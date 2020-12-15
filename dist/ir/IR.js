"use strict";
/**
 * 中间代码相关类型定义
 * 2020-11 @ https://github.com/seu-cs-class2/minisys-minicc-ts
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.IRFunc = exports.IRArray = exports.IRVar = exports.Quad = void 0;
/**
 * 四元式 (op, arg1, arg2, res)
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
    toString() {
        return `(${this._op}, ${this._arg1}, ${this._arg2}, ${this._res})`;
    }
}
exports.Quad = Quad;
/**
 * IR阶段变量信息存储
 */
class IRVar {
    constructor(id, name, type, scope) {
        this.name = name;
        this.type = type;
        this.id = id;
        this.scope = [...scope];
    }
}
exports.IRVar = IRVar;
/**
 * IR阶段数组信息存储
 */
class IRArray {
    constructor(id, type, name, len, scope) {
        this.id = id;
        this.type = type;
        this.name = name;
        this.len = len;
        this.scope = [...scope];
    }
}
exports.IRArray = IRArray;
/**
 * IR阶段函数信息存储
 */
class IRFunc {
    constructor(name, retType, paramList) {
        this.name = name;
        this.retType = retType;
        this.paramList = paramList;
    }
}
exports.IRFunc = IRFunc;
