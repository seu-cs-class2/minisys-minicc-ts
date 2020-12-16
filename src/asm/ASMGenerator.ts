/**
 * 汇编代码（目标代码）生成器
 * 约定：
 *   - 布尔真：0x1；布尔假：0x0
 *   - $2 <- $1  -->  or $1, $zero, $2
 *   - $2 <- immed  -->  addi $zero, $2, immed // FIXME 32bit immed assign
 * 2020-12 @ https://github.com/seu-cs-class2/minisys-minicc-ts
 */

import { MiniCType } from '../ir/IR'
import { GlobalScope, IRGenerator, LabelPrefix } from '../ir/IRGenerator'

/**
 * 汇编代码生成器
 */
export class ASMGenerator {
  private _ir: IRGenerator
  private _asm: string[]

  constructor(ir: IRGenerator) {
    this._ir = ir
    this._asm = []
    // TODO: 寄存器分配
    this.newAsm('.DATA 0x0')
    this.processGlobalVars()
    this.newAsm('.TEXT 0x0')
    this.processTextSegment()
  }

  /**
   * 生成汇编代码
   */
  toAssembly() {
    return this._asm
      .map(v => (!(v.startsWith('.') || v.startsWith(LabelPrefix)) ? '\t' : '') + v.replace(' ', '\t'))
      .join('\n')
  }

  /**
   * 添加一行新汇编代码
   */
  newAsm(line: string) {
    this._asm.push(line)
  }

  /**
   * 将MiniC类型转换为Minisys汇编类型
   */
  toMinisysType(type: MiniCType) {
    const table: { [key: string]: string } = {
      int: '.word',
    }
    return table[type]
  }

  /**
   * 处理全局变量
   */
  processGlobalVars() {
    const globalVars = this._ir.varPool.filter(v => IRGenerator.sameScope(v.scope, GlobalScope))
    for (let var_ of globalVars) {
      // FIXME 数组、初始值，怎么处理
      this.newAsm(`${var_.name}: ${this.toMinisysType(var_.type)} 0x0`)
    }
  }

  /**
   * 为变量varId分配寄存器
   */
  getRegister(varId: string, protect: string[] = [], mustExist = false) {
    // TODO
  }

  /**
   * @see https://github.com/seu-cs-class2/minisys-minicc-ts/blob/master/docs/IR.md
   */
  processTextSegment() {
    for (let quad of this._ir.quads) {
      const { op, arg1, arg2, res } = quad
      const binaryOp = !!(arg1.trim() && arg2.trim()) // 是二元表达式
      const unaryOp = !!(+!!arg1.trim() ^ +!!arg2.trim()) // 是一元表达式
      switch (op) {
        case 'set_label': {
          this.newAsm(res + ':')
          break
        }
        case 'j_false': {
          const boolResult = this.getRegister(arg1, [], true)
          this.newAsm(`beq ${boolResult}, $zero, ${res}`)
          break
        }
        case 'j': {
          this.newAsm(`j ${res}`)
          break
        }
        case '=var': {
          const rhs = this.getRegister(arg1)
          const lhs = this.getRegister(res)
          this.newAsm(`or ${rhs}, $zero, ${lhs}`)
          break
        }
        case '=const': {
        }
        case '=[]': {
        }
        case '[]': {
        }
        case '=$': {
        }
        case '=const': {
          // 赋常量
          const sourceData = arg1
          const targetReg = this.getRegister(res)
          this.newAsm(`addi $zero, ${targetReg}, ${sourceData}`)
          break
        }
        case 'call': {
        }
        case 'return_void': {
        }
        case 'return_expr': {
        }
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
        default:
          break
      }
    }
  }
}
