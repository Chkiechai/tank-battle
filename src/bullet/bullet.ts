import { Bodies, Body, Composite, Engine, Vector } from "matter-js";
import { Game } from "src/game";
import Tank from "src/tank/tank";
import { vecstr } from "src/utils/string";

export default class Bullet {
  body: Body;
  energy: number;
  dead: boolean;

  static Speed:number = Tank.MaxSpeed * 3;
  static Damage:(energy:number)=>number=(energy:number)=>energy ** 1.5;

  constructor(position:Vector, velocity:Vector, energy:number) {
    this.body = Bodies.circle(position.x,position.y,3);
    this.body.isSensor = true;
    this.body.frictionAir = 0;
    this.body.friction = 0;
    this.body.restitution =1;
    this.body.collisionFilter.mask = 0xffffffff;
    this.body.collisionFilter.group = 0;
    this.body.collisionFilter.category = Game.BulletCollisionFilter;

    Body.setVelocity(this.body, velocity);
    this.body.label = "Bullet";
    this.dead = false /// garbage collecting: I want to get rid of bullets as soon as they touch anything...
    this.energy = energy;
  }

  update(_dt:number, game: Game) {
    console.log(`Update Bullet id ${this.body.id}`);
    if(this.dead){
      console.log(`Bullet id ${this.body.id} being removed.`);
      Composite.remove(game.world(), this.body);
    }
  }
}
