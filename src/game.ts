
import {Events,Engine,Render,Bodies,Composite, Vector, World} from "matter-js";
import {Tank} from "./tank/tank";
import { Ray } from "./utils/math";
import Bullet from "./bullet/bullet";
import enemies from './enemy_ai/enemies';
import {JsModule} from './tank/script';
import { Script } from './tank/script';
import {Globals} from "./globals";
import Editor from "./editor";

declare function insert_enemies(element:any, names:string[]):void;

/**
  The Game class is in charge of running the arena and coordinating all of the updates.
  It keeps track of the set of tanks and the score as well. In order to use it:

  1. Create a div with the id 'game'
  2. Create the game (`new Game()`)
  3. Call `game.setEnemyAI(ai_name)` with the name of the enemy control code module
     you want to use. It should be structured like the ones in enemy_ai/tank_*.ts
  4. Call `game.setAllyCode(code)` with the user's code, if it exists. If not, the ally
     tanks will start with a null module.
  5. Set an event to call `game.reset(); game.setAllyCode(new_code_string); game.run()`
     whenever the user's code needs to be updated.
  6. Call `game.run()`
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
  enemy_ai_modules: {[key:string]:JsModule}
  enemy_ai: JsModule
  editor: Editor
  pending:Function[]

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

  constructor(editor:Editor) {
    this.engine = Engine.create();
    this.enemy_ai_modules = enemies;
    this.engine.gravity.scale = 0;
    this.tanks = {};
    this.animation_id = undefined;
    this.last_update=-1;
    this.output = [];
    this.bullets = {};
    this.paused = true;
    this.editor = editor;
    this.pending = [];
    // create a renderer
    this.render = Render.create({
      element: document.querySelector('#game'),
      engine: this.engine,
      options: {
        height: Game.bounds.height,
        width: Game.bounds.width,
        showAngleIndicator:true,
        wireframes: false,
      }
    });
    // This comes from index.html, and all it does is populate the enemy AI selector
    // box so that the user can choose among the AI modules.
    insert_enemies(document.querySelector("#enemy-options"), Object.keys(this.enemy_ai_modules));
    this.enemy_ai = Object.values(this.enemy_ai_modules)[0];
    if(!this.render) {
      throw new Error("Couldn't build a renderer!");
    }
    // quick helper to make the options for each wall
    let wall_props = (side:string) => {
      return {
        isStatic:true,
        label:`wall.${side}`,
        restitution:1,
        render: {
          fillStyle: '#555',
        },
        collisionFilter: {
          category: Game.WallCollisionfilter,
          group: -1,
          mask: ~Game.WallCollisionfilter,
        }
      }
    };
    let walls = [
      Bodies.rectangle(0,Game.bounds.height/2,10,Game.bounds.height,wall_props("left")),
      Bodies.rectangle(Game.bounds.width/2,0,Game.bounds.width, 10,wall_props("top")),
      Bodies.rectangle(Game.bounds.width/2,Game.bounds.height, Game.bounds.width, 10,wall_props("bottom")),
      Bodies.rectangle(Game.bounds.width, Game.bounds.height/2, 10,Game.bounds.height,wall_props("right")),
    ];
    Composite.add(this.engine.world,walls);

    this.register_updates();
  }

  /** addAllies
  * Sets the number of allied tanks to be included in the battle. Each tank
  * will get a copy of the current code and a blue color. The Allied tanks are always
  * team_id 0 while running in the browser, to make it simple to know which tanks to
  * update when the editor's content get shipped.
  * */
  addAllies(n: number) {
    let code = this.editor.loadSaved();
    for (let i = 0; i < n; i++) {
      let ally = new Tank(0, Vector.create(200, 200), new Globals().withGame(this), this);
      // Tanks will have an empty code module by default, no need to set it here unless
      // I actually have code to insert.
      ally.setStyle({
        fillStyle: '#8888ff',
        lineWidth: 0,
        opacity: 1,
      })
     this.add_tank(ally);
    }
    let self=this;
    this.editor.getJsCode()
      .then((code:string)=>{
        for(let ally of Object.values(self.tanks).filter((t)=>t.team_id == 0)) {
          ally.setCode(code)
        }
      })
      .catch((e)=>{
        this.println(`ERROR: Code could not be loaded: ${e}`);
      });
  }
  setAllyCount(n:number) {

    // first, remove all of the enemies (that means team_id != 0)
    // then, call this.addAllies(n)
    let saved_enemy_tanks = {};
    for (let entry of Object.entries(this.tanks)) {
      if (entry[1].team_id != 0) {
        //saving the enemy tank
        saved_enemy_tanks[entry[0]] = entry[1];
      } else {
        entry[1].remove_from_world(this.engine.world);
      }
    }
    this.tanks = saved_enemy_tanks;
    this.addAllies(n);
    this.reset();
  }


  /** Remove all existing enemies, then add back the number requested. */
  setEnemyCount(n:number) {
    let self = this;
    this.pending.push(()=>{
      console.log("Setting enemy count");
      let saved_ally_tanks = {};
      for(let entry of Object.entries(self.tanks)) {
        if(entry[1].team_id == 0) {
          saved_ally_tanks[entry[0]] = entry[1];
        } else {
          entry[1].remove_from_world(this.engine.world);
        }
      }
      self.tanks = saved_ally_tanks;
      self.addEnemies(n);
      self.reset();
    });
  }
  /** addEnemies
  *   Add the selected number of enemies to the arena. Each enemy will start with
  *   the currently-selected enemy AI module.
  * */
  addEnemies(n:number) {
    for(let i=0; i<n; i++) {
      let enemy = new Tank(1,Vector.create(200,200),new Globals().withGame(this),this);
      enemy.setStyle({
        fillStyle: '#993333',
        lineWidth: 0,
        opacity: 1,
      });
      enemy.setModule(
        new Script(this.enemy_ai,
          new Globals()
            .withGame(this)
            .withTank(enemy)));
      this.add_tank(enemy);
    }
  }

  /** setAllyCode
  *   Set the allied tanks' code to be the string provided. It is assumed to be a JS module
  *   with a single export named `setup`, which does nothing other than return an instance
  *   of a class that has a function called `update(dt:number,api:Globals)`. This module
  *   will be reused between several tanks, so it can't use global data anywhwere! If you use
  *   global data, your tanks will all be sharing and updating the *same variables*, so their
  *   behavior will be very strange.
  * */
  setAllyCode(code:string) {
    for(let tank of Object.values(this.tanks)) {
      if(tank.team_id == 0) { // allied team_id is always zero for now
        tank.setCode(code);
      }
    }
  }

  /** setEnemyAI
  *   This takes the *name* of an enemy AI module (see `enemy_ai/enemies.ts`). It will
  *   make the enemy tanks in the arena use that AI module. The module has the same rules
  *   as for `setAllyCode`, meaning that it has a `setup` function and it can't use global
  *   data.
  **/
  setEnemyAI(ai_name: string) {
    console.log(`Setting the AI to ${ai_name}`);
    this.enemy_ai = this.enemy_ai_modules[ai_name];
    for(let tank of Object.values(this.tanks)) {
      if(tank.team_id != 0) {
        tank.setModule(new Script(this.enemy_ai, new Globals().withGame(this).withTank(tank)));
      }
    }
    this.reset();
  }

  /** Return the tank that has the given id number. The id comes from matter-js and its
  * Body.id property. This is used for figuring out which tanks are involved with collisions
  * between tanks and other objects in the scene.
  **/
  getTankById(id:number):Tank|null {
    if(id in this.tanks) {
      return this.tanks[id];
    } else {
      console.log(`WARNING: No tank found for id ${id}`);
      return null;
    }
  }

  /** Return the matter-js Composite that contains all of the game bodies.
  **/
  world():Composite {
    return this.engine.world;
  }

  /** Every time a tank shoots, its bullet has to be registered with the world and
  * tracked by the game. This is where that happens. Note that each tank also keeps
  * its bullets in a list so that they can be deleted if the tank is reset.
  **/
  add_bullet(bullet:Bullet) {
    this.bullets[bullet.body.id] = bullet;
    Composite.add(this.engine.world,bullet.body);
  }

  /** Reset the game in preparation to restart
  *   This will call Tank.reset for all tanks (enemy and ally) and remove all bullets.
  *   If there aren't any tanks yet, it will also add them.
  **/
  reset() {
    for(let tank of Object.values(this.tanks)) {
        tank.reset(this.engine);
    }
    for(let bullet of Object.values(this.bullets)) {
      World.remove(this.engine.world, bullet.body);
    }
    this.bullets = [];
     // add some tanks if there aren't any
    if(Object.keys(this.tanks).length == 0) {
      this.addAllies(4);
      this.addEnemies(4);
    }
  }

  /** Connect the physics engine updates to the game state so the tanks get updated. This
   * is the function that listens for all of the collisions and takes action as needed. It
   * also runs the update loop for the physics entities.
   *
   * - on `beforeupdate`, it calls update on all tanks and bullets
   *    - any bullets that have collided (are 'dead') will be removed
   * - on `collisionActive`, it updates the radar values. Radar is the only game
   *   entity that can have an active collision that does anything right now. Tanks
   *   will eventually be damaged while in a collision, but not yet.
   * - on `collisionStart`, it applies damage and marks things as dead:
   *    - bullets die the moment they collide with anything (including other bullets)
   *    - tanks die when their hit_points value reaches zero
  **/
  register_updates() {
    // Update the controls before the step starts
    console.log("**** New game loop started ****");
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
        tank.update(engine.timing.lastDelta/1000.0,this);
      }
      this.updateOutput();
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
          //////console.log(`Bullet(A, id=${pair.bodyA.id}) hit: ${pair.bodyB.label}`);
          if(pair.bodyB.label != 'radar') {
            let b = this.bullets[pair.bodyA.id];
            if(pair.bodyB.label == 'Tank Body') {
              // We should damage the tank here!
              //console.log(`Tank ${pair.bodyB.id} is taking damage`);
              //console.log(`All tank ids: ${Object.keys(this.tanks).join(', ')}`);
              let tank_id = pair.bodyB.id;
              this.tanks[tank_id].take_damage(b.damage());
            }
            if(b) {
              b.dead = true;
              //console.log("bullet a marked dead");
              //delete this.bullets[pair.bodyA.id];
            }
          }
        }
        if(pair.bodyB.label == 'Bullet') {
          //console.log(`Bullet(B, id=${pair.bodyB.id}) hit: ${pair.bodyA.label}`);
          if(pair.bodyA.label != 'radar') {
            let b = this.bullets[pair.bodyB.id];
            if(pair.bodyA.label == 'Tank Body') {
              let tank_id = pair.bodyA.id;
              //console.log(`Tank ${tank_id} is taking damage`);
              //console.log(`All tank ids: ${Object.keys(this.tanks).join(', ')}`);
              this.tanks[tank_id].take_damage(b.damage());
            }
            if(b) {
              b.dead = true;
              //console.log("bullet b marked dead");
              //delete this.bullets[pair.bodyB.id];
            }
          }
        }
      }
    })
  }

  /** Update the output window of the game to display all of the messages from
   * calls to api.println. This is called from the `beforeUpdate` handler inside of
   * Game.register_updates
  * */
  updateOutput() {
    let tank_poses = Object.values(this.tanks).map((t) => t.show());
    //let out = `<pre>${tank_poses.join('\n')}\nBullets: ${Object.keys(this.bullets).length}\n${this.output.join('\n')}</pre>`;
    let out = `<pre>${this.output.join('\n')}</pre>`;
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
    let pos = Vector.create(
      Math.random() * (Game.bounds.width - 50) + 25,
      Math.random() * (Game.bounds.height - 50) + 25,
    );
    let ang = Math.random() * Math.PI * 2;
    this.tanks[tank.id()]=tank;
    tank.add_to_world(this.engine.world);
    tank.reset(this.engine, pos, ang);
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
    if(this.pending.length > 0) {
      for(let event of this.pending) {
        event()
      }
      this.pending = [];
    }

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
  }
}
