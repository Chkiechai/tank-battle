import {Tank,Controls} from './tank/tank';
import {Game} from './game';
import {Vector} from 'matter-js';
export {Vector} from 'matter-js';
import { Ray, turnAngle,limitAngle,clamp,fmod } from './utils/math';


export default class TankAPI {
  game: Game
  tank: Tank
  
  constructor(game:Game, tank:Tank) {
    this.game = game;
    this.tank = tank;
  }
  
  getControls() {
    this.tank.getControls()
  }
  getSensors() {
    this.tank.getSensors()
  }
  setControls(controls:Controls) {
    this.tank.setControls(controls);
  }
  getDeltaT(){
    this.tank.getDeltaT();
  }
  println(...args:any[]){
    this.game.println(...args);
  }
  pause(){
    this.game.pause();
  }
  resume(){
    this.game.resume();
  }
  turnAngle(from:number, to:number):number {
    return turnAngle(from,to);
  }
  limitAngle(ang:number):number {
    return limitAngle(ang);
  }
  clamp(num:number, min:number, max:number): number {
    return clamp(num,min,max);
  }
  fmod(num:number, modulus: number):number {
    return fmod(num,modulus);
  }
  Ray: Ray
}

