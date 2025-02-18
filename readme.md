# Tank Battle!

This code was inspired by [jsbattle](https://github.com/jamro/jsbattle), but
it's a completely fresh codebase. I'd eventually like to make it into something
bigger, but for now it's a school project I'm using to teach typescript.

## Trying it out

```shell
git clone https://github.com/aethertap/tank-battle
cd tank-battle
npm i
npx serve
```

Navigate a browser to [http://localhost:3000/editor.html] and you should see a
canvas, an output buffer, and a monaco editor with a splash of simple code in
it. At the moment, there will be a rectangle moving in a small circle as
well... that's going to be a tank someday.

## Check out the code

Everying gets launched from `editor.html`. The game uses `matter-js` for
collision detection and basic physics (and rendering at the moment, but that
will change). 

The game loop is driven by `requestAnimationFrame`, and it's handled in `game.ts`. 
Tank logic happens in `tank.ts`, and the management of scripts for the tank controls
is in `script.ts`. 

This is *not* safe to run as a real site where more than one
person may be interacting with it, because it uses `eval` to run the tank code.
I'm working on using [hardened JS](https://hardenedjs.org), but I haven't quite
gotten that figured out yet. It doesn't seem to play nicely with typescript or
esbuild modules or something. If you know how to use it, I'd be grateful for 
some pointers.


