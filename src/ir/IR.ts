/**
 * 符号表
 */
export class SymbolTable {
  private _name: string
  private _domain: 'function' | 'global'
  
}

/**
 * 四元式
 * <op, arg1, arg2, result>
 */
export class Quad {
  private _op: string
  private _arg1: string
  private _arg2: string
  private _result: string

  get op() {
    return this._op
  }
  get arg1() {
    return this._arg1
  }
  get arg2() {
    return this._arg2
  }
  get result() {
    return this._result
  }
  set op(val: string) {
    this._op = val
  }
  set arg1(val: string) {
    this._arg1 = val
  }
  set arg2(val: string) {
    this._arg2 = val
  }
  set result(val: string) {
    this._result = val
  }

  constructor(op: string, arg1: string, arg2: string, result: string) {
    this._op = op
    this._arg1 = arg1
    this._arg2 = arg2
    this._result = result
  }
}
