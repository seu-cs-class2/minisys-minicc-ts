import { DataType } from "./IR"

/**
 * 抽象语法树结点
 */
export class ASTNode {
  private _line: number
  private _name: string
  private _content: string
  private _left: ASTNode | null
  private _right: ASTNode | null

  get line() {
    return this._line
  }
  set line(val: number) {
    this._line = val
  }
  get name() {
    return this._name
  }
  set name(val: string) {
    this._name = val
  }
  get content() {
    return this._content
  }
  set content(val: string) {
    this._content = val
  }
  get left() {
    return this._left
  }
  set left(val: ASTNode | null) {
    this._left = val
  }
  get right() {
    return this._right
  }
  set right(val: ASTNode | null) {
    this._right = val
  }

  constructor() {
    this._line = -1
    this._name = ''
    this._content = ''
    this._left = null
    this._right = null
  }
}

export class VariableNode {}

export class FunctionNode {
  private _name: string
  private _returnType: DataType
}

export class BlockNode {}

export class ArrayNode {}


const handlers = {

  local_decl: function() {

  },
  

}