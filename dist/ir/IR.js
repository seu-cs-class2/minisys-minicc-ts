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
    set op(val) {
        this._op = val;
    }
    get arg1() {
        return this._arg1;
    }
    set arg1(val) {
        this._arg1 = val;
    }
    get arg2() {
        return this._arg2;
    }
    set arg2(val) {
        this._arg2 = val;
    }
    get res() {
        return this._res;
    }
    set res(val) {
        this._res = val;
    }
    toString(padEnd = 12) {
        return `(${this._op.padEnd(padEnd)}, ${this._arg1.padEnd(padEnd)}, ${this._arg2.padEnd(padEnd)}, ${this._res.padEnd(padEnd != 0 ? padEnd + 8 : 0)})`;
    }
}
exports.Quad = Quad;
/**
 * IR阶段变量信息存储
 */
class IRVar {
    constructor(id, name, type, scope, inited) {
        this._name = name;
        this._type = type;
        this._id = id;
        this._scope = [...scope];
        this._inited = inited;
    }
    get id() {
        return this._id;
    }
    set id(val) {
        this._id = val;
    }
    get name() {
        return this._name;
    }
    set name(val) {
        this._name = val;
    }
    get type() {
        return this._type;
    }
    set type(val) {
        this._type = val;
    }
    get scope() {
        return this._scope;
    }
    set scope(val) {
        this._scope = val;
    }
    get inited() {
        return this._inited;
    }
    set inited(val) {
        this._inited = val;
    }
}
exports.IRVar = IRVar;
/**
 * IR阶段数组信息存储
 */
class IRArray {
    constructor(id, type, name, len, scope) {
        this._id = id;
        this._type = type;
        this._name = name;
        this._len = len;
        this._scope = [...scope];
    }
    get id() {
        return this._id;
    }
    set id(val) {
        this._id = val;
    }
    get type() {
        return this._type;
    }
    set type(val) {
        this._type = val;
    }
    get name() {
        return this._name;
    }
    set name(val) {
        this._name = val;
    }
    get len() {
        return this._len;
    }
    set len(val) {
        this._len = val;
    }
    get scope() {
        return this._scope;
    }
    set scope(val) {
        this._scope = val;
    }
}
exports.IRArray = IRArray;
/**
 * IR阶段函数信息存储
 */
class IRFunc {
    constructor(name, retType, paramList, entryLabel, exitLabel, scopePath, hasReturn = false) {
        this._name = name;
        this._retType = retType;
        this._paramList = paramList;
        this._entryLabel = entryLabel;
        this._exitLabel = exitLabel;
        this._localVars = [];
        this._childFuncs = [];
        this._scopePath = [...scopePath];
        this._hasReturn = hasReturn;
    }
    get name() {
        return this._name;
    }
    set name(val) {
        this._name = val;
    }
    get retType() {
        return this._retType;
    }
    set retType(val) {
        this._retType = val;
    }
    get entryLabel() {
        return this._entryLabel;
    }
    set entryLabel(val) {
        this._entryLabel = val;
    }
    get exitLabel() {
        return this._exitLabel;
    }
    set exitLabel(val) {
        this._exitLabel = val;
    }
    get hasReturn() {
        return this._hasReturn;
    }
    set hasReturn(val) {
        this._hasReturn = val;
    }
    get paramList() {
        return this._paramList;
    }
    set paramList(val) {
        this._paramList = val;
    }
    get localVars() {
        return this._localVars;
    }
    set localVars(val) {
        this._localVars = val;
    }
    get childFuncs() {
        return this._childFuncs;
    }
    set childFuncs(val) {
        this._childFuncs = val;
    }
    get scopePath() {
        return this._scopePath;
    }
    set scopePath(val) {
        this._scopePath = val;
    }
}
exports.IRFunc = IRFunc;
