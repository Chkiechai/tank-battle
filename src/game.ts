
import {Common,Events,Engine,Render,Runner,Bodies,Composite,Body,Vector} from "matter-js";
import Tank from "./tank";

export class Game {
  engine: Engine
  render: Render|null
  tanks: Tank[]
  last_update: number
  animation_id:number | undefined

  static sim_fps = 60;
  static fixed_dt:number|undefined = 0.016;
  
  static bounds = {
    width:800,
    height: 600,
  }
  
  constructor() {
    this.engine = Engine.create();
    this.engine.gravity.scale = 0;
    this.tanks = [];
    this.animation_id = undefined;
    this.last_update=-1;
    // create a renderer
    this.render = Render.create({
      element: document.querySelector('#game'),
      engine: this.engine,
      options: {
        height: Game.bounds.height,
        width: Game.bounds.width,
      }
    });
    if(!this.render) {
      throw new Error("Couldn't build a renderer!");
    }
    
    Composite.add(this.engine.world,[
      Bodies.rectangle(0,Game.bounds.height/2,1,Game.bounds.height,{isStatic:true}),
      Bodies.rectangle(Game.bounds.width/2,0,Game.bounds.width, 1,{isStatic:true}),
      Bodies.rectangle(Game.bounds.width/2,Game.bounds.height, Game.bounds.width, 1,{isStatic:true}),
      Bodies.rectangle(Game.bounds.width, Game.bounds.height/2, 1,Game.bounds.height,{isStatic:true}),
    ]);
    this.register_updates();
  }

  register_updates() {
    Events.on(this.engine, 'beforeUpdate', (event)=> {
      let engine = event.source;
      for(let tank of this.tanks) {
        tank.control(engine.timing.lastDelta/1000.0);
        tank.update(engine.timing.lastDelta/1000.0);
      }
    })
  }

  add_tank(tank:Tank) {
    this.tanks.push(tank);
    Composite.add(this.engine.world,[tank.body]);
  }
  
  run() {
    Render.run(this.render);
    this.animation_id = requestAnimationFrame((_:number)=>this.update())  
  }

  fixDeltaT(dt: number): number {
    if(Game.fixed_dt) {
      return 1/Game.sim_fps;
    } else {
      return dt;
    }
  }

  update() {
    let this_update = new Date().getTime()/1000.0;
    if(this.last_update < 0) {
      this.last_update = this_update-1/Game.sim_fps;
    }
    let delta_t = this_update-this.last_update;
    if(delta_t >= 1/Game.sim_fps) {
      Engine.update(this.engine,this.fixDeltaT(delta_t)*1000.0); // engine wants milliseconds
      this.last_update = new Date().getTime()/1000.0; // everything else wants seconds
    }
    this.animation_id = requestAnimationFrame(()=>this.update())
  }
}



