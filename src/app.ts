
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

let tank_code = 
  `
  function drive_speed_and_angle(control,speed,angvel) {
    let rad = speed/angvel;
    if(angvel > 0) {
      control.right_track_speed = speed;
      control.left_track_speed = rad/(rad+60)*speed;
    } else if(angvel < 0) {
      control.left_track_speed = rad/(rad+60)*speed;
      control.right_track_speed = speed;
    } else {
      control.left_track_speed = speed;
      control.right_track_speed = speed;
    }
  }

  function drive_radius(control,radius,speed) {
    let ang_vel = speed/radius;
    drive_speed_and_angle(control,speed,ang_vel);
  }
  //console.log("Inside tank code: controls = ",controls);
  controls.turn_gun = 1.0;
  //drive_speed_and_angle(controls,20.0,1);
  drive_radius(controls, 60, 60);
  return controls;
`;

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


