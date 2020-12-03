"use strict";
/**
 * 解析语法树，生成中间代码
 * 2020-12 @ github.com/seu-cs-class2/minisys-minicc-ts
 *
 * 约定：
 *    - 文法中的非终结符在.y和此处都使用下划线分隔形式命名
 *    - 文法中的终结符在.y和此处都使用全大写命名
 *    - 其余驼峰命名的则是程序逻辑相关的部分
 * 文法文件：/syntax/MiniC.y，顺序、命名均一致
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.IRGenerator = void 0;
const utils_1 = require("../seu-lex-yacc/utils");
const AST_1 = require("./AST");
/**
 * !!! 注意
 * 这里取的是结点的children，取决于newNode时留了哪些参数，并不一定和产生式中相同
 */
function $(i) {
    utils_1.assert(eval(`node.children.length <= ${i}`), '$(i)超出children范围。');
    return eval(`node.children[${i - 1}]`);
}
class IRGenerator {
    constructor(root) {
        this._funcPool = new Map();
        this._blockStack = [];
        this._tempCount = 0;
        this.act(root);
    }
    _newTemp() {
        return `_TMP${this._tempCount++}`;
    }
    _blockFor(funcName) {
        return this._blockStack.find(v => v.funcName == funcName);
    }
    act(node) {
        if (!node)
            return;
        if (node.name == 'fun_decl') {
            this.parse_fun_decl(node);
        }
    }
    parse_program(node) { }
    parse_decl_list(node) { }
    parse_decl(node) { }
    parse_var_decl(node) { }
    /**
     * 解析type_spec（类型声明）
     * type_spec -> VOID
     *            | INT
     */
    parse_type_spec(node) {
        // 取类型字面
        return $(1).literal;
    }
    /**
     * 解析func_decl（函数声明）
     */
    parse_fun_decl(node) {
        // 取返回值类型
        const retType = this.parse_type_spec($(1));
        // 取函数名
        const funcName = $(2).literal;
        utils_1.assert(!this._funcPool.has(funcName), `重复定义的函数：${funcName}`);
        // 建函数的块级作用域
        // TODO:
        let funcNode = new AST_1.FuncNode(funcName, retType, []); // 参数列表在parse_params时会填上
        this._funcPool.set(funcName, funcNode);
        let funcBlock = new AST_1.Block(funcName, true, funcNode, new Map(), '', false);
        this._blockStack.push(funcBlock);
        // 处理形参列表
        this.parse_params($(3), funcName);
        // 处理局部变量
        this.parse_local_decls($(4), funcName);
        // 处理函数体逻辑
        const stmt_list = $(5);
    }
    /**
     * 解析params（参数s）
     */
    parse_params(node, funcName) {
        // 参数列表置空表示没有参数
        if ($(1).name == 'VOID') {
            this._funcPool.get(funcName).paramList = [];
        }
        if ($(1).name == 'param_list') {
            this.parse_param_list($(1), funcName);
        }
    }
    /**
     * 解析param_list（参数列表）
     */
    parse_param_list(node, funcName) {
        if ($(1).name == 'param_list') {
            this.parse_param_list($(1), funcName);
            this.parse_param($(2), funcName);
        }
        if ($(1).name == 'param') {
            this.parse_param($(1), funcName);
        }
    }
    /**
     * 解析param（单个参数）
     */
    parse_param(node, funcName) {
        var _a;
        // 取出并检查变量类型
        const paramType = this.parse_type_spec($(1));
        utils_1.assert(paramType != 'void', '不可以使用void作参数类型。');
        // 取变量名
        const paramName = $(2).name;
        // 组装变量结点
        const paramNode = new AST_1.VarNode(paramName, paramType);
        // 将形参送给函数
        (_a = this._funcPool.get(funcName)) === null || _a === void 0 ? void 0 : _a.paramList.push(paramNode);
    }
    /**
     * 解析stmt_list（语句列表）
     */
    parse_stmt_list(node) {
        if ($(1).name == 'stmt_list') {
            this.parse_stmt_list($(1));
            this.parse_stmt($(2));
        }
        if ($(1).name == 'stmt') {
            this.parse_stmt($(1));
        }
    }
    /**
     * 解析stmt（语句）
     */
    parse_stmt(node) {
        if ($(1).name == 'expr_stmt') {
            this.parse_expr_stmt($(1));
        }
        if ($(1).name == 'compound_stmt') {
            this.parse_compound_stmt($(1));
        }
        if ($(1).name == 'if_stmt') {
            this.parse_if_stmt($(1));
        }
        if ($(1).name == 'while_stmt') {
            this.parse_while_stmt($(1));
        }
        if ($(1).name == 'return_stmt') {
            this.parse_return_stmt($(1));
        }
        if ($(1).name == 'continue_stmt') {
            this.parse_continue_stmt($(1));
        }
        if ($(1).name == 'break_stmt') {
            this.parse_break_stmt($(1));
        }
    }
    parse_compound_stmt(node) { }
    parse_if_stmt(node) { }
    parse_while_stmt(node) {
        const block = new AST_1.Block('', false, void 0, new Map(), '', true);
        this._blockStack.push(block);
        const exprNode = this.parse_expr($(1));
    }
    parse_continue_stmt(node) { }
    parse_break_stmt(node) { }
    parse_expr_stmt(node) { }
    parse_local_decls(node, funcName) {
        if ($(1).name == 'local_decls') {
            this.parse_local_decls($(1), funcName);
            this.parse_local_decl($(2), funcName);
        }
        if ($(1).name == 'local_decl') {
            this.parse_local_decl($(1), funcName);
        }
    }
    parse_local_decl(node, funcName) {
        if (node.children.length == 2) {
            // 单个变量声明
            const varType = this.parse_type_spec($(1));
            const varName = $(2).name;
            const varNode = new AST_1.VarNode(varName, varType);
            utils_1.assert(!this._blockFor(funcName).vars.has(varName), `函数 ${funcName} 中的变量 ${varName} 重复声明。`);
            this._blockFor(funcName).vars.set(varName, varNode);
        }
        if (node.children.length == 3) {
            // 数组声明
            // TODO:
        }
    }
    parse_return_stmt(node) { }
    parse_expr(node) {
        // 处理所有二元表达式
        if (node.children.length == 3) {
            const oprand1 = this.parse_expr($(1));
            const oprand2 = this.parse_expr($(3));
            switch ($(2).name) {
                case 'OR_OP':
                    break;
                case 'AND_OP':
                    break;
                case 'EQ_OP':
                    break;
                case 'NE_OP':
                    break;
                case 'GT_OP':
                    break;
                case 'LT_OP':
                    break;
                case 'GE_OP':
                    break;
                case 'LE_OP':
                    break;
                case 'PLUS':
                    break;
                case 'MINUS':
                    break;
                case 'MULTIPLY':
                    break;
                case 'SLASH':
                    break;
                case 'PERCENT':
                    break;
            }
        }
    }
    parse_args(node) { }
}
exports.IRGenerator = IRGenerator;
