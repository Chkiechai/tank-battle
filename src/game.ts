
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
    // create a renderer
    this.render = Render.create({
      element: document.querySelector('#game'),
      engine: this.engine
    });
    if(!this.render) {
      throw new Error("Couldn't build a renderer!");
    }
    Composite.add(this.engine.world,[
      Bodies.rectangle(0,0,1,Game.bounds.height),
      Bodies.rectangle(0,0,Game.bounds.width, 1),
      Bodies.rectangle(0,Game.bounds.height, Game.bounds.width, 1),
      Bodies.rectangle(Game.bounds.width, 0, 1,Game.bounds.height),
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

  run() {
    this.animation_id = requestAnimationFrame((_:number)=>this.update())  
  }
  
  update(max_fr:number = 60) {
    let this_update = new Date().getTime()/1000.0;
    if(this.last_update < 0) {
      this.last_update = this_update-1/60.;
    }
    let delta_t = this_update-this.last_update;
    this.last_update = new Date().getTime()/1000.0;
    if(delta_t >= 1/max_fr) {
      Engine.update(this.engine,delta_t);
    }
    this.animation_id = requestAnimationFrame(()=>this.update(max_fr))
  }
}


/*
import {Common,Events,Engine,Render,Runner,Bodies,Composite,Body,Vector} from "matter-js";
import Tank from "./tank";

// module aliases
//var Engine = Matter.Engine,
//    Render = Matter.Render,
//    Runner = Matter.Runner,
//    Bodies = Matter.Bodies,
//    Composite = Matter.Composite;

engine.gravity.scale=0;

// create two boxes and a ground
var tank = new Tank(60, 100, tank_code, Vector.create(200,200));
var circ = Bodies.circle(200,290,59);
var ground = Bodies.rectangle(400, 610, 810, 60, { isStatic: true });

Body.setMass(tank.body,100.0);

// add all of the bodies to the world
Composite.add(engine.world, [tank.body, circ, ground]);

// run the renderer
Render.run(render);

// create runner
var runner = Runner.create();
runner.delta = 1/360.0;

Events.on(engine, 'beforeUpdate', function(event) {
  var engine = event.source;
  tank.control(engine.timing.lastDelta);
  tank.update(engine.timing.lastDelta);
  //thrust_update(tank,event.source.timing.lastDelta);
  //console.log(`Velocity is ${JSON.stringify(tank.velocity)}, location is ${JSON.stringify(tank.position)}`);
});

let dt = 0.016;
function millis() {
  let d = new Date();
  return d.getTime()/1000.0;
}
let last_time = millis();

function frame(t:number) {
  // run the engine
  requestAnimationFrame((t:number) => frame(t));
  let this_time = millis();
  dt = this_time-last_time;
  last_time = this_time;
  Engine.update(engine,dt);
}
requestAnimationFrame(frame);
//Runner.run(runner, engine);

*/
