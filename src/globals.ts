//import {Tank} from './tank/tank';
//import {Game} from './game';
import {Vector} from 'matter-js';
import { Ray, turnAngle,limitAngle,clamp,fmod } from './utils/math';

/** 
 * The Controls are what the user scripts use to control their tanks. It's accessible in the
 * tank script's `update` function under the `api.getControls()` call. 
 *
 * The user script should change values as desired in order to get the tank to do things. The
 * values in the members will be left unchanged from the last call, so you can rely on them to
 * indicate what your last control signal was except for the `fire_gun` control, which is always 
 * reset to zero after every loop.
 */
export interface Controls {
  /// specify the *turn speed* of the turret, in **radians per second**. This is limited to `Math.PI`
  //  radians per second.
  turn_gun: number,

  /// Specify the *turn speed* of the {@link Radar}, in **radians per second**. This is limited to `2 * Math.PI`.
  turn_radar: number,

  /// Specify the speed of the left track. This is in "screen units" per second, which approximately equal pixels
  // per second. Negative numbers will make the track go in reverse, and the limit is an absolute value of 200.
  left_track_speed: number,
  /// Specify the speed of the right track. This is in "screen units" per second, which approximately equal pixels
  // per second. Negative numbers will make the track go in reverse, and the limit is an absolute value of 200.
  right_track_speed: number,
  /// Specify the **power** of the shot from the gun. This ranges from zero to one. Your tank 
  //has a limited amount of shot energy that is gradually replenished. Smaller shot power will 
  //let you shoot faster, but larger shot power does more damage beyond just the linear amount.
  fire_gun: number,
  show_radar: boolean,
  boost: number,
}

export interface RadarData  {
  wall: number,
  enemies: RadarHit[],
  allies: RadarHit[],
  bullets: RadarHit[],
}

export interface RadarHit  {
  distance:number,
  angle:number,
  velocity: Vector,
  energy: number,
}

export interface Sensors  {
  radar_hits: RadarData,
  id: number,
  speed: number,
  direction: number,
  gun_angle: number,
  radar_angle: number,
  energy: number,
  impact: boolean,
}
export interface Tank{
  team_id:number
  id():number
  getControls():Controls
  getSensors():Sensors
  setControls(c:Controls):void
  getDeltaT():number
}
export interface Game{
  println(...msg:any[]):void
  pause():void
  resume():void
  send_message(tank_id:number, team_id: number, message:any):void
}

export class Globals {
  static SimFPS = 60;
  static MaxTrackSpeed:number = 200
  static MaxTurnSpeed:number = Math.PI
  static MaxRadarTurn:number = Math.PI*2
  static RadarRange:number = 300
  static MaxGunTurn:number = Math.PI
  static MaxShotEnergy:number = 1.0
  static GunRechargeRate:number = 0.01
  static MaxBoostEnergy:number = 1000
  static BoostRechargeRate:number = Globals.MaxBoostEnergy/(Globals.SimFPS*3)

  constructor() {
    this.game = undefined;
    this.tank = undefined;
  }
  withTank(tank:Tank):Globals {
    this.tank = tank;
    return this;
  }
  withGame(game:Game):Globals {
    this.game = game;
    return this;
  }
  check():boolean {
    if(this.tank && this.game) {
      return true;
    } else {
      console.log("WARNING: Globals function called without initializing Globals instance.");
      return false;
    }
  }
  getControls():Controls {
    this.check();
    return this.tank?.getControls()
  }
  getSensors():Sensors {
    this.check();
    return this.tank?.getSensors()
  }
  setControls(controls:Controls) {
    this.check();
    this.tank?.setControls(controls);
  }
  sendMessage(msg:any) {
    this.check();
    this.game?.send_message(this.tank?.id(), this.tank?.team_id, msg);
  }
  getDeltaT():number{
    this.check();
    return this.tank?.getDeltaT();
  }
  println(...args:any[]){
    this.check();
    this.game?.println(...args);
  }
  pause(){
    this.check();
    this.game?.pause();
  }
  resume(){
    this.check();
    this.game?.resume();
  }
  turnAngle(from:number, to:number):number {
    return turnAngle(from,to);
  }
  limitAngle(ang:number):number {
    return limitAngle(ang);
  }
  clamp(num:number, min:number, max:number): number {
    return clamp(num,min,max);
  }
  fmod(num:number, modulus: number):number {
    return fmod(num,modulus);
  }
  Ray: Ray
  Vector:Vector

  private game: Game|undefined
  private tank: Tank|undefined
 }
