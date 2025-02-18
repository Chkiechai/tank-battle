import {Vector} from 'matter-js';
//import script_loader from './script_loader';

export default class Script{
  js_code: undefined | ((env:{[key:string]:any})=>void)
  globals: {[key:string]:any}

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
    this.globals = globals;
    let self = this;
    this.scriptImport(js_code)
      .then((fn:(env:{[key:string]:any})=>void) => self.js_code = fn);
  }

  update(js_code:string) {
    let self=this;
    this.scriptImport(js_code)
    .then((fn:(env:{[key:string]:any})=>void) => self.js_code = fn);
  }
  
  execute() {
    if(typeof(this.js_code) == 'function') {
      this.js_code(this.globals);
    } else {
      console.log("Script function hasn't been defined yet");
      //throw new Error("Can't execute script: function is undefined");
    }
  }
}
