import { Bodies, Body, Composite, Engine, Vector } from "matter-js";
import Tank from "src/tank/tank";
import { vecstr } from "src/utils/string";

export default class Bullet {
  body: Body;
  dead: boolean;
  static Speed:number = Tank.max_speed * 3;

  constructor(position:Vector, velocity:Vector) {
    this.body = Bodies.circle(position.x,position.y,3);
    this.body.frictionAir = 0;
    this.body.friction = 0;
    this.body.restitution =1;
    Body.setVelocity(this.body, velocity);
    this.body.label = "Bullet";
    this.dead = false /// garbage collecting: I want to get rid of bullets as soon as they touch anything...
    console.log("new bullet with ", vecstr(position), " and vel = ", vecstr(velocity));
  }

  update(dt:number, engine: Engine) {
    if(this.dead){
      Composite.remove(engine.world, this.body);
    }
  }
}
