
import {Vector} from "matter-js";
import Tank from "./tank";
import { Game } from "./game";
import Editor from "./editor";

let _circle_tank_code = 
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
let tank_code = `
import {TankAPI,Controls,Sensors} from './tank-api';

export default function loop(api:TankAPI) {
  let controls = api.getControls();

  api.setControls(controls);
}
`

let tank = new Tank(tank_code, Vector.create(200,200));
let element = document.querySelector('#output');
tank.onUpdate((self)=>element.innerHTML=`<p>${self.show()}</p>`);
let editor = new Editor('monaco-editor-embed');
editor.setup();

let game = new Game();

editor.onShipCode((code:any)=>{
  tank.reset(); 
  tank.setCode(code);
});

game.add_tank(tank);
game.run();

