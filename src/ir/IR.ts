/**
 * 中间代码相关类型定义
 * 2020-11 @ https://github.com/seu-cs-class2/minisys-minicc-ts
 */

/**
 * 四元式 (op, arg1, arg2, res)
 */
export class Quad {
  public op: string
  public arg1: string
  public arg2: string
  public res: string

  constructor(op: string, arg1: string, arg2: string, res: string) {
    this.op = op
    this.arg1 = arg1
    this.arg2 = arg2
    this.res = res
  }

  toString() {
    return `(${this.op.padEnd(12)}, ${this.arg1.padEnd(12)}, ${this.arg2.padEnd(12)}, ${this.res.padEnd(20)})`
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
  public scope: number[] // 作用域路径

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
  public id: string // 数组变量唯一id
  public type: MiniCType // 数组类型
  public name: string // 数组名
  public len: number // 长度
  public scope: number[] // 作用域路径

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
