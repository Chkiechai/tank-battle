//import {Tank} from './tank/tank';
//import {Game} from './game';
import {Vector} from 'matter-js';
import { Ray, turnAngle,limitAngle,clamp,fmod } from './utils/math';

export interface Controls {
  turn_gun: number,
  turn_radar: number,
  left_track_speed: number,
  right_track_speed: number,
  fire_gun: number,
  show_radar: boolean,
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
  speed: number,
  direction: number,
  gun_angle: number,
  radar_angle: number,
  energy: number,
  impact: boolean,
}
export interface Tank{
  getControls():Controls
  getSensors():Sensors
  setControls(c:Controls):void
  getDeltaT():number
}
export interface Game{
  println(...msg:any[]):void
  pause():void
  resume():void
}

export class Globals {
  static MaxTrackSpeed:number = 200
  static MaxTurnSpeed:number = Math.PI
  static MaxRadarTurn:number = Math.PI*2
  static RadarRange:number = 300
  static MaxGunTurn:number = Math.PI
  static MaxShotEnergy:number = 1.0
  static GunRechargeRate:number = 0.01
  
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

