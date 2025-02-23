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


