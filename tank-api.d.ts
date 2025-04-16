//import {Tank} from './tank/tank';
//import {Game} from './game';
import {Vector} from 'matter-js';

export declare class Ray {
  origin: Vector
  direction: Vector
  constructor(origin:Vector,direction:Vector)
  intersect(other:Ray):Vector|null 
}

export declare function fmod(a:number, b:number) : number 
export declare function turnAngle(from_angle: number, to_angle: number):number 
export declare function limitAngle(angle:number):number 
export declare function clamp(value:number, min:number, max:number) : number 
export declare function angleRelativeTo(my_angle:number, relative_to:number):number 

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

export declare class Globals {
  constructor() 
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



