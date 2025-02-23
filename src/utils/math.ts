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

// limit the angle to the range 0...2pi
export function limitAngle(angle:number):number {
  let shrunk = angle/(2*Math.PI);
  let new_angle = angle - Math.trunc(shrunk)*2*Math.PI;
  if(new_angle < 0) {
    new_angle += 2 * Math.PI;
  }
  return new_angle;
}

export function clamp(value:number, min:number, max:number) : number {
  if(value < min) {
    return min;
  } else if(value > max) {
    return max;
  } else {
    return value;
  }
}

export function angleRelativeTo(my_angle:number, relative_to:number):number {
  let diff = limitAngle(my_angle - relative_to);
  if(diff > Math.PI) {
    diff -= 2*Math.PI;
  }
  return diff;
}
