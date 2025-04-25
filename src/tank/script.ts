import {Globals} from '../globals';

export declare class TankCode {
  update(api:Globals):void
}

export interface JsModule {
  setup(api:Globals):TankCode
}

export class EmptyTank {
  update(_api:Globals) {}
}

export class EmptyModule {
  setup(_api:Globals) {
    return new EmptyTank();
  }
}

export class Script{
  js_module: JsModule
  runner: TankCode
  globals: Globals

  static async scriptImport(code:string):Promise<any> {
    return window['script_loader'](code)
  }

  constructor(module: JsModule, globals:Globals) {
    console.log("Calling setup now..."+module);
    console.log(`Globals has: ${Object.keys(globals).join(',')}`);
    this.globals = globals;
    this.runner = module.setup(globals);
    this.js_module = module;
  }

  static async from_source(js_code:string, globals:Globals):Promise<void|Script> {
    return await Script.scriptImport(js_code)
      .then((module:any) => {
        return new Script(module,globals);
      })
    .catch((e)=>console.log("Error loading script: "+e));
  }

  update(js_code:string) {
    let self=this;
    if(js_code.length == 0) {
      self.js_module = new EmptyModule();
      self.runner = self.js_module.setup(self.globals);
    } else {
      Script.scriptImport(js_code)
        .then((module:any) => {
          console.log("Calling setup now..."+module);
          self.runner = module.setup(self.globals);
          self.js_module = module;
        })
        .catch((e)=>console.log("Error loading script: "+e));
    }
  }

  execute() {
    if(typeof(this.runner) == 'object') {
      //console.log(`updating tank, globals = ${Object.keys(this.globals).join(', ')}`)
      this.runner.update(this.globals);
    }
  }
}
