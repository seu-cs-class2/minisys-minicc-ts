/**
 * 汇编代码（目标代码）生成器
 * 2020-12 @ https://github.com/seu-cs-class2/minisys-minicc-ts
 */

import { MiniCType } from '../ir/IR'
import { IRGenerator } from '../ir/IRGenerator'
import { assert } from '../seu-lex-yacc/utils'
import { usefulRegs } from './Arch'

export class ASMGenerator {
  private _ir: IRGenerator
  private _registerTable: { [key: string]: string } // 变量id→变量所在寄存器
  private _asm: string[]

  constructor(ir: IRGenerator) {
    this._ir = ir
    this._registerTable = {}
    this._asm = []
    for (let reg of usefulRegs) this._registerTable[reg] = '[free]'
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

  getRegister(varId: string, mustExist = false) {
    // 检查是否已经为该变量分配过寄存器
    const regIndex = Object.values(this._registerTable).findIndex(v => v == varId)
    if (mustExist && regIndex == -1) assert(false, `找不到变量：${varId}`)
    if (regIndex !== -1) return '$' + usefulRegs[regIndex]
    // 分配新寄存器
    let regAlloc
    for (let reg in this._registerTable) {
      if (this._registerTable[reg] == '[free]') {
        this._registerTable[reg] = varId
        regAlloc = reg
        break
      }
    }
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
        }
        case 'MULTIPLY': {
        }
        case 'SLASH': {
        }
        case 'PERCENT': {
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
