import { Globals, Controls } from '../globals';

export default function setup() {
  return new Tank();
}

class Tank {
  gunstop: number = 1;
  dt = 0.016;
  time = 0;
  half_wheel_base = 10;
  max_speed = 200;
  robot: Robot;
  id:number;
  
  constructor() {
    this.time = 0;
    this.robot = new Robot();
    this.id = Math.trunc(Math.random()*10000);
  }

  stop(controls: Controls) {
    controls.left_track_speed = 0;
    controls.right_track_speed = 0;
  }

  update_gun(api: Globals) {
    let controls = api.getControls();
    let sensors = api.getSensors();
    let aim_error = sensors.radar_angle - sensors.gun_angle

    controls.turn_radar = Math.PI * 2;
    //api.println("(enemy) aim angle: ", sensors.gun_angle);
    //api.println("(enemy) gun angle: ", sensors.gun_angle);
    controls.turn_gun = Math.sign(sensors.radar_angle - sensors.gun_angle) * Math.PI;
    let enemies = sensors.radar_hits.enemies
      .filter((e)=>e.energy > 0)
      .sort((a,b)=>a.distance-b.distance);
    api.println(`Radar hits: ${sensors.radar_hits.enemies.length} ${sensors.radar_hits.allies.length}`);
    if(sensors.radar_hits.enemies.length > 0){
      api.println("energy/dist: ", sensors.radar_hits.enemies.map((e)=>`${e.energy}/${e.distance}`).join(', '));
    }
    api.println(`Enemy hits: ${enemies.length}`);
    if (enemies.length>0) {
      let enemy = enemies[0];
      let aim_turn = api.turnAngle(sensors.radar_angle+sensors.direction, enemy.angle);
      let radar_speed = aim_turn/api.getDeltaT();
      controls.turn_radar = api.clamp(radar_speed,-2*Math.PI,2*Math.PI);
      api.println(
        "(enemy) radar angle: ",
        sensors.radar_angle, 
        " enemy angle: ",
        enemy.angle,
        ", adjust: ",
        aim_turn
      );

      if (Math.abs(aim_error) <= 0.05) {
        api.println("(enemy) shoot angle ", sensors.gun_angle)
        controls.fire_gun = 0.3;
      } else {
        controls.fire_gun = 0;
      }
    } else {

      controls.turn_radar = Math.PI * 2;
    }
  }

  update(api: Globals) {
    this.update_gun(api);
    this.dt = api.getDeltaT();
    this.time += this.dt;
    let controls: Controls = this.robot.update(this.dt, api, this);
    api.println(`4557 id=${this.id}`);
    api.setControls(controls);
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

// here are your states:
//   turn_1 = new Forward(200, "turn_1")
//   Turn1 = new Turn(-Math.pi/2, "go_down")
//   GoDown = new Forward(200, "turn_2")
//   Turn2 = new Turn(-Math.pi/2, "go_left")
//   GoLeft = new Forward(200, "turn_3")
//   Turn3 = new Turn(-Math.pi/2, "go_up")
//   GoUp = new Forward(200, "turn_4")
//   Turn4 = new Turn(-Math.pi/2, "go_right")


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
    let trackSpeed = (this.half_wheel_base * (this.target_angle - sensors.direction)) / dt;
    let threshold = 0.1;
    this.target_angle = this.target_angle - Math.sign(this.target_angle) * Math.floor(Math.abs(this.target_angle)/(2*Math.PI)) * 2 * Math.PI
    api.println("(enemy) direction: " + sensors.direction)
    api.println("(enemy) target_angle :" + this.target_angle)
    if (Math.abs(trackSpeed) > this.max_speed) {
      trackSpeed = Math.sign(trackSpeed) * this.max_speed;
    }
    controls.left_track_speed = trackSpeed;
    controls.right_track_speed = -trackSpeed;
    if (Math.abs(this.target_angle - sensors.direction) < threshold) {
      controls.right_track_speed = 0;
      controls.left_track_speed = 0;
      api.println("(enemy) direction: " + sensors.direction)

      return "forward";
    } else {
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
