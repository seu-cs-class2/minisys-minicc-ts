import { LALRAnalyzer } from './seu-lex-yacc/seuyacc/LALR'
import { LR0Analyzer } from './seu-lex-yacc/seuyacc/LR0'
import { LR1Analyzer } from './seu-lex-yacc/seuyacc/LR1'
import { visualizeGOTOGraph } from './seu-lex-yacc/seuyacc/Visualizer'
import { YaccParser } from './seu-lex-yacc/seuyacc/YaccParser'

const lr1 = new LR1Analyzer(new YaccParser('F:\\minisys-minicc-ts\\Yacc.y'))
// console.log(lr1)
// visualizeGOTOGraph(lr1.dfa,lr1)

// const lr0 = new LR0Analyzer(new YaccParser('F:\\minisys-minicc-ts\\Yacc.y'))
// visualizeLR0GOTOGraph(lr0.dfa, lr0)

const lalr = new LALRAnalyzer(new LR0Analyzer(new YaccParser('F:\\minisys-minicc-ts\\Yacc.y')))
// console.log(lalr)
// visualizeGOTOGraph(lalr.lr0dfa, lalr.lr0Analyzer)
visualizeGOTOGraph(lalr.dfa, lalr)
