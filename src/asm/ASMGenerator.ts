/**
 * 汇编代码（目标代码）生成器
 * 约定：
 *   - 布尔真：0x1；布尔假：0x0
 *   - $2 <- $1  -->  or $1, $zero, $2
 *   - $2 <- immed  -->  addi $zero, $2, immed // FIXME 32bit immed assign
 * // TODO: 目前写好的是最蠢的汇编生成，每条指令前后均访存，不考虑寄存器复用，并且不支持函数调用、数组特性
 * 2020-12 @ https://github.com/seu-cs-class2/minisys-minicc-ts
 */

import { IRFunc, IRVar, MiniCType, Quad } from '../ir/IR'
import { GlobalScope, IRGenerator, LabelPrefix, VarPrefix } from '../ir/IRGenerator'
import { assert } from '../seu-lex-yacc/utils'
import { UsefulRegs, WordLengthByte } from './Arch'
import { AddressDescriptor, RegisterDescriptor } from './Asm'

/**
 * 汇编代码生成器
 */
export class ASMGenerator {
  private _ir: IRGenerator
  private _asm: string[]

  private _stackStartAddr: number
  private _stackPtr: number
  private _stackArea: string[] // 栈区，每格32位
  private _freeRegs: string[]
  private _registerDescriptors: Map<string, RegisterDescriptor> //寄存器描述符, 寄存器号->变量名(可多个)
  private _addressDescriptors: Map<string, AddressDescriptor> //变量描述符, 变量名->地址（可多个）

  constructor(ir: IRGenerator) {
    this._ir = ir
    this._asm = []
    this._stackStartAddr = 1023 // 1024 * 32 bit
    this._stackPtr = this._stackStartAddr // 高地址向低地址增长
    this._stackArea = Array(this._stackStartAddr + 1).fill('none')
    this._freeRegs = [...UsefulRegs]
    this._registerDescriptors = new Map();
    this._addressDescriptors = new Map();
    // 给main函数局部变量分配栈位置
    // FIXME: 规定main函数不准递归
    // TODO: 数组支持
    let allVar: string[] = []
    this._ir.quads.forEach(v => {
      v.arg1.startsWith(VarPrefix) && allVar.push(v.arg1)
      v.arg2.startsWith(VarPrefix) && allVar.push(v.arg2)
      v.res.startsWith(VarPrefix) && allVar.push(v.res)
    })
    allVar = [...new Set(allVar)]
    for (let var_ of allVar) {
      this._stackArea[this._stackPtr--] = var_
    }
    this.newAsm('.DATA 0x0')
    this.processGlobalVars()
    this.newAsm('.TEXT 0x0')
    this.processTextSegment()
  }

  /**
   * 从内存取变量到寄存器 // TODO: Change this
   */
  loadVar(varId: string, register: string) {
    const varLoc = this._stackArea.findIndex(v => v == varId)
    assert(varLoc !== -1, '?')
    const offset = (this._stackStartAddr - varLoc!) * WordLengthByte
    this.newAsm(`addi $at, $zero, ${offset}`)
    this.newAsm(`lw ${register}, ${this._stackStartAddr}($at)`)
  }

  /**
   * 回写寄存器内容到内存 // TODO: Change this
   */
  storeVar(varId: string, register: string) {
    const varLoc = this._stackArea.findIndex(v => v == varId)
    assert(varLoc !== -1, '?')
    const offset = (this._stackStartAddr - varLoc!) * WordLengthByte
    this.newAsm(`addi $at, $zero, ${offset}`)
    this.newAsm(`sw ${register}, ${this._stackStartAddr}($at)`)
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
   * 为一条四元式获取每个变量可用的寄存器 // TODO: implement this
   * @param ir 
   */
  getRegs(ir: Quad) {
    let res = []
    for (let i = 0; i < 3; i++) {
      res.push(this._freeRegs.shift()!)
    }
    return res
  }

  /**
   * 根据IRFunc计算该Procedure所需的Frame大小，
   * 默认使用所有通用寄存器；
   * 4个以内参数不分配内存传实参，仅用寄存器；
   * 先不考虑数组
   * 需要访问VARPOOL
   * @param func 
   */

   calcFrameSize(func: IRFunc) {

   }
   

  allocateProcMemory(func: IRFunc) {
    // TODO: analyze VARPOOL

    // TODO: process AddressDescriptors
    return 16
  }

  deallocateProcMemory(func: IRFunc) {
    // TODO: analyze VARPOOL

    // TODO: process RegisterDescriptors

    // TODO: process AddressDescriptors
  }

  /**
   * @see https://github.com/seu-cs-class2/minisys-minicc-ts/blob/master/docs/IR.md
   */
  processTextSegment() {
    for (let quad of this._ir.quads) {
      const { op, arg1, arg2, res } = quad
      const binaryOp = !!(arg1.trim() && arg2.trim()) // 是二元表达式
      const unaryOp = !!(+!!arg1.trim() ^ +!!arg2.trim()) // 是一元表达式
      if (binaryOp) {
        switch (op) {
          case '=[]': {
            // TODO: 数组支持
            break
          }
          case '[]': {
            // TODO: 数组支持
            break
          }
          case '=$': {
            // TODO: 需要硬件侧约定端口访问方法（编址等）
            break
          }
          case 'call': {

            // TODO: Save arg2 number of arguments

            // TODO: under 4 arguments, use register

            // TODO: over 4 arguments, save it to CALLEE's stack

            // TODO: save return address to ra

            this.newAsm(`j ${arg1}`)

            // TODO: restore SP
            break
          }
          // X = Y op Z
          case 'OR_OP':
          case 'AND_OP':
          case 'LT_OP':
          case 'PLUS':
          case 'MINUS':
          case 'BITAND_OP':
          case 'BITOR_OP':
          case 'BITXOR_OP':
          case 'LEFT_OP':
          case 'RIGHT_OP':
          case 'EQ_OP':
          case 'NE_OP':
          case 'NE_OP':
          case 'GT_OP':
          case 'GE_OP':
          case 'LE_OP':
          case 'MULTIPLY':
          case 'SLASH':
          case 'PERCENT':
            {
              // register allocation
              const [regY, regZ, regX] = this.getRegs(quad)
              if (!this._registerDescriptors.get(regY)?.variables.has(arg1)) {
                this.loadVar(arg1, regY)
              }
              if (!this._registerDescriptors.get(regZ)?.variables.has(arg2)) {
                this.loadVar(arg2, regZ)
              }

              // emit respective instructions
              switch (op) {
                case 'BITOR_OP':
                case 'OR_OP': {
                  this.newAsm(`or ${regY}, ${regZ}, ${regX}`)
                  break
                }
                case 'BITAND_OP':
                case 'AND_OP': {
                  this.newAsm(`and ${regY}, ${regZ}, ${regX}`)
                  break
                }
                case 'BITXOR_OP': {
                  this.newAsm(`xor ${regY}, ${regZ}, ${regX}`)
                  break
                }
                case 'PLUS': {
                  this.newAsm(`add ${regY}, ${regZ}, ${regX}`)
                  break
                }
                case 'MINUS': {
                  this.newAsm(`sub ${regY}, ${regZ}, ${regX}`)
                  break
                }
                case 'LEFT_OP': {
                  this.newAsm(`sllv ${regY}, ${regZ}, ${regX}`)
                  break
                }
                case 'RIGHT_OP': {
                  this.newAsm(`srlv ${regY}, ${regZ}, ${regX}`)
                  break
                }
                case 'EQ_OP': {
                  this.newAsm(`sub ${regY}, ${regZ}, ${regX}`)
                  this.newAsm(`nor ${regX}, ${regX}, ${regX}`)
                  break
                }
                case 'NE_OP': {
                  this.newAsm(`sub ${regY}, ${regZ}, ${regX}`)
                  break
                }
                case 'LT_OP': {
                  this.newAsm(`slt ${regY}, ${regZ}, ${regX}`)
                  break
                }
                case 'GT_OP': {
                  this.newAsm(`slt ${regZ}, ${regY}, ${regX}`)
                  break
                }
                case 'GE_OP': {
                  this.newAsm(`slt ${regY}, ${regZ}, ${regX}`)
                  this.newAsm(`nor ${regX}, ${regX}, ${regX}`)
                  break
                }
                case 'LE_OP': {
                  this.newAsm(`slt ${regZ}, ${regY}, ${regX}`)
                  this.newAsm(`nor ${regX}, ${regX}, ${regX}`)
                  break
                }
                case 'MULTIPLY': {
                  this.newAsm(`mult ${regY}, ${regZ}`)
                  this.newAsm(`mflo ${regX}`)
                  break
                }
                case 'SLASH': {
                  this.newAsm(`div ${regY}, ${regZ}`)
                  this.newAsm(`mflo ${regX}`)
                  break
                }
                case 'PERCENT': {
                  this.newAsm(`div ${regY}, ${regZ}`)
                  this.newAsm(`mfhi ${regX}`)
                  break
                }
              }

              // Manage descriptors

              // a. Change the register descriptor for regX so that it only holds res
              this._registerDescriptors.get(regX)?.variables.clear()
              this._registerDescriptors.get(regX)?.variables.add(res)

              // b. Remove regX from the address descriptor of any variable other than res
              for (let descriptor of this._addressDescriptors.values()) {
                if (descriptor.addresses.has(regX)) {
                  descriptor.addresses.delete(regX)
                }
              }

              // c. Change the address descriptor for res so that its only location is regX
              // Note the memory location for res is NOT now in the address descriptor for res!
              this._addressDescriptors.get(res)?.addresses.clear()
              this._addressDescriptors.get(res)?.addresses.add(regX)
            }
            break
          default:
            break
        }
      }
      else if (unaryOp) {
        switch (op) {
          case 'j_false': {
            // TODO
            const [reg1] = this.getRegs(quad)
            this.loadVar(arg1, reg1)
            this.newAsm(`beq ${reg1}, $zero, ${res}`)
            this.newAsm(`nop`) // delay-slot
            break
          }
          case '=var': {
            // TODO
            const [reg1, reg2] = this.getRegs(quad)
            this.loadVar(arg1, reg1)
            this.newAsm(`or ${reg1}, $zero, ${reg2}`)
            this.storeVar(res, reg2)
            break
          }
          case '=const': {
            // TODO: 位数扩展
            const [reg1] = this.getRegs(quad)
            this.newAsm(`addi ${reg1}, $zero, ${arg1}`)
            this.storeVar(res, reg1)
            break
          }
          case 'return_expr': {
            // TODO: load return value into $v0
            break
          }
          case 'NOT_OP':
          case 'MINUS':
          case 'PLUS':
          case 'DOLLAR':
          case 'BITINV_OP': {
            // TODO
            break
          }
        }
      }
      else {
        switch (op) {
          case 'set_label': {

            // parse the label to identify type
            let labelContents = res.split('_')
            let labelType = labelContents[labelContents.length - 1]
            if (labelType == 'entry') {
              // find the function in symbol table
              const func = this._ir.funcPool.find(element => element.entryLabel == res)
              this.newAsm(func?.name + ':')

              // TODO: calculate current frame size, store it

              let frameSize = 16

              this.newAsm(`addiu $sp, $sp, -${frameSize}`)

              // TODO: push stack frame

              // TODO: save return address

              // TODO: save register values

            }
            else if (labelType == 'exit') {
              // find the function in symbol table
              const func = this._ir.funcPool.find(element => element.entryLabel == res)
              this.newAsm(func?.name + ':')

              // TODO: restore register values

              // TODO: restore the return address

              // TODO: retrieve current frame size

              // TODO: pop stack frame

              this.newAsm(`jr ra`)

            }
            else {
              this.newAsm(res + ':')
            }
            break
          }
          case 'j': {
            this.newAsm(`j ${res}`)
            this.newAsm(`nop`) // delay-slot
            break
          }
          case 'return_void': {
            // nothing
            break
          }
          default:
            break
        }
      }
    }
  }
}
