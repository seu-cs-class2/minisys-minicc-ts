import { LALRAnalyzer } from './seu-lex-yacc/seuyacc/LALR'
import { LR0Analyzer } from './seu-lex-yacc/seuyacc/LR0'
import { LR1Analyzer } from './seu-lex-yacc/seuyacc/LR1'
import { visualizeLALRGOTOGraph, visualizeLR0GOTOGraph } from './seu-lex-yacc/seuyacc/Visualizer'
import { YaccParser } from './seu-lex-yacc/seuyacc/YaccParser'

// const lr1 = LR1Analyzer.load('F:\\minisys-minicc-ts\\src\\parser\\MiniC-Parse.json')
// console.log(lr1)

// const lr0 = new LR0Analyzer(new YaccParser('F:\\minisys-minicc-ts\\Yacc.y'))
// visualizeLR0GOTOGraph(lr0.dfa, lr0)

const lalr = new LALRAnalyzer(new LR0Analyzer(new YaccParser('F:\\minisys-minicc-ts\\Yacc.y')))
// lalr._kernelize()
console.log(lalr)
// visualizeLR0GOTOGraph(lalr.lr0dfa, lalr.lr0Analyzer)
visualizeLALRGOTOGraph(lalr.dfa, lalr)
