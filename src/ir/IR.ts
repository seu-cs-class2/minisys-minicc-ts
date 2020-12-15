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
  private _id: string // 变量唯一id
  private _name: string // 变量名
  private _type: MiniCType // 变量类型

  get id() {
    return this._id
  }
  set id(v: string) {
    this._id = v
  }
  get name() {
    return this._name
  }
  set name(v: string) {
    this._name = v
  }
  get type() {
    return this._type
  }
  set type(v: MiniCType) {
    this._type = v
  }

  constructor(id: string, name: string, type: MiniCType) {
    this._name = name
    this._type = type
    this._id = id
  }
}

/**
 * IR阶段数组信息存储
 */
export class IRArray {
  private _id: string
  private _type: MiniCType
  private _name: string
  private _len: number

  get id() {
    return this._id
  }
  set id(v: string) {
    this._id = v
  }
  get type() {
    return this._type
  }
  set type(v: MiniCType) {
    this._type = v
  }
  get name() {
    return this._name
  }
  set name(v: string) {
    this._name = v
  }
  get len() {
    return this._len
  }
  set len(v: number) {
    this._len = v
  }

  constructor(id: string, type: MiniCType, name: string, len: number) {
    this._id = id
    this._type = type
    this._name = name
    this._len = len
  }
}

/**
 * IR阶段函数信息存储
 */
export class IRFunc {
  private _name: string // 函数名
  private _retType: MiniCType // 函数返回值类型
  // 形参仍然分配变量位，当需要调用时，将实参变量赋给形参变量即可
  private _paramList: IRVar[] // 形参列表

  get name() {
    return this._name
  }
  set name(v: string) {
    this._name = v
  }
  get retType() {
    return this._retType
  }
  set retType(v: MiniCType) {
    this._retType = v
  }
  get paramList() {
    return this._paramList
  }
  set paramList(v: IRVar[]) {
    this._paramList = v
  }

  constructor(name: string, retType: MiniCType, paramList: IRVar[]) {
    this._name = name
    this._retType = retType
    this._paramList = paramList
  }
}

/**
 * IR阶段块类型：函数体块、复合语句块
 */
type IRBlockType = 'func' | 'compound'

/**
 * IR阶段块级作用域
 */
export class IRBlock {
  private _type: IRBlockType
  // 局部变量
  private _vars: IRVar[]
  // 函数信息
  private _funcName?: string
  private _func?: IRFunc
  // 复合语句信息
  private _label?: string
  private _breakLabel?: string
  private _breakable?: boolean

  get type() {
    return this._type
  }
  set type(v: IRBlockType) {
    this._type = v
  }
  get vars() {
    return this._vars
  }
  get func() {
    return this._func
  }
  set func(v: IRFunc | undefined) {
    this._func = v
  }
  get funcName() {
    return this._funcName
  }
  set funcName(v: string | undefined) {
    this._funcName = v
  }
  get label() {
    return this._label
  }
  set label(v: string | undefined) {
    this._label = v
  }
  get breakLabel() {
    return this._breakLabel
  }
  set breakLabel(v: string | undefined) {
    this._breakLabel = v
  }
  get breakable() {
    return this._breakable
  }
  set breakable(v: boolean | undefined) {
    this._breakable = v
  }

  /**
   * 新建函数型块
   */
  static newFunc(funcName: string, func: IRFunc) {
    return new IRBlock('func', [], funcName, func, void 0, void 0, void 0)
  }

  /**
   * 新建复合语句型块
   */
  static newCompound(label: string, breakable: boolean, breakLabel?: string) {
    return new IRBlock('compound', [], void 0, void 0, label, breakable, breakLabel)
  }

  protected constructor(
    type: IRBlockType,
    vars: IRVar[],
    funcName: string | undefined,
    func: IRFunc | undefined,
    label: string | undefined,
    breakable: boolean | undefined,
    breakLabel: string | undefined
  ) {
    this._type = type
    this._vars = vars
    this._func = func
    this._funcName = funcName
    this._label = label
    this._breakable = breakable
    this._breakLabel = breakLabel
  }
}
