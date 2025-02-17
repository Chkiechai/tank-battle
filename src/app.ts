
import {Vector} from "matter-js";
import Tank from "./tank";
import { Game } from "./game";
import Editor from "./editor";

let tank_code = 
`export default function update(env) {
  let controls = env.getControls();
  let wheel_base = 20;
  function drive_speed_and_angle(control,speed,angvel) {
    let rad = speed/angvel;
    if(angvel > 0) {
      control.left_track_speed = rad/(rad+wheel_base)*speed;
      control.right_track_speed = speed;
    } else if(angvel < 0) {
      control.left_track_speed = speed;
      control.right_track_speed = rad/(rad+wheel_base)*speed;
    } else {
      control.left_track_speed = speed;
      control.right_track_speed = speed;
    }
  }

  function drive_radius(control,radius,speed) {
    let ang_vel = speed/radius;
    drive_speed_and_angle(control,speed,ang_vel);
  }
  controls.turn_gun = 1.0;
  drive_radius(controls, -30, 50);
  
  env.setControls(controls);
}
`;

// create two boxes and a ground
var tank = new Tank(tank_code, Vector.create(200,200));

let editor = new Editor('monaco-editor-embed');
editor.setup();
let game = new Game();
game.add_tank(tank);
game.run();

