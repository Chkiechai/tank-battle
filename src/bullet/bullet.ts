import { Bodies, Body, Composite, Vector } from "matter-js";
import { Game } from "../game";
import {RenderStyle} from "../tank/tank";
import {Globals} from "../globals";

export default class Bullet {
  body: Body;
  energy: number; // range = 0..1
  dead: boolean;

  public static readonly Speed:number = Globals.MaxTrackSpeed * 3;
  
  constructor(position:Vector, velocity:Vector, energy:number, style:RenderStyle) {
    this.body = Bodies.circle(position.x,position.y,3);
    this.body.isSensor = true;
    this.body.frictionAir = 0;
    this.body.friction = 0;
    this.body.restitution =1;
    this.body.collisionFilter.mask = 0xffffffff;
    this.body.collisionFilter.group = 0;
    this.body.collisionFilter.category = Game.BulletCollisionFilter;
    this.body.render = style;

    Body.setVelocity(this.body, velocity);
    this.body.label = "Bullet";
    this.dead = false /// garbage collecting: I want to get rid of bullets as soon as they touch anything...
    this.energy = energy;
  }

  damage():number {
    return this.energy ** 1.5;
  }

  update(_dt:number, game: Game) {
    //console.log(`Update Bullet id ${this.body.id}`);
    if(this.dead){
      //console.log(`Bullet id ${this.body.id} being removed.`);
      Composite.remove(game.world(), this.body);
    }
  }
}
