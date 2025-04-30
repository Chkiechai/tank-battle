import { Globals, Controls } from '../globals';

interface Point {
  x:number,
  y:number,
}

export default function setup() {
  return new Tank();
}

class Tank {
  position: Point
  veer_angle:number = Math.random() * 2 - 1
  delay_time:number = 0.5;
  gunstop: number = 1;
  dt = 0.016;
  time = 0;
  next_veer_time:number = 0;
  half_wheel_base = 10;
  max_speed = 200;
  robot: Robot;
  radar_change:number
  id:number;
  
  constructor() {
    this.position ={x:0, y:0}
    this.time = 0;
    this.robot = new Robot();
    this.id = Math.trunc(Math.random()*10000);
    this.radar_change = 0;
  }

  stop(controls: Controls) {
    controls.left_track_speed = 0;
    controls.right_track_speed = 0;
  }

  // amount: -1 is spin left, 1 is spin right, otherwise it scales down the turn
  // while still moving forward as as fast as possible
  veer(controls: Controls ,amount: number){
    let max_turn = 2* this.max_speed/20
    let angle_vel = amount * max_turn

    if(amount<0){
      controls.right_track_speed = this.max_speed
      // amount is negative, so adding it is subtracting the absolute value
      controls.left_track_speed = this.max_speed + 2 * amount * this.max_speed
    } else{
      controls.left_track_speed = this.max_speed
      controls.right_track_speed = this.max_speed - 2 * amount * this.max_speed
    }
  }

  snap_turn(controls:Controls){
    controls.left_track_speed = 200;
    controls.right_track_speed = -200;
  }

  update_gun(api: Globals) {
    let controls = api.getControls();
    let sensors = api.getSensors();
    let aim_error = sensors.radar_angle - sensors.gun_angle

    controls.turn_radar = Math.PI * 2;
    controls.turn_gun = api.turnAngle(sensors.gun_angle, sensors.radar_angle) / api.getDeltaT();
    let enemies = sensors.radar_hits.enemies
      .filter((e:any)=>(e.energy || 0) > 0)
      .sort((a:any,b:any)=>a.distance-b.distance);
    api.println(`Radar hits: ${sensors.radar_hits.enemies.length} ${sensors.radar_hits.allies.length}`);
    if(sensors.radar_hits.enemies.length > 0){
      
    }
    if (enemies.length>0) {
      let enemy = enemies[0]
      let aim_turn = api.turnAngle(sensors.radar_angle+sensors.direction, enemy.angle);
      let radar_speed = aim_turn/api.getDeltaT();
      this.radar_change = aim_turn;
      controls.turn_radar = api.clamp(radar_speed,-2*Math.PI,2*Math.PI);
      if (Math.abs(aim_error) <= 0.2) {
        api.println("(enemy) shoot angle ", sensors.gun_angle)
        controls.fire_gun = 1;
      } else {
        controls.fire_gun = 0;
      }
    } else {

      controls.turn_radar = Math.PI * 2;
    }
    
  }

  radarAngleChange():number{
    return this.radar_change;
  }


  update(api: Globals) {
    this.dt = api.getDeltaT();
    this.time += this.dt;
    let controls = api.getControls();
    let sensors = api.getSensors();
    let speed = sensors.speed;
    let drive_dir_error = sensors.radar_angle;
    let hit_bool:boolean = false
    this.update_gun(api);

    if (sensors.radar_hits.enemies.length > 0){
      if (sensors.radar_hits.enemies[0].distance <= 100){
        sensors.radar_angle + 90 - sensors.direction;
        let angle = api.turnAngle(sensors.direction, sensors.radar_angle + 90);
        this.veer(controls, angle);
      }else{

      if (drive_dir_error > Math.PI/6){
        this.snap_turn(controls);
      }else{
        let delta_angle = this.radarAngleChange();
        this.veer(controls, 10*delta_angle)
        if (sensors.radar_hits.enemies.filter(e => e.energy > 0).length > 0){
        controls.boost=1;
      }
      }
    }
    }

  }
  
}

class State {
  //let controls = api.getControls();
  //let sensors = api.getSensors();
  update(dt: number, api: Globals, tank: Tank): string {
    return "no_change";
  }

  enter(api: Globals): string {
    return "no_change";
  }

  leave(api: Globals) {
  }
}

class Init extends State {
  update(dt: number, api: Globals, tank: Tank): string {
    return "forward";
  }

  enter(api: Globals): string {
    let controls = api.getControls();
    api.setControls(controls);
    controls.left_track_speed = 0;
    controls.right_track_speed = 0;
    return "no_change";
  }
}

class Forward extends State {
  moved_already: number
  distance: number
  next_state: string

  constructor(distance: number, next_state: string) {
    super();
    this.distance = distance;
    this.next_state = next_state;
    this.moved_already = 0;
  }

  enter(api: Globals): string {
    this.moved_already = 0;
    return "no_change";
  }

  update(dt: number, api: Globals, tank: Tank): string {
    let controls = api.getControls();
    if (this.moved_already >= this.distance) {
      return this.next_state;
    }
    let speed = (this.distance - this.moved_already) / api.getDeltaT();
    if (speed > 100) {
      speed = 100;
    }
    this.moved_already += speed * api.getDeltaT();
    controls.left_track_speed = speed;
    controls.right_track_speed = speed;
    return "no_change";
  }
}


class Turn extends State {
  max_speed: number
  half_wheel_base: number
  angleAmount: number
  next_state: string
  target_angle: number


  constructor(angleAmount: number, next_state: string) {
    super();
    this.target_angle = 0;
    this.next_state = next_state;
    this.angleAmount = angleAmount
    this.max_speed = 200
    this.half_wheel_base = 10;
  }

  enter(api: Globals): string {
    this.target_angle = api.getSensors().direction + this.angleAmount
    return "no_change";
  }

  update(dt: number, api: Globals, tank: Tank): string {
    let controls = api.getControls();
    let sensors = api.getSensors();
    let trackSpeed = (this.half_wheel_base * api.turnAngle(sensors.direction, this.target_angle)) / dt;
    let threshold = 0.01;
    //this.target_angle = this.target_angle - Math.sign(this.target_angle) * Math.floor(Math.abs(this.target_angle)/(2*Math.PI)) * 2 * Math.PI
    api.println("(enemy) direction: " + sensors.direction)
    api.println("(enemy) target_angle :" + this.target_angle)
    if (Math.abs(trackSpeed) > this.max_speed) {
      trackSpeed = Math.sign(trackSpeed) * this.max_speed;
    }
    controls.left_track_speed = trackSpeed;
    controls.right_track_speed = -trackSpeed;
    if (Math.abs(api.turnAngle(sensors.direction, sensors.radar_angle + sensors.direction)) < threshold) {
      controls.right_track_speed = 0;
      controls.left_track_speed = 0;
      api.println("(enemy) direction: " + sensors.direction)
      return "forward";

    } else {
      api.println()
      return "no_change";

    }
  }
}

class Robot {
  states: { [key: string]: State }
  state_names: string[] = [
    "init",
    "forward",
    "turn",
    "forwardTwo",
    "turnTwo",
    "forwardThree",
    "turnThree",
    "forwardFour",
    "no_change",
    "finished",
    "error",
  ]

  current_state: string;

  constructor(init_state: string = "init") {
    this.current_state = init_state;
    this.states = {
      "init": new Init() as State,
      "forward": new Forward(250, "turn") as State,
      "turn": new Turn(Math.PI / 2, "forward") as State,

    }
  }


  update(dt: number, api: Globals, tank: Tank): Controls {
    let new_state = this.states[this.current_state].update(dt, api, tank);
    this.switch_to(api, tank, new_state);
    return api.getControls();
  }

  switch_to(api: Globals, tank: Tank, new_state: string) {
    if (new_state == "no_change") {
      return;
    }
    this.current_state = new_state;
    let another_state = this.states[this.current_state].enter(api);
    this.switch_to(api, tank, another_state);
  };

}
