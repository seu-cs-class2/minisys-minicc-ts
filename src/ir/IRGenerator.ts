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

import { assert } from '../seu-lex-yacc/utils'
import { ASTNode, Block, FuncNode, VarNode } from './AST'

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
  private _blockStack: Block[]

  private _tempCount: number
  _newTemp() {
    return `_TMP${this._tempCount++}`
  }

  _blockFor(funcName: string) {
    return this._blockStack.find(v => v.funcName == funcName)
  }

  constructor(root: ASTNode) {
    this._funcPool = new Map()
    this._blockStack = []
    this._tempCount = 0
    this.act(root)
  }

  act(node: ASTNode) {
    if (!node) return

    if (node.name == 'fun_decl') {
      this.parse_fun_decl(node)
    }
  }

  parse_program(node: ASTNode) {}

  parse_decl_list(node: ASTNode) {}

  parse_decl(node: ASTNode) {}

  parse_var_decl(node: ASTNode) {}

  /**
   * 解析type_spec（类型声明）
   * type_spec -> VOID
   *            | INT
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
    // TODO:
    let funcNode = new FuncNode(funcName, retType, []) // 参数列表在parse_params时会填上
    this._funcPool.set(funcName, funcNode)
    let funcBlock = new Block(funcName, true, funcNode, new Map(), '', false)
    this._blockStack.push(funcBlock)
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
    const paramNode = new VarNode(paramName, paramType)
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
    const block = new Block('', false, void 0, new Map(), '', true)
    this._blockStack.push(block)

    const exprNode = this.parse_expr($(1))
  }

  parse_continue_stmt(node: ASTNode) {}

  parse_break_stmt(node: ASTNode) {}

  parse_expr_stmt(node: ASTNode) {}

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
      const varNode = new VarNode(varName, varType)
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
    if (node.children.length == 3) {
      const oprand1 = this.parse_expr($(1))
      const oprand2 = this.parse_expr($(3))
      switch ($(2).name) {
        case 'OR_OP':
          
          break
        case 'AND_OP':
          break
        case 'EQ_OP':
          break
        case 'NE_OP':
          break
        case 'GT_OP':
          break
        case 'LT_OP':
          break
        case 'GE_OP':
          break
        case 'LE_OP':
          break
        case 'PLUS':
          break
        case 'MINUS':
          break
        case 'MULTIPLY':
          break
        case 'SLASH':
          break
        case 'PERCENT':
          break
      }
    }
  }

  parse_args(node: ASTNode) {}
}
