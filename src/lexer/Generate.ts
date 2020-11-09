/**
 * 从.l文件生成序列化的DFA
 */

import { DFA } from '../seu-lex-yacc/seulex/DFA'
import { LexParser } from '../seu-lex-yacc/seulex/LexParser'
import { NFA } from '../seu-lex-yacc/seulex/NFA'
import * as path from 'path'
import { assert } from '../seu-lex-yacc/utils'

// eslint-disable-next-line @typescript-eslint/no-var-requires
const args = require('minimist')(process.argv.slice(2))
// args looks like { _: [ 'example/md.l' ], v: true }
assert(args._.length == 2, '[usage]: node Generate.js <path_to_.l> <path_output>')
const dotLPath = args._[0]
const dotLName = path.basename(dotLPath)
const outJSONPath = args._[1]

const dfa = DFA.fromNFA(NFA.fromLexParser(new LexParser(dotLPath)))
dfa.dump(
  `Generated from ${dotLName} @ ${new Date().toLocaleDateString()}`,
  path.join(outJSONPath, dotLName + '-Lex.json')
)
