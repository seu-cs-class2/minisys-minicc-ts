// Try something here.

import { lexSourceCode } from './lexer/Lex'
import { DFA } from './seu-lex-yacc/seulex/DFA'
import * as path from 'path'
import { ASTNode, visualizeAST } from './ir/AST'
import { LALRAnalyzer } from './seu-lex-yacc/seuyacc/LALR'
import { parseTokensLALR } from './parser/ParseLALR'
import { WHITESPACE_TOKENNAME } from './seu-lex-yacc/utils'
import { LR1Analyzer } from './seu-lex-yacc/seuyacc/LR1'
import { parseTokensLR1 } from './parser/ParseLR1'
import { visualizeLALRACTIONGOTOTable, visualizeLR1ACTIONGOTOTable } from './seu-lex-yacc/seuyacc/Visualizer'

const CCode = String.raw`
int main(void) {
  int a;
  int b;
  a = 10;
  b = 20;
  func(a, c);
}
`
const lexDFA = DFA.fromFile(path.join(__dirname, '../syntax/MiniC/MiniC-Lex.json'))
const tokens = lexSourceCode(CCode, lexDFA)
console.log(tokens.filter(v => v.name != WHITESPACE_TOKENNAME))

const lr1 = LR1Analyzer.load(path.join(__dirname, '../syntax/MiniMiniC/MiniMiniC-LR1Parse.json'))
const lalr = LALRAnalyzer.load(path.join(__dirname, '../syntax/MiniMiniC/MiniMiniC-LALRParse.json'))

// visualizeLR1ACTIONGOTOTable(lr1)
visualizeLALRACTIONGOTOTable(lalr)

// const ast = parseTokensLR1(tokens, lr1)
const ast = parseTokensLALR(tokens, lalr)

// visualizeAST(ast!)
