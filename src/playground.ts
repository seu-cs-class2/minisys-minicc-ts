// Try something here.

import { lexSourceCode } from './lexer/Lex'
import { DFA } from './seu-lex-yacc/seulex/DFA'
import { ASTNode } from './ir/AST'
import { LALRAnalyzer } from './seu-lex-yacc/seuyacc/LALR'
import { parseTokensLALR } from './parser/ParseLALR'
import { IRGenerator } from './ir/IRGenerator'
import path from 'path'
import * as fs from 'fs'
import { IROptimizer } from './ir/IROptimizer'
import { preCompile } from './pre-compile/PreCompile'
import { SeuError } from './seu-lex-yacc/utils'
import { ASMGenerator } from './asm/ASMGenerator'

const CCode = `
int main(void) {
  int a;
  int b;
  a = 10;
  b = 20;
  b = a + b;
  return 0;
}
`

try {
  // 预编译
  const cookedCCode = preCompile(CCode, path.join(__dirname, './'))

  // 词法分析
  const lexDFA = DFA.fromFile(path.join(__dirname, '../syntax/MiniC/MiniC-Lex.json'))
  let tokens = lexSourceCode(cookedCCode, lexDFA)

  // 语法分析
  const lalr = LALRAnalyzer.load(path.join(__dirname, '../syntax/MiniC/MiniC-LALRParse.json'))
  const root = parseTokensLALR(tokens, lalr) as ASTNode

  // 中间代码生成
  const ir = new IRGenerator(root)
  console.log(ir.toIRString())

  // 中间代码优化
  const opt = new IROptimizer(ir)
  console.log(opt.printLogs())

  // 目标代码生成
  const asm = new ASMGenerator(ir)
  fs.writeFileSync(path.join(__dirname, './output.asm'), asm.toAssembly())
} catch (ex) {
  if (ex instanceof SeuError) console.error('[SeuError] ' + ex.message)
  else throw ex
}
