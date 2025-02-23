
  
import { Bodies, Body, Pair, Vector } from "matter-js"
import {Game} from "./game";
import Tank from "./tank";
import {clamp,limitAngle, nstr} from "./utils";
import { Ray } from "./math";

export class Turret {
  turn_speed: number // speed of rotation
  shape: Body
  tank_id: number // maybe used to mark bullets
  
  static max_turn_speed: number = Math.PI // fastest allowed turning speed
  
  constructor(tank: Tank) {
    this.turn_speed = 0;
    this.tank_id = tank.id();
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
        fillStyle: '#141',
        visible:true,
      }

    });
    let turret = Bodies.rectangle(0,0,12,9);
    let barrel = Bodies.rectangle(15,0,18,2);
    Body.setParts(this.shape,[turret,barrel]);
    Body.setCentre(this.shape, Vector.create(this.shape.bounds.min.x+6,0));
  }

  reset() {
    Body.setAngle(this.shape,0);
    this.turn_speed = 0;
  }
  
  update(delta_t:number,tank:Tank) {
    this.turn_speed = clamp(
      tank.controls.turn_radar, 
      -Turret.max_turn_speed, 
      Turret.max_turn_speed);
    let angle = limitAngle(this.shape.angle + this.turn_speed * delta_t);
    Body.setAngle(this.shape,angle);
    Body.setPosition(this.shape, tank.body.position);
    //this.set_visible(tank.controls.show_radar);
    this.set_visible(true);
    console.log("Radar angle: ", nstr((this.shape.angle)));
  }
  
  set_visible(vis:boolean) {
    this.shape.render.visible = vis;   
  }

  same_team(body:Body):boolean {
    return (
      Game.teamCollisionFilter(this.team_id) 
      & Game.teamCollisionFilter(body.collisionFilter.category)) 
      != 0;
  }

  update(delta_t:number, tank:Tank) {
    this.turn_speed = clamp(tank.controls.turn_gun, -Tank.max_gun_speed, Tank.max_gun_speed);
    let angle = limitAngle(this.shape.angle + this.turn_speed * delta_t);
    Body.setPosition(this.shape,tank.body.position);
    Body.setAngle(this.shape, tank.body.angle+angle);
  }
  
  angle():number {
    return this.shape.angle;
  }
  
  get_hits():RadarData {
    return this.hits;
  }
}
}
