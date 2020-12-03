"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Quad = void 0;
/**
 * 四元式
 */
class Quad {
    constructor(op, arg1, arg2, res) {
        this._op = op;
        this._arg1 = arg1;
        this._arg2 = arg2;
        this._res = res;
    }
    get op() {
        return this._op;
    }
    set op(v) {
        this._op = v;
    }
    get arg1() {
        return this._arg1;
    }
    set arg1(v) {
        this._arg1 = v;
    }
    get arg2() {
        return this._arg2;
    }
    set arg2(v) {
        this._arg2 = v;
    }
    get res() {
        return this._res;
    }
    set res(v) {
        this._res = v;
    }
}
exports.Quad = Quad;
