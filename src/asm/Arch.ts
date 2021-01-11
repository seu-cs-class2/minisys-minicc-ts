/**
 * Minisys架构相关
 * 2020-11 @ https://github.com/seu-cs-class2/minisys-minicc-ts
 */

// prettier-ignore
export const AllRegs = [
  '$zero', '$at',
  '$v0', '$v1',
  '$a0', '$a1', '$a2', '$a3',
  '$t0', '$t1', '$t2', '$t3', '$t4', '$t5', '$t6', '$t7', '$t8', '$t9',
  '$s0', '$s1', '$s2', '$s3', '$s4', '$s5', '$s6', '$s7',
  '$k0', '$k1',
  '$gp', '$sp', '$fp',
  '$ra',
]

// prettier-ignore
export const UsefulRegs = <const>[
  '$t0', '$t1', '$t2', '$t3', '$t4', '$t5', '$t6', '$t7', '$t8', '$t9', // 子程序可以破坏其中的值
  '$s0', '$s1', '$s2', '$s3', '$s4', '$s5', '$s6', '$s7', // 子程序必须保持前后的值
]

export const WordLengthBit = 32
export const WordLengthByte = 4
export const RAMSize = 65536 // bytes
export const ROMSize = 65536 // bytes
export const IOMaxAddr = 0xffffffff