
import {Globals,Controls} from '../globals';

export default function setup() {
  return new Tank()
}

class Tank {
  static max_speed: number = 100;
  static wheel_base: number = 20;

  constructor() {
  }

  update(api: Globals) {
    let controls = api.getControls();
    controls.left_track_speed = 200;
    controls.right_track_speed = 190;
    api.setControls(controls);
  }
}
