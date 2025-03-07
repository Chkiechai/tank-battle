import {Composite, Vector as Vector, Vertices} from 'matter-js';
import {Bodies,Body,Engine} from 'matter-js';
import { nstr, setw} from '../utils/string';
import { limitAngle, angleRelativeTo } from '../utils/math';
import Script from './script';
import { Game } from '../game';
import {Radar,RadarData} from './radar';
import { Turret } from './turret';
import Bullet from 'src/bullet/bullet';

export type Controls = {
  turn_gun: number,
  turn_radar: number,
  left_track_speed: number,
  right_track_speed: number,
  fire_gun: boolean,
  show_radar: boolean,
}

export type Sensors = {
  radar_hits: RadarData,
  speed: number,
  direction: number,
  gun_angle: number,
  radar_angle: number,
  energy: number,
  impact: boolean,
}

// Questions:
//   - How do I make this thing have collision detection? - use Body isSensor
//   - What should I do when a collision happens? move and slide? crash? - move and slide, for now.
//   - Should tanks be able to push each other around? - yes
//   - Should the drives be applying forces instead of just setting speeds? - no, not for now. Set speeds, it's easier.
//
// The Tank has a radar, a gun, a body, and some code. The code is provided by the player
// to control the rest of it. See the tank-api.ts file for details about what's in the
// sensors and controls.

export default class Tank{
  wheel_base:number
  energy: number
  gun_charge: number
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
  team_id: number
  radar: Radar
  turret: Turret
  bullets:Bullet[]

  static min_turn_angle: number=0.00001
  static width:number = 20
  static length:number = 25
  static max_energy: 100
  static max_speed:number = 200
  static max_radar_speed:number = 2*Math.PI
  static radar_range:number = 200
  static max_gun_speed:number = Math.PI/2

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
  constructor(team_id:number, pos:Vector, extra_globals: any) {
    this.team_id = team_id;
    this.starting_pos = pos;
    this.body = Bodies.rectangle(pos.x, pos.y, Tank.length, Tank.width,{label:"Tank Body"});
    this.body.frictionAir = 0;
    this.max_energy = Tank.max_energy;
    this.wheel_base = Tank.width;
    Body.setAngle(this.body,0);
    this.gun_charge = 1;
    this.left_speed = 0;
    this.right_speed = 0;
    this.energy = this.max_energy;
    this.max_speed = 100;
    this.delta_t = 0.016;
    this.radar = new Radar(this);
    this.body.collisionFilter.category = Game.teamCollisionFilter(this.team_id);
    this.body.collisionFilter.mask = 0xffffffff;
    this.body.collisionFilter.group = 0;
    this.turret = new Turret(this);
    this.bullets = [];

    // Add globals for the tank
    extra_globals.getSensors= this.getSensors.bind(this);
    extra_globals.getControls= this.getControls.bind(this);
    extra_globals.setControls= this.setControls.bind(this);
    extra_globals.getDeltaT= this.getDeltaT.bind(this);

    this.code = new Script('', Script.addDefaultGlobals(extra_globals));
    this.controls = {
      turn_gun: 0,
      turn_radar: 0,
      left_track_speed: 0,
      right_track_speed: 0,
      fire_gun: false,
      show_radar: true,
    };
  }

  // A unique identifier number for each tank
  id():number {
    return this.body.id;
  }

  // Add this tank to the world, along with its other body pieces. There might be
  // a better way to do this using parts.
  add_to_world(world:Composite) {
    Composite.add(world,this.body);
    Composite.add(world, this.radar.collision_shape);
    Composite.add(world,this.turret.shape);
  }

  // Add a hook to do something whenever the tank is updated. This isn't currently used.
  onUpdate(hndler:(t:Tank)=>void, skip:number = 100) {
    let count:number = 1;
    let self = this;
    this.update_handler = ()=>{
      if(count % skip == 0) {
        hndler(this);
      }
      count += 1;
    }
  }

  // Put the toys back where they started. kakoii
  reset(engine:Engine) {
    Body.setPosition(this.body, this.starting_pos);
    Body.setVelocity(this.body,Vector.create(0,0));
    Body.setAngle(this.body,0);
    Body.setAngularSpeed(this.body, 0);
    for(let bullet of this.bullets) {
      Composite.remove(engine.world,bullet.body);
    }
    this.bullets = [];
    this.radar.reset();
    this.turret.reset();
    this.code.update('');
  }

  // Go through all of the controls and update the tank properties based on
  // what the code says to do.
  update(delta_t: number, engine:Engine) {
    Body.setAngle(this.body, limitAngle(this.body.angle));
    this.radar.update(delta_t, this);
    this.turret.update(delta_t, this);

    this.left_speed = this.controls.left_track_speed;
    this.right_speed = this.controls.right_track_speed;
    if(this.controls.fire_gun) {
      this.controls.fire_gun = false;
      let bullet = this.turret.fire();
      if(bullet) {
        Composite.add(engine.world, bullet.body);
        this.bullets.push(bullet);
      }
    }
    let limited = Math.max(this.left_speed,this.right_speed);
    if(limited > Tank.max_speed) {
      console.log(`WARNING: limiting tank speed to ${Tank.max_speed}, requested speed was ${limited}`);
      this.left_speed *= Tank.max_speed/limited;
      this.right_speed *= Tank.max_speed/limited;
    }
    let delta_angle = (this.left_speed - this.right_speed)*delta_t / this.wheel_base;
    let angle = this.body.angle;
    let velocity = Vector.mult(Vector.create(Math.cos(angle), Math.sin(angle)), (this.left_speed+this.right_speed)/2);
    Body.setAngularVelocity(this.body, delta_angle);
    Body.setVelocity(this.body, Vector.mult(velocity,1/Game.sim_fps));
    if(this.update_handler) {
      this.update_handler(this);
    }
  }

  // Put some diagnostics up about the tank's motion properties
  show():string {
    return `Tank pose: `
      +` left: ${setw(nstr(this.left_speed),4)}`
      +` right: ${setw(nstr(this.right_speed),4)}`
      +` ang=${setw(nstr(this.body.angle),4)}`
      +` angvel=${setw(nstr(this.body.angularVelocity*Game.sim_fps),4)}`
      + setw(` vel=(${Math.round(this.body.velocity.x*Game.sim_fps)},${Math.round(this.body.velocity.y*Game.sim_fps)})`, 15)
      + setw(` pos=(${Math.round(this.body.position.x)},${Math.round(this.body.position.y)})`, 15)
      ;
  }

  setCode(code:string) {
    this.code.update(code);
  }

  getSensors() : Sensors {
    return {
      radar_hits: this.radar.get_hits(),
      speed: Game.sim_fps*(this.left_speed+this.right_speed)/2,
      direction:this.body.angle,
      gun_angle: angleRelativeTo(this.turret.get_angle(), 0),
      radar_angle: angleRelativeTo(this.radar.angle(),this.body.angle),
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
