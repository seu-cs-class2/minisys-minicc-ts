// 中间代码生成样例

import { lexSourceCode } from '../lexer/Lex'
import { DFA } from '../seu-lex-yacc/seulex/DFA'
import * as path from 'path'
import { ASTNode } from './AST'
import { LALRAnalyzer } from '../seu-lex-yacc/seuyacc/LALR'
import { parseTokensLALR } from '../parser/ParseLALR'
import { IRGenerator } from './IRGenerator'

const CCode = String.raw`
int main(void) {
  int a;
  int b;
  a = 10;
  b = 20;
  func(a, b);
}
`
const lexDFA = DFA.fromFile(path.join(__dirname, '../../syntax/MiniC/MiniC-Lex.json'))
const tokens = lexSourceCode(CCode, lexDFA)

const lalr = LALRAnalyzer.load(path.join(__dirname, '../../syntax/MiniC/MiniC-LALRParse.json'))
const root = parseTokensLALR(tokens, lalr) as ASTNode

const ir = new IRGenerator(root)
console.dir(ir, {
  depth: 4,
})
console.log('\n=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=\n')
console.log(ir.toIRString())
