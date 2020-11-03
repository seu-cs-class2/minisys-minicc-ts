"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.newNode = void 0;
const AST_1 = require("./AST");
function newNode(yycontext, name, ...args) {
    let root = new AST_1.ASTNode();
    root.name = name;
    if (args.length > 0) {
        root.left = args[0];
        root.line = args[0].line;
        if (args.length === 1) {
            root.content = args[0].content;
        }
        else {
            let ptr = 0;
            for (let i = 1; i < args.length; i++, ptr++) {
                args[ptr].right = ptr + 1 < args.length ? args[ptr + 1] : null;
            }
        }
    }
    else {
    }
}
exports.newNode = newNode;
