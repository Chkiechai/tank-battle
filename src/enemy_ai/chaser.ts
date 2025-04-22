import { Globals, Controls, Sensors } from '../globals';

export default function setup() {
  return new Tank()
}

interface Enemy {
  distance:number,
  angle: number,
  energy: number,
}

class Tank {
  static MaxTrackSpeed:number = 200;
  static MaxRadarSpeed:number = 2*Math.PI; // radians per sec
  static DeltaT = 1/60.0;
  static Wheelbase = 20.0;
  radar_lock:boolean
  radar_change:number
  controls:Controls
  sensors:Sensors
  api:Globals
  radar_target:Enemy|null

  constructor() {
    this.radar_lock = true;
    this.radar_change = 0;
    this.controls = {} as Controls;
    this.sensors = {} as Sensors;
    this.api = {} as Globals;
    this.radar_target = null;
  }

  reset() {

  }

  stop(controls: Controls) {
    controls.left_track_speed = 0;
    controls.right_track_speed = 0;
    controls.turn_gun = 0;
    controls.turn_radar = 0;
  }

  aimRadarAt(targ_ang:number){
    let ang = this.sensors.radar_angle;
    let turn = this.api.turnAngle(ang+this.sensors.direction,targ_ang)/this.api.getDeltaT();
    this.api.println(`turn radar by ${turn} radians (unadjusted)`);

    if(Math.abs(turn)>Tank.MaxRadarSpeed) {
      turn = Math.sign(turn) * Tank.MaxRadarSpeed;
    }
    this.controls.turn_radar = turn;
    this.radar_change = turn;
  }

  trackRadar() {
    let en = this.sensors.radar_hits.enemies.filter((e)=>e.energy > 0);
    this.radar_change = 0;
    if(en.length > 0) {
      this.radar_lock = true;
      let targ = en.sort((a,b)=> a.distance-b.distance)[0];
      this.radar_target = targ;
      // get closest enemy
      this.aimRadarAt(targ.angle);
    } else {
      this.radar_target = null;
      this.radar_lock = false;
      this.radar_change = 0.1;
      this.controls.turn_radar = Tank.MaxRadarSpeed;
    }
  }


  // Return the change in the *locked* radar angle. Positive turns
  // should be in the same direction that the tank would turn if it
  // did a positive turn. Returns zero only when the radar angle doesn't
  // need to change in order to stay on target.
  radarAngleChange():number {
    return this.radar_change;
  }

  update(api: Globals) {
    let controls = api.getControls();
    let sensors = api.getSensors();
    this.controls = controls;
    this.sensors = sensors;
    this.api=api;
    // We want to steer so that the radar angle doesn't change from frame to frame.
    // We're NOT trying to pick a particular angle, just find the angle that stays
    // the most stable by checking how fast it's changing.
  
    this.trackRadar();
    if(this.radar_lock) {
      let delta_angle = this.radarAngleChange();
      this.controls.boost = 1;
      let drive_dir_error = this.sensors.radar_angle;
      if(Math.abs(drive_dir_error)>Math.PI/4){
        // need to turn quickly to close the gap
        this.turnAtSpeed(drive_dir_error*10);
        api.println(`turn fast: ${drive_dir_error}`);
      } else {
        this.turnAtSpeed(5*delta_angle);
      }
    }else {
      this.controls.boost = 0;
      this.turnAtSpeed(1);
      this.aimAt({angle:this.sensors.direction,distance:0,energy:0});
    }
    this.murder();
  }

  // c = theta * r
  // maxTrackSpeed == angle_speed * dt * wheel_base
  turnAtSpeed(ang_vel:number) {
    let fast_track_speed = Tank.MaxTrackSpeed;
    let slow_track_speed = Tank.MaxTrackSpeed - Math.abs(ang_vel) * Tank.Wheelbase;

    if(ang_vel < 0) {
      this.controls.left_track_speed = slow_track_speed;
      this.controls.right_track_speed = fast_track_speed;
    } else {
      this.controls.left_track_speed = fast_track_speed;
      this.controls.right_track_speed = slow_track_speed;
    }
  }

  murder() {
    if(this.radar_target){
      if(this.aimAt(this.radar_target)){
        this.controls.fire_gun =0.4;
      };
    }
  }

  aimAt(target:Enemy):boolean{
    let delta_ang = this.api.turnAngle(
      this.sensors.gun_angle, 
      target.angle-this.sensors.direction);
    this.controls.turn_gun = delta_ang/this.api.getDeltaT();
    return Math.abs(delta_ang) < 0.1;
  }
}
