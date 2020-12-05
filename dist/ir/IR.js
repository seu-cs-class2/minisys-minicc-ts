"use strict";
/**
 * 中间代码相关类型定义
 * 2020-11 @ https://github.com/seu-cs-class2/minisys-minicc-ts
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.IRBlock = exports.IRFunc = exports.IRArray = exports.IRVar = exports.Quad = void 0;
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
    constructor(id, name, type) {
        this._name = name;
        this._type = type;
        this._id = id;
    }
    get id() {
        return this._id;
    }
    set id(v) {
        this._id = v;
    }
    get name() {
        return this._name;
    }
    set name(v) {
        this._name = v;
    }
    get type() {
        return this._type;
    }
    set type(v) {
        this._type = v;
    }
}
exports.IRVar = IRVar;
/**
 * IR阶段数组信息存储
 */
class IRArray {
    constructor(id, type, name, len) {
        this._id = id;
        this._type = type;
        this._name = name;
        this._len = len;
    }
    get id() {
        return this._id;
    }
    set id(v) {
        this._id = v;
    }
    get type() {
        return this._type;
    }
    set type(v) {
        this._type = v;
    }
    get name() {
        return this._name;
    }
    set name(v) {
        this._name = v;
    }
    get len() {
        return this._len;
    }
    set len(v) {
        this._len = v;
    }
}
exports.IRArray = IRArray;
/**
 * IR阶段函数信息存储
 */
class IRFunc {
    constructor(name, retType, paramList) {
        this._name = name;
        this._retType = retType;
        this._paramList = paramList;
    }
    get name() {
        return this._name;
    }
    set name(v) {
        this._name = v;
    }
    get retType() {
        return this._retType;
    }
    set retType(v) {
        this._retType = v;
    }
    get paramList() {
        return this._paramList;
    }
    set paramList(v) {
        this._paramList = v;
    }
}
exports.IRFunc = IRFunc;
/**
 * IR阶段块级作用域
 */
class IRBlock {
    constructor(type, vars, funcName, func, label, breakable) {
        this._type = type;
        this._vars = vars;
        this._func = func;
        this._funcName = funcName;
        this._label = label;
        this._breakable = breakable;
    }
    get type() {
        return this._type;
    }
    set type(v) {
        this._type = v;
    }
    get vars() {
        return this._vars;
    }
    get func() {
        return this._func;
    }
    set func(v) {
        this._func = v;
    }
    get funcName() {
        return this._funcName;
    }
    set funcName(v) {
        this._funcName = v;
    }
    get label() {
        return this._label;
    }
    set label(v) {
        this._label = v;
    }
    get breakable() {
        return this._breakable;
    }
    set breakable(v) {
        this._breakable = v;
    }
    /**
     * 新建函数型块
     */
    static newFunc(funcName, func) {
        return new IRBlock('func', [], funcName, func, void 0, void 0);
    }
    /**
     * 新建复合语句型块
     */
    static newCompound(label, breakable) {
        return new IRBlock('compound', [], void 0, void 0, label, breakable);
    }
}
exports.IRBlock = IRBlock;
