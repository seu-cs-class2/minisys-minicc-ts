// Try something here.

// 中间代码生成样例

import { lexSourceCode } from './lexer/Lex'
import { DFA } from './seu-lex-yacc/seulex/DFA'
import * as path from 'path'
import { ASTNode } from './ir/AST'
import { LALRAnalyzer } from './seu-lex-yacc/seuyacc/LALR'
import { parseTokensLALR } from './parser/ParseLALR'
import { IRGenerator } from './ir/IRGenerator'
import { ASMGenerator } from './asm/ASMGenerator'

const CCode = String.raw`
int main(void) {
  int a;
  int b;
  a = 10;
  b = 20;
  if (a > b) {
    b = 30;
  }
  b = 40;
}
`
const lexDFA = DFA.fromFile(path.join(__dirname, '../syntax/MiniC/MiniC-Lex.json'))
const tokens = lexSourceCode(CCode, lexDFA)

const lalr = LALRAnalyzer.load(path.join(__dirname, '../syntax/MiniC/MiniC-LALRParse.json'))
const root = parseTokensLALR(tokens, lalr) as ASTNode

const ir = new IRGenerator(root)

console.log(ir.toIRString())

const asm = new ASMGenerator(ir)

console.log(asm.toAssembly())
