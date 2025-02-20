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
    this.update(js_code);
  }

  update(js_code:string) {
    let self=this;
    this.scriptImport(js_code)
      .then((module:any) => {
        console.log("Calling setup now..."+module);
        module.setup();
        self.js_code = module.loop;
      })
    .catch((e)=>console.log("Error loading script: "+e));
  }
  
  execute() {
    if(typeof(this.js_code) == 'function') {
      this.js_code(this.globals);
    } 
  }
}
