import {Composite, Vector as Vector, Vertices} from 'matter-js';
import {Bodies,Body,Engine} from 'matter-js';
import { nstr, setw} from '../utils/string';
import { limitAngle, angleRelativeTo } from '../utils/math';
import {Script, EmptyModule } from './script';
import { Game } from '../game';
import {Radar,RadarData} from './radar';
import { Turret } from './turret';
import Bullet from 'src/bullet/bullet';
import { TankAPI } from 'tank-api';

export type Controls = {
  turn_gun: number,
  turn_radar: number,
  left_track_speed: number,
  right_track_speed: number,
  fire_gun: number, // equals power to apply to the bullet
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

export class Tank{
  dead:boolean
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
  hit_points: number
  bullets:Bullet[]

  static MinTurnAngle: number=0.00001
  static MaxAngularVelocity: number=Math.PI
  static Width:number = 20
  static Length:number = 25
  static MaxEnergy: 1000
  static MaxSpeed:number = 200
  //static MaxRadarSpeed:number = 2*Math.PI
  //static RadarRange:number = 200
  //static MaxGunSpeed:number = Math.PI/2
  static DefaultControls:Controls = {
      turn_gun: 0,
      turn_radar: 0,
      left_track_speed: 0,
      right_track_speed: 0,
      fire_gun: 0,
      show_radar: true,
    };

  static DefaultCode = `
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
    this.dead = false;
    this.team_id = team_id;
    this.starting_pos = pos;
    this.body = Bodies.rectangle(pos.x, pos.y, Tank.Length, Tank.Width,{label:"Tank Body"});
    this.body.frictionAir = 0;
    this.max_energy = Tank.MaxEnergy;
    this.wheel_base = Tank.Width;
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
    this.hit_points = 1;
    this.bullets = [];

    // Add globals for the tank
    extra_globals.getSensors= this.getSensors.bind(this);
    extra_globals.getControls= this.getControls.bind(this);
    extra_globals.setControls= this.setControls.bind(this);
    extra_globals.getDeltaT= this.getDeltaT.bind(this);

    this.code = new Script(
      new EmptyModule(),
      Script.addDefaultGlobals(extra_globals) as TankAPI
    );

    this.controls = {
      turn_gun: 0,
      turn_radar: 0,
      left_track_speed: 0,
      right_track_speed: 0,
      fire_gun: 0,
      show_radar: true,
    };
  }

  // A unique identifier number for each tank
  id():number {
    return this.body.id;
  }

  die() {
    this.dead = true
    this.body.friction = 0.5;
    this.body.frictionAir = 0.5;
    this.radar.set_visible(false);
  }

  take_damage(damage: number) {
    this.hit_points -= damage;
    console.log(`Tank ${this.body.id} took ${damage} damage: hp = ${this.hit_points}`);
    if (this.hit_points <= 0) {
      console.log(`AM DEAD. (id=${this.body.id})`);
      this.die();
    }
  }
  // Add this tank to the world, along with its other body pieces. There might be
  // a better way to do this using parts.
  add_to_world(world:Composite) {
    Composite.add(world,this.body);
    Composite.add(world, this.radar.collision_shape);
    Composite.add(world,this.turret.shape);
  }

  remove_from_world(world:Composite){
    Composite.remove(world,this.body);
    Composite.remove(world,this.radar.collision_shape);
    Composite.remove(world,this.turret.shape);
  }

  stop() {
    this.controls.right_track_speed = 0;
    this.controls.left_track_speed = 0;
    this.controls.fire_gun = 0;
    this.controls.turn_radar = 0;
    this.controls.turn_gun = 0;
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
  reset(engine:Engine, position: Vector|null = null, angle: number=0 ) {
    if(position !== null) {
      this.starting_pos = position;
    }
    Body.setPosition(this.body, this.starting_pos);
    Body.setVelocity(this.body,Vector.create(0,0));
    Body.setAngle(this.body,angle);
    Body.setAngularSpeed(this.body, 0);
    for(let bullet of this.bullets) {
      Composite.remove(engine.world,bullet.body);
    }
    this.dead = false;
    this.energy = Tank.MaxEnergy;
    this.controls = Tank.DefaultControls;
    this.bullets = [];
    this.radar.reset();
    this.turret.reset();
    //this.code.update('');
  }

  // Go through all of the controls and update the tank properties based on
  // what the code says to do.
  update(delta_t: number, game:Game) {
    if (this.dead) {
      this.stop();
    } else {
      this.control(delta_t);
    }

    if(this.update_handler) {
      this.update_handler(this);
    }
    Body.setAngle(this.body, limitAngle(this.body.angle));
    this.radar.update(delta_t, this);
    this.turret.update(delta_t, this);

    this.left_speed = this.controls.left_track_speed;
    this.right_speed = this.controls.right_track_speed;
    if(this.controls.fire_gun>0) {
      let bullet = this.turret.fire(this.controls.fire_gun, this.body.velocity);
      if(bullet) {
        game.add_bullet(bullet);
      }
      this.controls.fire_gun = 0;
    }
    let limited = Math.max(this.left_speed,this.right_speed);
    if(limited > Tank.MaxSpeed) {
      console.log(`WARNING: limiting tank speed to ${Tank.MaxSpeed}, requested speed was ${limited}`);
      this.left_speed *= Tank.MaxSpeed/limited;
      this.right_speed *= Tank.MaxSpeed/limited;
    }
    if(!this.dead) {
      let delta_angle = (this.left_speed - this.right_speed)*delta_t / this.wheel_base;
      if(Math.abs(delta_angle*Game.SimFPS) > Tank.MaxAngularVelocity) {
        delta_angle = Math.sign(delta_angle) * Tank.MaxAngularVelocity/Game.SimFPS;
        this.left_speed *= Tank.MaxAngularVelocity/(delta_angle*Game.SimFPS);
        this.right_speed *= Tank.MaxAngularVelocity/(delta_angle*Game.SimFPS);
      }
      let angle = this.body.angle;
      let velocity = Vector.mult(Vector.create(Math.cos(angle), Math.sin(angle)), (this.left_speed+this.right_speed)/2);
      Body.setAngularVelocity(this.body, delta_angle);
      Body.setVelocity(this.body, Vector.mult(velocity,1/Game.SimFPS));
    }
  }

  // Put some diagnostics up about the tank's motion properties
  show():string {
    return `Tank pose: `
      +` left: ${setw(nstr(this.left_speed),4)}`
      +` right: ${setw(nstr(this.right_speed),4)}`
      +` ang=${setw(nstr(this.body.angle),4)}`
      +` angvel=${setw(nstr(this.body.angularVelocity*Game.SimFPS),4)}`
      + setw(` vel=(${Math.round(this.body.velocity.x*Game.SimFPS)},${Math.round(this.body.velocity.y*Game.SimFPS)})`, 15)
      + setw(` pos=(${Math.round(this.body.position.x)},${Math.round(this.body.position.y)})`, 15)
      ;
  }

  setCode(code:string) {
    this.code.update(code);
  }

  setModule(script:Script) {
    this.code = script;
  }
  
  getSensors() : Sensors {
    return {
      radar_hits: this.radar.get_hits(),
      speed: Game.SimFPS*(this.left_speed+this.right_speed)/2,
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
