
import {Vector} from "matter-js";
import Tank from "./tank";
import { Game } from "./game";
import Editor from "./editor";

let tank = new Tank(Vector.create(200,200));
let element = document.querySelector('#output');
tank.onUpdate((self)=>element.innerHTML=`<p>${self.show()}</p>`, 10);
let editor = new Editor('monaco-editor-embed');
editor.setup();

let game = new Game();

editor.onShipCode((code:string)=>{
  tank.reset(); 
  tank.setCode(code);
});

game.add_tank(tank);
game.run();

