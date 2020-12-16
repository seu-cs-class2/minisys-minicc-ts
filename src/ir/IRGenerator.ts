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

import { assert } from '../seu-lex-yacc/utils'
import { ASTNode } from './AST'
import { IRVar, IRFunc, MiniCType, IRArray, BasicBlock } from './IR'
import { Quad } from './IR'

export const GlobalScope = [0] // 0号作用域是全局作用域
export const LabelPrefix = '_label_'
export const VarPrefix = '_var_'

/**
 * 中间代码生成器
 */
export class IRGenerator {
  private _funcPool: IRFunc[] // 所有函数
  private _quads: Quad[] // 所有四元式
  get quads() {
    return this._quads
  }
  private _basicBlocks: BasicBlock[] // 经过基本块划分的四元式
  get basicBlocks() {
    return this._basicBlocks
  }
  /**
   * 新增一条四元式并将其返回
   */
  private _newQuad(op: string, arg1: string, arg2: string, res: string) {
    const quad = new Quad(op, arg1, arg2, res)
    this._quads.push(quad)
    return quad
  }
  private _varPool: (IRVar | IRArray)[] // 所有变量
  get varPool() {
    return this._varPool
  }
  private _varCount: number // 变量计数
  /**
   * 分配一个新的变量id
   */
  private _newVarId() {
    return VarPrefix + this._varCount++
  }
  /**
   * 新增一个变量
   */
  private _newVar(v: IRVar | IRArray) {
    this._varPool.push(v)
  }
  private _labelCount: number // 标号计数
  /**
   * 分配一个新标号
   */
  private _newLabel(desc = '') {
    return LabelPrefix + this._labelCount++ + '_' + desc
  }
  private _scopeCount: number // 作用域计数
  private _scopePath: number[] // 当前作用域路径
  /**
   * 进一层作用域
   */
  private pushScope() {
    this._scopePath.push(++this._scopeCount)
  }
  /**
   * 退出当前作用域
   */
  private popScope() {
    return this._scopePath.pop()
  }
  /**
   * 判断两个作用域是否相同
   */
  static sameScope(scope1: number[], scope2: number[]) {
    return scope1.join('/') == scope2.join('/')
  }
  /**
   * 结合当前所在的作用域寻找最近的名字相符的变量
   */
  private _findVar(name: string) {
    let validScopes = [],
      currentScope = [...this._scopePath]
    while (currentScope.length) {
      validScopes.push([...currentScope])
      currentScope.pop()
    }
    // validScopes由近及远
    for (let scope of validScopes)
      for (let v of this._varPool) if (v.name == name && IRGenerator.sameScope(v.scope, scope)) return v
    assert(false, `未找到该变量：${name}`)
    return new IRVar('-1', '', 'none', [])
  }
  /**
   * 检查变量是否重复
   */
  private duplicateCheck(v1: IRVar | IRArray, v2: IRVar | IRArray) {
    return v1.name == v2.name && v1.scope.join('/') == v2.scope.join('/')
  }
  // break、continue辅助栈，以支持while嵌套
  private _loopStack: { loopLabel: string; breakLabel: string }[]

  constructor(root: ASTNode) {
    this._scopePath = GlobalScope
    this._varPool = []
    this._funcPool = []
    this._quads = []
    this._varCount = 0
    this._labelCount = 0
    this._scopeCount = 0
    this._loopStack = []
    this.start(root)
    this._basicBlocks = this._toBasicBlocks()
  }

  start(node: ASTNode) {
    if (!node) assert(false, 'AST根节点为null。')
    this.parse_program(node)
  }

  parse_program(node: ASTNode) {
    this.parse_decl_list(node.$(1))
  }

  parse_decl_list(node: ASTNode) {
    if (node.$(1).name == 'decl_list') {
      this.parse_decl_list(node.$(1))
      this.parse_decl(node.$(2))
    }
    if (node.$(1).name == 'decl') {
      this.parse_decl(node.$(1))
    }
  }

  parse_decl(node: ASTNode) {
    if (node.$(1).name == 'var_decl') {
      this.parse_var_decl(node.$(1))
    }
    if (node.$(1).name == 'fun_decl') {
      this.parse_fun_decl(node.$(1))
    }
  }

  parse_var_decl(node: ASTNode) {
    // 全局变量声明
    if (node.match('type_spec IDENTIFIER')) {
      const type = this.parse_type_spec(node.$(1))
      const name = node.$(2).literal
      this._scopePath = GlobalScope
      this._newVar(new IRVar(this._newVarId(), name, type, this._scopePath))
    }
    // 全局数组声明
    if (node.match('type_spec IDENTIFIER CONSTANT')) {
      const type = this.parse_type_spec(node.$(1))
      const name = node.$(2).literal
      let len = Number(node.$(3).literal)
      this._scopePath = GlobalScope
      assert(!isNaN(len), `数组长度必须为数字，但取到 ${node.$(3).literal}。`)
      this._newVar(new IRArray(this._newVarId(), type, name, len, this._scopePath))
    }
  }

  parse_type_spec(node: ASTNode) {
    // 取类型字面
    return node.$(1).literal as MiniCType
  }

  parse_fun_decl(node: ASTNode) {
    // 规定所有的函数都在全局作用域
    const retType = this.parse_type_spec(node.$(1))
    const name = node.$(2).literal
    assert(!this._funcPool.some(v => v.name == name), `重复定义的函数：${name}`)
    // 参数列表在parse_params时会填上
    this._funcPool.push(new IRFunc(name, retType, []))
    const entryLabel = this._newLabel(name + '_entry')
    const exitLabel = this._newLabel(name + '_exit')
    this.pushScope()
    this._newQuad('set_label', '', '', entryLabel) // 函数入口
    this.parse_params(node.$(3), name)
    if (node.children.length == 5) {
      this.parse_local_decls(node.$(4))
      this.parse_stmt_list(node.$(5), { entryLabel, exitLabel })
    } else if (node.children.length == 4) {
      // 没有局部变量
      this.parse_stmt_list(node.$(4), { entryLabel, exitLabel })
    }
    this._newQuad('set_label', '', '', exitLabel) // 函数出口
    this.popScope()
  }

  parse_params(node: ASTNode, funcName: string) {
    if (node.$(1).name == 'VOID') {
      this._funcPool.find(v => v.name == funcName)!.paramList = []
    }
    if (node.$(1).name == 'param_list') {
      this.parse_param_list(node.$(1), funcName)
    }
  }

  parse_param_list(node: ASTNode, funcName: string) {
    if (node.$(1).name == 'param_list') {
      // 左递归文法加上这里的递归顺序使得参数列表保序
      this.parse_param_list(node.$(1), funcName)
      this.parse_param(node.$(2), funcName)
    }
    if (node.$(1).name == 'param') {
      this.parse_param(node.$(1), funcName)
    }
  }

  parse_param(node: ASTNode, funcName: string) {
    const type = this.parse_type_spec(node.$(1))
    assert(type != 'void', '不可以使用void作参数类型。函数: ' + funcName)
    const name = node.$(2).literal
    const var_ = new IRVar(this._newVarId(), name, type, this._scopePath)
    this._newVar(var_)
    // 将形参送给函数
    this._funcPool.find(v => v.name == funcName)!.paramList.push(var_)
  }

  parse_stmt_list(node: ASTNode, context?: any) {
    if (node.$(1).name == 'stmt_list') {
      this.parse_stmt_list(node.$(1), context)
      this.parse_stmt(node.$(2), context)
    }
    if (node.$(1).name == 'stmt') {
      this.parse_stmt(node.$(1), context)
    }
  }

  parse_stmt(node: ASTNode, context?: any) {
    if (node.$(1).name == 'expr_stmt') {
      this.parse_expr_stmt(node.$(1))
    }
    if (node.$(1).name == 'compound_stmt') {
      this.parse_compound_stmt(node.$(1))
    }
    if (node.$(1).name == 'if_stmt') {
      this.parse_if_stmt(node.$(1))
    }
    if (node.$(1).name == 'while_stmt') {
      this.parse_while_stmt(node.$(1))
    }
    if (node.$(1).name == 'return_stmt') {
      this.parse_return_stmt(node.$(1), context.exitLabel)
    }
    if (node.$(1).name == 'continue_stmt') {
      this.parse_continue_stmt(node.$(1))
    }
    if (node.$(1).name == 'break_stmt') {
      this.parse_break_stmt(node.$(1))
    }
  }

  parse_compound_stmt(node: ASTNode) {
    this.pushScope()
    if (node.children.length == 2) {
      this.parse_local_decls(node.$(1))
      this.parse_stmt_list(node.$(2))
    } else if (node.children.length == 1) {
      // 没有局部变量
      this.parse_stmt_list(node.$(1))
    }
    this.popScope()
  }

  parse_if_stmt(node: ASTNode) {
    const expr = this.parse_expr(node.$(1))
    const trueLabel = this._newLabel('true') // 真入口标号
    const falseLabel = this._newLabel('false') // 假入口标号
    this._newQuad('set_label', '', '', trueLabel)
    this._newQuad('j_false', expr, '', falseLabel)
    this.parse_stmt(node.$(2))
    this._newQuad('set_label', '', '', falseLabel)
  }

  parse_while_stmt(node: ASTNode) {
    const loopLabel = this._newLabel('loop') // 入口标号
    const breakLabel = this._newLabel('break') // 出口标号
    this._loopStack.push({ loopLabel, breakLabel })
    this._newQuad('set_label', '', '', loopLabel)
    const expr = this.parse_expr(node.$(1))
    this._newQuad('j_false', expr, '', breakLabel)
    this.parse_stmt(node.$(2))
    this._newQuad('j', '', '', loopLabel)
    this._newQuad('set_label', '', '', breakLabel)
    this._loopStack.pop()
  }

  parse_continue_stmt(node: ASTNode) {
    assert(this._loopStack.length > 0, '产生continue时没有足够的上下文')
    this._newQuad('j', '', '', this._loopStack.slice(-1)[0]!.loopLabel)
  }

  parse_break_stmt(node: ASTNode) {
    assert(this._loopStack.length > 0, '产生break时没有足够的上下文')
    this._newQuad('j', '', '', this._loopStack.slice(-1)[0]!.breakLabel)
  }

  parse_expr_stmt(node: ASTNode) {
    // 变量赋值
    if (node.match('IDENTIFIER ASSIGN expr')) {
      const lhs = this._findVar(node.$(1).literal)
      const rhs = this.parse_expr(node.$(3))
      this._newQuad('=var', rhs, '', lhs.id)
    }
    // 读数组
    if (node.match('IDENTIFIER expr ASSIGN expr')) {
      const arr = this._findVar(node.$(1).literal) as IRArray
      const index = this.parse_expr(node.$(2))
      const rhs = this.parse_expr(node.$(4))
      this._newQuad('=[]', index, rhs, arr.id)
    }
    // 访地址
    if (node.match('DOLLAR expr ASSIGN expr')) {
      const addr = this.parse_expr(node.$(2))
      const rhs = this.parse_expr(node.$(4))
      this._newQuad('=$', rhs, '', addr)
    }
    // 调函数
    if (node.match('IDENTIFIER args')) {
      const args = this.parse_args(node.$(2))
      this._newQuad('call', node.$(1).literal, args.join('&'), '')
    }
  }

  parse_local_decls(node: ASTNode) {
    if (node.$(1).name == 'local_decls') {
      this.parse_local_decls(node.$(1))
      this.parse_local_decl(node.$(2))
    }
    if (node.$(1).name == 'local_decl') {
      this.parse_local_decl(node.$(1))
    }
  }

  parse_local_decl(node: ASTNode) {
    if (node.children.length == 2) {
      // 单个变量声明
      const type = this.parse_type_spec(node.$(1))
      const name = node.$(2).literal
      const var_ = new IRVar(this._newVarId(), name, type, this._scopePath)
      assert(!this._varPool.some(v => this.duplicateCheck(v, var_)), '变量重复声明: ' + name)
      this._newVar(var_)
    }
    if (node.children.length == 3) {
      // 数组声明
      const type = this.parse_type_spec(node.$(1))
      const name = node.$(2).literal
      const len = Number(node.$(3).literal)
      assert(!isNaN(len), `数组长度必须为数字，但取到 ${node.$(3).literal}。`)
      const arr = new IRArray(this._newVarId(), type, name, len, this._scopePath)
      assert(!this._varPool.some(v => this.duplicateCheck(v, arr)), '变量重复声明: ' + name)
      this._newVar(arr)
    }
  }

  parse_return_stmt(node: ASTNode, exitLabel: string) {
    if (node.children.length == 0) {
      this._newQuad('return_void', '', '', exitLabel)
    }
    if (node.children.length == 1) {
      const expr = this.parse_expr(node.$(1))
      this._newQuad('return_expr', expr, '', exitLabel)
    }
  }

  /**
   * 处理expr，返回指代expr结果的IRVar的id
   */
  parse_expr(node: ASTNode) {
    // 处理特殊情况
    if (node.match('LPAREN expr RPAREN')) {
      // 括号表达式
      const oprand = this.parse_expr(node.$(2))
      const res = this._newVarId()
      this._newQuad('=var', oprand, '', res)
      return res
    }
    if (node.match('IDENTIFIER')) {
      // 访问变量
      return this._findVar(node.$(1).literal).id
    }
    if (node.match('IDENTIFIER expr')) {
      // 访问数组元素
      const index = this.parse_expr(node.$(2))
      const name = node.$(1).literal
      const res = this._newVarId()
      this._newQuad('[]', this._findVar(name).id, index, res)
      return res
    }
    if (node.match('IDENTIFIER args')) {
      // 调用函数
      const funcName = node.$(1).literal
      const args = this.parse_args(node.$(2))
      let res = this._newVarId()
      this._newQuad('call', funcName, args.join('&'), res)
      return res
    }
    if (node.match('CONSTANT')) {
      // 常量
      const res = this._newVarId()
      this._newQuad('=const', node.$(1).literal, '', res)
      return res
    }
    // 处理所有二元表达式 expr op expr
    if (node.children.length == 3 && node.$(1).name == 'expr' && node.$(3).name == 'expr') {
      // OR_OP, AND_OP, EQ_OP, NE_OP, GT_OP, LT_OP, GE_OP, LE_OP, PLUS, MINUS, MULTIPLY,
      // SLASH, PERCENT, BITAND_OP, BITOR_OP, LEFT_OP, RIGHT_OP, BITOR_OP
      const oprand1 = this.parse_expr(node.$(1))
      const oprand2 = this.parse_expr(node.$(3))
      const res = this._newVarId()
      this._newQuad(node.$(2).name, oprand1, oprand2, res)
      return res
    }
    // 处理所有一元表达式 op expr
    if (node.children.length == 2) {
      // NOT_OP, MINUS, PLUS, DOLLAR, BITINV_OP
      const oprand = this.parse_expr(node.$(2))
      const res = this._newVarId()
      this._newQuad(node.$(1).name, oprand, '', res)
      return res
    }
    assert(false, 'parse_expr兜底失败')
    return '-1'
  }

  /**
   * 按参数顺序返回IRVar.id[]
   */
  parse_args(node: ASTNode): string[] {
    if (node.$(1).name == 'args') {
      return [...this.parse_args(node.$(1)), this.parse_expr(node.$(2))]
    }
    if (node.$(1).name == 'expr') {
      return [this.parse_expr(node.$(1))]
    }
    return []
  }

  toIRString() {
    let res = ''
    // 函数定义
    res += '[FUNCTIONS]\n'
    for (let func of this._funcPool) {
      res += '\tname: ' + func.name + '\n'
      res += '\tretType: ' + func.retType + '\n'
      res += '\tparamList: ' + func.paramList.map(v => `${v.id}(${v.type})`).join(' | ') + '\n'
      res += '\n'
    }
    res += '\n'
    // 全局变量
    res += '[GLOBALVARS]\n'
    for (let v of this._varPool.filter(x => IRGenerator.sameScope(x.scope, GlobalScope))) {
      res += '\t' + `${v.id}(${v.type})` + '\n'
    }
    res += '\n'
    // 变量池
    res += '[VARPOOL]\n'
    for (let v of this._varPool) {
      res += '\t' + `${v.id}, ${v.name}, ${v.type}, ${v.scope.join('/')}` + '\n'
    }
    res += '\n'
    // 四元式
    res += '[QUADS]\n'
    for (let quad of this._quads) {
      res += '\t' + quad.toString() + '\n'
    }
    res += '\n'
    return res
  }

  /**
   * 对四元式进行基本块划分
   * 龙书算法8.5
   */
  private _toBasicBlocks(): BasicBlock[] {
    let leaders = [] // 首指令下标
    let nextFlag = false
    for (let i = 0; i < this._quads.length; i++) {
      if (i == 0) {
        // 中间代码的第一个四元式是一个首指令
        leaders.push(i)
        continue
      }
      if (this._quads[i].op == 'j' || this._quads[i].op == 'j_false') {
        // 条件或无条件转移指令的目标指令是一个首指令
        leaders.push(this._quads.findIndex(v => v.op == 'set_label' && v.res == this._quads[i].res))
        nextFlag = true
        continue
      }
      if (nextFlag) {
        // 紧跟在一个条件或无条件转移指令之后的指令是一个首指令
        leaders.push(i)
        nextFlag = false
        continue
      }
    }
    leaders = [...new Set(leaders)].sort((a, b) => a - b)
    if (leaders.slice(-1)[0] !== this._quads.length - 1) leaders.push(this._quads.length - 1)

    // 每个首指令左闭右开地划分了四元式
    let res: BasicBlock[] = []
    let id = 0
    for (let i = 0; i < leaders.length - 1; i++) {
      res.push({
        id: id++,
        content: this._quads.slice(leaders[i], leaders[i + 1]),
      })
    }

    return res
  }
}
