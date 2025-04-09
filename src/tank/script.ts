import {Vector} from 'matter-js';
import {TankAPI} from '../../tank-api';

export declare class TankCode {
  update(api:TankAPI):void
}

export interface JsModule {
  setup(api:TankAPI):TankCode
}

export class EmptyTank {
  update(api:TankAPI) {}
}

export class EmptyModule {
  setup(api:TankAPI) {
    return new EmptyTank();
  }
}

export default class Script{
  js_module: JsModule
  runner: TankCode
  globals: TankAPI


  static addDefaultGlobals(extras:{[key:string]:any}): {[key:string]:any} {
    let globals = {};
    globals['log'] = console.log;
    globals['Math'] = Math;
    globals['Vector'] = Vector;

    for(let kv of Object.entries(extras)) {
      globals[kv[0]] = kv[1];
    }
    return globals;
  }

  static async scriptImport(code:string):Promise<any> {
    return window['script_loader'](code)
  }

  constructor(module: JsModule,globals:TankAPI) {
    console.log("Calling setup now..."+module);
    this.globals = globals;
    this.runner = module.setup(globals);
    this.js_module = module;
  }

  static async from_source(
    js_code:string,
    globals_=Script.addDefaultGlobals({})):Promise<void|Script>
  {
    let globals:TankAPI = globals_ as TankAPI;
    return await Script.scriptImport(js_code)
      .then((module:any) => {
        return new Script(module,globals);
      })
    .catch((e)=>console.log("Error loading script: "+e));
  }

  update(js_code:string) {
    let self=this;
    Script.scriptImport(js_code)
      .then((module:any) => {
        console.log("Calling setup now..."+module);
        self.runner = module.setup(self.globals);
        self.js_module = module;
      })
    .catch((e)=>console.log("Error loading script: "+e));
  }

  execute() {
    if(typeof(this.runner) == 'object') {
      console.log(`updating tank, globals = ${this.globals}`)
      this.runner.update(this.globals);
    }
  }
}
