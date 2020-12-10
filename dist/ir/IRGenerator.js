"use strict";
/**
 * 解析语法树，生成中间代码，同时检查语义
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
const IR_1 = require("./IR");
const IR_2 = require("./IR");
// 收集所有变量、函数
class IRGenerator {
    constructor(root) {
        this._funcs = new Map();
        this._blocks = [];
        this._blockPtr = -1;
        this._globalVars = [];
        this._quads = [];
        this._varCount = 0;
        this._labelCount = 0;
        this.start(root);
    }
    /**
     * 获取当前所在的块
     */
    _currentBlock() {
        return this._blocks[this._blockPtr];
    }
    /**
     * 在当前位置添加一个块，并进入该块的上下文
     */
    _pushBlock(block) {
        this._blocks.push(block);
        this._blockPtr += 1;
    }
    /**
     * 前进一个块
     */
    _nextBlock() {
        this._blockPtr += 1;
    }
    /**
     * 回退一个块
     */
    _backBlock() {
        this._blockPtr -= 1;
    }
    /**
     * 获取函数对应的块
     */
    _blockFor(funcName) {
        return this._blocks.find(v => v.funcName == funcName);
    }
    /**
     * 新建四元式
     */
    _newQuad(op, arg1, arg2, res) {
        const quad = new IR_2.Quad(op, arg1, arg2, res);
        this._quads.push(quad);
        return quad;
    }
    /**
     * 获取新的变量ID
     */
    _newVar() {
        return '_var_' + this._varCount++;
    }
    /**
     * 根据变量名结合作用域定位变量
     */
    _findVar(name) {
        // FIXME: 考虑层次
        for (let i = this._blockPtr; i >= 0; i--) {
            const res = this._blocks[i].vars.find(v => v.name == name);
            if (res)
                return res;
        }
        utils_1.assert(false, `未找到该变量：${name}`);
        return new IR_1.IRVar('-1', '', 'none');
    }
    /**
     * 获取新的标签ID
     */
    _newLabel() {
        return '_label_' + this._labelCount++;
    }
    start(node) {
        if (!node)
            utils_1.assert(false, 'AST根节点为null。');
        this.parse_program(node);
    }
    parse_program(node) {
        this.parse_decl_list(node.$(1));
    }
    parse_decl_list(node) {
        if (node.$(1).name == 'decl_list') {
            this.parse_decl_list(node.$(1));
            this.parse_decl(node.$(2));
        }
        if (node.$(1).name == 'decl') {
            this.parse_decl(node.$(1));
        }
    }
    parse_decl(node) {
        if (node.$(1).name == 'var_decl') {
            this.parse_var_decl(node.$(1));
        }
        if (node.$(1).name == 'fun_decl') {
            this.parse_fun_decl(node.$(1));
        }
    }
    parse_var_decl(node) {
        if (node.match('type_spec IDENTIFIER')) {
            const type = this.parse_type_spec(node.$(1));
            const name = node.$(2).literal;
            this._globalVars.push(new IR_1.IRVar(this._newVar(), name, type));
        }
        if (node.match('type_spec IDENTIFIER CONSTANT')) {
            const type = this.parse_type_spec(node.$(1));
            const name = node.$(2).literal;
            let len = node.$(3).literal;
            utils_1.assert(!isNaN(Number(node.$(3).literal)), `数组长度必须为数字，但取到 ${len}。`);
            // TODO: 数组和变量分开管理，还是一起管理？
        }
    }
    parse_type_spec(node) {
        // 取类型字面
        return node.$(1).literal;
    }
    parse_fun_decl(node) {
        const retType = this.parse_type_spec(node.$(1));
        const name = node.$(2).literal;
        utils_1.assert(!this._funcs.has(name), `重复定义的函数：${name}`);
        const func = new IR_1.IRFunc(name, retType, []); // 参数列表在parse_params时会填上
        this._funcs.set(name, func);
        const funcBlock = IR_1.IRBlock.newFunc(name, func);
        this._pushBlock(funcBlock);
        this.parse_params(node.$(3), name);
        this.parse_local_decls(node.$(4), name);
        this.parse_stmt_list(node.$(5));
    }
    parse_params(node, funcName) {
        if (node.$(1).name == 'VOID') {
            this._funcs.get(funcName).paramList = [];
        }
        if (node.$(1).name == 'param_list') {
            this.parse_param_list(node.$(1), funcName);
        }
    }
    parse_param_list(node, funcName) {
        if (node.$(1).name == 'param_list') {
            // 左递归文法加上这里的递归顺序使得参数列表保序
            this.parse_param_list(node.$(1), funcName);
            this.parse_param(node.$(2), funcName);
        }
        if (node.$(1).name == 'param') {
            this.parse_param(node.$(1), funcName);
        }
    }
    parse_param(node, funcName) {
        const type = this.parse_type_spec(node.$(1));
        utils_1.assert(type != 'void', '不可以使用void作参数类型。');
        const name = node.$(2).name;
        const param = new IR_1.IRVar(this._newVar(), name, type);
        // 将形参送给函数
        this._funcs.get(funcName).paramList.push(param);
    }
    parse_stmt_list(node) {
        if (node.$(1).name == 'stmt_list') {
            this.parse_stmt_list(node.$(1));
            this.parse_stmt(node.$(2));
        }
        if (node.$(1).name == 'stmt') {
            this.parse_stmt(node.$(1));
        }
    }
    parse_stmt(node) {
        if (node.$(1).name == 'expr_stmt') {
            this.parse_expr_stmt(node.$(1));
        }
        if (node.$(1).name == 'compound_stmt') {
            this.parse_compound_stmt(node.$(1));
        }
        if (node.$(1).name == 'if_stmt') {
            this.parse_if_stmt(node.$(1));
        }
        if (node.$(1).name == 'while_stmt') {
            this.parse_while_stmt(node.$(1));
        }
        if (node.$(1).name == 'return_stmt') {
            this.parse_return_stmt(node.$(1));
        }
        if (node.$(1).name == 'continue_stmt') {
            this.parse_continue_stmt(node.$(1));
        }
        if (node.$(1).name == 'break_stmt') {
            this.parse_break_stmt(node.$(1));
        }
    }
    parse_compound_stmt(node) {
        // 复合语句注意作用域问题
        // FIXME: 确定breakable
        this._pushBlock(IR_1.IRBlock.newCompound(this._newLabel(), false));
        this.parse_stmt_list(node.$(1));
    }
    parse_if_stmt(node) {
        const expr = this.parse_expr(node.$(1));
        const trueLabel = this._newLabel();
        const falseLabel = this._newLabel();
        this._pushBlock(IR_1.IRBlock.newCompound(trueLabel, false));
        this._newQuad('set_label', '', '', trueLabel);
        this._newQuad('j_if_not', expr, '', falseLabel);
        this.parse_stmt(node.$(2));
        this._backBlock();
        this._newQuad('set_label', '', '', falseLabel);
    }
    parse_while_stmt(node) { }
    parse_continue_stmt(node) {
        this._newQuad('j', this._currentBlock().label, '', '');
    }
    parse_break_stmt(node) { }
    parse_expr_stmt(node) {
        // 变量赋值
        if (node.match('IDENTIFIER ASSIGN expr')) {
            const lhs = this._findVar(node.$(1).literal);
            const rhs = this.parse_expr(node.$(3));
            this._newQuad('=', rhs, '', lhs.id);
        }
        // 读数组
        if (node.match('IDENTIFIER expr ASSIGN expr')) {
            // TODO:
        }
        // 访地址
        if (node.match('DOLLAR expr ASSIGN expr')) {
            const addr = this.parse_expr(node.$(2));
            const rhs = this.parse_expr(node.$(4));
            this._newQuad('$=', rhs, '', addr);
        }
        // 调函数
        if (node.match('IDENTIFIER args')) {
            const args = this.parse_args(node.$(2));
            this._newQuad('call', node.$(1).literal, args.join('&'), '');
        }
    }
    parse_local_decls(node, funcName) {
        if (node.$(1).name == 'local_decls') {
            this.parse_local_decls(node.$(1), funcName);
            this.parse_local_decl(node.$(2), funcName);
        }
        if (node.$(1).name == 'local_decl') {
            this.parse_local_decl(node.$(1), funcName);
        }
    }
    parse_local_decl(node, funcName) {
        if (node.children.length == 2) {
            // 单个变量声明
            const type = this.parse_type_spec(node.$(1));
            const name = node.$(2).literal;
            const var_ = new IR_1.IRVar(this._newVar(), name, type);
            utils_1.assert(!this._blockFor(funcName).vars.some(v => v.name == name), `函数 ${funcName} 中的变量 ${name} 多次声明。`);
            this._blockFor(funcName).vars.push(var_);
        }
        if (node.children.length == 3) {
            // TODO: 数组
        }
    }
    parse_return_stmt(node) { }
    /**
     * 处理expr，返回指代expr结果的IRVar的id
     */
    parse_expr(node) {
        // 处理所有二元表达式 expr op expr
        if (node.children.length == 3 && node.$(1).name == 'expr' && node.$(2).name == 'expr') {
            // OR_OP, AND_OP, EQ_OP, NE_OP, GT_OP, LT_OP, GE_OP, LE_OP, PLUS, MINUS, MULTIPLY, SLASH, PERCENT, BITAND_OP, BITOR_OP, LEFT_OP, RIGHT_OP, BITOR_OP
            const oprand1 = this.parse_expr(node.$(1));
            const oprand2 = this.parse_expr(node.$(3));
            const res = this._newVar();
            this._newQuad(node.$(2).name, oprand1, oprand2, res);
            return res;
        }
        // 处理所有一元表达式 op expr
        if (node.children.length == 2) {
            // NOT_OP, MINUS, PLUS, DOLLAR, BITINV_OP
            const oprand = this.parse_expr(node.$(2));
            const res = this._newVar();
            this._newQuad(node.$(1).name, oprand, '', res);
            return res;
        }
        // 处理其余情况
        if (node.match('LPAREN expr RPAREN')) {
            const oprand = this.parse_expr(node.$(2));
            const res = this._newVar();
            this._newQuad('=', oprand, '', res);
            return res;
        }
        if (node.match('IDENTIFIER')) {
            return this._findVar(node.$(1).literal).id;
        }
        if (node.match('IDENTIFIER expr')) {
            // TODO: 数组
            return '?';
        }
        if (node.match('IDENTIFIER args')) {
            const funcName = node.$(1).literal;
            const args = this.parse_args(node.$(2));
            let res = this._newVar();
            this._newQuad('call', funcName, args.join('&'), res);
            return res;
        }
        if (node.match('CONSTANT')) {
            const res = this._newVar();
            this._newQuad('=', node.$(1).literal, '', res);
            return res;
        }
        utils_1.assert(false, 'parse_expr兜底失败。');
        return '-1';
    }
    /**
     * 按参数顺序返回IRVar.id[]
     */
    parse_args(node) {
        if (node.$(1).name == 'args') {
            return [...this.parse_args(node.$(1)), this.parse_expr(node.$(2))];
        }
        if (node.$(1).name == 'expr') {
            return [this.parse_expr(node.$(1))];
        }
        return [];
    }
    toIRString() {
        // TODO
        let res = '';
        // 函数定义
        res += '[FUNCTIONS]\n';
        for (let func of this._funcs.values()) {
            res += '\tname: ' + func.name + '\n';
            res += '\tretType: ' + func.retType + '\n';
            res += '\tparamList: ' + func.paramList.map(v => `${v.id}(${v.type})`).join(' | ') + '\n';
            res += '\n';
        }
        res += '\n';
        // 全局变量
        res += '[GLOBALVARS]\n';
        for (let v of this._globalVars) {
            res += '\t' + `${v.id}(${v.type})` + '\n';
        }
        res += '\n';
        // 四元式
        res += '[QUADS]\n';
        for (let quad of this._quads) {
            res += '\t' + quad.toString() + '\n';
        }
        res += '\n';
        return res;
    }
}
exports.IRGenerator = IRGenerator;
