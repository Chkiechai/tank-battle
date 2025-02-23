

// limit the angle to the range 0...2pi
export function limitAngle(angle:number):number {
  let shrunk = angle/(2*Math.PI);
  let new_angle = angle - Math.trunc(shrunk)*2*Math.PI;
  if(new_angle < 0) {
    new_angle += 2 * Math.PI;
  }
  return new_angle;
}

export function nstr(n:number):string {
  return ''+Math.round(n*1000)/1000.0
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

export function setw(str:string, width: number): string {
  let space=' '.repeat(width);
  return (str+space).slice(0,width);
}

export function angleRelativeTo(my_angle:number, relative_to:number):number {
  let diff = limitAngle(my_angle - relative_to);
  if(diff > Math.PI) {
    diff -= 2*Math.PI;
  }
  return diff;
}
