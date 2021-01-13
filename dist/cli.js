"use strict";
/**
 * 编译器使用入口
 * 用法
 *    node cli.js <path_to_c_code> [options]
 * 可用选项
 *    -o <output_path>    指定输出路径
 *    -i                  一并输出中间代码
 *    -v                  显示编译过程详细信息
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const utils_1 = require("./seu-lex-yacc/utils");
const Lex_1 = require("./lexer/Lex");
const DFA_1 = require("./seu-lex-yacc/seulex/DFA");
const LALR_1 = require("./seu-lex-yacc/seuyacc/LALR");
const ParseLALR_1 = require("./parser/ParseLALR");
const IRGenerator_1 = require("./ir/IRGenerator");
const ASMGenerator_1 = require("./asm/ASMGenerator");
const IROptimizer_1 = require("./ir/IROptimizer");
const PreCompile_1 = require("./pre-compile/PreCompile");
const chalk = require('chalk'); // 解决eval中chalk在编译后不被替换的问题
const assert = (condition, hint) => {
    if (!condition)
        console.log(chalk.bgRed.bold.white(hint));
    utils_1.assert(condition, hint);
};
// eslint-disable-next-line @typescript-eslint/no-var-requires
const args = require('minimist')(process.argv.slice(2));
// args looks like { _: [ 'example/md.l' ], v: true }
assert(args._.length == 1, '[usage]: node cli.js <path_to_c_code> [-o <output_path>] [-i]');
// 整理参数
const codePath = args._[0];
const outputPath = args.o || path_1.default.dirname(args._[0]);
const outputName = path_1.default.basename(args._[0], path_1.default.extname(args._[0]));
const withIR = !!args.i;
const verbose = !!args.v;
const print = (message, style = '') => {
    if (!verbose)
        return;
    eval(`console.log(chalk${style.trim() ? '.' : ''}${style.split(' ').join('.')}('${message}'))`);
};
const tik = new Date().getTime();
print(`                                    `, 'bgWhite bold black');
print(`  ===== [minisys-minicc-ts] ======  `, 'bgWhite bold black');
print(`                                    `, 'bgWhite bold black');
print(`*** Basic Information ***`, 'bgBlue bold white');
print(`  Source: ${codePath}`);
print(`  Output Path: ${outputPath}`);
print(`  With IR: ${String(withIR)}`);
print('*** Start frontend part... ***', 'bgBlue bold white');
// 读入C源码
print('  Reading source file...', 'yellow');
const rawCCode = fs_1.default.readFileSync(codePath).toString('utf-8');
assert(rawCCode.trim(), 'Source code is empty!');
print('  Source file loaded.', 'green');
// 预编译
print('  Start precompiling...', 'yellow');
const CCode = PreCompile_1.preCompile(rawCCode, path_1.default.dirname(codePath));
print('  Precompilation done.', 'green');
// 词法分析
print('  Loading DFA for lexing...', 'yellow');
const lexDFADumpPath = path_1.default.join(__dirname, '../syntax/MiniC/MiniC-Lex.json');
const lexDFA = DFA_1.DFA.fromFile(lexDFADumpPath);
print('  Lexing DFA loaded from ' + lexDFADumpPath.replace(/\\/g, '/'), 'green');
print('  Start tokenization...', 'yellow');
const tokens = Lex_1.lexSourceCode(CCode, lexDFA);
print('  Tokenization done. Received ' + tokens.length + ' tokens.', 'green');
// 语法分析
print('  Loading parsing table for parsing...', 'yellow');
const lalrDumpPath = path_1.default.join(__dirname, '../syntax/MiniC/MiniC-LALRParse.json');
const lalr = LALR_1.LALRAnalyzer.load(lalrDumpPath);
print('  Parsing table loaded from ' + lalrDumpPath.replace(/\\/g, '/'), 'green');
print('  Start parsing...', 'yellow');
const astRoot = ParseLALR_1.parseTokensLALR(tokens, lalr);
assert(astRoot, '  AST root is null.');
print('  Parsing done.', 'green');
print('*** Start backend part... ***', 'bgBlue bold white');
// 中间代码生成
print('  Generating Intermediate Representation...', 'yellow');
const ir = new IRGenerator_1.IRGenerator(astRoot);
print('  Intermediate Representation generation done.', 'green');
// 中间代码优化
print('  Optimizing Intermediate Representation...', 'yellow');
const opt = new IROptimizer_1.IROptimizer(ir);
print(`  IR optimization done. Made ${opt.printLogs().split('\n').length} optimizations.`, 'green');
// 目标代码生成与优化
print('  Generating object code (assembly code)...', 'yellow');
const asm = new ASMGenerator_1.ASMGenerator(ir);
print('  Object code generation done.', 'green');
// 输出
print('  Start output works...', 'yellow');
const asmCode = asm.toAssembly();
fs_1.default.writeFileSync(path_1.default.join(outputPath, outputName + '.asm'), asmCode);
print('  Object code output successfully.', 'green');
if (withIR) {
    const irCode = ir.toIRString();
    fs_1.default.writeFileSync(path_1.default.join(outputPath, outputName + '.ir'), irCode);
    print('  Intermediate Representation output successfully.', 'green');
}
print('  Output works done.', 'green');
const tok = new Date().getTime();
print('*** Summary ***', 'bgBlue bold white');
print('  Compilation ended successfully with in ' + String((tok - tik) / 1000) + ' secs.');
