import {Vector} from 'matter-js';
export {Vector} from 'matter-js';
import { Ray } from 'src/utils/math';

export interface TankAPI {
  getControls: () => Controls,
  getSensors: () => Sensors,
  setControls: (arg0:Controls) => void,
  getDeltaT: () => number,
  println: (...args:any[])=>void,
  pause: ()=>void,
  resume: ()=>void,
  turnAngle: (from:number, to:number)=>number,
  limitAngle: (ang:number) => number,
  clamp: (num:number, min:number, max:number) => number,
  fmod: (num:number, modulus: number) => number,
  Ray: Ray,
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
  energy: number|undefined,
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

