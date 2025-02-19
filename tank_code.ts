import {Sensors,Controls,TankAPI} from './tank-api';

var pose = {
  angle:0,
  x:0,
  y:0
};
var sensors:Sensors;
var dt = 0;
var wheel_base = 20;
var max_speed = 100;
function fix_angle(ang:number):number {
  let revs = Math.floor(ang / (2*Math.PI));
  return ang - revs*2*Math.PI;
}

export default function loop(api:TankAPI) {
  let controls = api.getControls();
  sensors = api.getSensors();
  pose.angle = fix_angle(sensors.direction);
  console.log(`pose angle = ${pose.angle}`)

  if(pose.angle < Math.PI/2) {
    console.log(`pose angle = ${pose.angle}`)
    turn_to(Math.PI/2,controls);
  } else {
    controls.left_track_speed = 0;
    controls.right_track_speed = 0;
  }
  dt = api.getDeltaT();
  api.setControls(controls);
}

function turn_to(angle:number,controls:Controls):boolean {
  let adjust = angle-pose.angle;
  let max_turn = dt*max_speed/wheel_base;
  if(adjust > 0 && adjust < max_turn) {
    controls.left_track_speed = (adjust/max_turn)*max_speed;
    controls.right_track_speed = 0;
  } else if(adjust > 0 && adjust >= max_turn) {
    controls.left_track_speed = max_speed;
    controls.right_track_speed = 0;
  } else {
    controls.left_track_speed = 0;
    controls.right_track_speed = 0;
    return true;
  }
  return false;
}
