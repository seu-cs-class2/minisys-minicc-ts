// 词法分析使用示例
// 1 - 空白符的Token名为_WHITESPACE
// 2 - 非法符号的Token名为_UNMATCH

import { lexSourceCode } from './Lex'
import { DFA } from '../seu-lex-yacc/seulex/DFA'
import * as path from 'path'

const CCode = String.raw`
int main() {
  int a = 10;
  int b = 100; // change = to # to get an UNMATCH
  float c = a + b / 2.5;
  printf("\2f", c);
  return 0;
}
`
const lexDFA = DFA.fromFile(path.join(__dirname, '../../syntax/MiniC-Lex.json'))
const tokens = lexSourceCode(CCode, lexDFA)
console.log(tokens)
