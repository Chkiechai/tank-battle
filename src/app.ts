
import {Vector} from "matter-js";
import Tank from "./tank/tank";
import { Game } from "./game";
import Editor from "./editor";
import {fmod, turnAngle, limitAngle, Ray, clamp} from './utils/math';
import { TankAPI } from "tank-api";

declare function download(filename:string,content:string):void;
declare function insert_enemies(element:any, names:string[]);

let element = document.querySelector('#output');
let editor = new Editor('monaco-editor-embed');
editor.setup();

insert_enemies(document.querySelector("#enemy-options"),["foo", "bar", "blab"]);

document.querySelector('#pauseButton').addEventListener('click', ()=>game.pause());
document.querySelector('#stepButton').addEventListener('click', ()=>game.step());
document.querySelector('#resumeButton').addEventListener('click', ()=>game.resume());
document.querySelector('#enemy-options')
  .addEventListener("change", (event:any)=>{
  game.setEnemyAI(event.target.value);
});

let game = new Game();
let api_globals = {
  println:game.println.bind(game),
  pause: game.pause.bind(game),
  resume: game.resume.bind(game),
  step: game.step.bind(game),
  turnAngle: turnAngle,
  limitAngle: limitAngle,
  clamp: clamp,
  fmod: fmod,
  Ray: Ray,
};
game.setGlobals(api_globals);

let tank2 = new Tank(
  1,
  Vector.create(200,200),
  api_globals
);

let tank1 = new Tank(
  0, // team_id
  Vector.create(200,200), // Position
  api_globals // Extra global functions for the API
);

tank1.onUpdate((self)=>element.innerHTML=`<p>${self.show()}</p>`, 10);

editor.onShipCode((code:string)=>{
  game.setAllyCode(code);
  game.run();
});

document.querySelector('#downloadButton').addEventListener('click', ()=>{
  download(`tank-${editor.contentHash().toString(16)}.ts`, editor.getCode());
});

game.add_tank(tank1);
game.add_tank(tank2);
game.run();
