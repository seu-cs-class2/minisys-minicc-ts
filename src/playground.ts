import { DFA } from './seu-lex-yacc/seulex/DFA'
import { lexSourceCode } from './lexer/Lex'
import { LexParser } from './seu-lex-yacc/seulex/LexParser'
import { NFA } from './seu-lex-yacc/seulex/NFA'

// console.log('Start DFA construction...')
// const dfa = DFA.fromNFA(NFA.fromLexParser(new LexParser('F:\\minisys-minicc-ts\\src\\lexer\\MiniC.l')))
// console.log('Start dumping...')
// dfa.dump('Generated from MiniC.l', 'F:\\minisys-minicc-ts\\src\\lexer\\dump.json')

const dfa = DFA.fromFile('F:\\minisys-minicc-ts\\src\\lexer\\dump.json')
const cCode = `
int main() {
  int a = 2;
  for (int i = 0; i < MAX_INT; i++) {
    if (i != 0) {
      printf("Hello, world!");
    }
  }
  return 0;
}
`

console.log(lexSourceCode(cCode, dfa))

import { LR1Analyzer } from './seu-lex-yacc/seuyacc/LR1'
import { YaccParser } from './seu-lex-yacc/seuyacc/YaccParser'

const filePath = 'F:\\minisys-minicc-ts\\src\\parser\\MiniC.y'
const dumpPath = 'F:\\minisys-minicc-ts\\src\\parser\\dump.json'
const lr1 = new LR1Analyzer(new YaccParser(filePath))
lr1.dump(dumpPath)
console.log(lr1)
