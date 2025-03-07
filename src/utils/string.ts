import { Vector } from "matter-js";

export function nstr(n:number):string {
  return ''+Math.round(n*1000)/1000.0
}

export function setw(str:string, width: number): string {
  let space=' '.repeat(width);
  return (str+space).slice(0,width);
}

export function vecstr(v:Vector): string {
  return `(${nstr(v.x)}, ${nstr(v.y)})`;
}
