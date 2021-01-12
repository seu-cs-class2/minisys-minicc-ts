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

const CCode1 = `
int fib(int x) {
  int a;
  int b;
  if (x == 1) {
    return 1;
  } 
  if (x == 2) {
    return 1;
  }
  a = fib(x - 1);
  b = fib(x - 2);
  // return fib(x - 1) + fib(x - 2);
  return a + b;
}
int main(void) {
  int result;
  result = fib(8);
  return result;
}
`

const CCode = `
int a[10];
int main(void) {
  a[5] = 2;
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

  // 中间代码优化
  const opt = new IROptimizer(ir)
  console.log(ir.toIRString())
  console.log(opt.printLogs())

  // 目标代码生成
  const asm = new ASMGenerator(ir)
  fs.writeFileSync(path.join(__dirname, './output.asm'), asm.toAssembly())
} catch (ex) {
  if (ex instanceof SeuError) console.error('[SeuError] ' + ex.message)
  else throw ex
}
