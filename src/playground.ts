import { LR1Analyzer } from './seu-lex-yacc/seuyacc/LR1'

const lr1 = LR1Analyzer.load('F:\\minisys-minicc-ts\\src\\parser\\MiniC-Parse.json')
console.log(lr1)
