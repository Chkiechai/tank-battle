
import {Events,Engine,Render,Bodies,Composite, Vector} from "matter-js";
import Tank from "./tank/tank";
import { Ray } from "./utils/math";
import Bullet from "./bullet/bullet";


/**
  The Game class is in charge of running the arena and coordinating all of the updates.
  It keeps track of the set of tanks and the score as well.
**/

export class Game {
  engine: Engine
  render: Render|null
  tanks: {[key:number]:Tank}
  last_update: number
  animation_id:number | undefined
  output:string[]
  bullets: {[key:number]:Bullet}
  paused:boolean

  // The target frames per second for the physics simulation
  static SimFPS = 60;

  // This is the number of seconds per timestep. The physics simulation does all of its
  // velocity and other change calculations *per frame* NOT per second, so this is used
  // to map the numbers to something more usable.
  static FixedDt:number|undefined = 1.0/Game.SimFPS;

  static RadarCollisionFilter:number = 1;
  static BulletCollisionFilter:number = 1<<1;
  static WallCollisionfilter:number = 1<<2;

  // Return the collision filter mask for the team number provided. Team numbers should
  // range from 0..28
  static teamCollisionFilter(team:number):number {
    return 1<<(team+3);
  }
  // The size of the arena
  static bounds = {
    width:800,
    height: 600,
  }

  static WallRays = {
    "wall.left": new Ray(Vector.create(0,0), Vector.create(0,1)),
    "wall.top": new Ray(Vector.create(Game.bounds.width/2, 0), Vector.create(1,0)),
    "wall.right": new Ray(Vector.create(Game.bounds.width, 0), Vector.create(0,1)),
    "wall.bottom": new Ray(Vector.create(Game.bounds.width/2,Game.bounds.height), Vector.create(-1,0)),
  }

  constructor() {
    this.engine = Engine.create();
    this.engine.gravity.scale = 0;
    this.tanks = {};
    this.animation_id = undefined;
    this.last_update=-1;
    this.output = [];
    this.bullets = {};
    this.paused = false;
    // create a renderer
    this.render = Render.create({
      element: document.querySelector('#game'),
      engine: this.engine,
      options: {
        height: Game.bounds.height,
        width: Game.bounds.width,
        showAngleIndicator:true,
      }
    });
    if(!this.render) {
      throw new Error("Couldn't build a renderer!");
    }
    let walls = [
      Bodies.rectangle(0,Game.bounds.height/2,10,Game.bounds.height,{isStatic:true,label:"wall.left",restitution:1}),
      Bodies.rectangle(Game.bounds.width/2,0,Game.bounds.width, 10,{isStatic:true,label:"wall.top",restitution:1}),
      Bodies.rectangle(Game.bounds.width/2,Game.bounds.height, Game.bounds.width, 10,{isStatic:true,label:"wall.bottom",restitution:1}),
      Bodies.rectangle(Game.bounds.width, Game.bounds.height/2, 10,Game.bounds.height,{isStatic:true,label:"wall.right",restitution:1}),
    ];
    for(let wall of walls) {
      wall.collisionFilter.category = Game.WallCollisionfilter;
      wall.collisionFilter.group = -1;
      wall.collisionFilter.mask = ~Game.WallCollisionfilter;
    }
    Composite.add(this.engine.world,walls);

    this.register_updates();
  }

  world():Composite {
    return this.engine.world;
  }

  add_bullet(bullet:Bullet) {
    this.bullets[bullet.body.id] = bullet;
    Composite.add(this.engine.world,bullet.body);
  }

  // Connect the physics engine updates to the game state so the tanks get updated.
  register_updates() {
    // Update the controls before the step starts
    Events.on(this.engine, 'beforeUpdate', (event)=> {
      //console.log("update");
      this.output=[];
      let engine = event.source;
      let new_bullets = {};
      for(let entry of Object.entries(this.bullets)) {
        entry[1].update(engine.timing.lastDelta/1000.0,this);
        if(!entry[1].dead) { // only save the live ones
          new_bullets[entry[0]] = entry[1];
        }
      }
      // erase all the dead ones
      this.bullets = new_bullets;
      for(let tank of Object.values(this.tanks)) {
        tank.control(engine.timing.lastDelta/1000.0);
        tank.update(engine.timing.lastDelta/1000.0,this);
      }
    });

    // radar is the only thing that needs *active* events for now, to continue detecting
    // when it's on something.
    Events.on(this.engine, 'collisionActive', (event)=>{
       for(let tank of Object.values(this.tanks)) {
        tank.radar.scan(event.pairs);
      }
    });
    // Process collision events.
    Events.on(this.engine, 'collisionStart', (event)=>{
      for(let pair of event.pairs){
        if(pair.bodyA.label == 'Bullet') {
          console.log(`Bullet(A, id=${pair.bodyA.id}) hit: ${pair.bodyB.label}`);
          if(pair.bodyB.label != 'radar') {
            let b = this.bullets[pair.bodyA.id];
            if(pair.bodyB.label == 'Tank Body') {
              //this.pause();
            }
            if(b) {
              b.dead = true;
              console.log("bullet a marked dead");
              //delete this.bullets[pair.bodyA.id];
            }
          }
        }
        if(pair.bodyB.label == 'Bullet') {
          console.log(`Bullet(B, id=${pair.bodyB.id}) hit: ${pair.bodyA.label}`);
          if(pair.bodyA.label != 'radar') {
            let b = this.bullets[pair.bodyB.id];
            if(pair.bodyA.label == 'Tank Body') {
              //this.pause();
            }
            if(b) {
              b.dead = true;
              console.log("bullet b marked dead");
              //delete this.bullets[pair.bodyB.id];
            }
          }
        }
      }
    })
  }

  updateOutput() {
    let tank_poses = Object.values(this.tanks).map((t) => t.show());
    let out = `<pre>${tank_poses.join('\n')}\nBullets: ${Object.keys(this.bullets).length}\n${this.output.join('\n')}</pre>`;
    document.querySelector('#output').innerHTML = out;
  }

  // Add a line to the output view. Lines are replace each frame.
  println(...args:any[]):void {
    this.output.push(args.map((s)=>{
      if(typeof(s) == "number") {
        return JSON.stringify(Math.floor(s*1000)/1000.0);
      } else if(typeof(s) != "string") {
        return JSON.stringify(s);
      } else {
        return s
      }
    }).join(''));
  }

  // add a tank to the arena.
  add_tank(tank:Tank) {
    this.tanks[tank.id()]=tank;
    tank.add_to_world(this.engine.world);
  }

  // Run the simulation until the next pause is called
  run() {
    this.resume();
  }

  // Continue after a pause (or start)
  resume() {
    this.paused = false;
    this.animation_id = requestAnimationFrame((_:number)=>this.update())
  }

  // Single-step one frame of the world.
  step() {
    this.animation_id = requestAnimationFrame((_:number)=>this.update())
  }

  // Stop the animation to allow single-stepping.
  pause() {
    this.paused = true;
    if(this.animation_id) {
      cancelAnimationFrame(this.animation_id);
      this.animation_id = undefined;
    }
  }

  // This just replaces the real-time delta_t with the fixed timestep if that's configured by
  // setting Game.fixed_dt
  fixDeltaT(dt: number): number {
    if(Game.FixedDt) {
      return 1/Game.SimFPS;
    } else {
      return dt;
    }
  }

  // This is where the engine's update function is called as a result of requestAnimationFrame. The
  // actual game updates happen in the handler from Game.register_updates.
  update() {
    let this_update = new Date().getTime()/1000.0;
    if(this.last_update < 0) {
      this.last_update = this_update-1/Game.SimFPS;
    }
    let delta_t = this_update-this.last_update;
    if(delta_t >= 1/Game.SimFPS) {
      Engine.update(this.engine,this.fixDeltaT(delta_t)*1000.0); // engine wants milliseconds
      this.last_update = new Date().getTime()/1000.0; // everything else wants seconds
    }
    if(!this.paused) {
      this.animation_id = requestAnimationFrame(()=>this.update());
    }
    Render.world(this.render);
    this.updateOutput();
  }
}
