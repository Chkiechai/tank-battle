import {Vector as Vector} from 'matter-js';
import {Bodies,Body,Engine} from 'matter-js';
import { nstr,limitAngle } from './utils';
import Script from './script';

type Controls = {
  turn_gun: number,
  turn_radar: number,
  left_track_speed: number,
  right_track_speed: number,
  fire_gun: boolean,
}

type RadarData = {
  wall: boolean,
  enemies: RadarHit[],
  allies: RadarHit[],
  bullets: RadarHit[],
}

type RadarHit = {
  distance:number,
  angle:number,
  velocity: Vector,
  energy: number|undefined,
}

type Sensors = {
  radar_hits: RadarData,
  speed: number,
  direction: number,
  gun_angle: number,
  radar_angle: number,
  energy: number,
  impact: boolean,
}

// Questions:
//   - How do I make this thing have collision detection?
//   - What should I do when a collision happens? move and slide? crash?
//   - Should tanks be able to push each other around?
//   - Should the drives be applying forces instead of just setting speeds?
//
// I could model this as a rigid body that has collisions, and use forces as a thrust
// on each wheel. If I do that, I need to implement a sideways friction force that 
// prevents the tanks from sliding sideways (maybe with a limit, so they can drift?).
// I could just directly cancel all velocity that is not along the axis of motion, 
// effectively giving the tank infinite traction.
export default class Tank{
  wheel_base:number
  gun_angle: number
  energy: number
  gun_charge: number
  radar_angle: number
  left_speed: number
  right_speed: number
  max_energy: number 
  max_speed: number
  delta_t: number
  body: Body
  code: Script
  controls: Controls
  update_handler:undefined|((t:Tank)=>void) = undefined
  starting_pos: Vector
  
  static min_turn_angle: number=0.00001
  static width:number = 20
  static length:number = 25 
  static max_energy: 100 
  static default_code = `
import {TankAPI,Controls,Sensors} from './tank-api';
export function setup() {

}


export function loop(api:TankAPI) {
  let controls = api.getControls();
  let sensors = api.getSensors();
  //your code here.
  api.setControls(controls);
}
`;
  constructor(pos:Vector) {
    this.starting_pos = pos;
    this.body = Bodies.rectangle(pos.x, pos.y, Tank.length, Tank.width);
    this.max_energy = Tank.max_energy;
    this.gun_angle = 0;
    this.wheel_base = Tank.width;
    Body.setAngle(this.body,0);
    this.gun_charge = 1;
    this.left_speed = 0;
    this.right_speed = 0;
    this.energy = this.max_energy;
    this.max_speed = 100;
    this.delta_t = 0.016;
    this.code = new Script('', Script.addDefaultGlobals({
      getSensors: this.getSensors.bind(this),
      getControls: this.getControls.bind(this),
      setControls: this.setControls.bind(this),
      getDeltaT: this.getDeltaT.bind(this),
    }));
    this.controls = {
      turn_gun: 0,
      turn_radar: 0,
      left_track_speed: 0,
      right_track_speed: 0,
      fire_gun: false,
    };
  }
  
  onUpdate(hdler:(t:Tank)=>void, skip:number = 100) {
    let count:number = 1;
    let self = this;
    this.update_handler = ()=>{
      if(count % skip == 0) {
        hdler(this);
      }
      count += 1;
    }
  }
 
  reset() {
    Body.setPosition(this.body, this.starting_pos);
    Body.setVelocity(this.body,Vector.create(0,0));
    Body.setAngle(this.body,0);
    Body.setAngularSpeed(this.body, 0);
    this.code.update('');
  }
  
  update(delta_t: number) {
    this.left_speed = this.controls.left_track_speed;
    this.right_speed = this.controls.right_track_speed;
    let delta_angle = (this.left_speed - this.right_speed)*delta_t / this.wheel_base;
    let angle = this.body.angle;
    let velocity = Vector.mult(Vector.create(Math.cos(angle), Math.sin(angle)), (this.left_speed+this.right_speed)/2);
    Body.setAngle(this.body, limitAngle(angle + delta_angle));
    Body.setAngularVelocity(this.body, delta_angle/delta_t);
    Body.setPosition(this.body, Vector.add(this.body.position, Vector.mult(velocity,delta_t)));
    Body.setVelocity(this.body, velocity);
    if(this.update_handler) {
      this.update_handler(this);
    }
  }

  
  show():string {
    return `Tank pose: `
      +` left: ${nstr(this.left_speed)}`
      +` right: ${nstr(this.right_speed)}`
      +` pos=(${nstr(this.body.position.x)},${nstr(this.body.position.y)})`
      +` ang=${nstr(this.body.angle)}` 
      +` angvel=${nstr(this.body.angularVelocity)}`
      +` vel=(${nstr(this.body.velocity.x)},${nstr(this.body.velocity.y)})`
      ;
  }

  setCode(code:string) {
    this.code.update(code);
  }

  getSensors() : Sensors {
    let rd = {
      wall: false,
      enemies: [],
      allies: [],
      bullets: [],
    } as RadarData;
    
    return {
      radar_hits: rd,
      speed: (this.left_speed+this.right_speed)/2,
      direction:this.body.angle,
      gun_angle:this.gun_angle,
      radar_angle: this.radar_angle,
      energy: this.energy,
      impact: false,
    } as Sensors;
  }

  getControls() {
    return this.controls;
  }
 
  getDeltaT() {
    return this.delta_t;
  }
  
  setControls(controls:Controls) {
    if(controls) {
      this.controls = controls;
    }
  }
  
  control(delta_t: number) {
    this.delta_t = delta_t;
    this.code.execute();
  }
}

