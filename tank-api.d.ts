//import {Tank} from './tank/tank';
//import {Game} from './game';
import {Vector} from 'matter-js';

export declare class Ray {
  origin: Vector
  direction: Vector
  constructor(origin:Vector,direction:Vector)
  intersect(other:Ray):Vector|null 
}

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
  setSensors(s:Sensors):void
  getDeltaT():number
}
export interface Game{
  println(...msg:any[]):void
  pause():void
  resume():void
}

export class Constants {
  public static readonly MaxTrackSpeed = 200
  public static readonly MaxTurnSpeed = 3.1415926536
  public static readonly MaxRadarTurn = 6.2831853072
  public static readonly RadarRange = 300
  public static readonly MaxGunTurn = 3.1415926536
  public static readonly MaxShotEnergy = 1.0
  public static readonly GunRechargeRate = 0.01
  public static readonly TankWheelBase = 20
}

export interface Globals {
  withTank(tank:Tank):Globals 
  withGame(game:Game):Globals 
  check():boolean 
  getControls():Controls 
  getSensors():Sensors 
  setControls(controls:Controls):void
  getDeltaT():number
  println(...args:any[]):void
  pause():void
  resume():void
  turnAngle(from:number, to:number):number 
  limitAngle(ang:number):number 
  clamp(num:number, min:number, max:number): number 
  fmod(num:number, modulus: number):number 
  Ray: Ray
  Vector:Vector
}



