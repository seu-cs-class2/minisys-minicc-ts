// LR1语法分析使用示例

import { lexSourceCode } from '../lexer/Lex'
import { DFA } from '../seu-lex-yacc/seulex/DFA'
import * as path from 'path'
import { LR1Analyzer } from '../seu-lex-yacc/seuyacc/LR1'
import { parseTokensLR1 } from './ParseLR1'

const CCode = String.raw`
int main() {
  int a = 10;
  int b = 100; // change = to # to get an UNMATCH
  float c = a + b / 2.5;
  printf("\2f", c);
  return 0;
}
`
const lexDFA = DFA.fromFile(path.join(__dirname, '../../syntax/TestC-Lex.json'))
const tokens = lexSourceCode(CCode, lexDFA)
console.log(tokens)

const lr1 = LR1Analyzer.load(path.join(__dirname, '../../syntax/TestC-LR1Parse.json'))
parseTokensLR1(tokens, lr1)
