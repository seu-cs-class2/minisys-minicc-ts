// LR1语法分析使用示例

import { lexSourceCode } from '../lexer/Lex'
import { DFA } from '../seu-lex-yacc/seulex/DFA'
import * as path from 'path'
import { LR1Analyzer } from '../seu-lex-yacc/seuyacc/LR1'
import { parseTokensLR1 } from './ParseLR1'
import { ASTNode, visualizeAST } from '../ir/AST'

const CCode = String.raw`
int main(void) {
  int a;
  int b;
  a = 10;
  b = 20;
  func(a, c);
}
`
const lexDFA = DFA.fromFile(path.join(__dirname, '../../syntax/MiniC-Lex.json'))
const tokens = lexSourceCode(CCode, lexDFA)
const lr1 = LR1Analyzer.load(path.join(__dirname, '../../syntax/MiniMiniC-LR1Parse.json'))
const final = parseTokensLR1(tokens, lr1) as ASTNode
visualizeAST(final)
