/**
 * 中间代码优化
 * 2020-12 @ https://github.com/seu-cs-class2/minisys-minicc-ts
 */

import { IOMaxAddr } from '../asm/Arch'
import { assert } from '../seu-lex-yacc/utils'
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
      unfix = unfix || this.constPropPeepHole()
      // unfix = unfix || this.constPropAndFold()
      // 代数优化
      unfix = unfix || this.algebraOptimize()
      this.earlyReject()
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
      const finalIndex = indices.sort((a, b) => b - a)[0] // 最后一次被更新的地方
      let used = false
      for (let i = finalIndex + 1; i < this._quads.length; i++) {
        const quad = this._quads[i]
        // 只要出现在arg1 / arg2 / res，就是被使用过的活变量
        if (quad.arg1 == var_ || quad.arg2 == var_ || quad.arg2.split('&').includes(var_) || quad.res == var_) {
          used = true
          break
        }
      }
      // 没被使用过，那么对它的最后一次赋值没有意义
      if (!used) {
        this._logs.push(`删除从未被使用的变量 ${var_}，对应四元式索引 ${indices}`)
        quadsToRemove.push(finalIndex)
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
   * 处理常量传播的一种窥孔级边界情况
   *  - (=const, xxx, , _var_1), (=var, _var_1, , _var_2) --> (=const, xxx, , _var_2)
   */
  constPropPeepHole() {
    // 找出所有=var的四元式
    const eqVars = this._quads.map((v, i) => v.op == '=var' && { v, i }).filter(Boolean) as { v: Quad; i: number }[]
    const patches: { index: number; source: string; target: Quad }[] = []

    // 替换符合上述模式的四元式
    for (let eqVar of eqVars) {
      const rhs = eqVar.v.arg1
      for (let i = eqVar.i - 1; i >= 0; i--) {
        if (this._quads[i].op == '=const' && this._quads[i].res == rhs) {
          patches.push({
            index: eqVar.i,
            source: this._quads[i].toString(0),
            target: new Quad('=const', this._quads[i].arg1, '', eqVar.v.res),
          })
          // 不需要删除原有的=const产生式，因为死代码消除部分会负责清除
        }
      }
    }

    // 应用修改
    for (let patch of patches) {
      this._quads[patch.index] = patch.target
      this._logs.push(`常量传播，将位于 ${patch.index} 的 ${patch.source} 改写为 ${patch.target.toString(0)}`)
    }

    return !!patches.length
  }

  /**
   * 常量传播和常量折叠
   */
  constPropAndFold() {
    // 找出所有=var的四元式
    const eqVars = this._quads.map((v, i) => v.op == '=var' && { v, i }).filter(Boolean) as { v: Quad; i: number }[]

    // 处理复杂的常量传播和常量折叠情况
    // 借助回溯法构造表达式树，可以同时完成常量传播和常量折叠

    for (let eqVar of eqVars) {
      // TODO
    }
  }

  /**
   * 代数规则优化
   * PLUS: a+0=a
   * MINUS: a-0=0; 0-a=-a
   * MULTIPLY: a*1=a; a*0=0
   * SLASH: 0/a=0; a/1=a
   */
  algebraOptimize() {
    // 找出所有算术计算四元式
    const calcQuads = this._quads
      .map((v, i) => ({ v, i }))
      .filter(x => ['PLUS', 'MINUS', 'MULTIPLY', 'SLASH'].includes(x.v.op))

    interface Record {
      optimizable: boolean | undefined
      constant: string | undefined
    }

    let undone = false

    // 对每条四元式的arg1、arg2
    for (let { v, i } of calcQuads) {
      let record: { arg1: Record; arg2: Record } = {
        arg1: {
          optimizable: void 0, // 是否可能被优化
          constant: void 0, // 常量是多少
        },
        arg2: {
          optimizable: void 0,
          constant: void 0,
        },
      }
      const that = this

      // 向上找最近相关的=const，并且过程中不应被作为其他res覆写过
      function checkHelper(varId: string, record: Record) {
        for (let j = i - 1; j >= 0; j--) {
          const quad = that._quads[j]
          if (quad.op == '=const' && quad.res == varId) {
            record.optimizable = true
            record.constant = quad.arg1
            return
          }
          if (quad.res == varId) {
            record.optimizable = false
            return
          }
        }
        record.optimizable = false
        return
      }
      checkHelper(v.arg1, record.arg1)
      checkHelper(v.arg2, record.arg2)

      function _modify(to: Quad) {
        that._logs.push(`代数优化，将位于 ${i} 的 ${that._quads[i].toString(0)} 优化为 ${to.toString(0)}`)
        that._quads[i] = to
        undone = true
      }

      // 应用规则优化之
      function optimArg1() {
        const quad = that._quads[i]
        if (record.arg1.optimizable && record.arg1.constant == '0') {
          switch (v.op) {
            case 'PLUS':
              // 0 + a = a
              _modify(new Quad('=var', quad.arg2, '', quad.res))
              break
            case 'MINUS':
              // 0 - a = -a
              // Minisys架构没有比较高效的取相反数指令，优化与否区别不大，这里不优化
              break
            case 'MULTIPLY':
              // 0 * a = 0
              _modify(new Quad('=const', '0', '', quad.res))
              break
            case 'SLASH':
              // 0 / a = 0
              _modify(new Quad('=const', '0', '', quad.res))
              break
            default:
              break
          }
        }
        if (record.arg1.optimizable && record.arg1.constant == '1') {
          switch (v.op) {
            case 'MULTIPLY':
              // 1 * a = a
              _modify(new Quad('=var', quad.arg2, '', quad.res))
              break
            default:
              break
          }
        }
      }
      function optimArg2() {
        const quad = that._quads[i]
        if (record.arg2.optimizable && record.arg2.constant == '0') {
          switch (v.op) {
            case 'PLUS':
              // a + 0 = a
              _modify(new Quad('=var', quad.arg1, '', quad.res))
              break
            case 'MINUS':
              // a - 0 = a
              _modify(new Quad('=var', quad.arg1, '', quad.res))
              break
            case 'MULTIPLY':
              // a * 0 = 0
              _modify(new Quad('=const', '0', '', quad.res))
              break
            default:
              break
          }
        }
        if (record.arg2.optimizable && record.arg2.constant == '1') {
          switch (v.op) {
            case 'MULTIPLY':
              // a * 1 = a
              _modify(new Quad('=var', quad.arg1, '', quad.res))
              break
            default:
              break
          }
        }
      }
      optimArg1()
      optimArg2()
    }

    return undone
  }

  /**
   * 对不合理的命令立即拒绝
   */
  earlyReject() {
    for (let i = 0; i < this._quads.length; i++) {
      const quad = this._quads[i]

      // 编译期可以确定的除以0
      if (quad.op == 'SLASH' || quad.op == 'PERCENT') {
        for (let j = i - 1; j >= 0; j--) {
          if (this._quads[j].op == '=const' && this._quads[j].res == quad.arg2 && this._quads[j].arg1 == '0') {
            // 上次赋值确定是常数0
            assert(false, `位于 ${i} 的四元式 ${quad.toString(0)} 存在除以0错误`)
            break
          }
          if (this._quads[j].res == quad.arg2) {
            // 被写入值不能确定的情况
            break
          }
        }
      }

      // 越界的端口访问
      if (quad.op == '=$') {
        for (let j = i - 1; j >= 0; j--) {
          if (this._quads[j].op == '=const' && this._quads[j].res == quad.arg1) {
            // 上次赋值确定是某常数
            const addr = this._quads[j].arg1.startsWith('0x')
              ? parseInt(this._quads[j].arg1, 16)
              : parseInt(this._quads[j].arg1, 10)
            assert(addr <= IOMaxAddr, `位于 ${i} 的四元式 ${quad.toString(0)} 存在越界端口访问`)
            break
          }
          if (this._quads[j].res == quad.arg2) {
            // 被写入值不能确定的情况
            break
          }
        }
      }
    }
  }
}
