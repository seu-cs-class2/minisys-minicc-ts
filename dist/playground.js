"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const DFA_1 = require("./seu-lex-yacc/seulex/DFA");
const Lex_1 = require("./seu-lex-yacc/seulex/Lex");
// console.log('Start DFA construction...')
// const dfa = DFA.fromNFA(NFA.fromLexParser(new LexParser('F:\\minisys-minicc-ts\\src\\lexer\\MiniC.l')))
// console.log('Start dumping...')
// dfa.dump('Generated from MiniC.l', 'F:\\minisys-minicc-ts\\src\\lexer\\dump.json')
const dfa = DFA_1.DFA.fromFile('F:\\minisys-minicc-ts\\src\\lexer\\dump.json');
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
`;
console.log(Lex_1.lexSourceCode(cCode, dfa));
