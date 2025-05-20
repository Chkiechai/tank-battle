/// MurmurHash is a fast hash that I use to keep track of versions
// in the tank control scripts. 
import MurmurHash3 from 'imurmurhash';
import {Tank} from './tank/tank';

/// black magic, don't look at this. Also, I have to do it in order
// to use the typescript editor from the typescript playground (below)
declare var require:any;
declare global {
  interface Window {
    ts: any;
  }
}

/** This is the VS Code Monaco editor, embedded with the stuff provided
 * by the typescript playground at [Typescript Sandbox](https://www.typescriptlang.org/dev/sandbox/)
 *
 * The Editor is responsible for turning the user's typescript code into
 * javascript, and then passing it off to {@link script_loader} (in the 
 * `index.html` file).
 */ 
export default class Editor {
  element_id:string
  sandbox:any
  code_handler:(code:string)=>void
  backup_timer:ReturnType<typeof setInterval>
  
  constructor(element_id:string) {
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
      require(['vs/editor/editor.main', 'vs/language/typescript/tsWorker', 'sandbox/index'], 
        ( main:any, _tsWorker:any, sandboxFactory:any) => {
          let initialCode = this.loadSaved();
          if(initialCode == null) {
            initialCode = Tank.DefaultCode;
          }
          let self = this;
          this.backup_timer = setInterval(()=>self.saveBackup(), 10000);

          const isOK = main && window.ts && sandboxFactory
          if (isOK) {
            document.getElementById('loader').parentNode.removeChild(document.getElementById('loader'))
          } else {
            console.error('Could not get all the dependencies of sandbox set up!')
            console.error('main', !!main, 'ts', !!window.ts)
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
            .then((_)=> self.shipCode())
            .catch((e) => document.querySelector('#output').innerHTML = `Error loading tank API: ${e}`)
            .finally(() => {
              document.querySelector('#output').innerHTML = `Loaded Tank API`;
            })
          ;
        })
    }
    document.body.appendChild(getLoaderScript)
    document.querySelector('#shipCodeButton').addEventListener('click', ()=>self.shipCode())
  }

  /** This adds a hook for the click event on the "Ship It!" button
   * 
   * @param {(code:string)=>void} handler - A callback that will receive the *compiled javascript* code when Ship It is clicked. 
  * */
  onShipCode(handler:(code:string)=>void) {
    console.log("Set shipCode handler");
    this.code_handler = handler;
  }
 
  /** Retrieve the *typescript* code that's currently in the editor.
  * 
  * See also: {@link Editor.getJsCode} to retrive the transpiled version
  * @returns string - the code directly from the editor with no transpilation.
  * */
  getCode():string {
    return this.sandbox.editor.getValue();
  }
  
  
  /** Save the code currently in the buffer as the most current, user-approved version. 
   * The code is also saved periodically by the { @link saveBackup } method, in order to 
   * provide some crash resilience.
  * */
  save() {
    console.log("Saving code...");
    let code=this.sandbox.editor.getValue();
    localStorage.setItem("com.ginosterous.tank-battle.code.shipped", code);
    this.saveBackup(code)
  }

  /** Create a MurmurHash3 hash of the contents of the user's code window. This is used
   * by the auto backup system to keep track of previous versions of the code so that they
   * can be recovered if something bad happens.
   *
   * @returns {number} - The numeric value of the hash.
  * */
  contentHash():number {
    return MurmurHash3(this.getCode()).result();
  }
  
  /** Load the saved, *official* version of the code. This is what's saved when the user
  * clicks "Ship It".
  *
  * @returns {string|null} - The *typescript* code, if a saved version exists, otherwise `null`
  */ 
  loadSaved():string|null {
    console.log("loading...");
    return localStorage.getItem("com.ginosterous.tank-battle.code.shipped");
  }

  /** Save the current typescript into the backups history. Backups are indexed by the
   * MurmurHash3 hash of the content, and I keep track of the list of valid versions with another
   * localstorage key named `com.ginosterous.tank-battle.backup-index`. The data itself is stored 
   * in localstorage under the related keys with names `com.ginosterous.tank-battle.backup.${hash}`.
   *
   * See also: {@link Editor.contentHash}
   * 
   * BUG: Editor.saveBackup does not remove old versions of the code.
   *
   * @param {string|null} source - The typescript source code to save.
   **/
  saveBackup(source:string|null=null) {
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

  /** Restore a backup from the backups in localstorage to the code buffer. 
  * This isn't currently usable from the page, but the function does work. I think...
  *
  * @param {string|null} backup_id - The id number (content hash) of the backup you want to restore. If `null`, use the most recent.
  * @returns {string|null} - The typescript code that was recovered from the backup.
  * */
  loadBackup(backup_id:string|null=null):string|null {
    if(backup_id == null) {
      // Get the most recent backup if no identifier is provided.
      backup_id = localStorage.getItem("com.ginosterous.tank-battle.backup-index")?.split(',')[0];
      if(!backup_id) {
        return null;
      }
    }
    return localStorage.getItem(`com.ginosterous.tank-battle.backup.${backup_id}`);
  }

  /** This takes the code from the editor and tries to transpile it into javascript. 
  * If the operation is successful, the returned Promise will fulfill with the text. 
  * Otherwise, it'll reject with an error.
  *
  * @returns {Promise<string>} - (hopefully) the runnable javascript code.
  **/
  getJsCode(): Promise<string> {
    if (this.sandbox) {
      return this.sandbox.getRunnableJS()
    } else {
      return Promise.reject("No sandbox")
    }
  }
 
  /** Transpile the typescript into javascript, then trigger the code_handler. This
  * is used to actually load the scripts into the tanks when the user clicks "Ship It".
  * It also saves the code to localstorage as a side-effect, marking this as the new
  * official version. See also {@link save}
  *
  * BUG: Errors are not reported when the code fails to transpile, or when the localstorage is full and it can't save.
  * */
  shipCode() {
    let self = this;
    this.save();
    if (this.sandbox && this.code_handler) {
      this.sandbox.getRunnableJS()
        .then((code: string) => self.code_handler(code))
    }
  }
}

