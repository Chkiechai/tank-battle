
import {Common,Events,Engine,Render,Runner,Bodies,Composite,Body,Vector} from "matter-js";
import Tank from "./tank";

// module aliases
//var Engine = Matter.Engine,
//    Render = Matter.Render,
//    Runner = Matter.Runner,
//    Bodies = Matter.Bodies,
//    Composite = Matter.Composite;

function thrust_update(tank:Body, _dt:number) {
  let pointing = Vector.create(Math.cos(tank.angle),Math.sin(tank.angle));
  let pos = tank.position;
  let angle = tank.angle;
  Body.applyForce(tank,
    Vector.add(pos, Vector.rotate(Vector.create(0,40),angle)),
    Vector.mult(pointing,0.06));
  Body.applyForce(tank,
    Vector.add(pos, Vector.rotate(Vector.create(0,-40),angle)),
    Vector.mult(pointing,0.006));
  Body.setVelocity(tank, Vector.mult(pointing,Vector.dot(tank.velocity, pointing)));
  if(Vector.magnitude(tank.velocity) > 20) {
    let shrink = 20/Vector.magnitude(tank.velocity);
    Body.setVelocity(tank,Vector.mult(tank.velocity,shrink));
    Body.setAngularSpeed(tank,tank.angularSpeed*shrink);
  }
}

// create an engine
var engine = Engine.create();
engine.gravity.scale=0;

// create a renderer
var render = Render.create({
  element: document.querySelector('#game'),
  engine: engine
});

let tank_code = `
  console.log("Inside tank code: controls = ",controls);
  controls.turn_gun = 1.0;
  controls.left_track_speed = 0.1;
  controls.right_track_speed = 0.3;
  return controls;
`;

// create two boxes and a ground
var tank = new Tank(60, 100, tank_code, Vector.create(200,200));
var ground = Bodies.rectangle(400, 610, 810, 60, { isStatic: true });

Body.setMass(tank.body,100.0);

// add all of the bodies to the world
Composite.add(engine.world, [tank.body, ground]);

// run the renderer
Render.run(render);

// create runner
var runner = Runner.create();

Events.on(engine, 'beforeUpdate', function(event) {
  var engine = event.source;
  tank.control(engine.timing.lastDelta);
  tank.update(engine.timing.lastDelta);
  //thrust_update(tank,event.source.timing.lastDelta);
  //console.log(`Velocity is ${JSON.stringify(tank.velocity)}, location is ${JSON.stringify(tank.position)}`);
});

// run the engine
Runner.run(runner, engine);


