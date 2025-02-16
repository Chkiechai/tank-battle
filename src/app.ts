
import {Common,Events,Engine,Render,Runner,Bodies,Composite,Body,Vector} from "matter-js";
import Tank from "./tank";
import { Game } from "./game";

let tank_code = 
  `
  function drive_speed_and_angle(control,speed,angvel) {
    let rad = speed/angvel;
    if(angvel > 0) {
      control.left_track_speed = speed;
      control.right_track_speed = rad/(rad+60)*speed;
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
  drive_radius(controls, 60, 1000);
  return controls;
`;

// create two boxes and a ground
var tank = new Tank(60, 100, tank_code, Vector.create(200,200));

let game = new Game();
game.add_tank(tank);
game.run();
