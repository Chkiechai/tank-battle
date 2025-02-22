
import {Events,Engine,Render,Bodies,Composite} from "matter-js";
import Tank from "./tank";


export class Game {
  engine: Engine
  render: Render|null
  tanks: Tank[]
  last_update: number
  animation_id:number | undefined
  output:string[]
  paused:boolean

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
    this.output = [];
    this.paused = false;
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
      this.output=[];
      let engine = event.source;
      for(let tank of this.tanks) {
        tank.control(engine.timing.lastDelta/1000.0);
        tank.update(engine.timing.lastDelta/1000.0);
      }
      let tank_poses=this.tanks.map((t) => t.show());
      let out = tank_poses.join('<br/>') + '<br/>' + `${this.output.join('<br/>')}`; 
      document.querySelector('#output').innerHTML = out;
    })
  }

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
  
  add_tank(tank:Tank) {
    this.tanks.push(tank);
    Composite.add(this.engine.world,[tank.body]);
  }
  
  run() {
    Render.run(this.render);
    this.resume();
  }
  
  resume() {
    this.paused = false;
    this.animation_id = requestAnimationFrame((_:number)=>this.update())  
  }

  step() {
    this.animation_id = requestAnimationFrame((_:number)=>this.update()) 
  }
  
  pause() {
    this.paused = true;
    if(this.animation_id) {
      cancelAnimationFrame(this.animation_id);
      this.animation_id = undefined;
    }
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
    if(!this.paused) {
      this.animation_id = requestAnimationFrame(()=>this.update());
    }
  }
}



