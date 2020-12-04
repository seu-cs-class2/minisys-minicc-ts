/**
 * 四元式
 */
export class Quad {
  private _op: string
  private _arg1: string
  private _arg2: string
  private _res: string

  get op() {
    return this._op
  }
  set op(v: string) {
    this._op = v
  }
  get arg1() {
    return this._arg1
  }
  set arg1(v: string) {
    this._arg1 = v
  }
  get arg2() {
    return this._arg2
  }
  set arg2(v: string) {
    this._arg2 = v
  }
  get res() {
    return this._res
  }
  set res(v: string) {
    this._res = v
  }

  constructor(op: string, arg1: string, arg2: string, res: string) {
    this._op = op
    this._arg1 = arg1
    this._arg2 = arg2
    this._res = res
  }

  toString() {
    return `(${this._op}, ${this._arg1}, ${this._arg2}, ${this._res})`
  }
}
