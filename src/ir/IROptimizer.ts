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

  printLogs() {
    return this._logs.join('\n')
  }

  constructor(ir: IRGenerator) {
    this._ir = ir
    this._quads = [...ir.quads]
    this._logs = []
    this._varPool = [...ir.varPool]

    // 不动点法
    let unfix
    do {
      unfix = false
      // 死代码消除
      unfix = unfix || this.deadVarEliminate()
      unfix = unfix || this.deadFuncEliminate()
      unfix = unfix || this.deadVarUseEliminate()
      // 常量传播和常量折叠
      // TODO
      // 代数优化
      // TODO
    } while (unfix)
  }

  /**
   * 删除在赋值后从未使用的变量的赋值语句
   */
  deadVarUseEliminate() {
    const varUpdates = new Map<string, number[]>() // VarId -> QuadIndex[]，变量更新的地方

    // 找出所有变量被更新的所有地方
    for (let i = 0; i < this._ir.varCount; i++) varUpdates.set(VarPrefix + String(i), [])
    for (let i = 0; i < this._quads.length; i++) {
      const quad = this._quads[i]
      quad.res.startsWith(VarPrefix) && varUpdates.set(quad.res, varUpdates.get(quad.res)!.concat([i]))
    }

    const quadsToRemove: number[] = []
    for (let [var_, indices] of varUpdates) {
      // 变量从未被更新，说明已经是死变量，在varPool中的会被deadVarEliminate处理，不在的则已经没有相关四元式
      if (indices.length == 0) continue
      // 向后寻找该变量是否被使用过
      const finalIndex = indices.sort((a, b) => b - a)[0]
      let used = false
      for (let i = finalIndex + 1; i < this._quads.length; i++) {
        const quad = this._quads[i]
        // 只要出现在arg1 / arg2 / res，就是被使用过的活变量？
        if (quad.arg1 == var_ || quad.arg2 == var_ || quad.arg2.split('&').includes(var_) || quad.res == var_) {
          used = true
          break
        }
      }
      // 没被使用过，那么之前对它的所有赋值都没有意义
      if (!used) {
        this._logs.push(`删除从未被使用的变量 ${var_}，对应四元式索引 ${indices}`)
        quadsToRemove.push(...indices)
      }
    }

    // 执行删除
    // @ts-ignore
    for (let quadIndex of quadsToRemove) this._quads[quadIndex] = void 0
    this._quads = this._quads.filter(Boolean)

    return !!quadsToRemove.length
  }

  /**
   * 删除变量池中的死变量（从未出现在任何四元式中的变量）
   */
  deadVarEliminate() {
    //
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
    const unusedVars = this._varPool.filter(v => !usedVars.includes(v.id))
    unusedVars.length && this._logs.push(`消除了死变量：${JSON.stringify(unusedVars.map(v => v.id))}`)

    this._varPool = this._varPool.filter(v => usedVars.includes(v.id))
    return !!unusedVars.length
  }

  /**
   * 删除从未成为跳转目标的函数
   */
  deadFuncEliminate() {
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
