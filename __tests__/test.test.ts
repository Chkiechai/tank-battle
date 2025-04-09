import {test,expect,describe} from "@jest/globals";
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
  expect(df).toBeCloseTo(-4.4+2*Math.PI);
  df = turnAngle(7,1);
  expect(df).toBeCloseTo(1-(7-2*Math.PI));
})

describe('turnAngle', () => {
  // Helper function to compare floating point values with tolerance
  const expectCloseTo = (actual: number, expected: number) => {
    expect(actual).toBeCloseTo(expected, 10);
  };

  // Test cases for common angles
  test('should return 0 for identical angles', () => {
    expectCloseTo(turnAngle(0, 0), 0);
    expectCloseTo(turnAngle(Math.PI, Math.PI), 0);
    expectCloseTo(turnAngle(2 * Math.PI, 0), 0);
  });

  test('should handle basic clockwise differences (positive returns)', () => {
    // Quarter turn clockwise (0 to π/2)
    expectCloseTo(turnAngle(0, Math.PI / 2), Math.PI / 2);
    
    // Half turn clockwise (0 to π)
    expectCloseTo(turnAngle(0, Math.PI), Math.PI);
    
    // Small clockwise turn
    expectCloseTo(turnAngle(0, 0.1), 0.1);
  });

  test('should handle basic counterclockwise differences (negative returns)', () => {
    // Quarter turn counterclockwise (π/2 to 0)
    expectCloseTo(turnAngle(Math.PI / 2, 0), -Math.PI / 2);
    
    // Almost half turn counterclockwise
    expectCloseTo(turnAngle(Math.PI, 0.1), -Math.PI + 0.1);
  });

  test('should always return the smallest angular difference', () => {
    // Going from 0 to 3π/2 would be -π/2 (counterclockwise) as it's shorter
    expectCloseTo(turnAngle(0, 3 * Math.PI / 2), -Math.PI / 2);
    
    // Going from 3π/2 to 0 would be π/2 (clockwise) as it's shorter
    expectCloseTo(turnAngle(3 * Math.PI / 2, 0), Math.PI / 2);
  });

  test('should handle angles greater than 2π', () => {
    // 4π is same as 0
    expectCloseTo(turnAngle(0, 4 * Math.PI), 0);
    
    // 5π/2 is same as π/2
    expectCloseTo(turnAngle(0, 5 * Math.PI / 2), Math.PI / 2);
    
    // Both angles outside 0-2π range
    expectCloseTo(turnAngle(4 * Math.PI, 5 * Math.PI / 2), Math.PI / 2);
  });

  test('should handle negative angles', () => {
    // -π/2 is same as 3π/2
    expectCloseTo(turnAngle(0, -Math.PI / 2), -Math.PI / 2);
    
    // Both angles negative
    expectCloseTo(turnAngle(-Math.PI / 2, -Math.PI), -Math.PI / 2);
    
    // Extreme negative value
    expectCloseTo(turnAngle(0, -9 * Math.PI / 2), -Math.PI / 2);
  });

  test('should handle edge cases around the π boundary', () => {
    // Slightly less than π (clockwise) should remain positive
    expectCloseTo(turnAngle(0, Math.PI - 0.01), Math.PI - 0.01);
    
    // Slightly more than π (counterclockwise) should become negative
    expectCloseTo(turnAngle(0, Math.PI + 0.01), -Math.PI + 0.01);
    
    // At exactly the π boundary
    expectCloseTo(turnAngle(0, Math.PI), Math.PI);
    expectCloseTo(turnAngle(Math.PI, 0), -Math.PI);
  });

  test('should handle angles close to 0 and 2π boundary', () => {
    // Small angles near 0/2π boundary should give expected results
    expectCloseTo(turnAngle(0.01, 2 * Math.PI - 0.01), -0.02);
    expectCloseTo(turnAngle(2 * Math.PI - 0.01, 0.01), 0.02);
  });
});
