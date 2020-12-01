/**
 * 从.y文件生成序列化的LR1Analyzer
 */

import { LR1Analyzer } from '../seu-lex-yacc/seuyacc/LR1'
import { YaccParser } from '../seu-lex-yacc/seuyacc/YaccParser'
import * as path from 'path'
import { assert } from '../seu-lex-yacc/utils'

// eslint-disable-next-line @typescript-eslint/no-var-requires
const args = require('minimist')(process.argv.slice(2))
// args looks like { _: [ 'example/md.l' ], v: true }
assert(args._.length == 2, '[usage]: node GenerateLR1.js <path_to_.y> <path_output>')

const dotYPath = args._[0]
const dotYName = path.basename(dotYPath).replace('.y', '')
const outJSONPath = args._[1]

const lr1 = new LR1Analyzer(new YaccParser(dotYPath))
lr1.dump(
  `Generated from ${dotYName} @ ${new Date().toLocaleDateString()}`,
  path.join(outJSONPath, dotYName + '-LR1Parse.json')
)
