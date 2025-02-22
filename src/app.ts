
import {Vector} from "matter-js";
import Tank from "./tank";
import { Game } from "./game";
import Editor from "./editor";
declare function download(filename:string,content:string):void;

let element = document.querySelector('#output');
let editor = new Editor('monaco-editor-embed');
editor.setup();

let game = new Game();
document.querySelector('#pauseButton').addEventListener('click', ()=>game.pause());
document.querySelector('#stepButton').addEventListener('click', ()=>game.step());
document.querySelector('#resumeButton').addEventListener('click', ()=>game.resume())

let tank = new Tank(Vector.create(200,200),
  {
    println:game.println.bind(game),
    pause: game.pause.bind(game),
    resume: game.resume.bind(game),
    step: game.step.bind(game),// can't see how this could be used, but then I can't see all ends...
  });

tank.onUpdate((self)=>element.innerHTML=`<p>${self.show()}</p>`, 10);

editor.onShipCode((code:string)=>{
  tank.reset(); 
  tank.setCode(code);
});

document.querySelector('#downloadButton').addEventListener('click', ()=>{
  download(`tank-${editor.contentHash().toString(16)}.ts`, editor.getCode());
});

game.add_tank(tank);
game.run();

