import { LR0Analyzer } from './seu-lex-yacc/seuyacc/LR0'
import { LR1Analyzer } from './seu-lex-yacc/seuyacc/LR1'
import { YaccParser } from './seu-lex-yacc/seuyacc/YaccParser'

// const lr1 = LR1Analyzer.load('F:\\minisys-minicc-ts\\src\\parser\\MiniC-Parse.json')
// console.log(lr1)

const lr0 = new LR0Analyzer(new YaccParser('F:\\minisys-minicc-ts\\src\\parser\\MiniC.y'))

