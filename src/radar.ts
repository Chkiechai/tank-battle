import { Bodies, Body, Pair, Vector } from "matter-js"
import {Game} from "./game";
import Tank from "./tank";
import {clamp,limitAngle, nstr} from "./utils";
import { Ray } from "./math";

export type RadarData = {
  wall: number,
  enemies: RadarHit[],
  allies: RadarHit[],
  bullets: RadarHit[],
}

export type RadarHit = {
  distance:number,
  angle:number,
  velocity: Vector,
  energy: number|undefined,
}

export class Radar {
  range: number // distance the beam reaches
  sweep: number // angle to include in detection
  turn_speed: number // speed of rotation
  collision_shape: Body
  team_id: number // The team number of the tank that owns this radar
  tank_id: number // the tank's id number
  hits: RadarData
  
  static max_turn_speed: number = 2*Math.PI // fastest allowed turning speed
  static default_range: number = 300
  static emptyHits():RadarData  {
    return {
      wall:-1,
      enemies:[],
      allies:[],
      bullets:[]
    }
  }
  
  constructor(tank: Tank, range: number = Radar.default_range) {
    this.hits = Radar.emptyHits();
    this.range = range;
    this.sweep = Math.sin(Radar.max_turn_speed)*this.range;
    this.turn_speed = 0;
    this.team_id = tank.team_id;
    this.tank_id = tank.id();
    console.log(`Radar setup: tank_id = ${this.tank_id}, team_id = ${this.team_id}`);
    this.setup_shape(tank.body.position);
  }

  setup_shape(pos:Vector):void {
    // Make the radar intersection shape (a circular-ish sector)
    let half_ms = Radar.max_turn_speed/(2*Game.sim_fps);
    let verts = [
        [0,-Math.sin(half_ms)/3],
        [Math.cos(half_ms),-Math.sin(half_ms)],
        [1,0],
        [Math.cos(half_ms),Math.sin(half_ms)],
        [0,Math.sin(half_ms)/3]
      ].map((pt)=>Vector.mult(Vector.create(pt[0],pt[1]),this.range));
    this.collision_shape = Bodies.fromVertices(0,0,[verts],
      {
        label:"radar",
        isSensor:true,
        render:{ // this doesn't seem to work at all, so I need to investigate.
          visible:false,
          opacity: 0.5,
          fillStyle: '#fff',
          lineWidth: 0,
        }
      });
    this.collision_shape.frictionAir = 0;
    Body.setCentre(this.collision_shape, Vector.create(this.collision_shape.bounds.min.x+1,0));
    Body.setPosition(this.collision_shape, pos);
    
    this.collision_shape.render.fillStyle = '#fff';
    this.collision_shape.collisionFilter.category = Game.RadarCollisionFilter;
    // collide with anything but other radars
    this.collision_shape.collisionFilter.mask = ~(Game.RadarCollisionFilter); 
  }

  reset() {
    Body.setAngle(this.collision_shape,0);
    this.hits = Radar.emptyHits();
  }
  
  update(delta_t:number,tank:Tank) {
    this.turn_speed = clamp(
      tank.controls.turn_radar, 
      -Radar.max_turn_speed, 
      Radar.max_turn_speed);
    let angle = limitAngle(this.collision_shape.angle + this.turn_speed * delta_t);
    Body.setAngle(this.collision_shape,angle);
    Body.setPosition(this.collision_shape, tank.body.position);
    //this.set_visible(tank.controls.show_radar);
    this.set_visible(true);
    console.log("Radar angle: ", nstr((this.collision_shape.angle)));
  }
  
  set_visible(vis:boolean) {
    this.collision_shape.render.visible = vis;   
  }

  same_team(body:Body):boolean {
    return (
      Game.teamCollisionFilter(this.team_id) 
      & Game.teamCollisionFilter(body.collisionFilter.category)) 
      != 0;
  }

  scan(pairs:Pair[]) : RadarData {
    let collisions = [];
    for(let pair of pairs) {
      if(pair.bodyA === this.collision_shape) {
        collisions.push(pair.bodyB);       
      } else if(pair.bodyB === this.collision_shape) {
        collisions.push(pair.bodyA);
      }
    }

    let result:RadarData = {
      wall: -1,
      enemies: [],
      allies: [],
      bullets: [],
    };
    //this.set_visible(false);
    //console.log(`Radar scan: ${pairs.map((p)=>p.bodyA.label+' hit '+p.bodyB.label)}` );
    for(let body of collisions) {
      switch(body.collisionFilter.category) {
        case Game.RadarCollisionFilter:
          throw new Error("Radar beams should not be colliding");
        case Game.WallCollisionfilter:
          this.set_visible(true);
          let ray = Game.WallRays[body.label];
          let ray_dar = new Ray(
            this.collision_shape.position, 
            Vector.rotate(Vector.create(1,0), this.collision_shape.angle));
          let collision = ray_dar.intersect(ray);
          //console.log(`Wall detected by radar at vector ${JSON.stringify(collision)}`);
          if(collision){
            result.wall = Vector.magnitude(Vector.sub(collision,this.collision_shape.position)); 
          }
          break;
        case Game.BulletCollisionFilter:
          this.set_visible(true);
          result.bullets.push({
            distance: Vector.magnitude(Vector.sub(body.position,this.collision_shape.position)),
            angle:Vector.angle(Vector.create(1,0), body.position),
            velocity:body.velocity,
            energy:(body.velocity**2)/2,
          });
          break;
        default:
          if(body.id != this.tank_id) {
            this.set_visible(true);
            console.log("WARNING: Radar Hit returning zero energy, need to figure out how to look up tank from body");
            let res:RadarHit = {
              distance:Vector.magnitude(Vector.sub(body.position,this.collision_shape.position)),
              angle:Vector.angle(Vector.create(1,0), body.position),
              velocity:body.velocity,
              energy: 0,
            };

            if(this.same_team(body)) {
              result.allies.push(res);
            } else {
              result.enemies.push(res);
            }
          }
      }  
    }
    this.hits = result;
    return result;
  }

  angle():number {
    return this.collision_shape.angle;
  }
  
  get_hits():RadarData {
    return this.hits;
  }
}
