/**
 * 汇编代码生成器
 * 2020-12 @ https://github.com/seu-cs-class2/minisys-minicc-ts
 */

import { IRGenerator } from '../ir/IRGenerator'

export class ASMGenerator {
  private _ir: IRGenerator

  constructor(ir: IRGenerator) {
    this._ir = ir
  }
}
