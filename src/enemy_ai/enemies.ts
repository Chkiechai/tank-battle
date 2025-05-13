
import setup1 from './chaser';
import setup2 from './rando';
import orbiter from './orbiter';
import circle from './circle';
import setup3 from './square-drive-killer';

export default {
  "chaser": {"setup":setup1},
  "circle": {"setup":circle},
  "rando": {"setup":setup2},
  "orbiter": {"setup":orbiter},
  "square-drive-killer": {"setup":setup3},
}
