/**
 * Minisys架构相关
 * 2020-11 @ https://github.com/seu-cs-class2/minisys-minicc-ts
 */

// prettier-ignore
export const allRegs = [
  'zero', 'at',
  'v0', 'v1',
  'a0', 'a1', 'a2', 'a3',
  't0', 't1', 't2', 't3', 't4', 't5', 't6', 't7',
  's0', 's1', 's2', 's3', 's4', 's5', 's6', 's7',
  'k0', 'k1',
  'gp', 'sp', 'fp',
  'ra',
]

// prettier-ignore
export const usefulRegs = <const>[
  't0', 't1', 't2', 't3', 't4', 't5', 't6', 't7', // 子程序可以破坏其中的值
  's0', 's1', 's2', 's3', 's4', 's5', 's6', 's7', // 子程序必须保持前后的值
]
