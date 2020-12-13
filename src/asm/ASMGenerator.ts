/**
 * 汇编代码（目标代码）生成器
 * 2020-12 @ https://github.com/seu-cs-class2/minisys-minicc-ts
 */

import { MiniCType } from '../ir/IR'
import { IRGenerator } from '../ir/IRGenerator'
import { assert } from '../seu-lex-yacc/utils'
import { usefulRegs } from './Arch'

// true: 0x1
// false: 0x0

interface VarLocation {
  type: 'stack' | 'register' | 'unassigned'
  location: string
}

export class ASMGenerator {
  private _ir: IRGenerator
  private _registerStatus: { [key: string]: 'free' | 'allocated' }
  private _varLocTable: { [key: string]: VarLocation } // 变量id→变量所在位置
  private _asm: string[]

  constructor(ir: IRGenerator) {
    this._ir = ir
    this._registerStatus = {}
    this._varLocTable = {}
    this._asm = []
    for (let reg of usefulRegs) this._registerStatus[reg] = 'free'
    this.newAsm('.DATA 0x0')
    this.processGlobalVars()
    this.newAsm('.TEXT 0x0')
    this.convert()
  }

  toAssembly() {
    return this._asm.map(v => (!v.startsWith('.') ? '\t' : '') + v.replace(' ', '\t')).join('\n')
  }

  newAsm(line: string) {
    this._asm.push(line)
  }

  toMinisysType(type: MiniCType) {
    const table: { [key: string]: string } = {
      int: '.word',
    }
    return table[type]
  }

  processGlobalVars() {
    const globalVars = this._ir.globalVars
    for (let var_ of globalVars) {
      // FIXME
      this.newAsm(`${var_.name}: ${this.toMinisysType(var_.type)} 0x0`)
    }
  }

  /**
   * 为变量varId分配寄存器（总是返回寄存器）
   */
  getRegister(varId: string, mustExist = false) {
    // 检查是否已经为该变量分配过寄存器
    const allocatedCheck = this._varLocTable[varId] && this._varLocTable[varId].type === 'register'
    if (allocatedCheck) return this._varLocTable[varId].location
    if (mustExist && !allocatedCheck) assert(false, `找不到变量：${varId}`)
    // 否则尝试分配新寄存器
    let regAlloc
    for (let reg of usefulRegs) {
      if (this._registerStatus[reg] == 'free') {
        regAlloc = reg
        this._varLocTable[varId] = { type: 'register', location: '$' + reg }
        break
      }
    }
    // 找不到空闲的寄存器，则开始压栈处理

    // TODO: 复用寄存器
    assert(regAlloc, '没有空闲寄存器分配给变量：' + varId) // FIXME: 进栈
    return ('$' + regAlloc) as string
  }

  // $2 <- $1  -->  or $1, $zero, $2
  // $2 <- immed  -->  addi $zero, $2, immed

  convert() {
    for (let quad of this._ir.quads) {
      const { op, arg1, arg2, res } = quad
      const binaryOp = !!(arg1.trim() && arg2.trim())
      const unaryOp = !!(+!!arg1.trim() ^ +!!arg2.trim())
      switch (op) {
        case 'OR_OP': {
        }
        case 'AND_OP': {
        }
        case 'BITAND_OP': {
          const lhs = this.getRegister(arg1)
          const rhs = this.getRegister(arg2)
          const saveTo = this.getRegister(res)
          this.newAsm(`and ${lhs}, ${rhs}, ${saveTo}`)
          break
        }
        case 'BITXOR_OP': {
          const lhs = this.getRegister(arg1)
          const rhs = this.getRegister(arg2)
          const saveTo = this.getRegister(res)
          this.newAsm(`xor ${lhs}, ${rhs}, ${saveTo}`)
          break
        }
        case 'BITOR_OP': {
          const lhs = this.getRegister(arg1)
          const rhs = this.getRegister(arg2)
          const saveTo = this.getRegister(res)
          this.newAsm(`or ${lhs}, ${rhs}, ${saveTo}`)
          break
        }
        case 'EQ_OP': {
          const lhs = this.getRegister(arg1)
          const rhs = this.getRegister(arg2)
          const saveTo = this.getRegister(res)
          this.newAsm(`sub ${lhs}, ${rhs}, ${saveTo}`)
          this.newAsm(`nor ${saveTo}, ${saveTo}, ${saveTo}`)
          break
        }
        case 'NE_OP': {
          const lhs = this.getRegister(arg1)
          const rhs = this.getRegister(arg2)
          const saveTo = this.getRegister(res)
          this.newAsm(`sub ${lhs}, ${rhs}, ${saveTo}`)
          break
        }
        case 'LT_OP': {
          const lhs = this.getRegister(arg1)
          const rhs = this.getRegister(arg2)
          const saveTo = this.getRegister(res)
          this.newAsm(`slt ${lhs}, ${rhs}, ${saveTo}`)
          break
        }
        case 'GT_OP': {
          const lhs = this.getRegister(arg1)
          const rhs = this.getRegister(arg2)
          const saveTo = this.getRegister(res)
          this.newAsm(`slt ${rhs}, ${lhs}, ${saveTo}`)
          break
        }
        case 'GE_OP': {
        }
        case 'LE_OP': {
        }
        case 'PLUS': {
        }
        case 'MINUS': {
          if (binaryOp) {
            const lhs = this.getRegister(arg1)
            const rhs = this.getRegister(arg2)
            const saveTo = this.getRegister(res)
            this.newAsm(`sub ${lhs}, ${rhs}, ${saveTo}`)
          }
          if (unaryOp) {
            const oprand = this.getRegister(arg1)
            const saveTo = this.getRegister(res)
            this.newAsm(`sub $zero, ${oprand}, ${saveTo}`)
          }
          break
        }
        case 'MULTIPLY': {
          if (binaryOp) {
            const lhs = this.getRegister(arg1)
            const rhs = this.getRegister(arg2)
            const saveTo = this.getRegister(res)
            this.newAsm(`add ${lhs}, ${rhs}, ${saveTo}`)
          }
          if (unaryOp) {
            const oprand = this.getRegister(arg1)
            const saveTo = this.getRegister(res)
            this.newAsm(`add $zero, ${oprand}, ${saveTo}`)
          }
          break
        }
        case 'SLASH': {
          const lhs = this.getRegister(arg1)
          const rhs = this.getRegister(arg2)
          const saveTo = this.getRegister(res)
          this.newAsm(`div ${lhs}, ${rhs}`)
          this.newAsm(`mflo ${saveTo}`)
        }
        case 'PERCENT': {
          const lhs = this.getRegister(arg1)
          const rhs = this.getRegister(arg2)
          const saveTo = this.getRegister(res)
          this.newAsm(`div ${lhs}, ${rhs}`)
          this.newAsm(`mfhi ${saveTo}`)
        }
        case 'NOT_OP': {
        }
        case 'set_label': {
          // 添加标号
          this.newAsm(res + ':')
          break
        }
        case '=': {
          // 互相赋值
          const sourceReg = this.getRegister(arg1)
          const targetReg = this.getRegister(res)
          this.newAsm(`or ${sourceReg}, $zero, ${targetReg}`)
          break
        }
        case '=const': {
          // 赋常量
          const sourceData = arg1
          const targetReg = this.getRegister(res)
          this.newAsm(`addi $zero, ${targetReg}, ${sourceData}`)
          break
        }
        case 'j_if_not': {
          const boolResult = this.getRegister(arg1, true)
          const targetLabel = res
          this.newAsm(`beq ${boolResult}, $zero, ${targetLabel}`)
          break
        }
        case 'j_if_yes': {
          const boolResult = this.getRegister(arg1, true)
          const targetLabel = res
          this.newAsm(`bne ${boolResult}, $zero, ${targetLabel}`)
          break
        }
        case 'j': {
          const label = res
          this.newAsm(`j ${label}`)
          break
        }
        case 'call': {
          // 先准备参数
          const args = arg2.split('&')
          const argRegs = args.map(v => this.getRegister(v))
          // 然后调函数
          this.newAsm(`addi $sp, $sp, -4`)
          // TODO:
        }
        default:
          break
      }
    }
  }
}
