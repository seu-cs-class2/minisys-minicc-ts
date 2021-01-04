// Try something here.

import { lexSourceCode } from './lexer/Lex'
import { DFA } from './seu-lex-yacc/seulex/DFA'
import { ASTNode } from './ir/AST'
import { LALRAnalyzer } from './seu-lex-yacc/seuyacc/LALR'
import { parseTokensLALR } from './parser/ParseLALR'
import { IRGenerator } from './ir/IRGenerator'
import path from 'path'
import { IROptimizer } from './ir/IROptimizer'
import { preCompile } from './pre-compile/PreCompile'
import { UNMATCH_TOKENNAME } from './seu-lex-yacc/utils'

// 测试代码
const CCode1 = `
// hello
#include "./test.c"

string a;
void proc(void) {
  return;
}
int main(void) {
  a = "hello, world!";
  a = proc();
  proc();
  return 0;
}
`

const CCode = `
int a;
int main(void) {
  int b;
  int c;
  c = 5;
  a = 20;
  b = a + 20 * 2;
  // c = b;
  return b;
}
`

const after = preCompile(CCode, path.join(__dirname, './'))
console.log(after)

const lexDFA = DFA.fromFile(path.join(__dirname, '../syntax/MiniC/MiniC-Lex.json'))
let tokens = lexSourceCode(after, lexDFA)

const lalr = LALRAnalyzer.load(path.join(__dirname, '../syntax/MiniC/MiniC-LALRParse.json'))
const root = parseTokensLALR(tokens, lalr) as ASTNode

const ir = new IRGenerator(root)
console.log(ir.toIRString())

const opt = new IROptimizer(ir)
console.log(opt.quads.map(v => v.toString()))

console.log(opt.printLogs())
