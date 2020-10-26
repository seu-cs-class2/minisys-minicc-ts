import { DFA } from '../seu-lex-yacc/seulex/DFA'
import { LexParser } from '../seu-lex-yacc/seulex/LexParser'
import { NFA } from '../seu-lex-yacc/seulex/NFA'
import * as path from 'path'

const dfa = DFA.fromNFA(NFA.fromLexParser(new LexParser(path.join(__dirname, '../../src/lexer/MiniC.l'))))
dfa.dump(
  `Generated from MiniC.l @ ${new Date().toLocaleDateString()}`,
  path.join(__dirname, '../../src/lexer/MiniC-Lex.json')
)
dfa.dump(
  `Generated from MiniC.l @ ${new Date().toLocaleDateString()}`,
  path.join(__dirname, '../../dist/lexer/MiniC-Lex.json')
)
