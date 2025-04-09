
import {Vector} from "matter-js";
import Tank from "./tank/tank";
import { Game } from "./game";
import Editor from "./editor";
import {fmod, turnAngle, limitAngle, Ray, clamp} from './utils/math';
import { TankAPI } from "tank-api";

declare function download(filename:string,content:string):void;

let element = document.querySelector('#output');
let editor = new Editor('monaco-editor-embed');
editor.setup();


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
editor.onShipCode((code:string)=>{
  game.reset();
  game.setAllyCode(code);
  game.run();
});

document.querySelector('#downloadButton').addEventListener('click', ()=>{
  download(`tank-${editor.contentHash().toString(16)}.ts`, editor.getCode());
});

game.reset();
game.run();
