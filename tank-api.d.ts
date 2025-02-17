import {Vector} from 'matter-js';

export interface Controls {
  turn_gun: number,
  turn_radar: number,
  left_track_speed: number,
  right_track_speed: number,
  fire_gun: boolean,
}

export interface RadarData  {
  wall: boolean,
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

export var controls: Controls;
export const sensors: Sensors;
export const Math:Math;
