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

  set op(val: string) {
    this._op = val
  }

  get arg1() {
    return this._arg1
  }

  set arg1(val: string) {
    this._arg1 = val
  }

  get arg2() {
    return this._arg2
  }

  set arg2(val: string) {
    this._arg2 = val
  }

  get res() {
    return this._res
  }

  set res(val: string) {
    this._res = val
  }

  constructor(op: string, arg1: string, arg2: string, res: string) {
    this._op = op
    this._arg1 = arg1
    this._arg2 = arg2
    this._res = res
  }

  toString(padEnd = 12) {
    return `(${this._op.padEnd(padEnd)}, ${this._arg1.padEnd(padEnd)}, ${this._arg2.padEnd(padEnd)}, ${this._res.padEnd(
      padEnd != 0 ? padEnd + 8 : 0
    )})`
  }
}

/**
 * MiniC语言数据类型
 */
export type MiniCType = 'int' | 'void' | 'string' | 'none'

/**
 * IR阶段变量信息存储
 */
export class IRVar {
  private _id: string // 变量唯一id
  private _name: string // 变量名
  private _type: MiniCType // 变量类型
  private _scope: number[] // 作用域路径
  private _inited: boolean

  get id() {
    return this._id
  }

  set id(val: string) {
    this._id = val
  }

  get name() {
    return this._name
  }

  set name(val: string) {
    this._name = val
  }

  get type() {
    return this._type
  }

  set type(val: MiniCType) {
    this._type = val
  }

  get scope() {
    return this._scope
  }

  set scope(val: number[]) {
    this._scope = val
  }

  get inited() {
    return this._inited
  }

  set inited(val: boolean) {
    this._inited = val
  }

  constructor(id: string, name: string, type: MiniCType, scope: number[], inited: boolean) {
    this._name = name
    this._type = type
    this._id = id
    this._scope = [...scope]
    this._inited = inited
  }
}

/**
 * IR阶段数组信息存储
 */
export class IRArray {
  private _id: string // 数组变量唯一id
  private _type: MiniCType // 数组类型
  private _name: string // 数组名
  private _len: number // 长度
  private _scope: number[] // 作用域路径

  get id() {
    return this._id
  }

  set id(val: string) {
    this._id = val
  }

  get type() {
    return this._type
  }

  set type(val: MiniCType) {
    this._type = val
  }

  get name() {
    return this._name
  }

  set name(val: string) {
    this._name = val
  }

  get len() {
    return this._len
  }

  set len(val: number) {
    this._len = val
  }

  get scope() {
    return this._scope
  }

  set scope(val: number[]) {
    this._scope = val
  }

  constructor(id: string, type: MiniCType, name: string, len: number, scope: number[]) {
    this._id = id
    this._type = type
    this._name = name
    this._len = len
    this._scope = [...scope]
  }
}

/**
 * IR阶段函数信息存储
 */
export class IRFunc {
  private _name: string // 函数名
  private _retType: MiniCType // 函数返回值类型
  private _entryLabel: string
  private _exitLabel: string
  // 形参仍然分配变量位，当需要调用时，将实参变量赋给形参变量即可
  private _paramList: IRVar[] // 形参列表
  // 所有所属的局部变量
  private _localVars: (IRVar | IRArray)[]
  // 内部调用过的其他函数
  private _childFuncs: string[]
  // 基层作用域路径
  private _scopePath: number[]

  get name() {
    return this._name
  }

  set name(val: string) {
    this._name = val
  }

  get retType() {
    return this._retType
  }

  set retType(val: MiniCType) {
    this._retType = val
  }

  get entryLabel() {
    return this._entryLabel
  }

  set entryLabel(val: string) {
    this._entryLabel = val
  }

  get exitLabel() {
    return this._exitLabel
  }

  set exitLabel(val: string) {
    this._exitLabel = val
  }

  get paramList() {
    return this._paramList
  }

  set paramList(val: IRVar[]) {
    this._paramList = val
  }

  get localVars() {
    return this._localVars
  }

  set localVars(val: (IRVar | IRArray)[]) {
    this._localVars = val
  }

  get childFuncs() {
    return this._childFuncs
  }

  set childFuncs(val: string[]) {
    this._childFuncs = val
  }

  get scopePath() {
    return this._scopePath
  }

  set scopePath(val: number[]) {
    this._scopePath = val
  }

  constructor(
    name: string,
    retType: MiniCType,
    paramList: IRVar[],
    entryLabel: string,
    exitLabel: string,
    scopePath: number[]
  ) {
    this._name = name
    this._retType = retType
    this._paramList = paramList
    this._entryLabel = entryLabel
    this._exitLabel = exitLabel
    this._localVars = []
    this._childFuncs = []
    this._scopePath = [...scopePath]
  }
}

/**
 * 基本块
 */
export interface BasicBlock {
  id: number
  content: Quad[]
}
