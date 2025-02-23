import {test,expect} from "@jest/globals";
import {limitAngle} from "../src/utils";
import {Ray} from "../src/math";
import {Vector} from 'matter-js';

test("limitAngle works", () => {
  expect(limitAngle(10*Math.PI)).toBeCloseTo(0);
  expect(limitAngle(3*Math.PI)).toBeCloseTo(Math.PI);
  expect(limitAngle(-4*Math.PI+2)).toBeCloseTo(2);
  expect(limitAngle(-4*Math.PI-2)).toBeCloseTo(Math.PI*2-2);
})

test("ray intersection works", () => {
  let r1 = new Ray(Vector.create(0,0), Vector.create(2,1));
  let r2 = new Ray(Vector.create(100,100), Vector.create(0,-1));
  let x = r1.intersect(r2);
  expect(x).toBeTruthy();
  if(x != null) {
    expect(x.x).toBeCloseTo(100);
    expect(x.y).toBeCloseTo(50);
  }
  x = r2.intersect(r1);
  expect(x).toBeTruthy();
  if(x != null) {
    expect(x.x).toBeCloseTo(100);
    expect(x.y).toBeCloseTo(50);
  }
})
