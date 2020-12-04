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
import { ASTNode, Block, FuncNode, VarNode } from './AST'
import { Quad } from './IR'

/**
 * !!! 注意
 * 这里取的是结点的children，取决于newNode时留了哪些参数，并不一定和产生式中相同
 */
function $(i: number): ASTNode {
  assert(eval(`node.children.length <= ${i}`), '$(i)超出children范围。')
  return eval(`node.children[${i - 1}]`)
}

export class IRGenerator {
  private _funcPool: Map<string, FuncNode> // 函数名→函数结点 映射
  private _blockPool: Block[]
  private _blockSp: number
  private _quads: Quad[]

  findVar(name: string): VarNode {
    for (let i = this._blockSp; i >= 0; i--) {
      if (this._blockPool[i].vars.has(name)) return this._blockPool[i].vars.get(name)!
    }
    assert(false, `未找到该变量：${name}`)
    return new VarNode('', '', '-1')
  }

  _currentBlock() {
    return this._blockPool[this._blockSp]
  }

  private _tempCount: number
  _newTemp() {
    return `_TMP${this._tempCount++}`
  }

  private _varCount: number
  _newVar() {
    return `_VAR${this._varCount++}`
  }

  newQuad(op: string, arg1: string, arg2: string, res: string) {
    let quad = new Quad(op, arg1, arg2, res)
    this._quads.push(quad)
    return quad
  }

  _blockFor(funcName: string) {
    return this._blockPool.find(v => v.funcName == funcName)
  }

  _pushBlock(block: Block) {
    this._blockPool.push(block)
    this._blockSp += 1
  }

  _popBlock() {
    this._blockSp -= 1
  }

  constructor(root: ASTNode) {
    this._funcPool = new Map()
    this._blockSp = 0
    this._blockPool = []
    this._tempCount = 0
    this._varCount = 0
    this._quads = []
    this.act(root)
  }

  act(node: ASTNode) {
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

  }

  /**
   * 解析type_spec（类型声明）
   */
  parse_type_spec(node: ASTNode) {
    // 取类型字面
    return $(1).literal
  }

  /**
   * 解析func_decl（函数声明）
   */
  parse_fun_decl(node: ASTNode) {
    // 取返回值类型
    const retType = this.parse_type_spec($(1))
    // 取函数名
    const funcName = $(2).literal
    assert(!this._funcPool.has(funcName), `重复定义的函数：${funcName}`)
    // 建函数的块级作用域
    let funcNode = new FuncNode(funcName, retType, []) // 参数列表在parse_params时会填上
    this._funcPool.set(funcName, funcNode)
    let funcBlock = Block.newFunc(funcName, funcNode)
    this._blockPool.push(funcBlock)
    // 处理形参列表
    this.parse_params($(3), funcName)
    // 处理局部变量
    this.parse_local_decls($(4), funcName)
    // 处理函数体逻辑
    const stmt_list = $(5)
  }

  /**
   * 解析params（参数s）
   */
  parse_params(node: ASTNode, funcName: string) {
    // 参数列表置空表示没有参数
    if ($(1).name == 'VOID') {
      this._funcPool.get(funcName)!.paramList = []
    }
    if ($(1).name == 'param_list') {
      this.parse_param_list($(1), funcName)
    }
  }

  /**
   * 解析param_list（参数列表）
   */
  parse_param_list(node: ASTNode, funcName: string) {
    if ($(1).name == 'param_list') {
      this.parse_param_list($(1), funcName)
      this.parse_param($(2), funcName)
    }
    if ($(1).name == 'param') {
      this.parse_param($(1), funcName)
    }
  }

  /**
   * 解析param（单个参数）
   */
  parse_param(node: ASTNode, funcName: string) {
    // 取出并检查变量类型
    const paramType = this.parse_type_spec($(1))
    assert(paramType != 'void', '不可以使用void作参数类型。')
    // 取变量名
    const paramName = $(2).name
    // 组装变量结点
    const paramNode = new VarNode(paramName, paramType, this._newVar())
    // 将形参送给函数
    this._funcPool.get(funcName)?.paramList.push(paramNode)
  }

  /**
   * 解析stmt_list（语句列表）
   */
  parse_stmt_list(node: ASTNode) {
    if ($(1).name == 'stmt_list') {
      this.parse_stmt_list($(1))
      this.parse_stmt($(2))
    }
    if ($(1).name == 'stmt') {
      this.parse_stmt($(1))
    }
  }

  /**
   * 解析stmt（语句）
   */
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

  parse_compound_stmt(node: ASTNode) {}

  parse_if_stmt(node: ASTNode) {}

  parse_while_stmt(node: ASTNode) {
    const block = Block.newCompound('', false)

    const exprNode = this.parse_expr($(1))
  }

  parse_continue_stmt(node: ASTNode) {}

  parse_break_stmt(node: ASTNode) {

  }

  parse_expr_stmt(node: ASTNode) {
    // 变量赋值
    if (node.fit('IDENTIFIER ASSIGN expr')) {
      const lhs = this.findVar($(1).name)
      const rhs = this.parse_expr($(2))
      this.newQuad('ASSIGN', rhs, '', lhs.name)
    }
    if (node.fit('IDENTIFIER expr ASSIGN expr')) {
      // TODO:
    }
    // 访地址
    if (node.fit('DOLLAR expr ASSIGN expr')) {
      // TODO:
    }
    // 调函数
    if (node.fit('IDENTIFIER args')) {
      // TODO:
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
      const varType = this.parse_type_spec($(1))
      const varName = $(2).name
      const varNode = new VarNode(varName, varType, this._newVar())
      assert(!this._blockFor(funcName)!.vars.has(varName), `函数 ${funcName} 中的变量 ${varName} 重复声明。`)
      this._blockFor(funcName)!.vars.set(varName, varNode)
    }
    if (node.children.length == 3) {
      // 数组声明
      // TODO:
    }
  }

  parse_return_stmt(node: ASTNode) {}

  parse_expr(node: ASTNode) {
    // 处理所有二元表达式
    if (node.children.length == 3 && node.children[0].name == 'expr' && node.children[2].name == 'expr') {
      // OR_OP, AND_OP, EQ_OP, NE_OP, GT_OP, LT_OP, GE_OP, LE_OP, PLUS, MINUS, MULTIPLY, SLASH, PERCENT, BITAND_OP, BITOR_OP, LEFT_OP, RIGHT_OP, BITOR_OP
      const oprand1 = this.parse_expr($(1))
      const oprand2 = this.parse_expr($(3))
      const res = this._newTemp()
      this.newQuad($(2).name, oprand1, oprand2, res)
      return res
    }
    // 处理所有一元表达式
    if (node.children.length == 2) {
      // NOT_OP, MINUS, PLUS, DOLLAR, BITINV_OP
      const oprand = this.parse_expr($(2))
      const res = this._newTemp()
      this.newQuad($(1).name, oprand, '', res)
      return res
    }
    // 其余情况
    if (node.fit('LPAREN expr RPAREN')) {
      const oprand = this.parse_expr($(2))
      const res = this._newTemp()
      this.newQuad('=', oprand, '', res)
      return res
    }
    if (node.fit('IDENTIFIER')) {
      // TODO: 变量
      return $(1).literal
    }
    if (node.fit('IDENTIFIER LBRACKET expr RBRACKET')) {
      // TODO: 数组
      return '?'
    }
    if (node.fit('IDENTIFIER LPAREN args RPAREN')) {
      // TODO: 函数调用
      return '?'
    }
    if (node.fit('CONSTANT')) {
      // TODO: 字面常量
      return $(1).literal
    }
    return '?'
  }

  parse_args(node: ASTNode) {
    // TODO: 
  }
}
