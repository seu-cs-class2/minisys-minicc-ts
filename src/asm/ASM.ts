/**
 * 目标代码生成相关定义
 * 2021-01 @ https://github.com/seu-cs-class2/minisys-minicc-ts
 */

// 寄存器描述符
export interface RegisterDescriptor {
  usable: boolean
  variables: Set<string>
}

// 地址描述符
export interface AddressDescriptor {
  currentAddresses: Set<string>
  boundMemAddress: string | undefined // temporary variables should not have mem locations
}

// 栈帧信息
export interface StackFrameInfo {
  // A non-leaf function is one that calls other func- tion(s); a leaf function is one that does not itself make any function calls.
  isLeaf: boolean
  wordSize: number
  outgoingSlots: number
  localData: number
  numGPRs2Save: number
  numReturnAdd: number
}
