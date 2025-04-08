import { Vector } from "matter-js";

export class Ray {
  origin: Vector
  direction: Vector

  constructor(origin:Vector,direction:Vector) {
    this.origin = origin;
    this.direction = Vector.normalise(direction);
  }

  intersect(other:Ray):Vector|null {
    let p0 = this.origin;
    let p1 = other.origin;
    let q0 = this.direction;
    let q1 = other.direction;
    let c = Vector.dot(q0,q1);
    if(c >= 0.9999) {
      // Rays are parallel, so there is no single intersection
      return null;
    }
    //  s * (1-c^2) = q1.dot(p0-p1) + c*q0.dot(p1-p0)
    let q1_dot = Vector.dot(q1, Vector.sub(p0,p1));
    let q0_dot = Vector.dot(q0, Vector.sub(p1,p0));
    let s = (q1_dot + c*q0_dot)/(1-c*c);
    return Vector.add(other.origin, Vector.mult(other.direction, s));
  }
}

// Given two angles, return the shortest turn to get from `from_angle` to `to_angle`. 
// No turn will ever be more than Math.PI, but it may be positive or negative.
export function turnAngle(from_angle: number, to_angle: number):number {
  let pi2 = Math.PI*2;
  let delta = fmod(fmod(to_angle, pi2) - fmod(from_angle, pi2), pi2);
  console.log(`delta = ${delta}`);
  if(Math.abs(delta) > Math.PI) {
    delta -= Math.sign(delta)*Math.PI;
  }
  return delta;
}

// limit the angle to the range 0...2pi
export function limitAngle(angle:number):number {
  let shrunk = fmod(angle,(2*Math.PI));
  if(shrunk < 0) {
    shrunk += 2 * Math.PI;
  }
  return shrunk;
}

export function fmod(a:number, b:number) : number {
  return a - Math.trunc(a/b)*b;
}

export function clamp(value:number, min:number, max:number) : number {
  return Math.max(min, Math.min(max,value));
}

export function angleRelativeTo(my_angle:number, relative_to:number):number {
  let diff = limitAngle(my_angle - relative_to);
  if(diff > Math.PI) {
    diff -= 2*Math.PI;
  }
  return diff;
}
