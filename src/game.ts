
import {Common,Events,Engine,Render,Runner,Bodies,Composite,Body,Vector} from "matter-js";
import Tank from "./tank";

export class Game {
  engine: Engine
  render: Render|null
  tanks: Tank[]
  last_update: number
  animation_id:number | undefined
  
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
        tank.control(engine.timing.lastDelta);
        tank.update(engine.timing.lastDelta);
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
  
  update(max_fr:number = 60) {
    let this_update = new Date().getTime()/1000.0;
    if(this.last_update < 0) {
      this.last_update = this_update-1/60.;
    }
    let delta_t = this_update-this.last_update;
    if(delta_t >= 1/max_fr) {
      Engine.update(this.engine,delta_t);
      this.last_update = new Date().getTime()/1000.0;
    }
    this.animation_id = requestAnimationFrame(()=>this.update(max_fr))
  }
}



