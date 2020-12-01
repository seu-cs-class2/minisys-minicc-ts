// LALR语法分析使用示例

import { lexSourceCode } from '../lexer/Lex'
import { DFA } from '../seu-lex-yacc/seulex/DFA'
import * as path from 'path'
import { ASTNode, visualizeAST } from '../ir/AST'
import { LALRAnalyzer } from '../seu-lex-yacc/seuyacc/LALR'
import { parseTokensLALR } from './ParseLALR'

const CCode = String.raw`
int main() {
  int a = 10;
  int b = 100;
  func(a, c);
  return 0;
}
`
const lexDFA = DFA.fromFile(path.join(__dirname, '../../syntax/MiniC-Lex.json'))
const tokens = lexSourceCode(CCode, lexDFA)
console.log(tokens)
const lalr = LALRAnalyzer.load(path.join(__dirname, '../../syntax/MiniC-LALRParse.json'))
// console.dir(lalr.dfa.states[11], { depth: null })
// console.log(lalr.dfa.states[11])
// console.log(lalr.dfa.states[11].items)
// console.log(lalr.dfa.states[11].items.map(v => lalr.formatPrintProducer(lalr.producers[v.producer])).join('\n'))

const final = parseTokensLALR(tokens, lalr) as ASTNode
// visualizeAST(final)
