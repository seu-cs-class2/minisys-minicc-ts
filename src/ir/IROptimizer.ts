/**
 * 中间代码优化
 * 2020-12 @ https://github.com/seu-cs-class2/minisys-minicc-ts
 */

import { IRArray, IRVar, Quad } from './IR'
import { IRGenerator, LabelPrefix, VarPrefix } from './IRGenerator'

/**
 * 中间代码优化器
 */
export class IROptimizer {
  private _ir: IRGenerator
  private _quads: Quad[]
  private _varPool: (IRVar | IRArray)[]
  private _logs: string[]

  get ir() {
    return this._ir
  }

  set ir(val: IRGenerator) {
    this._ir = val
  }

  get quads() {
    return this._quads
  }

  set quads(val: Quad[]) {
    this._quads = val
  }

  get varPool() {
    return this._varPool
  }

  set varPool(val: (IRVar | IRArray)[]) {
    this._varPool = val
  }

  constructor(ir: IRGenerator) {
    this._ir = ir
    this._quads = [...ir.quads]
    this._logs = []
    this._varPool = [...ir.varPool]

    // 不动点法优化中间代码
    let unfix = false
    do {
      unfix = false
      unfix = unfix || this.deadVarEliminate()
      unfix = unfix || this.deadCodeEliminate()
    } while (unfix)
  }

  /**
   * 死变量消除
   */
  deadVarEliminate() {
    let usedVars: string[] = []
    for (let quad of this._quads) {
      if (quad.op == 'call') {
        quad.arg2.trim() && usedVars.push(...quad.arg2.split('&'))
      } else {
        quad.arg2.startsWith(VarPrefix) && usedVars.push(quad.arg2)
      }
      quad.arg1.startsWith(VarPrefix) && usedVars.push(quad.arg1)
      quad.res.startsWith(VarPrefix) && usedVars.push(quad.res)
    }
    usedVars = [...new Set(usedVars)]
    const unusedVars = this._ir.varPool.filter(v => !usedVars.includes(v.id))
    this._logs.push(`消除了死变量：${unusedVars}`)
    this._varPool = this._ir.varPool.filter(v => usedVars.includes(v.id))
    return !!unusedVars.length
  }

  /**
   * 死代码消除
   *  - 消除从未成为跳转目标的函数
   *  - TODO 消除不可能的if、while
   */
  deadCodeEliminate() {
    // 所有跳转目标
    const jTargets = this._quads.filter(v => ['j', 'j_false'].includes(v.op)).map(x => x.res)
    // 所有调用目标
    const callTargets = this._quads.filter(v => v.op == 'call').map(x => x.arg1)
    // 所有声明过的标签
    const labels = this._quads.filter(v => v.op == 'set_label').map(x => x.res)

    // 消除从未成为跳转目标的函数
    const neverJLabels = labels.filter(v => jTargets.every(x => x != v))
    const neverJFuncs = neverJLabels
      .filter(v => v.endsWith('_entry'))
      .map(x => x.match(new RegExp(/^_label_\d+_(.*?)_entry$/))![1])
      .filter(y => y != 'main')
      .filter(z => !callTargets.includes(z))
    const rangesToRemove = []
    // 找到对应的四元式下标
    for (let func of neverJFuncs) {
      const start = this._quads.findIndex(
        v => v.op == 'set_label' && v.res == this._ir.funcPool.find(x => x.name == func)!.entryLabel
      )!
      const end = this._quads.findIndex(
        v => v.op == 'set_label' && v.res == this._ir.funcPool.find(x => x.name == func)!.exitLabel
      )!
      rangesToRemove.push({ start, end })
      this._logs.push(`消除了函数 ${func}`)
    }
    // 删除之
    for (let range of rangesToRemove)
      for (let i = range.start; i <= range.end; i++)
        // @ts-ignore
        this._quads[i] = void 0

    this._quads = this._quads.filter(Boolean)

    return !!rangesToRemove.length
  }

  /**
   * 常量传播和常量折叠
   */
  constPropAndFold() {
    // 找出所有=var的四元式
    const eqVars = this._quads.map((v, i) => v.op == '=var' && { v, i }).filter(Boolean) as { v: Quad; i: number }[]
    // TODO 回溯每一个arg1，构建表达式树？
  }
}
