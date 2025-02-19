import MurmurHash3 from 'imurmurhash';

export default class Editor {
  element_id
  sandbox
  code_handler
  backup_timer
  
  constructor(element_id) {
    this.element_id = element_id
  }
  
  setup() {
    let self=this;
    // First set up the VSCode loader in a script tag
    const getLoaderScript = document.createElement('script')
    getLoaderScript.src = 'https://www.typescriptlang.org/js/vs.loader.js'
    getLoaderScript.async = true
    getLoaderScript.onload = () => {
      // Now the loader is ready, tell require where it can get the version of monaco, and the sandbox
      // This version uses the latest version of the sandbox, which is used on the TypeScript website

      // For the monaco version you can use unpkg or the TypeSCript web infra CDN
      // You can see the available releases for TypeScript here:
      // https://playgroundcdn.typescriptlang.org/indexes/releases.json
      //
      require.config({
        paths: {
          vs: 'https://playgroundcdn.typescriptlang.org/cdn/4.0.5/monaco/min/vs',
          // vs: 'https://unpkg.com/@typescript-deploys/monaco-editor@4.0.5/min/vs',
          sandbox: 'https://www.typescriptlang.org/js/sandbox',
        },
        // This is something you need for monaco to work
        ignoreDuplicateModules: ['vs/editor/editor.main'],
      })

      // Grab a copy of monaco, TypeScript and the sandbox
      require(['vs/editor/editor.main', 'vs/language/typescript/tsWorker', 'sandbox/index'], (
        main,
        _tsWorker,
        sandboxFactory
      ) => {
          let initialCode = this.loadSaved();
          if(initialCode == null) {
            initialCode = `import {TankAPI,Controls,Sensors} from './tank-api';

export default function loop(api:TankAPI) {
  let controls = api.getControls();

  api.setControls(controls);
}
`;
          }
          let self = this;
          this.backup_timer = setInterval(()=>self.saveBackup(), 10000);

          const isOK = main && window.ts && sandboxFactory
          if (isOK) {
            document.getElementById('loader').parentNode.removeChild(document.getElementById('loader'))
          } else {
            console.error('Could not get all the dependencies of sandbox set up!')
            console.error('main', !!main, 'ts', !!window.ts, 'sandbox', !!sandbox)
            return
          }

          // Create a sandbox and embed it into the div #monaco-editor-embed
          const sandboxConfig = {
            text: initialCode,
            compilerOptions: {},
            domID: this.element_id,
          }

          const sandbox = sandboxFactory.createTypeScriptSandbox(sandboxConfig, main, window.ts);
          self.sandbox = sandbox;
          fetch("tank-api.d.ts")
            .then((response)=>response.text())
            .then((tank_api)=> sandbox.languageServiceDefaults.addExtraLib(tank_api,"file:///tank-api.d.ts"))
            .then((_)=> sandbox.editor.focus())
            .catch((e) => document.querySelector('#output').innerText = `Error loading tank API: ${e}`)
            .finally((_) => document.querySelector('#output').innerText = `Loaded Tank API`)
          ;
        })
    }
    document.body.appendChild(getLoaderScript)
    document.querySelector('#shipCodeButton').addEventListener('click', ()=>self.shipCode())
  }

  onShipCode(handler) {
    console.log("Set shipCode handler");
    this.code_handler = handler;
  }

  save() {
    console.log("Saving code...");
    let code=this.sandbox.editor.getValue();
    localStorage.setItem("com.ginosterous.tank-battle.code.shipped", code);
    this.saveBackup(code)
  }

  loadSaved() {
    console.log("loading...");
    return localStorage.getItem("com.ginosterous.tank-battle.code.shipped");
  }

  saveBackup(source=null) {
    let index = localStorage.getItem("com.ginosterous.tank-battle.backup-index")
      ?.split(',').map((s)=>parseInt(s)) 
      || []; 
    if(source == null) {
      source = this.sandbox.editor.getValue();
    }
    let hash = MurmurHash3(source).result();
    let existing = index.indexOf(hash);
    if(existing >= 0){ // move this version to the front, but don't change anything else.
      let temp = index[0];
      index[0] = hash;
      index[existing] = temp;
      return;
    } else if(index.length > 5) {
      index.unshift(hash);
      index.pop();
    } else {
      index.unshift(hash);
    }
    localStorage.setItem(`com.ginosterous.tank-battle.backup.${hash}`, source);
    localStorage.setItem("com.ginosterous.tank-battle.backup-index", index.join(','));
    console.log(`Saved backup id ${hash}, index is ${JSON.stringify(index)}`);
  }

  loadBackup(backup_id=null) {
    if(backup_id == null) {
      // Get the most recent backup if no identifier is provided.
      backup_id = localStorage.getItem("com.ginosterous.tank-battle.backup-index")?.split(',')[0];
      if(!backup_id) {
        return null;
      }
    }
    return localstorage.getItem(`com.ginosterous.tank-battle.backup.${backup_id}`);
  }
  
  shipCode() {
    let self = this;
    this.save();
    if(this.sandbox && this.code_handler) {
      this.sandbox.getRunnableJS()
        .then((code)=>self.code_handler(code))
    }
  }
}
