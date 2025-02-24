import { TankAPI, Controls, Sensors } from './tank-api';

const max_speed: number = 200;
const wheel_base: number = 20;
var steps: ((api: TankAPI) => boolean)[];
var time: number = 0;
var step: number = 0;

function stop(controls: Controls) {
  controls.left_track_speed = 0;
  controls.right_track_speed = 0;
  controls.turn_gun = 0;
  controls.turn_radar =0;
}

export function setup() {
  steps = [
    move_builder(300),
    turn_builder(Math.PI / 2),
    move_builder(300),
    turn_builder(Math.PI),
    move_builder(300),
    turn_builder(-Math.PI / 2),
    move_builder(300),
    turn_builder(0),
  ];
  step = 0;
}

export function loop(api: TankAPI) {
  let controls = api.getControls();
  let sensors = api.getSensors();
  time += api.getDeltaT();
  api.println("Time = ", time);
  api.println("delta_t = ", api.getDeltaT());
  controls.turn_radar = -2 * Math.PI;
  controls.turn_gun = Math.PI;
  //controls.show_radar = false;
  if (Math.abs(sensors.radar_angle + Math.PI/2) < 0.01) {
    api.println("wall distance: ", sensors.radar_hits.wall);
    api.println("radar angle: ", sensors.radar_angle);
    api.println("gun angle: ", sensors.gun_angle);
    stop(controls);
    //api.pause();
  }
  if (step >= steps.length) {
    setup();
    api.println("Paused, press resume to run again");
    api.pause();
  } else if (steps[step](api)) {
    step++;
  }

  api.setControls(controls);
}

// return the amount of turn required to reach target angle in a 
// counter-clockwise direction (radians)
function ccw_turn(target_angle: number, current_angle: number): number {
  if (current_angle < target_angle) {
    current_angle += Math.PI * 2;
  }
  return target_angle - current_angle;
}

// Return the turn required (radians) to reach target angle from 
// current angle by turning clockwise
function cw_turn(target_angle: number, current_angle: number): number {
  if (current_angle > target_angle) {
    current_angle -= Math.PI * 2;
  }
  return target_angle - current_angle;
}

// Create a closure that will continue to turn the tank until it reaches
// the target angle (in radians). It will return true when it finishes.
function turn_builder(target_angle: number): (api: TankAPI) => boolean {
  let max_turn_speed = max_speed / (wheel_base / 2);
  return (api: TankAPI) => {
    let delta_ang = ccw_turn(target_angle, api.getSensors().direction);
    api.println("ccw turn is ", delta_ang);
    if (Math.abs(delta_ang) > Math.PI) {
      delta_ang = cw_turn(target_angle, api.getSensors().direction);
      api.println("cw turn is ", delta_ang);
    }
    let turn_speed = delta_ang / api.getDeltaT();
    api.println("delta angle: ", delta_ang);
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
      controls.left_track_speed = turn_speed * wheel_base / 2;
      controls.right_track_speed = -turn_speed * wheel_base / 2;
    }

    return false;
  }
}

// Return a closure that will incrementally move the tank until it has
// moved by distance. It will return true when the move is complete.
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

