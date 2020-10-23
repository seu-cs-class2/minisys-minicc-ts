import { LR1Analyzer } from '../seu-lex-yacc/seuyacc/LR1'
import { YaccParser } from '../seu-lex-yacc/seuyacc/YaccParser'
import * as path from 'path'

const lr1 = new LR1Analyzer(new YaccParser(path.join(__dirname, './MiniC.y')))
lr1.dump(`Generated from MiniC.y @ ${new Date().toLocaleDateString()}`, path.join(__dirname, './MiniC-Parse.json'))
