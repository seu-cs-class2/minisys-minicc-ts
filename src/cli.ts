/**
 * 编译器使用入口
 * 用法
 *    node cli.js <path_to_c_code> [options]
 * 可用选项
 *    -o <output_path>    指定输出路径
 *    -i                  一并输出中间代码
 *    -v                  显示编译过程详细信息
 */

import path from 'path'
import fs from 'fs'
import { assert as assert_ } from './seu-lex-yacc/utils'
import { lexSourceCode } from './lexer/Lex'
import { DFA } from './seu-lex-yacc/seulex/DFA'
import { LALRAnalyzer } from './seu-lex-yacc/seuyacc/LALR'
import { parseTokensLALR } from './parser/ParseLALR'
import { IRGenerator } from './ir/IRGenerator'
import { ASMGenerator } from './asm/ASMGenerator'
import { IROptimizer } from './ir/IROptimizer'
import { preCompile } from './pre-compile/PreCompile'
const chalk = require('chalk') // 解决eval中chalk在编译后不被替换的问题

const assert = (condition: unknown, hint: string) => {
  if (!condition) console.log(chalk.bgRed.bold.white(hint))
  assert_(condition, hint)
}

// eslint-disable-next-line @typescript-eslint/no-var-requires
const args = require('minimist')(process.argv.slice(2))
// args looks like { _: [ 'example/md.l' ], v: true }
assert(args._.length == 1, '[usage]: node cli.js <path_to_c_code> [-o <output_path>] [-i]')

// 整理参数
const codePath = args._[0]
const outputPath = args.o || path.dirname(args._[0])
const outputName = path.basename(args._[0], path.extname(args._[0]))
const withIR = !!args.i
const verbose = !!args.v

const print = (message: string, style: string = '') => {
  if (!verbose) return
  eval(`console.log(chalk${style.trim() ? '.' : ''}${style.split(' ').join('.')}('${message}'))`)
}

const tik = new Date().getTime()

print(`                                    `, 'bgWhite bold black')
print(`  ===== [minisys-minicc-ts] ======  `, 'bgWhite bold black')
print(`                                    `, 'bgWhite bold black')

print(`*** Basic Information ***`, 'bgBlue bold white')
print(`  Source: ${codePath}`)
print(`  Output Path: ${outputPath}`)
print(`  With IR: ${String(withIR)}`)

print('*** Start frontend part... ***', 'bgBlue bold white')

// 读入C源码
print('  Reading source file...', 'yellow')
const rawCCode = fs.readFileSync(codePath).toString('utf-8')
assert(rawCCode.trim(), 'Source code is empty!')
print('  Source file loaded.', 'green')

// 预编译
print('  Start precompiling...', 'yellow')
const CCode = preCompile(rawCCode, path.dirname(codePath))
print('  Precompilation done.', 'green')

// 词法分析
print('  Loading DFA for lexing...', 'yellow')
const lexDFADumpPath = path.join(__dirname, '../syntax/MiniC/MiniC-Lex.json')
const lexDFA = DFA.fromFile(lexDFADumpPath)
print('  Lexing DFA loaded from ' + lexDFADumpPath.replace(/\\/g, '/'), 'green')
print('  Start tokenization...', 'yellow')
const tokens = lexSourceCode(CCode, lexDFA)
print('  Tokenization done. Received ' + tokens.length + ' tokens.', 'green')

// 语法分析
print('  Loading parsing table for parsing...', 'yellow')
const lalrDumpPath = path.join(__dirname, '../syntax/MiniC/MiniC-LALRParse.json')
const lalr = LALRAnalyzer.load(lalrDumpPath)
print('  Parsing table loaded from ' + lalrDumpPath.replace(/\\/g, '/'), 'green')
print('  Start parsing...', 'yellow')
const astRoot = parseTokensLALR(tokens, lalr)
assert(astRoot, '  AST root is null.')
print('  Parsing done.', 'green')

print('*** Start backend part... ***', 'bgBlue bold white')

// 中间代码生成
print('  Generating Intermediate Representation...', 'yellow')
const ir = new IRGenerator(astRoot!)
print('  Intermediate Representation generation done.', 'green')

// 中间代码优化
print('  Optimizing Intermediate Representation...', 'yellow')
const opt = new IROptimizer(ir)
print(`  IR optimization done. Made ${opt.printLogs().split('\n').length} optimizations.`, 'green')

// 目标代码生成与优化
print('  Generating object code (assembly code)...', 'yellow')
const asm = new ASMGenerator(ir)
print('  Object code generation done.', 'green')

// 输出
print('  Start output works...', 'yellow')
const asmCode = asm.toAssembly()
fs.writeFileSync(path.join(outputPath, outputName + '.asm'), asmCode)
print('  Object code output successfully.', 'green')
if (withIR) {
  const irCode = ir.toIRString()
  fs.writeFileSync(path.join(outputPath, outputName + '.ir'), irCode)
  print('  Intermediate Representation output successfully.', 'green')
}
print('  Output works done.', 'green')

const tok = new Date().getTime()

print('*** Summary ***', 'bgBlue bold white')
print('  Compilation ended successfully with in ' + String((tok - tik) / 1000) + ' secs.')
