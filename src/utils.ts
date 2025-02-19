

// limit the angle to the range 0...2pi
export function limitAngle(angle:number):number {
  let shrunk = angle/(2*Math.PI);
  let new_angle = angle - Math.floor(shrunk)*2*Math.PI;
  if(new_angle < 0) {
    new_angle += 2 * Math.PI;
  }
  return new_angle;
}

export function nstr(n:number):string {
  return ''+Math.round(n*1000)/1000.0
}
