/**
 * 中间代码相关类型定义
 * 2020-11 @ https://github.com/seu-cs-class2/minisys-minicc-ts
 */

/**
 * 四元式 (op, arg1, arg2, res)
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

/**
 * MiniC语言数据类型
 */
export type MiniCType = 'int' | 'void' | 'none'

/**
 * IR阶段变量信息存储
 */
export class IRVar {
  public id: string // 变量唯一id
  public name: string // 变量名
  public type: MiniCType // 变量类型
  public scope: number[] // 作用域

  constructor(id: string, name: string, type: MiniCType, scope: number[]) {
    this.name = name
    this.type = type
    this.id = id
    this.scope = [...scope]
  }
}

/**
 * IR阶段数组信息存储
 */
export class IRArray {
  public id: string
  public type: MiniCType
  public name: string
  public len: number
  public scope: number[]

  constructor(id: string, type: MiniCType, name: string, len: number, scope: number[]) {
    this.id = id
    this.type = type
    this.name = name
    this.len = len
    this.scope = [...scope]
  }
}

/**
 * IR阶段函数信息存储
 */
export class IRFunc {
  public name: string // 函数名
  public retType: MiniCType // 函数返回值类型
  // 形参仍然分配变量位，当需要调用时，将实参变量赋给形参变量即可
  public paramList: IRVar[] // 形参列表

  constructor(name: string, retType: MiniCType, paramList: IRVar[]) {
    this.name = name
    this.retType = retType
    this.paramList = paramList
  }
}
