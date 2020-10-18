import { DFA } from './seu-lex-yacc/seulex/DFA'
import { lexSourceCode } from './seu-lex-yacc/seulex/Lex'
import { LexParser } from './seu-lex-yacc/seulex/LexParser'
import { NFA } from './seu-lex-yacc/seulex/NFA'

// console.log('Start DFA construction...')
// const dfa = DFA.fromNFA(NFA.fromLexParser(new LexParser('F:\\minisys-minicc-ts\\src\\lexer\\MiniC.l')))
// console.log('Start dumping...')
// dfa.dump('Generated from MiniC.l', 'F:\\minisys-minicc-ts\\src\\lexer\\dump.json')

const dfa = DFA.fromFile('E:\\program\\project\\seu-cs-class2\\minisys-minicc-ts\\src\\lexer\\dump.json')
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
