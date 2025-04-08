
import {Vector} from "matter-js";
import Tank from "./tank/tank";
import { Game } from "./game";
import Editor from "./editor";
import {turnAngle, limitAngle, Ray, clamp} from './utils/math';

declare function download(filename:string,content:string):void;

let element = document.querySelector('#output');
let editor = new Editor('monaco-editor-embed');
editor.setup();

let game = new Game();
document.querySelector('#pauseButton').addEventListener('click', ()=>game.pause());
document.querySelector('#stepButton').addEventListener('click', ()=>game.step());
document.querySelector('#resumeButton').addEventListener('click', ()=>game.resume());

let api_globals = { 
  println:game.println.bind(game),
  pause: game.pause.bind(game),
  resume: game.resume.bind(game),
  // can't see how this could be used, but then again, it is very small...
  // Even the wisest cannot see all ends.
  step: game.step.bind(game),
  turnAngle: turnAngle,
  limitAngle: limitAngle,
  clamp: clamp,
  Ray: Ray,
};

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
  tank1.reset(game.engine); 
  tank1.setCode(code);
  tank2.reset(game.engine);
  tank2.setCode(code);
  game.run();
});

document.querySelector('#downloadButton').addEventListener('click', ()=>{
  download(`tank-${editor.contentHash().toString(16)}.ts`, editor.getCode());
});

game.add_tank(tank1);
game.add_tank(tank2);
game.run();

