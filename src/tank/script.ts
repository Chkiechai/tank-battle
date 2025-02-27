import {Vector} from 'matter-js';
import {TankAPI} from '../../tank-api';

declare class TankCode {
  update(api:TankAPI):void
}
interface JsModule {
  setup():TankCode
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
  
  async scriptImport(code:string):Promise<any> {
    return window['script_loader'](code)
  }
  
  constructor(js_code:string,globals=Script.addDefaultGlobals({})) {
    this.globals = globals as TankAPI;
    this.update(js_code);
  }

  update(js_code:string) {
    let self=this;
    this.scriptImport(js_code)
      .then((module:any) => {
        console.log("Calling setup now..."+module);
        self.runner = module.setup(self.globals);
        self.js_module = module;
      })
    .catch((e)=>console.log("Error loading script: "+e));
  }
  
  execute() {
    if(typeof(this.runner) == 'object') {
      this.runner.update(this.globals);
    } 
  }
}
