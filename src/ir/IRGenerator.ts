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
import { IRBlock, IRVar, IRFunc, MiniCType } from './IR'
import { Quad } from './IR'

// 收集所有变量、函数
export class IRGenerator {
  // 函数名→函数结点 映射
  private _funcs: Map<string, IRFunc>
  get funcs() {
    return this._funcs
  }
  // 块
  private _blocks: IRBlock[]
  private _blocksStk: number[]
  get blocks() {
    return this._blocks
  }
  private _blockStkPtr: number // 当前块编号栈指针，用于实现作用域
  /**
   * 获取当前所在的块
   */
  private _currentBlock() {
    return this._blocks[this._blocksStk[this._blockStkPtr]]
  }
  /**
   * 在当前位置添加一个块，并进入该块的上下文
   */
  private _pushBlock(block: IRBlock) {
    this._blocks.push(block)
    this._blocksStk.push(this._blocks.length - 1)
    this._blockStkPtr += 1
  }
  /**
   * 前进一个块
   */
  private _nextBlock() {
    this._blockStkPtr += 1
  }
  /**
   * 回退一个块
   */
  private _backBlock() {
    this._blocksStk.pop()
    this._blockStkPtr -= 1
  }
  /**
   * 获取函数对应的块
   */
  private _blockFor(funcName: string) {
    return this._blocks.find(v => v.funcName == funcName)
  }
  // 全局变量
  private _globalVars: IRVar[]
  get globalVars() {
    return this._globalVars
  }
  // 四元式
  private _quads: Quad[]
  get quads() {
    return this._quads
  }
  /**
   * 新建四元式
   */
  private _newQuad(op: string, arg1: string, arg2: string, res: string) {
    const quad = new Quad(op, arg1, arg2, res)
    this._quads.push(quad)
    return quad
  }
  // 变量计数
  private _varCount: number
  /**
   * 获取新的变量ID
   */
  private _newVar() {
    return '_var_' + this._varCount++
  }
  /**
   * 根据变量名结合作用域定位变量
   */
  private _findVar(name: string) {
    // FIXME: 考虑层次
    for (let i = this._blockStkPtr; i >= 0; i--) {
      const res = this._blocks[this._blocksStk[i]].vars.find(v => v.name == name)
      if (res) return res
    }
    assert(false, `未找到该变量：${name}`)
    return new IRVar('-1', '', 'none')
  }
  // 标签计数，每个复合语句块都分配一个标签
  private _labelCount: number
  /**
   * 获取新的标签ID
   */
  private _newLabel() {
    return '_label_' + this._labelCount++
  }

  constructor(root: ASTNode) {
    this._funcs = new Map()
    this._blocks = []
    this._blockStkPtr = -1
    this._blocksStk = []
    this._globalVars = []
    this._quads = []
    this._varCount = 0
    this._labelCount = 0
    this.start(root)
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
    if (node.match('type_spec IDENTIFIER')) {
      const type = this.parse_type_spec(node.$(1))
      const name = node.$(2).literal
      this._globalVars.push(new IRVar(this._newVar(), name, type))
    }
    if (node.match('type_spec IDENTIFIER CONSTANT')) {
      const type = this.parse_type_spec(node.$(1))
      const name = node.$(2).literal
      let len = node.$(3).literal
      assert(!isNaN(Number(node.$(3).literal)), `数组长度必须为数字，但取到 ${len}。`)
      // TODO: 数组和变量分开管理，还是一起管理？
    }
  }

  parse_type_spec(node: ASTNode) {
    // 取类型字面
    return node.$(1).literal as MiniCType
  }

  parse_fun_decl(node: ASTNode) {
    const retType = this.parse_type_spec(node.$(1))
    const name = node.$(2).literal
    assert(!this._funcs.has(name), `重复定义的函数：${name}`)

    const func = new IRFunc(name, retType, []) // 参数列表在parse_params时会填上
    this._funcs.set(name, func)

    const funcBlock = IRBlock.newFunc(name, func)
    this._pushBlock(funcBlock)

    this.parse_params(node.$(3), name)
    this.parse_local_decls(node.$(4), name)
    this.parse_stmt_list(node.$(5))
  }

  parse_params(node: ASTNode, funcName: string) {
    if (node.$(1).name == 'VOID') {
      this._funcs.get(funcName)!.paramList = []
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
    assert(type != 'void', '不可以使用void作参数类型。')
    const name = node.$(2).name
    const param = new IRVar(this._newVar(), name, type)
    // 将形参送给函数
    this._funcs.get(funcName)!.paramList.push(param)
  }

  parse_stmt_list(node: ASTNode) {
    if (node.$(1).name == 'stmt_list') {
      this.parse_stmt_list(node.$(1))
      this.parse_stmt(node.$(2))
    }
    if (node.$(1).name == 'stmt') {
      this.parse_stmt(node.$(1))
    }
  }

  parse_stmt(node: ASTNode) {
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
      this.parse_return_stmt(node.$(1))
    }
    if (node.$(1).name == 'continue_stmt') {
      this.parse_continue_stmt(node.$(1))
    }
    if (node.$(1).name == 'break_stmt') {
      this.parse_break_stmt(node.$(1))
    }
  }

  parse_compound_stmt(node: ASTNode) {
    // 复合语句注意作用域问题
    // FIXME: 确定breakable
    this._pushBlock(IRBlock.newCompound(this._newLabel(), false))
    this.parse_stmt_list(node.$(1))
  }

  parse_if_stmt(node: ASTNode) {
    const expr = this.parse_expr(node.$(1))
    const trueLabel = this._newLabel()
    const falseLabel = this._newLabel()
    this._pushBlock(IRBlock.newCompound(trueLabel, false))
    this._newQuad('set_label', '', '', trueLabel)
    this._newQuad('j_if_not', expr, '', falseLabel)
    this.parse_stmt(node.$(2))
    this._backBlock()
    this._newQuad('set_label', '', '', falseLabel)
  }

  parse_while_stmt(node: ASTNode) {
    const loopLabel = this._newLabel()
    const breakLabel = this._newLabel()
    this._pushBlock(IRBlock.newCompound(loopLabel, true, breakLabel))
    this._newQuad('set_label', '', '', loopLabel)
    const expr = this.parse_expr(node.$(1))
    this._newQuad('j_if_not', expr, '', breakLabel)
    this.parse_stmt(node.$(2))
    this._newQuad('j', '', '', loopLabel)
    this._backBlock()
    this._newQuad('set_label', '', '', breakLabel)
  }

  parse_continue_stmt(node: ASTNode) {
    this._newQuad('j', '', '', this._currentBlock().label!)
  }
  
  parse_break_stmt(node: ASTNode) {
    for (let i = this._blockStkPtr; i >= 0; i--) {
      if (this._blocks[this._blocksStk[i]].breakable) {
        this._newQuad('j', '', '', this._blocks[this._blocksStk[i]].breakLabel!)
        return
      }
    }
    assert(false, `break未找到跳转目标`)
  }

  parse_expr_stmt(node: ASTNode) {
    // 变量赋值
    if (node.match('IDENTIFIER ASSIGN expr')) {
      const lhs = this._findVar(node.$(1).literal)
      const rhs = this.parse_expr(node.$(3))
      this._newQuad('=', rhs, '', lhs.id)
    }
    // 读数组
    if (node.match('IDENTIFIER expr ASSIGN expr')) {
      // TODO:
    }
    // 访地址
    if (node.match('DOLLAR expr ASSIGN expr')) {
      const addr = this.parse_expr(node.$(2))
      const rhs = this.parse_expr(node.$(4))
      this._newQuad('$=', rhs, '', addr)
    }
    // 调函数
    if (node.match('IDENTIFIER args')) {
      const args = this.parse_args(node.$(2))
      this._newQuad('call', node.$(1).literal, args.join('&'), '')
    }
  }

  parse_local_decls(node: ASTNode, funcName: string) {
    if (node.$(1).name == 'local_decls') {
      this.parse_local_decls(node.$(1), funcName)
      this.parse_local_decl(node.$(2), funcName)
    }
    if (node.$(1).name == 'local_decl') {
      this.parse_local_decl(node.$(1), funcName)
    }
  }

  parse_local_decl(node: ASTNode, funcName: string) {
    if (node.children.length == 2) {
      // 单个变量声明
      const type = this.parse_type_spec(node.$(1))
      const name = node.$(2).literal
      const var_ = new IRVar(this._newVar(), name, type)
      assert(!this._blockFor(funcName)!.vars.some(v => v.name == name), `函数 ${funcName} 中的变量 ${name} 多次声明。`)
      this._blockFor(funcName)!.vars.push(var_)
    }
    if (node.children.length == 3) {
      // TODO: 数组
    }
  }

  parse_return_stmt(node: ASTNode) {}

  /**
   * 处理expr，返回指代expr结果的IRVar的id
   */
  parse_expr(node: ASTNode) {
    // 处理所有二元表达式 expr op expr
    if (node.children.length == 3 && node.$(1).name == 'expr' && node.$(3).name == 'expr') {
      // OR_OP, AND_OP, EQ_OP, NE_OP, GT_OP, LT_OP, GE_OP, LE_OP, PLUS, MINUS, MULTIPLY, SLASH, PERCENT, BITAND_OP, BITOR_OP, LEFT_OP, RIGHT_OP, BITOR_OP
      const oprand1 = this.parse_expr(node.$(1))
      const oprand2 = this.parse_expr(node.$(3))
      const res = this._newVar()
      this._newQuad(node.$(2).name, oprand1, oprand2, res)
      return res
    }
    // 处理所有一元表达式 op expr
    if (node.children.length == 2) {
      // NOT_OP, MINUS, PLUS, DOLLAR, BITINV_OP
      const oprand = this.parse_expr(node.$(2))
      const res = this._newVar()
      this._newQuad(node.$(1).name, oprand, '', res)
      return res
    }
    // 处理其余情况
    if (node.match('LPAREN expr RPAREN')) {
      const oprand = this.parse_expr(node.$(2))
      const res = this._newVar()
      this._newQuad('=', oprand, '', res)
      return res
    }
    if (node.match('IDENTIFIER')) {
      return this._findVar(node.$(1).literal).id
    }
    if (node.match('IDENTIFIER expr')) {
      // TODO: 数组
      return '?'
    }
    if (node.match('IDENTIFIER args')) {
      const funcName = node.$(1).literal
      const args = this.parse_args(node.$(2))
      let res = this._newVar()
      this._newQuad('call', funcName, args.join('&'), res)
      return res
    }
    if (node.match('CONSTANT')) {
      const res = this._newVar()
      this._newQuad('=const', node.$(1).literal, '', res)
      return res
    }
    assert(false, 'parse_expr兜底失败。')
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
    // TODO
    let res = ''
    // 函数定义
    res += '[FUNCTIONS]\n'
    for (let func of this._funcs.values()) {
      res += '\tname: ' + func.name + '\n'
      res += '\tretType: ' + func.retType + '\n'
      res += '\tparamList: ' + func.paramList.map(v => `${v.id}(${v.type})`).join(' | ') + '\n'
      res += '\n'
    }
    res += '\n'
    // 全局变量
    res += '[GLOBALVARS]\n'
    for (let v of this._globalVars) {
      res += '\t' + `${v.id}(${v.type})` + '\n'
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
}
