import {Lockdown,LockdownOptions} from 'ses';

lockdown();

let c = new Compartment({ console });

c.evaluate("console.log('hello')");

