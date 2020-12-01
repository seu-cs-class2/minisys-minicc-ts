// LALR语法分析使用示例

import { lexSourceCode } from '../lexer/Lex'
import { DFA } from '../seu-lex-yacc/seulex/DFA'
import * as path from 'path'
import { ASTNode, visualizeAST } from '../ir/AST'
import { LALRAnalyzer } from '../seu-lex-yacc/seuyacc/LALR'
import { parseTokensLALR } from './ParseLALR'
import { WHITESPACE_TOKENNAME } from '../seu-lex-yacc/utils'

const CCode = String.raw`
int main(void) {
  int a;
  int b;
  a = 10;
  b = 20;
  func(a, c);
  return 0;
}
`
const lexDFA = DFA.fromFile(path.join(__dirname, '../../syntax/MiniC/MiniC-Lex.json'))
const tokens = lexSourceCode(CCode, lexDFA)
console.log(tokens.filter(v=>v.name != WHITESPACE_TOKENNAME))

const lalr = LALRAnalyzer.load(path.join(__dirname, '../../syntax/MiniC/MiniC-LALRParse.json'))

console.log(lalr.watchState(24))

const final = parseTokensLALR(tokens, lalr) as ASTNode
// visualizeAST(final)
