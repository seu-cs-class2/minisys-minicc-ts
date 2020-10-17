import { LR1Analyzer } from './LR1'
import { YaccParser } from './YaccParser'

const filePath = 'F:\\minisys-minicc-ts\\src\\parser\\MiniC.y'
const dumpPath = 'F:\\minisys-minicc-ts\\src\\parser\\dump.json'
const lr1 = new LR1Analyzer(new YaccParser(filePath))
lr1.dump(dumpPath)
// console.log(lr1);
