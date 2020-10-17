"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FunctionCall = exports.Expression = void 0;
class Expression extends Node {
}
exports.Expression = Expression;
class FunctionCall extends Expression {
    constructor(_functionName, _args) {
        super();
        this.functionName = _functionName;
        this.args = _args;
    }
}
exports.FunctionCall = FunctionCall;
