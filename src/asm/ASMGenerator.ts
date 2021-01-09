/**
 * 汇编代码（目标代码）生成器
 * 约定：
 *   - 布尔真：0x1；布尔假：0x0
 *   - $2 <- $1  -->  or $1, $zero, $2
 *   - $2 <- immed  -->  addi $zero, $2, immed // FIXME 32bit immed assign
 * // TODO: 目前写好的是最蠢的汇编生成，每条指令前后均访存，不考虑寄存器复用，并且不支持函数调用、数组特性
 * 2020-12 @ https://github.com/seu-cs-class2/minisys-minicc-ts
 */

import { type } from 'os'
import { IRFunc, IRVar, MiniCType, Quad } from '../ir/IR'
import { GlobalScope, IRGenerator, LabelPrefix, VarPrefix } from '../ir/IRGenerator'
import { assert } from '../seu-lex-yacc/utils'
import { UsefulRegs, WordLengthByte } from './Arch'
import { AddressDescriptor, RegisterDescriptor, StackFrameInfo } from './Asm'

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
  private _stackFrameInfos: Map<string, StackFrameInfo>

  // TODO: Array support
  constructor(ir: IRGenerator) {
    this._ir = ir
    this._asm = []
    this._stackStartAddr = 1023 // 1024 * 32 bit
    this._stackPtr = this._stackStartAddr // 高地址向低地址增长
    this._stackArea = Array(this._stackStartAddr + 1).fill('none')
    this._freeRegs = [...UsefulRegs]
    this._registerDescriptors = new Map();
    this._addressDescriptors = new Map();
    this._stackFrameInfos = new Map();
    this.calcFrameInfo()

    for (const regName in this._freeRegs) {
      this._registerDescriptors.set(regName, {recent:0, variables: new Set<string>()})
    }
    this.newAsm('.DATA 0x0')
    this.processGlobalVars()
    this.newAsm('.TEXT 0x0')
    this.processTextSegment()
  }

  /**
   * 从内存取变量到寄存器
   */
  loadVar(varId: string, register: string) {
    const varLoc = this._stackArea.findIndex(v => v == varId) // TODO
    assert(varLoc !== -1, '?')
    const offset = (this._stackStartAddr - varLoc!) * WordLengthByte
    this.newAsm(`addi $at, $zero, ${offset}`)
    this.newAsm(`lw ${register}, ${this._stackStartAddr}($at)`)
  }

  /**
   * 回写寄存器内容到内存
   */
  storeVar(varId: string, register: string) {
    const varLoc = this._stackArea.findIndex(v => v == varId) // TODO
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
   * 没有子函数则不用存返回地址，否则需要，并且分配至少4个outgoing args块
   * 先不考虑数组
   */

   calcFrameInfo() {
    for (const outer of this._ir.funcPool) {
      // if it calls child function(s), it needs to save return address
      // and allocate a minimum of 4 outgoing argument slots
      let isLeaf = outer.childFuncs.length == 0
      let maxArgs = 0
      for (const inner of this._ir.funcPool) {
        if (inner.name in outer.childFuncs) {
          maxArgs = Math.max(maxArgs, inner.paramList.length)
        }
      }
      let outgoingSlots = isLeaf ? 0 : Math.max(maxArgs, 4)
      let localData = 0
      for (const localVar of outer.localVars) {
        if (localVar instanceof IRVar) localData++
        else localData += localVar.len
      }
      let wordSize = (isLeaf ? 0 : 1 + localData + 8 + outgoingSlots) // allocate memory for all local variables (but not for temporary variables)
      if (wordSize % 2 != 0) wordSize++ // padding
      this._stackFrameInfos.set(outer.name, {isLeaf: isLeaf, wordSize: wordSize,
         outgoingSlots: outgoingSlots, localData: localData, numRegs:8, numReturnAdd: isLeaf ? 0 : 1}) // for now allocate all regs
    }
   }
   

  allocateProcMemory(func: IRFunc) {
    const frameInfo = this._stackFrameInfos.get(func?.name)
    if (frameInfo == undefined) throw new Error('function name not in the pool')
    // must save args passed by register to memory, otherwise they can be damaged.
    for (let index = 0; index < func.paramList.length; index++) {
      const memLoc = `${4*(frameInfo.wordSize + index)}($sp)`
      if (index < 4) {
        this.newAsm(`sw $a${index}, ${memLoc}`)
      }
      this._addressDescriptors.set(func.paramList[index].id, {currentAddresses: new Set<string>().add(memLoc), boundMemAddress: memLoc})
    }
    let remainingLVSlots = frameInfo.localData
    for (const localVar of func.localVars) {
      if (localVar instanceof IRVar) {
        if (func.paramList.includes(localVar)) continue
        else {
          const memLoc = `${4*(frameInfo.wordSize - (frameInfo.isLeaf ? 0 : 1) - frameInfo.numRegs - remainingLVSlots-- )}($sp)`
          this._addressDescriptors.set(localVar.id, {currentAddresses: new Set<string>().add(memLoc), boundMemAddress: memLoc})
        }
      }
      else {
        // TODO: array support
      }

    }
    
    const globalVars = this._ir.varPool.filter(v => IRGenerator.sameScope(v.scope, GlobalScope))
    for (const globalVar of globalVars) {
      if (globalVar instanceof IRVar) {
        this._addressDescriptors.set(globalVar.id, {currentAddresses: new Set<string>().add(globalVar.name), boundMemAddress: globalVar.name})
      }
      else {
        // TODO: array support
      }
    }

  }

  deallocateProcMemory(func: IRFunc) {
    this._addressDescriptors.clear()
    for (let pair of this._registerDescriptors) {
      pair[1].recent = 0
      pair[1].variables.clear()
    }
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
            // TODO: array support
            break
          }
          case '[]': {
            // TODO: array support
            break
          }
          case '=$': {
            const [regZ] = this.getRegs(quad) // TODO: specifically handle this
            if (!this._registerDescriptors.get(regZ)?.variables.has(arg2)) {
              this.loadVar(arg2, regZ)
            }
            this.newAsm(`sw ${arg1}, ${regZ}`)
          }
          case 'call': {
            const func = this._ir.funcPool.find(element => element.entryLabel == arg1)
            if (func == undefined) throw new Error('unidentified function')
            const actualArguments = arg2.split('&')

            for (let argNum = 0; argNum < func.paramList.length; argNum++) {
              const actualArg = actualArguments[argNum];
              const ad =  this._addressDescriptors.get(actualArg)
              if (ad == undefined || ad.currentAddresses == undefined || ad.currentAddresses.size == 0) {
                throw new Error('Actual argument does not have current address')
              }
              else {
                let regLoc = ''
                let memLoc = ''
                for (const addr of ad.currentAddresses) {
                  if (addr[0] == '$') {
                    // register has higher priority
                    regLoc = addr
                    break
                  }
                  else {
                    memLoc = addr
                  }
                }

                if (regLoc.length > 0) {
                  if (argNum < 4) {
                    this.newAsm(`mov $a${argNum}, ${regLoc}`)
                  }
                  else {
                    this.newAsm(`sw ${4*argNum}($sp), ${regLoc}`)
                  }
                }
                else {
                  if (argNum < 4) {
                    this.newAsm(`lw $a${argNum}, ${memLoc}`)
                  }
                  else {
                    // since $v1 will not be used elsewhere, it is used to do this!
                    this.newAsm(`lw $v1, ${memLoc}`)
                    this.newAsm(`sw ${4*argNum}($sp), $v1`)
                  }
                }
              }
            }

            this.newAsm(`jal ${arg1}`) // jal will automatically save return address to $ra

            // clear temporary registers because they might have been damaged
            for (let kvpair of this._addressDescriptors.entries()) {
              for(let addr of kvpair[1].currentAddresses) {
                if (addr.substr(0, 2) == '$t') {
                  kvpair[1].currentAddresses.delete(addr)
                  this._registerDescriptors.get(addr)?.variables.delete(kvpair[0])
                }
              }
            }

            if (res.length > 0) {
              const ad =  this._addressDescriptors.get(res)
              const regX = this.getRegs(quad) // TODO: specifically handle this in getRegs because it will always be a temp variable
              this.newAsm(`mov ${regX}, $v0`)
            }
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
                if (descriptor.currentAddresses.has(regX)) {
                  descriptor.currentAddresses.delete(regX)
                }
              }

              // c. Change the address descriptor for res so that its only location is regX
              // Note the memory location for res is NOT now in the address descriptor for res!
              this._addressDescriptors.get(res)?.currentAddresses.clear()
              this._addressDescriptors.get(res)?.currentAddresses.add(regX)
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
            const ad =  this._addressDescriptors.get(arg1)
            if (ad == undefined || ad.currentAddresses == undefined || ad.currentAddresses.size == 0) {
              throw new Error('Return value does not have current address')
            }
            else {
              let regLoc = ''
              let memLoc = ''
              for (const addr of ad.currentAddresses) {
                if (addr[0] == '$') {
                  // register has higher priority
                  regLoc = addr
                  break
                }
                else {
                  memLoc = addr
                }
              }
              
              if (regLoc.length > 0) {
                this.newAsm(`mov $v0, ${regLoc}`)
              }
              else {
                this.newAsm(`lw $v0, ${memLoc}`)
              }
            }
            
            break
          }
          case 'NOT_OP':
          case 'MINUS':
          case 'PLUS':
          case 'BITINV_OP': {
            const [regY, regX] = this.getRegs(quad)
            if (!this._registerDescriptors.get(regY)?.variables.has(arg1)) {
              this.loadVar(arg1, regY)
            }
            switch(op) {
              case 'NOT_OP':
                this.newAsm(`xor, ${regX}, $zero, ${regY}`)
                break
              case 'MINUS':
                this.newAsm(`sub, ${regX}, $zero, ${regY}`)
                break
              case 'PLUS':
                this.newAsm(`mov, ${regX}, ${regY}`)
                break
              case 'BITINV_OP':
                this.newAsm(`nor, ${regX}, ${regY}, ${regY}`)
                break
              default:
                break
            }

            // TODO: deal with descriptors
            break
          }
          default:
            break
        }
      }
      else {
        switch (op) {
          case 'set_label': {
            // parse the label to identify type
            const labelContents = res.split('_')
            const labelType = labelContents[labelContents.length - 1]
            if (labelType == 'entry') {
              // find the function in symbol table
              const func = this._ir.funcPool.find(element => element.entryLabel == res)
              if (func == undefined) throw new Error('fuction name not in the pool')
              const frameInfo = this._stackFrameInfos.get(func?.name)
              if (frameInfo == undefined) throw new Error('function name not in the pool')
              this.newAsm(func?.name + ':')
              this.newAsm(`addiu $sp, $sp, -${4 * frameInfo.wordSize}`)
              if (!frameInfo.isLeaf) {
                this.newAsm(`sw $ra, ${4 * (frameInfo.wordSize - 1)}($sp)`)
              }
              for (let index = 0; index < frameInfo.numRegs; index++) {
                this.newAsm(`sw $s${index}, ${4 * (frameInfo.wordSize - frameInfo.numRegs + index)}($sp)`)
              }
              this.allocateProcMemory(func)
            }
            else if (labelType == 'exit') {
              // find the function in symbol table
              const func = this._ir.funcPool.find(element => element.entryLabel == res)
              if (func == undefined) throw new Error('fuction name not in the pool')
              const frameInfo = this._stackFrameInfos.get(func?.name)
              if (frameInfo == undefined) throw new Error('function name not in the pool')

              for (let index = 0; index < frameInfo.numRegs; index++) {
                this.newAsm(`lw $s${index}, ${4 * (frameInfo.wordSize - frameInfo.numRegs + index)}($sp)`)
              }

              if (!frameInfo.isLeaf) {
                this.newAsm(`lw $ra, ${4 * (frameInfo.wordSize - 1)}($sp)`)
              }
              this.newAsm(`addiu $sp, $sp, ${4 * frameInfo.wordSize}`)
              this.newAsm(`jr $ra`)

              this.deallocateProcMemory(func)
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
