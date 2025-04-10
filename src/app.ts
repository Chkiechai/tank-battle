import { Game } from "./game";
import Editor from "./editor";

declare function download(filename:string,content:string):void;

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
