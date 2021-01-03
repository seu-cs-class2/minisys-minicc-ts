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
exports.IRGenerator = exports.VarPrefix = exports.LabelPrefix = exports.GlobalScope = void 0;
const utils_1 = require("../seu-lex-yacc/utils");
const IR_1 = require("./IR");
const IR_2 = require("./IR");
exports.GlobalScope = [0]; // 0号作用域是全局作用域
exports.LabelPrefix = '_label_';
exports.VarPrefix = '_var_';
/**
 * 中间代码生成器
 */
class IRGenerator {
    constructor(root) {
        this._scopePath = exports.GlobalScope;
        this._varPool = [];
        this._funcPool = [];
        this._quads = [];
        this._varCount = 0;
        this._labelCount = 0;
        this._scopeCount = 0;
        this._loopStack = [];
        this.start(root);
        this._basicBlocks = this._toBasicBlocks();
    }
    get funcPool() {
        return this._funcPool;
    }
    get quads() {
        return this._quads;
    }
    get basicBlocks() {
        return this._basicBlocks;
    }
    /**
     * 新增一条四元式并将其返回
     */
    _newQuad(op, arg1, arg2, res) {
        const quad = new IR_2.Quad(op, arg1, arg2, res);
        this._quads.push(quad);
        return quad;
    }
    get varPool() {
        return this._varPool;
    }
    get varCount() {
        return this._varCount;
    }
    /**
     * 分配一个新的变量id
     */
    _newVarId() {
        return exports.VarPrefix + this._varCount++;
    }
    /**
     * 新增一个变量
     */
    _newVar(v) {
        this._varPool.push(v);
    }
    /**
     * 分配一个新标号
     */
    _newLabel(desc = '') {
        return exports.LabelPrefix + this._labelCount++ + '_' + desc;
    }
    /**
     * 进一层作用域
     */
    pushScope() {
        this._scopePath.push(++this._scopeCount);
    }
    /**
     * 退出当前作用域
     */
    popScope() {
        return this._scopePath.pop();
    }
    /**
     * 判断两个作用域是否相同
     */
    static sameScope(scope1, scope2) {
        return scope1.join('/') == scope2.join('/');
    }
    /**
     * 结合当前所在的作用域寻找最近的名字相符的变量
     */
    _findVar(name) {
        let validScopes = [], currentScope = [...this._scopePath];
        while (currentScope.length) {
            validScopes.push([...currentScope]);
            currentScope.pop();
        }
        // validScopes由近及远
        for (let scope of validScopes)
            for (let v of this._varPool)
                if (v.name == name && IRGenerator.sameScope(v.scope, scope))
                    return v;
        utils_1.assert(false, `未找到该变量：${name}`);
        return new IR_1.IRVar('-1', '', 'none', [], false);
    }
    /**
     * 检查变量是否重复
     */
    duplicateCheck(v1, v2) {
        return v1.name == v2.name && v1.scope.join('/') == v2.scope.join('/');
    }
    start(node) {
        if (!node)
            utils_1.assert(false, 'AST根节点为null');
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
        // 全局变量声明
        if (node.match('type_spec IDENTIFIER')) {
            const type = this.parse_type_spec(node.$(1));
            const name = node.$(2).literal;
            utils_1.assert(type !== 'void', `不可以声明void型变量：${name}`);
            this._scopePath = exports.GlobalScope;
            utils_1.assert(!this._varPool.some(v => IRGenerator.sameScope(v.scope, exports.GlobalScope) && v.name == name), `全局变量重复声明：${name}`);
            this._newVar(new IR_1.IRVar(this._newVarId(), name, type, this._scopePath, false));
        }
        // 全局数组声明
        if (node.match('type_spec IDENTIFIER CONSTANT')) {
            const type = this.parse_type_spec(node.$(1));
            const name = node.$(2).literal;
            let len = Number(node.$(3).literal);
            this._scopePath = exports.GlobalScope;
            utils_1.assert(!isNaN(len), `数组长度必须为数字，但取到 ${node.$(3).literal}。`);
            this._newVar(new IR_1.IRArray(this._newVarId(), type, name, len, this._scopePath));
        }
    }
    parse_type_spec(node) {
        // 取类型字面
        return node.$(1).literal;
    }
    parse_fun_decl(node) {
        // 规定所有的函数都在全局作用域
        const retType = this.parse_type_spec(node.$(1));
        const name = node.$(2).literal;
        utils_1.assert(!this._funcPool.some(v => v.name == name), `函数重复定义：${name}`);
        // 参数列表在parse_params时会填上
        const entryLabel = this._newLabel(name + '_entry');
        const exitLabel = this._newLabel(name + '_exit');
        this._funcPool.push(new IR_1.IRFunc(name, retType, [], entryLabel, exitLabel));
        this.pushScope();
        this._newQuad('set_label', '', '', entryLabel); // 函数入口
        this.parse_params(node.$(3), name);
        if (node.children.length == 5) {
            this.parse_local_decls(node.$(4));
            this.parse_stmt_list(node.$(5), { entryLabel, exitLabel });
        }
        else if (node.children.length == 4) {
            // 没有局部变量
            this.parse_stmt_list(node.$(4), { entryLabel, exitLabel });
        }
        this._newQuad('set_label', '', '', exitLabel); // 函数出口
        this.popScope();
    }
    parse_params(node, funcName) {
        if (node.$(1).name == 'VOID') {
            this._funcPool.find(v => v.name == funcName).paramList = [];
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
        utils_1.assert(type != 'void', '不可以用void作参数类型。函数：' + funcName);
        const name = node.$(2).literal;
        const var_ = new IR_1.IRVar(this._newVarId(), name, type, this._scopePath, false);
        this._newVar(var_);
        // 将形参送给函数
        this._funcPool.find(v => v.name == funcName).paramList.push(var_);
    }
    parse_stmt_list(node, context) {
        if (node.$(1).name == 'stmt_list') {
            this.parse_stmt_list(node.$(1), context);
            this.parse_stmt(node.$(2), context);
        }
        if (node.$(1).name == 'stmt') {
            this.parse_stmt(node.$(1), context);
        }
    }
    parse_stmt(node, context) {
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
            this.parse_return_stmt(node.$(1), context.exitLabel);
        }
        if (node.$(1).name == 'continue_stmt') {
            this.parse_continue_stmt(node.$(1));
        }
        if (node.$(1).name == 'break_stmt') {
            this.parse_break_stmt(node.$(1));
        }
    }
    parse_compound_stmt(node) {
        this.pushScope();
        if (node.children.length == 2) {
            this.parse_local_decls(node.$(1));
            this.parse_stmt_list(node.$(2));
        }
        else if (node.children.length == 1) {
            // 没有局部变量
            this.parse_stmt_list(node.$(1));
        }
        this.popScope();
    }
    parse_if_stmt(node) {
        const expr = this.parse_expr(node.$(1));
        const trueLabel = this._newLabel('true'); // 真入口标号
        const falseLabel = this._newLabel('false'); // 假入口标号
        this._newQuad('set_label', '', '', trueLabel);
        this._newQuad('j_false', expr, '', falseLabel);
        this.parse_stmt(node.$(2));
        this._newQuad('set_label', '', '', falseLabel);
    }
    parse_while_stmt(node) {
        const loopLabel = this._newLabel('loop'); // 入口标号
        const breakLabel = this._newLabel('break'); // 出口标号
        this._loopStack.push({ loopLabel, breakLabel });
        this._newQuad('set_label', '', '', loopLabel);
        const expr = this.parse_expr(node.$(1));
        this._newQuad('j_false', expr, '', breakLabel);
        this.parse_stmt(node.$(2));
        this._newQuad('j', '', '', loopLabel);
        this._newQuad('set_label', '', '', breakLabel);
        this._loopStack.pop();
    }
    parse_continue_stmt(node) {
        utils_1.assert(this._loopStack.length > 0, '产生continue时没有足够的上下文');
        this._newQuad('j', '', '', this._loopStack.slice(-1)[0].loopLabel);
    }
    parse_break_stmt(node) {
        utils_1.assert(this._loopStack.length > 0, '产生break时没有足够的上下文');
        this._newQuad('j', '', '', this._loopStack.slice(-1)[0].breakLabel);
    }
    parse_expr_stmt(node) {
        // 变量赋值
        if (node.match('IDENTIFIER ASSIGN expr')) {
            const lhs = this._findVar(node.$(1).literal);
            lhs.inited = true;
            const rhs = this.parse_expr(node.$(3));
            this._newQuad('=var', rhs, '', lhs.id);
        }
        // 读数组
        if (node.match('IDENTIFIER expr ASSIGN expr')) {
            const arr = this._findVar(node.$(1).literal);
            const index = this.parse_expr(node.$(2));
            const rhs = this.parse_expr(node.$(4));
            this._newQuad('=[]', index, rhs, arr.id);
        }
        // 访地址
        if (node.match('DOLLAR expr ASSIGN expr')) {
            const addr = this.parse_expr(node.$(2));
            const rhs = this.parse_expr(node.$(4));
            this._newQuad('=$', rhs, '', addr);
        }
        // 调函数
        if (node.match('IDENTIFIER args')) {
            const args = this.parse_args(node.$(2));
            utils_1.assert(this._funcPool.find(v => v.name == node.$(1).literal), `未声明就调用了函数 ${node.$(1).literal}`);
            utils_1.assert(args.length == this._funcPool.find(v => v.name == node.$(1).literal).paramList.length, `函数 ${node.$(1).literal} 调用参数数量不匹配`);
            this._newQuad('call', node.$(1).literal, args.join('&'), '');
        }
        // 调函数（无参）
        if (node.match('IDENTIFIER LPAREN RPAREN')) {
            utils_1.assert(this._funcPool.find(v => v.name == node.$(1).literal), `未声明就调用了函数 ${node.$(1).literal}`);
            utils_1.assert(0 == this._funcPool.find(v => v.name == node.$(1).literal).paramList.length, `函数 ${node.$(1).literal} 调用参数数量不匹配`);
            this._newQuad('call', node.$(1).literal, '', '');
        }
    }
    parse_local_decls(node) {
        if (node.$(1).name == 'local_decls') {
            this.parse_local_decls(node.$(1));
            this.parse_local_decl(node.$(2));
        }
        if (node.$(1).name == 'local_decl') {
            this.parse_local_decl(node.$(1));
        }
    }
    parse_local_decl(node) {
        if (node.children.length == 2) {
            // 单个变量声明
            const type = this.parse_type_spec(node.$(1));
            const name = node.$(2).literal;
            const var_ = new IR_1.IRVar(this._newVarId(), name, type, this._scopePath, false);
            utils_1.assert(!this._varPool.some(v => this.duplicateCheck(v, var_)), '局部变量重复声明：' + name);
            this._newVar(var_);
        }
        if (node.children.length == 3) {
            // 数组声明
            const type = this.parse_type_spec(node.$(1));
            const name = node.$(2).literal;
            const len = Number(node.$(3).literal);
            utils_1.assert(!isNaN(len), `数组长度必须为数字，但取到 ${node.$(3).literal}`);
            const arr = new IR_1.IRArray(this._newVarId(), type, name, len, this._scopePath);
            utils_1.assert(!this._varPool.some(v => this.duplicateCheck(v, arr)), '局部变量重复声明：' + name);
            this._newVar(arr);
        }
    }
    parse_return_stmt(node, exitLabel) {
        if (node.children.length == 0) {
            this._newQuad('return_void', '', '', exitLabel);
        }
        if (node.children.length == 1) {
            const expr = this.parse_expr(node.$(1));
            this._newQuad('return_expr', expr, '', exitLabel);
        }
    }
    /**
     * 处理expr，返回指代expr结果的IRVar的id
     */
    parse_expr(node) {
        // 处理特殊情况
        if (node.match('LPAREN expr RPAREN')) {
            // 括号表达式
            const oprand = this.parse_expr(node.$(2));
            const res = this._newVarId();
            this._newQuad('=var', oprand, '', res);
            return res;
        }
        if (node.match('IDENTIFIER')) {
            // 访问变量
            const var_ = this._findVar(node.$(1).literal);
            utils_1.assert(var_.inited, `在初始化前使用了变量：${var_.name}`);
            return var_.id;
        }
        if (node.match('IDENTIFIER expr')) {
            // 访问数组元素
            const index = this.parse_expr(node.$(2));
            const name = node.$(1).literal;
            const res = this._newVarId();
            this._newQuad('[]', this._findVar(name).id, index, res);
            return res;
        }
        if (node.match('IDENTIFIER args')) {
            console.log('herererererere');
            // 调用函数（有参）
            const funcName = node.$(1).literal;
            utils_1.assert(funcName !== 'main', '禁止手动或递归调用main函数');
            const args = this.parse_args(node.$(2));
            let res = this._newVarId();
            utils_1.assert(args.length == this._funcPool.find(v => v.name == funcName).paramList.length, `函数 ${funcName} 调用参数数量不匹配`);
            this._newQuad('call', funcName, args.join('&'), res);
            return res;
        }
        if (node.match('IDENTIFIER LPAREN RPAREN')) {
            // 调用函数（无参）
            const funcName = node.$(1).literal;
            utils_1.assert(funcName !== 'main', '禁止手动或递归调用main函数');
            let res = this._newVarId();
            this._newQuad('call', funcName, '', res);
            return res;
        }
        if (node.match('CONSTANT')) {
            // 常量
            const res = this._newVarId();
            this._newQuad('=const', node.$(1).literal, '', res);
            return res;
        }
        if (node.match('STRING_LITERAL')) {
            // 字符串字面
            // FIXME
            const res = this._newVarId();
            this._newQuad('=string', node.$(1).literal, '', res);
            return res;
        }
        // 处理所有二元表达式 expr op expr
        if (node.children.length == 3 && node.$(1).name == 'expr' && node.$(3).name == 'expr') {
            // OR_OP, AND_OP, EQ_OP, NE_OP, GT_OP, LT_OP, GE_OP, LE_OP, PLUS, MINUS, MULTIPLY,
            // SLASH, PERCENT, BITAND_OP, BITOR_OP, LEFT_OP, RIGHT_OP, BITOR_OP
            const oprand1 = this.parse_expr(node.$(1));
            const oprand2 = this.parse_expr(node.$(3));
            const res = this._newVarId();
            this._newQuad(node.$(2).name, oprand1, oprand2, res);
            return res;
        }
        // 处理所有一元表达式 op expr
        if (node.children.length == 2) {
            // NOT_OP, MINUS, PLUS, DOLLAR, BITINV_OP
            const oprand = this.parse_expr(node.$(2));
            const res = this._newVarId();
            this._newQuad(node.$(1).name, oprand, '', res);
            return res;
        }
        utils_1.assert(false, 'parse_expr兜底失败');
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
        let res = '';
        // 函数定义
        res += '[FUNCTIONS]\n';
        for (let func of this._funcPool) {
            res += '\tname: ' + func.name + '\n';
            res += '\tretType: ' + func.retType + '\n';
            res += '\tparamList: ' + func.paramList.map(v => `${v.id}(${v.type})`).join('; ') + '\n';
            res += '\n';
        }
        res += '\n';
        // 全局变量
        res += '[GLOBALVARS]\n';
        for (let v of this._varPool.filter(x => IRGenerator.sameScope(x.scope, exports.GlobalScope))) {
            res += '\t' + `${v.id}(${v.type})` + '\n';
        }
        res += '\n';
        // 变量池
        res += '[VARPOOL]\n';
        for (let v of this._varPool) {
            res += '\t' + `${v.id}, ${v.name}, ${v.type}, ${v.scope.join('/')}` + '\n';
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
    /**
     * 对四元式进行基本块划分
     * 龙书算法8.5
     */
    _toBasicBlocks() {
        let leaders = []; // 首指令下标
        let nextFlag = false;
        for (let i = 0; i < this._quads.length; i++) {
            if (i == 0) {
                // 中间代码的第一个四元式是一个首指令
                leaders.push(i);
                continue;
            }
            if (this._quads[i].op == 'j' || this._quads[i].op == 'j_false') {
                // 条件或无条件转移指令的目标指令是一个首指令
                leaders.push(this._quads.findIndex(v => v.op == 'set_label' && v.res == this._quads[i].res));
                nextFlag = true;
                continue;
            }
            if (nextFlag) {
                // 紧跟在一个条件或无条件转移指令之后的指令是一个首指令
                leaders.push(i);
                nextFlag = false;
                continue;
            }
        }
        leaders = [...new Set(leaders)].sort((a, b) => a - b);
        if (leaders.slice(-1)[0] !== this._quads.length - 1)
            leaders.push(this._quads.length - 1);
        // 每个首指令左闭右开地划分了四元式
        let res = [];
        let id = 0;
        for (let i = 0; i < leaders.length - 1; i++) {
            res.push({
                id: id++,
                content: this._quads.slice(leaders[i], leaders[i + 1]),
            });
        }
        return res;
    }
}
exports.IRGenerator = IRGenerator;
