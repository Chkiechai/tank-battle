

import { Bodies, Body, Vector } from "matter-js"
import {RenderStyle, Tank} from "./tank";
import {clamp,limitAngle } from "../utils/math";
import Bullet from "src/bullet/bullet";
import { Game } from "src/game";

export class Turret {
  turn_speed: number // speed of rotation
  shape: Body
  tank_id: number // maybe used to mark bullets
  angle: number
  energy: number // when this is 1, I can shoot

  static MaxEnergy:number = 1;
  static EnergyRecovery: number = 0.01;
  static BarrelLength:number = 18;
  static MaxTurnSpeed: number = Math.PI // fastest allowed turning speed
  static MinimumShotEnergy: number = 0.1;
  constructor(tank: Tank) {
    this.energy = Turret.MaxEnergy;
    this.turn_speed = 0;
    this.tank_id = tank.id();
    this.angle = 0;
    this.setup_shape(tank.body.position);
  }

  setup_shape(pos:Vector):void {
    // The next section builds a turret shape that can rotate as part of the tank.
    this.shape = Body.create({
      label: "turret",
      isSensor:true,
      collisionFilter:{
        category:0,
        mask:0,
        group:-10,
      },
      render:{
        opacity:1,
        fillStyle: '#bbb',
        lineWidth: 1,
        visible:true,
      }

    });
    let turret = Bodies.rectangle(0,0,12,9);
    turret.render = {
        opacity:1,
        fillStyle: '#bbb',
        lineWidth: 1,
        visible:true,
      };
    let barrel = Bodies.rectangle(15,0,18,2);
    barrel.render={
        opacity:1,
        fillStyle: '#bbb',
        lineWidth: 1,
        visible:true,
      };
    Body.setParts(this.shape,[turret,barrel]);
    Body.setCentre(this.shape, Vector.create(this.shape.bounds.min.x+6,0));
    Body.setPosition(this.shape,pos);
  }

  reset() {
    Body.setAngle(this.shape,0);
    this.shape.render.opacity = 1;
    this.shape.render.fillStyle = '#bbb';
    this.shape.render.lineWidth=1;
    this.angle = 0;
    this.energy = Turret.MaxEnergy;
    this.turn_speed = 0;
  }

  update(delta_t:number, tank:Tank) {
    this.turn_speed = clamp(tank.controls.turn_gun, -Turret.MaxTurnSpeed, Turret.MaxTurnSpeed);
    this.angle = limitAngle(this.angle + this.turn_speed * delta_t);
    this.energy += Turret.EnergyRecovery;
    if(this.energy > Turret.MaxEnergy) {
      this.energy = Turret.MaxEnergy;
    }
    Body.setPosition(this.shape,tank.body.position);
    Body.setAngle(this.shape, limitAngle(tank.body.angle+this.angle));
  }

  get_angle():number {
    return this.angle;
  }

  // Shoot a bullet from the end of the barrel, aimed in the same direction as the barrel,
  // and incorporating the speed of the tank it was fired from. The shot_energy is used
  // to compute the damage.

  fire(shot_energy:number,initial_velocity:Vector, tank_style:RenderStyle): Bullet|undefined {
    //let bullet = new Bullet(// oh noeeessss)
    // need a position and a velocity
    // The barrel length is in Turret.BarrelLength
    if(shot_energy < Turret.MinimumShotEnergy) {
      shot_energy = Turret.MinimumShotEnergy;
    }
    if(this.energy < shot_energy) {
      return undefined;
    } else {
      this.energy -= shot_energy;
    }
    let barrelDisp: Vector = Vector.create(
        Turret.BarrelLength * Math.cos(this.shape.angle),
        Turret.BarrelLength * Math.sin(this.shape.angle)
    );// konichiwa
    let endOfGun: Vector = Vector.add(this.shape.position, barrelDisp);
    let bulletVel: Vector = Vector.add(initial_velocity, Vector.mult(Vector.normalise(barrelDisp), Bullet.Speed*Game.FixedDt));
    return new Bullet(endOfGun, bulletVel, shot_energy,tank_style);
  }
}
