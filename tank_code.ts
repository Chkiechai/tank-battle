import { TankAPI, Controls, Sensors } from './tank-api';

const max_speed: number = 100;
const wheel_base: number = 20;
let t = 0;
var controls: Controls;
var sensors: Sensors;
var delta_t: number;
var plan = [
  turn_toward(Math.PI / 2),
  forward(100),
  turn_toward(Math.PI),
  forward(100),
  turn_toward(-Math.PI / 2),
  forward(100),
  turn_toward(0),
  forward(100)
];
var step = 0;

export function setup() {
  console.log("called setup");
  plan = [
    turn_toward(Math.PI / 2),
    forward(100),
    turn_toward(Math.PI),
    forward(100),
    turn_toward(-Math.PI / 2),
    forward(100),
    turn_toward(0),
    forward(100)
  ];
  step = 0;
}
export function loop(api: TankAPI) {
  controls = api.getControls();
  sensors = api.getSensors();
  delta_t = api.getDeltaT();
  t += delta_t;
  if (step < plan.length) {
    if (plan[step]()) {
      step++;
    }
  }

  api.setControls(controls);
}

function turn(turn_rate: number, s_max = max_speed) {
  let outer = s_max;
  let outer_rad = outer / Math.abs(turn_rate);
  let inner_rad = outer_rad - wheel_base;
  let inner = outer * inner_rad / outer_rad;
  if (turn_rate > 0) { // turn right, so outer is left side
    controls.left_track_speed = outer;
    controls.right_track_speed = inner;
  } else {
    controls.left_track_speed = inner;
    controls.right_track_speed = outer;
  }
  //foobar
}

function turn_toward(angle: number): () => boolean {
  let max_turn = max_speed / (wheel_base / 2);
  if (angle < 0) {
    angle += Math.PI * 2;
  }
  return () => {
    let diff = angle - sensors.direction;
    if (Math.abs(diff) > Math.PI) {
      diff = Math.sign(diff) * (Math.abs(diff) - 2 * Math.PI);
    }
    let speed = diff / delta_t * wheel_base / 2;
    if (delta_t * max_turn < Math.abs(diff)) {
      speed = Math.sign(speed) * max_turn * (wheel_base / 2);
    }

    controls.left_track_speed = speed;
    controls.right_track_speed = -speed;

    if (Math.abs(diff) < 0.01) {
      controls.left_track_speed = 0;
      controls.right_track_speed = 0
      return true;
    }
    return false;
  }
}

function forward(total_dist: number): () => boolean {
  let dist = total_dist;
  return () => {
    if (dist > max_speed * delta_t) {
      dist -= max_speed * delta_t;
      controls.left_track_speed = max_speed;
      controls.right_track_speed = max_speed;
    } else if (Math.abs(dist) > 0.01) {
      controls.left_track_speed = dist;
      controls.right_track_speed = dist;
      dist = 0;
    } else {
      controls.left_track_speed = 0;
      controls.right_track_speed = 0;
      return true;
    }
    return false;
  }
}
