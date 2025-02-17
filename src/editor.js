

export default class Editor {
  element_id
  
  constructor(element_id) {
    this.element_id = element_id
  }
  
  setup() {
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
          const initialCode = `import {controls,sensors,Controls,Sensors,Math} from './tank-api';`;

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
  }
}
