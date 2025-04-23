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

document.querySelector('#enemy-count')
  .addEventListener("change", (event:any) => {
    console.log(event.target.value);
    let n:number = parseInt(event.target.value);
    game.setEnemyCount(n);
});

document.querySelector('#ally-count')
  .addEventListener("change", (event:any) => {
    console.log(event.target.value);
    let n:number = parseInt(event.target.value);
    game.setAllyCount(n);
});


var game = new Game(editor);

editor.onShipCode((code:string)=>{
  game.reset();
  game.setAllyCode(code);
  game.run();
});
//editor.shipCode();

document.querySelector('#downloadButton').addEventListener('click', ()=>{
  console.log("Downloading code...");
  download(`tank-${editor.contentHash().toString(16)}.ts`, editor.getCode());
});

game.reset();
game.run();
