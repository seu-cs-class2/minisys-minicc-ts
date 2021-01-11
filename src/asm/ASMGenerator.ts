/**
 * 汇编代码（目标代码）生成器
 * 约定：
 *   - 布尔真：任何不是0x0的值；布尔假：0x0
 * 2021-01 @ https://github.com/seu-cs-class2/minisys-minicc-ts
 */

import { IRFunc, IRVar, MiniCType, Quad } from '../ir/IR'
import { GlobalScope, IRGenerator } from '../ir/IRGenerator'
import { assert } from '../seu-lex-yacc/utils'
import { UsefulRegs } from './Arch'
import { AddressDescriptor, RegisterDescriptor, StackFrameInfo } from './ASM'

/**
 * 汇编代码生成器
 */
export class ASMGenerator {
  private _ir: IRGenerator
  private _asm: string[]

  private _GPRs: string[] // 通用寄存器组
  private _registerDescriptors: Map<string, RegisterDescriptor> // 寄存器描述符, 寄存器号->变量名(可多个)
  private _addressDescriptors: Map<string, AddressDescriptor> // 变量描述符, 变量名->地址（可多个）
  private _stackFrameInfos: Map<string, StackFrameInfo>

  constructor(ir: IRGenerator) {
    this._ir = ir
    this._asm = []
    this._GPRs = [...UsefulRegs]
    this._registerDescriptors = new Map()
    this._addressDescriptors = new Map()
    this._stackFrameInfos = new Map()
    this.calcFrameInfo()
    // initialize all GPRs
    for (const regName of this._GPRs) {
      this._registerDescriptors.set(regName, { usable: true, variables: new Set<string>() })
    }
    this.newAsm('.data 0x0')
    this.processGlobalVars()
    this.newAsm('.text 0x0')
    this.processTextSegment()
  }

  /**
   * 从内存取变量到寄存器
   */
  loadVar(varId: string, register: string) {
    const varLoc = this._addressDescriptors.get(varId)?.boundMemAddress
    assert(varLoc, `Cannot get the bound address for this variable: ${varId}`)
    this.newAsm(`lw ${register}, ${varLoc}`)
    // change the register descriptor so it holds only this var
    this._registerDescriptors.get(register)?.variables.clear()
    this._registerDescriptors.get(register)?.variables.add(varId)
    // change the address descriptor by adding this register as an additonal location
    this._addressDescriptors.get(varId)?.currentAddresses.add(register)
  }

  /**
   * 回写寄存器内容到内存
   */
  storeVar(varId: string, register: string) {
    const varLoc = this._addressDescriptors.get(varId)?.boundMemAddress
    assert(varLoc, `Cannot get the bound address for this variable: ${varId}`)
    this.newAsm(`sw ${register}, ${varLoc}`)
    this._addressDescriptors.get(varId)?.currentAddresses.add(varLoc!)
  }

  /**
   * 生成汇编代码
   */
  toAssembly() {
    return this._asm.map(v => (!(v.startsWith('.') || v.includes(':')) ? '\t' : '') + v.replace(' ', '\t')).join('\n')
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
      this.newAsm(`${var_.name}: ${this.toMinisysType(var_.type)} 0x0`) // 全局变量初始值给 0x0
    }
  }

  /**
   * 为一条四元式获取每个变量可用的寄存器
   */
  getRegs(ir: Quad, blockIndex: number, irIndex: number) {
    const { op, arg1, arg2, res } = ir
    const binaryOp = arg1.trim() && arg2.trim() // 是二元表达式
    const unaryOp = !!(+!!arg1.trim() ^ +!!arg2.trim()) // 是一元表达式
    let regs = ['']
    if (['=$', 'call', 'j_false', '=var', '=const'].includes(op)) {
      switch (op) {
        case '=$': {
          let regY = this.allocateReg(blockIndex, irIndex, arg1, undefined, undefined)
          if (!this._registerDescriptors.get(regY)?.variables.has(arg1)) {
            this.loadVar(arg1, regY)
          }
          let regZ = this.allocateReg(blockIndex, irIndex, arg2, undefined, undefined)
          if (!this._registerDescriptors.get(regZ)?.variables.has(arg2)) {
            this.loadVar(arg2, regZ)
          }
          regs = [regY, regZ]
          break
        }
        case '=const':
        case 'call': {
          let regX = this.allocateReg(blockIndex, irIndex, res, undefined, undefined)
          regs = [regX]
          break
        }
        case 'j_false': {
          let regY = this.allocateReg(blockIndex, irIndex, arg1, undefined, undefined)
          if (!this._registerDescriptors.get(regY)?.variables.has(arg1)) {
            this.loadVar(arg1, regY)
          }
          regs = [regY]
          break
        }
        case '=var': {
          let regY = this.allocateReg(blockIndex, irIndex, arg1, undefined, res)
          if (!this._registerDescriptors.get(regY)?.variables.has(arg1)) {
            this.loadVar(arg1, regY)
          }
          // always choose RegX = RegY
          let regX = regY
          regs = [regY, regX]
          break
        }
        default:
          break
      }
    } else if (binaryOp) {
      let regY = this.allocateReg(blockIndex, irIndex, arg1, arg2, res)
      if (!this._registerDescriptors.get(regY)?.variables.has(arg1)) {
        this.loadVar(arg1, regY)
      }
      let regZ = this.allocateReg(blockIndex, irIndex, arg2, arg1, res)
      if (!this._registerDescriptors.get(regZ)?.variables.has(arg2)) {
        this.loadVar(arg2, regZ)
      }
      // if res is either of arg1 or arg2, then simply use the same register
      let regX = ''
      if (res == arg1) {
        regX = regY
      } else if (res == arg2) {
        regX = regZ
      } else {
        regX = this.allocateReg(blockIndex, irIndex, res, undefined, undefined)
      }
      regs = [regY, regZ, regX]
    } else if (unaryOp) {
      // unary op
      let regY = this.allocateReg(blockIndex, irIndex, arg1, undefined, res)
      if (!this._registerDescriptors.get(regY)?.variables.has(arg1)) {
        this.loadVar(arg1, regY)
      }
      let regX = res == arg1 ? regY : this.allocateReg(blockIndex, irIndex, res, undefined, undefined)
      regs = [regY, regX]
    } else assert(false, 'Illegal op.')
    return regs
  }

  allocateReg(
    blockIndex: number,
    irIndex: number,
    thisArg: string,
    otherArg: string | undefined,
    res: string | undefined
  ) {
    const addrDesc = this._addressDescriptors.get(thisArg)?.currentAddresses
    let finalReg = ''
    let alreadyInReg = false
    if (addrDesc != undefined) {
      for (const addr of addrDesc) {
        if (addr[0] == '$') {
          // 1. Currently in a register, just pick this one.
          alreadyInReg = true
          finalReg = addr
          break
        }
      }
    }
    if (!alreadyInReg) {
      let freeReg = ''
      for (let kvPair of this._registerDescriptors.entries()) {
        if (kvPair[1].variables.size == 0 && kvPair[1].usable) {
          freeReg = kvPair[0]
          break
        }
      }
      if (freeReg.length > 0) {
        // 2. Not in a register, but there is a register that is currently empty, pick one such register.
        finalReg = freeReg
      } else {
        const basicBlock = this._ir.basicBlocks[blockIndex]
        // 3. No free register. Need to pick one to replace.
        let scores = new Map<string, number>() // number of instructions needed to generate if pick such register
        for (let kvPair of this._registerDescriptors.entries()) {
          let scoreKey = kvPair[0]
          let scoreValue = 0
          if (!kvPair[1].usable) {
            // Not avaibale
            scoreValue = Infinity
            scores.set(scoreKey, scoreValue)
            continue
          }
          const curentVars = kvPair[1].variables
          for (const currentVar of curentVars) {
            if (currentVar == res && currentVar != otherArg) {
              // it is the result oprand and not another argument oprand, OK to replace because this value will never be used again
              continue
            }
            let reused = false
            let tempIndex = irIndex
            let procedureEnd = false
            while (!procedureEnd && !reused) {
              const tempIR = basicBlock.content[++tempIndex]
              if (tempIR.arg1 == currentVar || tempIR.arg2 == currentVar || tempIR.res == currentVar) {
                reused = true
                break
              }
              if (tempIR.op == 'set_label' && tempIR.res.endsWith('_exit')) procedureEnd = true
            }
            if (!reused) {
              // this variable will never be used again as an argument in subsequent instructions of this procedure
              continue
            } else {
              const boundMem = this._addressDescriptors.get(currentVar)?.boundMemAddress
              if (boundMem != undefined) {
                const addrs = this._addressDescriptors.get(currentVar)?.currentAddresses
                if (addrs != undefined && addrs.size > 1) {
                  // it has another current address, OK to directly replace this one without generating a store instruction
                  continue
                } else {
                  // can replace this one but need to emit an additional store instruction
                  scoreValue += 1
                }
              } else {
                // this is a temporary variable and has no memory address so cannot be replaced!
                scoreValue = Infinity
              }
            }
          }
          scores.set(scoreKey, scoreValue)
        }
        let minScore = Infinity
        let minKey = ''
        for (const kvPair of scores) {
          if (kvPair[1] < minScore) {
            minScore = kvPair[1]
            minKey = kvPair[0]
          }
        }
        assert(minScore != Infinity, 'Cannot find a register to replace.')
        finalReg = minKey
        if (minScore > 0) {
          // need to emit instruction(s) to store back
          const variables = this._registerDescriptors.get(finalReg)?.variables!
          assert(variables, 'Undefined varibales')
          for (const varID of variables) {
            const tempAddrDesc = this._addressDescriptors.get(varID)!
            assert(tempAddrDesc, 'Undefined address descriptor')
            assert(tempAddrDesc.boundMemAddress, 'Undefined bound address')
            const tempBoundAddr = tempAddrDesc.boundMemAddress!
            if (!tempAddrDesc.currentAddresses.has(tempBoundAddr)) {
              this.storeVar(varID, finalReg)
              this._registerDescriptors.get(finalReg)?.variables.delete(varID)
              this._addressDescriptors.get(varID)?.currentAddresses.delete(finalReg)
            }
          }
        }
      }
    }
    return finalReg
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
        if (localVar instanceof IRVar) {
          if (!outer.paramList.includes(localVar)) localData++
        } else localData += localVar.len
      }
      let numGPRs2Save = outer.name == 'main' ? 0 : localData > 10 ? (localData > 18 ? 8 : localData - 8) : 0
      let wordSize = (isLeaf ? 0 : 1) + localData + numGPRs2Save + outgoingSlots + numGPRs2Save // allocate memory for all local variables (but not for temporary variables)
      if (wordSize % 2 != 0) wordSize++ // padding
      this._stackFrameInfos.set(outer.name, {
        isLeaf: isLeaf,
        wordSize: wordSize,
        outgoingSlots: outgoingSlots,
        localData: localData,
        numGPRs2Save: numGPRs2Save,
        numReturnAdd: isLeaf ? 0 : 1,
      }) // for now allocate all regs
    }
  }

  allocateProcMemory(func: IRFunc) {
    const frameInfo = this._stackFrameInfos.get(func?.name)!
    assert(frameInfo, 'Function name not in the pool')
    // must save args passed by register to memory, otherwise they can be damaged
    for (let index = 0; index < func.paramList.length; index++) {
      const memLoc = `${4 * (frameInfo.wordSize + index)}($sp)`
      if (index < 4) {
        this.newAsm(`sw $a${index}, ${memLoc}`)
      }
      this._addressDescriptors.set(func.paramList[index].id, {
        currentAddresses: new Set<string>().add(memLoc),
        boundMemAddress: memLoc,
      })
    }

    let remainingLVSlots = frameInfo.localData
    for (const localVar of func.localVars) {
      if (localVar instanceof IRVar) {
        if (func.paramList.includes(localVar)) continue
        else {
          const memLoc = `${
            4 * (frameInfo.wordSize - (frameInfo.isLeaf ? 0 : 1) - frameInfo.numGPRs2Save - remainingLVSlots--)
          }($sp)`
          this._addressDescriptors.set(localVar.id, {
            currentAddresses: new Set<string>().add(memLoc),
            boundMemAddress: memLoc,
          })
        }
      } else {
        // TODO: array support
      }
    }

    const availableRSs = func.name == 'main' ? 8 : frameInfo.numGPRs2Save

    // allocate $s0 ~ $s8
    for (let index = 0; index < 8; index++) {
      let usable = index < availableRSs
      this._registerDescriptors.set(`$s${index}`, { usable: usable, variables: new Set<string>() })
    }

    this.allocateGlobalMemory()
  }

  allocateGlobalMemory() {
    const globalVars = this._ir.varPool.filter(v => IRGenerator.sameScope(v.scope, GlobalScope))
    for (const globalVar of globalVars) {
      if (globalVar instanceof IRVar) {
        this._addressDescriptors.set(globalVar.id, {
          currentAddresses: new Set<string>().add(globalVar.name),
          boundMemAddress: `${globalVar.name}($0)`,
        })
      } else {
        // TODO: array support
      }
    }
  }

  deallocateProcMemory() {
    for (const kvpair of this._addressDescriptors.entries()) {
      const boundMemAddress = kvpair[1].boundMemAddress
      const currentAddresses = kvpair[1].currentAddresses
      if (boundMemAddress != undefined && !currentAddresses.has(boundMemAddress)) {
        // need to write this back to its bound memory location
        if (currentAddresses.size > 0) {
          for (const addr of currentAddresses.values()) {
            if (addr[0] == '$') {
              this.storeVar(kvpair[0], addr)
              break
            }
          }
        } else {
          assert(false, `Attempted to store a ghost variable: ${kvpair[0]}`)
        }
      }
    }
    this._addressDescriptors.clear()
    for (let pair of this._registerDescriptors) {
      pair[1].variables.clear()
    }
  }

  deallocateBlockMemory() {
    for (const kvpair of this._addressDescriptors.entries()) {
      const boundMemAddress = kvpair[1].boundMemAddress
      const currentAddresses = kvpair[1].currentAddresses
      if (boundMemAddress != undefined && !currentAddresses.has(boundMemAddress)) {
        // need to write this back to its bound memory location
        if (currentAddresses.size > 0) {
          for (const addr of currentAddresses.values()) {
            if (addr[0] == '$') {
              this.storeVar(kvpair[0], addr)
              break
            }
          }
        } else {
          assert(false, `Attempted to store a ghost variable: ${kvpair[0]}`)
        }
      }
    }
    for (let pair of this._registerDescriptors) {
      pair[1].variables.clear()
    }
    for (let value of this._addressDescriptors.values()) {
      for (let addr of value.currentAddresses) {
        if (addr[0] == '$') value.currentAddresses.delete(addr)
      }
    }
  }

  /**
   * @see https://github.com/seu-cs-class2/minisys-minicc-ts/blob/master/docs/IR.md
   */
  processTextSegment() {
    // TODO: DOLLAR
    let currentFunc, currentFrameInfo
    for (let blockIndex = 0; blockIndex < this._ir.basicBlocks.length; blockIndex++) {
      const basicBlock = this._ir.basicBlocks[blockIndex]
      for (let irIndex = 0; irIndex < basicBlock.content.length; irIndex++) {
        const quad = basicBlock.content[irIndex]
        if (quad == undefined) break
        const { op, arg1, arg2, res } = quad
        const binaryOp = !!(arg1.trim() && arg2.trim()) // 是二元表达式
        const unaryOp = !!(+!!arg1.trim() ^ +!!arg2.trim()) // 是一元表达式
        if (op == 'call') {
          // parse the function name
          const func = this._ir.funcPool.find(element => element.name == arg1)
          if (func == undefined) throw new Error(`unidentified function:${arg1}`)
          assert(func.name != 'main', 'Cannot call main!')
          const actualArguments = arg2.split('&')
          // has arguments
          if (binaryOp) {
            for (let argNum = 0; argNum < func.paramList.length; argNum++) {
              const actualArg = actualArguments[argNum];
              const ad =  this._addressDescriptors.get(actualArg)
              if (ad == undefined || ad.currentAddresses == undefined || ad.currentAddresses.size == 0) {
                throw new Error('Actual argument does not have current address')
              }
              else {
                for (const kvpair of this._addressDescriptors.entries()) {
                  const boundMemAddress = kvpair[1].boundMemAddress
                  const currentAddresses = kvpair[1].currentAddresses
                  if(boundMemAddress != undefined && !currentAddresses.has(boundMemAddress)) {
                    // need to write this back to its bound memory location
                    if (currentAddresses.size > 0) {
                      for (const addr of currentAddresses.values()) {
                        if (addr.substr(0, 2) == '$t') {
                          this.storeVar(kvpair[0], addr)
                          break
                        }
                      }
                    }
                    else {
                      throw new Error(`Attempted to store a ghost variable: ${kvpair[0]}`)
                    }
                  }
                }
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
                    this.newAsm(`move $a${argNum}, ${regLoc}`)
                  }
                  else {
                    this.newAsm(`sw ${regLoc}, ${4*argNum}($sp)`)
                  }
                }
                else {
                  if (argNum < 4) {
                    this.newAsm(`lw $a${argNum}, ${memLoc}`)
                  }
                  else {
                    // since $v1 will not be used elsewhere, it is used to do this!
                    this.newAsm(`lw $v1, ${memLoc}`)
                    this.newAsm(`sw $v1, ${4*argNum}($sp)`)
                  }
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
            const [regX] = this.getRegs(quad, blockIndex, irIndex)
            this.newAsm(`move ${regX}, $v0`)
            
            // Manage descriptors

            // a. Change the register descriptor for regX so that it only holds res
            this._registerDescriptors.get(regX)?.variables.clear()
            this._registerDescriptors.get(regX)?.variables.add(res)

            if (this._addressDescriptors.has(res)) {
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
            else {
              // temporary vairable
              this._addressDescriptors.set(res, {boundMemAddress: undefined, currentAddresses: new Set<string>().add(regX)})
            }
          }
        }
        else if (binaryOp) {
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
              const [regY, regZ] = this.getRegs(quad, blockIndex, irIndex)
              this.newAsm(`sw ${regZ}, 0(${regY})`)
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
                const [regY, regZ, regX] = this.getRegs(quad, blockIndex, irIndex)
                // emit respective instructions
                switch (op) {
                  case 'BITOR_OP':
                  case 'OR_OP': {
                    this.newAsm(`or ${regX}, ${regY}, ${regZ}`)
                    break
                  }
                  case 'BITAND_OP':
                  case 'AND_OP': {
                    this.newAsm(`and ${regX}, ${regY}, ${regZ}`)
                    break
                  }
                  case 'BITXOR_OP': {
                    this.newAsm(`xor ${regX}, ${regY}, ${regZ}`)
                    break
                  }
                  case 'PLUS': {
                    this.newAsm(`add ${regX}, ${regY}, ${regZ}`)
                    break
                  }
                  case 'MINUS': {
                    this.newAsm(`sub ${regX}, ${regY}, ${regZ}`)
                    break
                  }
                  case 'LEFT_OP': {
                    this.newAsm(`sllv ${regX}, ${regY}, ${regZ}`)
                    break
                  }
                  case 'RIGHT_OP': {
                    this.newAsm(`srlv ${regX}, ${regY}, ${regZ}`)
                    break
                  }
                  case 'EQ_OP': {
                    this.newAsm(`sub ${regX}, ${regY}, ${regZ}`)
                    this.newAsm(`nor ${regX}, ${regY}, ${regZ}`)
                    break
                  }
                  case 'NE_OP': {
                    this.newAsm(`sub ${regX}, ${regY}, ${regZ}`)
                    break
                  }
                  case 'LT_OP': {
                    this.newAsm(`slt ${regX}, ${regY}, ${regZ}`)
                    break
                  }
                  case 'GT_OP': {
                    this.newAsm(`slt ${regX}, ${regZ}, ${regY}`)
                    break
                  }
                  case 'GE_OP': {
                    this.newAsm(`slt ${regX}, ${regY}, ${regZ}`)
                    this.newAsm(`nor ${regX}, ${regX}, ${regX}`)
                    break
                  }
                  case 'LE_OP': {
                    this.newAsm(`slt ${regX}, ${regZ}, ${regY}`)
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

                if (this._addressDescriptors.has(res)) {
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
                } else {
                  // temporary vairable
                  this._addressDescriptors.set(res, {
                    boundMemAddress: undefined,
                    currentAddresses: new Set<string>().add(regX),
                  })
                }
              }
              break
            default:
              break
          }
        } else if (unaryOp) {
          switch (op) {
            case 'out_asm': {
              // directly output assembly
              this.newAsm(arg1)
              break
            }
            case 'j_false': {
              const [regY] = this.getRegs(quad, blockIndex, irIndex)
              this.deallocateBlockMemory()
              this.newAsm(`beq ${regY}, $zero, ${res}`)
              this.newAsm(`nop`) // delay-slot
              break
            }
            case '=const': {
              const [regX] = this.getRegs(quad, blockIndex, irIndex)
              const immediateNum = parseInt(arg1)
              if (immediateNum <= 65535 && immediateNum >= 0) {
                this.newAsm(`addiu ${regX}, $zero, ${arg1}`)
              } else {
                const lowerHalf = immediateNum & 0x00ff
                const higherHalf = immediateNum >> 16
                this.newAsm(`lui ${regX}, ${higherHalf}`)
                this.newAsm(`ori ${regX}, ${regX}, ${lowerHalf}`)
              }

              // Manage descriptors

              // a. Change the register descriptor for regX so that it only holds res
              this._registerDescriptors.get(regX)?.variables.clear()
              this._registerDescriptors.get(regX)?.variables.add(res)

              if (this._addressDescriptors.has(res)) {
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
              } else {
                // temporary vairable
                this._addressDescriptors.set(res, {
                  boundMemAddress: undefined,
                  currentAddresses: new Set<string>().add(regX),
                })
              }
              break
            }
            case '=var':
              const [regY] = this.getRegs(quad, blockIndex, irIndex)
              // Add res to the register descriptor for regY
              this._registerDescriptors.get(regY)?.variables.add(res)
              // Change the address descriptor for res so that its only location is regY
              if (this._addressDescriptors.has(res)) {
                this._addressDescriptors.get(res)?.currentAddresses.clear()
                this._addressDescriptors.get(res)?.currentAddresses.add(regY)
              } else {
                // temporary vairable
                this._addressDescriptors.set(res, {
                  boundMemAddress: undefined,
                  currentAddresses: new Set<string>().add(regY),
                })
              }
              break
            case 'return_expr': {
              const ad = this._addressDescriptors.get(arg1)
              if (ad == undefined || ad.currentAddresses == undefined || ad.currentAddresses.size == 0) {
                assert(false, 'Return value does not have current address')
              } else {
                let regLoc = ''
                let memLoc = ''
                for (const addr of ad.currentAddresses) {
                  if (addr[0] == '$') {
                    // register has higher priority
                    regLoc = addr
                    break
                  } else {
                    memLoc = addr
                  }
                }

                if (regLoc.length > 0) {
                  this.newAsm(`move $v0, ${regLoc}`)
                } else {
                  this.newAsm(`lw $v0, ${memLoc}`)
                }
              }

              this.deallocateBlockMemory()

              if (currentFrameInfo == undefined) throw new Error('undefined frame info')
              for (let index = 0; index < currentFrameInfo.numGPRs2Save; index++) {
                this.newAsm(`lw $s${index}, ${4 * (currentFrameInfo.wordSize - currentFrameInfo.numGPRs2Save + index)}($sp)`)
              }

              if (!currentFrameInfo.isLeaf) {
                this.newAsm(`lw $ra, ${4 * (currentFrameInfo.wordSize - 1)}($sp)`)
              }
              this.newAsm(`addiu $sp, $sp, ${4 * currentFrameInfo.wordSize}`)
              this.newAsm(`jr $ra`)
              break
            }
            case 'NOT_OP':
            case 'MINUS':
            case 'PLUS':
            case 'BITINV_OP': {
              const [regY, regX] = this.getRegs(quad, blockIndex, irIndex)
              if (!this._registerDescriptors.get(regY)?.variables.has(arg1)) {
                this.loadVar(arg1, regY)
              }
              switch (op) {
                case 'NOT_OP':
                  this.newAsm(`xor ${regX}, $zero, ${regY}`)
                  break
                case 'MINUS':
                  this.newAsm(`sub ${regX}, $zero, ${regY}`)
                  break
                case 'PLUS':
                  this.newAsm(`move ${regX}, ${regY}`)
                  break
                case 'BITINV_OP':
                  this.newAsm(`nor ${regX}, ${regY}, ${regY}`)
                  break
                default:
                  break
              }

              // Manage descriptors

              // a. Change the register descriptor for regX so that it only holds res
              this._registerDescriptors.get(regX)?.variables.clear()
              this._registerDescriptors.get(regX)?.variables.add(res)

              if (this._addressDescriptors.has(res)) {
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
              } else {
                // temporary vairable
                this._addressDescriptors.set(res, {
                  boundMemAddress: undefined,
                  currentAddresses: new Set<string>().add(regX),
                })
              }

              break
            }
            default:
              break
          }
        } else {
          switch (op) {
            case 'set_label': {
              // parse the label to identify type
              const labelContents = res.split('_')
              const labelType = labelContents[labelContents.length - 1]
              if (labelType == 'entry') {
                // find the function in symbol table
                currentFunc = this._ir.funcPool.find(element => element.entryLabel == res)!
                assert(currentFunc, `Function name not in the pool: ${res}`)
                currentFrameInfo = this._stackFrameInfos.get(currentFunc?.name)!
                assert(currentFrameInfo, `Function name not in the pool: ${res}`)
                this.newAsm(
                  currentFunc?.name +
                    ':' +
                    `\t\t # vars = ${currentFrameInfo.localData}, regs to save($s#) = ${
                      currentFrameInfo.numGPRs2Save
                    }, outgoing args = ${currentFrameInfo.outgoingSlots}, ${
                      currentFrameInfo.numReturnAdd ? '' : 'do not '
                    }need to save return address`
                )
                this.newAsm(`addiu $sp, $sp, -${4 * currentFrameInfo.wordSize}`)
                if (!currentFrameInfo.isLeaf) {
                  this.newAsm(`sw $ra, ${4 * (currentFrameInfo.wordSize - 1)}($sp)`)
                }
                for (let index = 0; index < currentFrameInfo.numGPRs2Save; index++) {
                  this.newAsm(`sw $s${index}, ${4 * (currentFrameInfo.wordSize - currentFrameInfo.numGPRs2Save + index)}($sp)`)
                }
                this.allocateProcMemory(currentFunc)
              } else if (labelType == 'exit') {
                this.deallocateProcMemory()
              } else {
                this.newAsm(res + ':')
              }
              break
            }
            case 'j': {
              this.deallocateBlockMemory()
              this.newAsm(`j ${res}`)
              this.newAsm(`nop`) // delay-slot
              break
            }
            case 'return_void': {
              this.deallocateBlockMemory()
              if (currentFrameInfo == undefined) throw new Error('undefined frame info')
              for (let index = 0; index < currentFrameInfo.numGPRs2Save; index++) {
                this.newAsm(`lw $s${index}, ${4 * (currentFrameInfo.wordSize - currentFrameInfo.numGPRs2Save + index)}($sp)`)
              }

              if (!currentFrameInfo.isLeaf) {
                this.newAsm(`lw $ra, ${4 * (currentFrameInfo.wordSize - 1)}($sp)`)
              }
              this.newAsm(`addiu $sp, $sp, ${4 * currentFrameInfo.wordSize}`)
              this.newAsm(`jr $ra`)
              break
            }
            default:
              break
          }
        }
        if (op != 'set_label' && op != 'j' && op != 'j_false' && irIndex == basicBlock.content.length - 1) {
          this.deallocateBlockMemory()
        }
      }
    }
  }
}
