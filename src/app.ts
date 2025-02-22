
import {Vector} from "matter-js";
import Tank from "./tank";
import { Game } from "./game";
import Editor from "./editor";

let element = document.querySelector('#output');
let editor = new Editor('monaco-editor-embed');
editor.setup();

let game = new Game();
document.querySelector('#pauseButton').addEventListener('click', ()=>game.pause());
document.querySelector('#resumeButton').addEventListener('click', ()=>game.resume())

let tank = new Tank(Vector.create(200,200),
  {
    println:game.println.bind(game),
    pause: game.pause.bind(game),
    resume: game.resume.bind(game),
  });

tank.onUpdate((self)=>element.innerHTML=`<p>${self.show()}</p>`, 10);

editor.onShipCode((code:string)=>{
  tank.reset(); 
  tank.setCode(code);
});

game.add_tank(tank);
game.run();

