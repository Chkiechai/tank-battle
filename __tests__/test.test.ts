import {test,expect} from "@jest/globals";
import {limitAngle} from "../src/utils";


test("limitAngle works", () => {
  expect(limitAngle(10*Math.PI)).toBeCloseTo(0);
  expect(limitAngle(3*Math.PI)).toBeCloseTo(Math.PI);
  expect(limitAngle(-4*Math.PI+2)).toBeCloseTo(2);
  expect(limitAngle(-4*Math.PI-2)).toBeCloseTo(Math.PI*2-2);
})

