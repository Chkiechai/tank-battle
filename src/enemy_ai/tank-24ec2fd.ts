import { TankAPI, Controls, Sensors } from '../../tank-api';

export default function setup() {
  return new Tank()
}

class Tank {
  static max_speed: number = 200;
  static wheel_base: number = 20;
  steps: ((api: TankAPI) => boolean)[];
  time: number = 0;
  step: number = 0;

  constructor() {
    this.steps =  [];
    this.reset();
  }

  reset() {
    this.steps = [
      this.move_builder(300),
      this.turn_builder(Math.PI / 2),
      this.move_builder(300),
      this.turn_builder(Math.PI),
      this.move_builder(300),
      this.turn_builder(-Math.PI / 2),
      this.move_builder(300),
      this.turn_builder(0),
    ];
    this.step = 0;
    //api.getControls().show_radar = false;
  }

  stop(controls: Controls) {
    controls.left_track_speed = 0;
    controls.right_track_speed = 0;
    controls.turn_gun = 0;
    controls.turn_radar = 0;
  }

  update(api: TankAPI) {
    let controls = api.getControls();
    let sensors = api.getSensors();
    controls.fire_gun = 0.5;
    //api.pause();
    api.println("Radar angle: ", sensors.radar_angle);
    this.time += api.getDeltaT();
    api.println("Time = ", this.time);
    api.println("delta_t = ", api.getDeltaT());
    controls.turn_radar = 0.9;
    controls.turn_gun = Math.PI;
    //controls.turn_radar = 0.5 * Math.PI;
    //controls.turn_gun = Math.PI/2-sensors.gun_angle;
    controls.show_radar = true;
    api.println("enemies: ", sensors.radar_hits.enemies.length);
    if(sensors.radar_hits.bullets.length > 0) {
      controls.turn_radar = 0;
      let num_bullets = sensors.radar_hits.bullets.length;
      let first_bullet = sensors.radar_hits.bullets[0];
      api.println!(`Radar: ${num_bullets} bullets, first is at `, first_bullet.distance);
    } else {
      api.println!(`Radar: 0 bullets`);
    }
    // if (Math.abs(sensors.radar_angle + Math.PI / 2) < 0.01) {
    //   api.println("wall distance: ", sensors.radar_hits.wall);
    //   api.println("radar angle: ", sensors.radar_angle);
    //   api.println("gun angle: ", sensors.gun_angle);
    //   controls.turn_radar = 0;
    //   //api.pause();
    // }

    if (this.step >= this.steps.length) {
      this.reset();
      api.println("Paused, press resume to run again");
      //api.pause();
    } else if (this.steps[this.step](api)) {
      this.step++;
    }

    api.setControls(controls);
  }

  // return the amount of turn required to reach target angle in a
  // counter-clockwise direction (radians)
  ccw_turn(target_angle: number, current_angle: number): number {
    if (current_angle < target_angle) {
      current_angle += Math.PI * 2;
    }
    return target_angle - current_angle;
  }

  // Return the turn required (radians) to reach target angle from
  // current angle by turning clockwise
  cw_turn(target_angle: number, current_angle: number): number {
    if (current_angle > target_angle) {
      current_angle -= Math.PI * 2;
    }
    return target_angle - current_angle;
  }

  // Create a closure that will continue to turn the tank until it reaches
  // the target angle (in radians). It will return true when it finishes.
  turn_builder(target_angle: number): (api: TankAPI) => boolean {
    let max_turn_speed = Tank.max_speed / (Tank.wheel_base / 2);
    return (api: TankAPI) => {
      let delta_ang = this.ccw_turn(target_angle, api.getSensors().direction);
      api.println("ccw turn is ", delta_ang);
      if (Math.abs(delta_ang) > Math.PI) {
        delta_ang = this.cw_turn(target_angle, api.getSensors().direction);
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
        this.stop(controls);
        return true;
      } else {
        controls.left_track_speed = turn_speed * Tank.wheel_base / 2;
        controls.right_track_speed = -turn_speed * Tank.wheel_base / 2;
      }
      return false;
    }
  }

  // Return a closure that will incrementally move the tank until it has
  // moved by distance. It will return true when the move is complete.
  move_builder(distance: number): (api: TankAPI) => boolean {
    let moved_already = 0;
    return (api: TankAPI) => {
      let controls = api.getControls();
      if (Math.abs(moved_already - distance) < 0.01) {
        this.stop(controls);
        return true;
      }
      let speed = (distance - moved_already) / api.getDeltaT();
      if (speed > Tank.max_speed) {
        speed = Tank.max_speed;
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

}
