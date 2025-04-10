import { turnAngle, limitAngle, clamp, fmod } from './utils/math';
export class Globals {
    constructor() {
        this.game = undefined;
        this.tank = undefined;
    }
    withTank(tank) {
        this.tank = tank;
        return this;
    }
    withGame(game) {
        this.game = game;
        return this;
    }
    check() {
        if (this.tank && this.game) {
            return true;
        }
        else {
            console.log("WARNING: Globals function called without initializing Globals instance.");
            return false;
        }
    }
    getControls() {
        this.check();
        return this.tank?.getControls();
    }
    getSensors() {
        this.check();
        return this.tank?.getSensors();
    }
    setControls(controls) {
        this.check();
        this.tank?.setControls(controls);
    }
    getDeltaT() {
        this.check();
        return this.tank?.getDeltaT();
    }
    println(...args) {
        this.check();
        this.game?.println(...args);
    }
    pause() {
        this.check();
        this.game?.pause();
    }
    resume() {
        this.check();
        this.game?.resume();
    }
    turnAngle(from, to) {
        return turnAngle(from, to);
    }
    limitAngle(ang) {
        return limitAngle(ang);
    }
    clamp(num, min, max) {
        return clamp(num, min, max);
    }
    fmod(num, modulus) {
        return fmod(num, modulus);
    }
    Ray;
    Vector;
    game;
    tank;
}
//# sourceMappingURL=tank-api.js.map