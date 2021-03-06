/**
 * 从.y文件生成序列化的LALRAnalyzer
 */

import { LALRAnalyzer } from '../seu-lex-yacc/seuyacc/LALR'
import { YaccParser } from '../seu-lex-yacc/seuyacc/YaccParser'
import * as path from 'path'
import { assert } from '../seu-lex-yacc/utils'
import { LR0Analyzer } from '../seu-lex-yacc/seuyacc/LR0'

// eslint-disable-next-line @typescript-eslint/no-var-requires
const args = require('minimist')(process.argv.slice(2))
// args looks like { _: [ 'example/md.l' ], v: true }
assert(args._.length == 2, '[usage]: node GenerateLALR.js <path_to_.y> <path_output>')

const dotYPath = args._[0]
const dotYName = path.basename(dotYPath).replace('.y', '')
const outJSONPath = args._[1]

const lalr = new LALRAnalyzer(new LR0Analyzer(new YaccParser(dotYPath)))
lalr.dump(
  `Generated from ${dotYName} @ ${new Date().toLocaleDateString()}`,
  path.join(outJSONPath, dotYName + '-LALRParse.json')
)
