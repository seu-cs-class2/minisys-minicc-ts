"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ArrayNode = exports.BlockNode = exports.FunctionNode = exports.VariableNode = exports.ASTNode = void 0;
/**
 * 抽象语法树结点
 */
class ASTNode {
    constructor() {
        this._line = -1;
        this._name = '';
        this._content = '';
        this._left = null;
        this._right = null;
    }
    get line() {
        return this._line;
    }
    set line(val) {
        this._line = val;
    }
    get name() {
        return this._name;
    }
    set name(val) {
        this._name = val;
    }
    get content() {
        return this._content;
    }
    set content(val) {
        this._content = val;
    }
    get left() {
        return this._left;
    }
    set left(val) {
        this._left = val;
    }
    get right() {
        return this._right;
    }
    set right(val) {
        this._right = val;
    }
}
exports.ASTNode = ASTNode;
class VariableNode {
}
exports.VariableNode = VariableNode;
class FunctionNode {
}
exports.FunctionNode = FunctionNode;
class BlockNode {
}
exports.BlockNode = BlockNode;
class ArrayNode {
}
exports.ArrayNode = ArrayNode;
const handlers = {
    local_decl: function () {
    },
};
