// Try something here.

// 中间代码生成样例

import { lexSourceCode } from './lexer/Lex'
import { DFA } from './seu-lex-yacc/seulex/DFA'
import * as path from 'path'
import { ASTNode, visualizeAST } from './ir/AST'
import { LALRAnalyzer } from './seu-lex-yacc/seuyacc/LALR'
import { parseTokensLALR } from './parser/ParseLALR'
import { IRGenerator } from './ir/IRGenerator'
import { ASMGenerator } from './asm/ASMGenerator'
import { visualizeGOTOGraph, visualizeLALRACTIONGOTOTable } from './seu-lex-yacc/seuyacc/Visualizer'

const CCode1 = String.raw`
int a;
void foo(int x) {
  int y;
  return x + y;
}
void func(int a, int b) {
  int z;
  return;
}
int main(void) {
  int a;
  int b;
  a = 10;
  b = 20;
  if (a > b) {
    func(a, b);
  }
  while (a > b) {
    int a;
    if (a < b) {
      int c = a;
      foo(b);
    }
  }
  return;
}
`
const CCode = String.raw`
int a;
void foo(int x) {
  int y;
  return x + y;
}
void func(int a, int b) {
  int z;
  return;
}
int main(void) {
  int a;
  int b;
  a = 10;
  b = 20;
  if (a > b) {
    func(a, b);
  }
  while (a > b) {
    int a;
    if (a < b) {
      int c = a;
      foo(b);
    }
  }
  return;
}
`
const lexDFA = DFA.fromFile(path.join(__dirname, '../syntax/MiniC/MiniC-Lex.json'))
const tokens = lexSourceCode(CCode, lexDFA)

const lalr = LALRAnalyzer.load(path.join(__dirname, '../syntax/MiniC/MiniC-LALRParse.json'))
// visualizeGOTOGraph(lalr.dfa, lalr)
// visualizeLALRACTIONGOTOTable(lalr)

const root = parseTokensLALR(tokens, lalr) as ASTNode

// visualizeAST(root)

// const ir = new IRGenerator(root)

// console.log(ir.toIRString())

// const asm = new ASMGenerator(ir)

// console.log(asm.toAssembly())
