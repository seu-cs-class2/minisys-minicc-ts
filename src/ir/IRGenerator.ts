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

/**
 * !!! 注意
 * 这里取的是结点的children，取决于newNode时留了哪些参数，并不一定和产生式中相同
 */
function $(i: number): ASTNode {
  assert(eval(`node.children.length <= ${i}`), '$(i)超出children范围。')
  return eval(`node.children[${i - 1}]`)
}

// 收集所有变量、函数

export class IRGenerator {
  // 函数名→函数结点 映射
  private _funcs: Map<string, IRFunc>
  // 块
  private _blocks: IRBlock[]
  private _blockPtr: number // 当前块指针，用于实现作用域
  /**
   * 获取当前所在的块
   */
  private _currentBlock() {
    return this._blocks[this._blockPtr]
  }
  /**
   * 在当前位置添加一个块，并进入该块的上下文
   */
  private _pushBlock(block: IRBlock) {
    this._blocks.push(block)
    this._blockPtr += 1
  }
  /**
   * 前进一个块
   */
  private _nextBlock() {
    this._blockPtr += 1
  }
  /**
   * 回退一个块
   */
  private _backBlock() {
    this._blockPtr -= 1
  }
  /**
   * 获取函数对应的块
   */
  private _blockFor(funcName: string) {
    return this._blocks.find(v => v.funcName == funcName)
  }
  // 全局变量
  private _globalVars: IRVar[]
  // 四元式
  private _quads: Quad[]
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
    for (let i = this._blockPtr; i >= 0; i--) {
      const res = this._blocks[i].vars.find(v => v.name == name)
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
    this._blockPtr = -1
    this._globalVars = []
    this._quads = []
    this._varCount = 0
    this._labelCount = 0
    this.start(root)
  }

  start(node: ASTNode) {
    if (!node) return
    this.parse_program(node)
  }

  parse_program(node: ASTNode) {
    this.parse_decl_list(node)
  }

  parse_decl_list(node: ASTNode) {
    if ($(1).name == 'decl_list') {
      this.parse_decl_list($(1))
      this.parse_decl($(2))
    }
    if ($(1).name == 'decl') {
      this.parse_decl($(1))
    }
  }

  parse_decl(node: ASTNode) {
    if ($(1).name == 'var_decl') {
      this.parse_var_decl($(1))
    }
    if ($(1).name == 'fun_decl') {
      this.parse_fun_decl($(1))
    }
  }

  parse_var_decl(node: ASTNode) {
    if (node.match('type_spec IDENTIFIER')) {
      const type = this.parse_type_spec($(1))
      const name = $(2).literal
      this._globalVars.push(new IRVar(this._newVar(), name, type))
    }
    if (node.match('type_spec IDENTIFIER CONSTANT')) {
      const type = this.parse_type_spec($(1))
      const name = $(2).literal
      let len = $(3).literal
      assert(!isNaN(Number($(3).literal)), `数组长度必须为数字，但取到 ${len}。`)
      // TODO: 数组和变量到底分开管理，还是一起管理？
    }
  }

  parse_type_spec(node: ASTNode) {
    // 取类型字面
    return $(1).literal as MiniCType
  }

  parse_fun_decl(node: ASTNode) {
    const retType = this.parse_type_spec($(1))
    const name = $(2).literal
    assert(!this._funcs.has(name), `重复定义的函数：${name}`)

    const func = new IRFunc(name, retType, []) // 参数列表在parse_params时会填上
    this._funcs.set(name, func)

    const funcBlock = IRBlock.newFunc(name, func)
    this._pushBlock(funcBlock)

    this.parse_params($(3), name)
    this.parse_local_decls($(4), name)
    this.parse_stmt_list($(5))
  }

  parse_params(node: ASTNode, funcName: string) {
    if ($(1).name == 'VOID') {
      this._funcs.get(funcName)!.paramList = []
    }
    if ($(1).name == 'param_list') {
      this.parse_param_list($(1), funcName)
    }
  }

  parse_param_list(node: ASTNode, funcName: string) {
    if ($(1).name == 'param_list') {
      // 左递归文法加上这里的递归顺序使得参数列表保序
      this.parse_param_list($(1), funcName)
      this.parse_param($(2), funcName)
    }
    if ($(1).name == 'param') {
      this.parse_param($(1), funcName)
    }
  }

  parse_param(node: ASTNode, funcName: string) {
    const type = this.parse_type_spec($(1))
    assert(type != 'void', '不可以使用void作参数类型。')
    const name = $(2).name
    const param = new IRVar(this._newVar(), name, type)
    // 将形参送给函数
    this._funcs.get(funcName)!.paramList.push(param)
  }

  parse_stmt_list(node: ASTNode) {
    if ($(1).name == 'stmt_list') {
      this.parse_stmt_list($(1))
      this.parse_stmt($(2))
    }
    if ($(1).name == 'stmt') {
      this.parse_stmt($(1))
    }
  }

  parse_stmt(node: ASTNode) {
    if ($(1).name == 'expr_stmt') {
      this.parse_expr_stmt($(1))
    }
    if ($(1).name == 'compound_stmt') {
      this.parse_compound_stmt($(1))
    }
    if ($(1).name == 'if_stmt') {
      this.parse_if_stmt($(1))
    }
    if ($(1).name == 'while_stmt') {
      this.parse_while_stmt($(1))
    }
    if ($(1).name == 'return_stmt') {
      this.parse_return_stmt($(1))
    }
    if ($(1).name == 'continue_stmt') {
      this.parse_continue_stmt($(1))
    }
    if ($(1).name == 'break_stmt') {
      this.parse_break_stmt($(1))
    }
  }

  parse_compound_stmt(node: ASTNode) {
    // 复合语句注意作用域问题
    // FIXME: 确定breakable
    this._pushBlock(IRBlock.newCompound(this._newLabel(), false))
    this.parse_stmt_list($(1))
  }

  parse_if_stmt(node: ASTNode) {
    const expr = this.parse_expr($(1))

    const stmt = this.parse_stmt($(2))
  }

  parse_while_stmt(node: ASTNode) {}

  parse_continue_stmt(node: ASTNode) {
    this._newQuad('j', this._currentBlock().label!, '', '')
  }

  parse_break_stmt(node: ASTNode) {}

  parse_expr_stmt(node: ASTNode) {
    // 变量赋值
    if (node.match('IDENTIFIER ASSIGN expr')) {
      const lhs = this._findVar($(1).name)
      const rhs = this.parse_expr($(2))
      this._newQuad('=', rhs, '', lhs.name)
    }
    // 读数组
    if (node.match('IDENTIFIER expr ASSIGN expr')) {
      // TODO:
    }
    // 访地址
    if (node.match('DOLLAR expr ASSIGN expr')) {
      const addr = this.parse_expr($(2))
      const rhs = this.parse_expr($(4))
      this._newQuad('$=', rhs, '', addr)
    }
    // 调函数
    if (node.match('IDENTIFIER args')) {
      const args = this.parse_args($(2))
      this._newQuad('call', $(1).literal, args.join('&'), '')
    }
  }

  parse_local_decls(node: ASTNode, funcName: string) {
    if ($(1).name == 'local_decls') {
      this.parse_local_decls($(1), funcName)
      this.parse_local_decl($(2), funcName)
    }
    if ($(1).name == 'local_decl') {
      this.parse_local_decl($(1), funcName)
    }
  }

  parse_local_decl(node: ASTNode, funcName: string) {
    if (node.children.length == 2) {
      // 单个变量声明
      const type = this.parse_type_spec($(1))
      const name = $(2).name
      const var_ = new IRVar(this._newVar(), name, type)
      assert(!this._blockFor(funcName)!.vars.some(v => v.name == name), `函数 ${funcName} 中的变量 ${name} 重复声明。`)
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
    if (node.children.length == 3 && node.children[0].name == 'expr' && node.children[2].name == 'expr') {
      // OR_OP, AND_OP, EQ_OP, NE_OP, GT_OP, LT_OP, GE_OP, LE_OP, PLUS, MINUS, MULTIPLY, SLASH, PERCENT, BITAND_OP, BITOR_OP, LEFT_OP, RIGHT_OP, BITOR_OP
      const oprand1 = this.parse_expr($(1))
      const oprand2 = this.parse_expr($(3))
      const res = this._newVar()
      this._newQuad($(2).name, oprand1, oprand2, res)
      return res
    }
    // 处理所有一元表达式 op expr
    if (node.children.length == 2) {
      // NOT_OP, MINUS, PLUS, DOLLAR, BITINV_OP
      const oprand = this.parse_expr($(2))
      const res = this._newVar()
      this._newQuad($(1).name, oprand, '', res)
      return res
    }
    // 处理其余情况
    if (node.match('LPAREN expr RPAREN')) {
      const oprand = this.parse_expr($(2))
      const res = this._newVar()
      this._newQuad('=', oprand, '', res)
      return res
    }
    if (node.match('IDENTIFIER')) {
      return this._findVar($(1).literal).id
    }
    if (node.match('IDENTIFIER LBRACKET expr RBRACKET')) {
      // TODO: 数组
      return '?'
    }
    if (node.match('IDENTIFIER LPAREN args RPAREN')) {
      // TODO: 函数调用
      return '?'
    }
    if (node.match('CONSTANT')) {
      const res = this._newVar()
      this._newQuad('=', $(1).literal, '', res)
      return res
    }
    assert(false, 'parse_expr兜底失败。')
    return '-1'
  }

  /**
   * 按参数顺序返回IRVar.id[]
   */
  parse_args(node: ASTNode): string[] {
    if ($(1).name == 'args') {
      return [...this.parse_args($(1)), this.parse_expr($(2))]
    }
    if ($(1).name == 'expr') {
      return [this.parse_expr($(1))]
    }
    return []
  }
}
