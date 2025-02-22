import { TankAPI, Controls, Sensors } from './tank-api';

const max_speed: number = 100;
const wheel_base: number = 20;
var steps: ((api: TankAPI) => boolean)[];
var time:number = 0;
var step: number = 0;

function stop(controls: Controls) {
  controls.left_track_speed = 0;
  controls.right_track_speed = 0;
}

export function setup() {
  steps = [
    move_builder(300),
    turn_builder(Math.PI/2),
    move_builder(50),
    turn_builder(Math.PI),
    move_builder(300),
    turn_builder(-Math.PI/2),
    move_builder(50),
    turn_builder(0),
  ];
  step = 0;
}

export function loop(api: TankAPI) {
  let controls = api.getControls();
  time += api.getDeltaT();
  api.println("Time = ", time);
  api.println("delta_t = ", api.getDeltaT());
  if(step >= steps.length) {
    setup();
    api.println("Pause, resume to run again");
    api.pause();
  } else if(steps[step](api)) {
    step ++;
  }

  api.setControls(controls);
}

function ccw_turn(target_angle: number, current_angle: number): number {
  if (current_angle < target_angle) {
    current_angle += Math.PI * 2;
  }
  return target_angle - current_angle;
}

function cw_turn(target_angle: number, current_angle: number): number {
  if (current_angle > target_angle) {
    current_angle -= Math.PI * 2;
  }
  return target_angle - current_angle;
}

function turn_builder(target_angle: number): (api: TankAPI) => boolean {
  let max_turn_speed = max_speed/(wheel_base/2);
  return (api: TankAPI) => {
    let delta_ang = ccw_turn(target_angle, api.getSensors().direction);
    api.println("ccw turn is ", delta_ang);
    if (Math.abs(delta_ang) > Math.PI) {
      delta_ang = cw_turn(target_angle, api.getSensors().direction);
      api.println("cw turn is ", delta_ang);
    }
    let turn_speed = delta_ang / api.getDeltaT();
    api.println("delta angle: ",delta_ang);
    api.println("Total turn would be ", turn_speed);
    if (Math.abs(turn_speed) > max_turn_speed) {
      turn_speed = Math.sign(turn_speed) * max_turn_speed;
      api.println("Adjusted turn speed: ", turn_speed);
    }
    api.println("turn_speed (rad/sec): ", turn_speed);
    ///api.pause();
    let controls = api.getControls();
    if (Math.abs(delta_ang) < 0.01) {
      stop(controls);
      return true;
    } else {
      controls.left_track_speed = turn_speed*wheel_base/2;
      controls.right_track_speed = -turn_speed*wheel_base/2;
    }

    return false;
  }
}

function move_builder(distance: number): (api: TankAPI) => boolean {
  let moved_already = 0;
  return (api: TankAPI) => {
    let controls = api.getControls();
    if (Math.abs(moved_already - distance) < 0.01) {
      stop(controls);
      return true;
    }
    let speed = (distance - moved_already) / api.getDeltaT();
    if (speed > max_speed) {
      speed = max_speed;
      api.println(`speed limit: ${speed}`)
    }

    moved_already += speed * api.getDeltaT();
    controls.left_track_speed = speed;
    controls.right_track_speed = speed;
    api.println("dist: ", distance);
    api.println("moved: ", moved_already);
    api.println("remaining: ", distance - moved_already);
    return false;
  }
}

