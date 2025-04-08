import {test,expect} from "@jest/globals";
import {Ray,turnAngle,limitAngle} from "../src/utils/math";
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

test("angleDiff works", () => {
  let df  = turnAngle(1.2, -1.8);
  expect(df).toBeCloseTo(-3);
  df = turnAngle(1, -3.4);
  expect(df).toBeCloseTo(-4.4+Math.PI);
  df = turnAngle(7,1);
  expect(df).toBeCloseTo(1-(7-2*Math.PI));
})
