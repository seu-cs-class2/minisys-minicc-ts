"use strict";
// Try something here.
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Lex_1 = require("./lexer/Lex");
const DFA_1 = require("./seu-lex-yacc/seulex/DFA");
const LALR_1 = require("./seu-lex-yacc/seuyacc/LALR");
const ParseLALR_1 = require("./parser/ParseLALR");
const IRGenerator_1 = require("./ir/IRGenerator");
const path_1 = __importDefault(require("path"));
const fs = __importStar(require("fs"));
const IROptimizer_1 = require("./ir/IROptimizer");
const PreCompile_1 = require("./pre-compile/PreCompile");
const utils_1 = require("./seu-lex-yacc/utils");
const ASMGenerator_1 = require("./asm/ASMGenerator");
const CCode1 = `
int fib(int x) {
  int a;
  int b;
  if (x == 1) {
    return 1;
  } 
  if (x == 2) {
    return 1;
  }
  a = fib(x - 1);
  b = fib(x - 2);
  // return fib(x - 1) + fib(x - 2);
  return a + b;
}
int main(void) {
  int result;
  result = fib(8);
  return result;
}
`;
const CCode = `
int a[10];
int main(void) {
  a[5] = 2;
  return 0;
}
`;
try {
    // 预编译
    const cookedCCode = PreCompile_1.preCompile(CCode, path_1.default.join(__dirname, './'));
    // 词法分析
    const lexDFA = DFA_1.DFA.fromFile(path_1.default.join(__dirname, '../syntax/MiniC/MiniC-Lex.json'));
    let tokens = Lex_1.lexSourceCode(cookedCCode, lexDFA);
    // 语法分析
    const lalr = LALR_1.LALRAnalyzer.load(path_1.default.join(__dirname, '../syntax/MiniC/MiniC-LALRParse.json'));
    const root = ParseLALR_1.parseTokensLALR(tokens, lalr);
    // 中间代码生成
    const ir = new IRGenerator_1.IRGenerator(root);
    // 中间代码优化
    const opt = new IROptimizer_1.IROptimizer(ir);
    console.log(ir.toIRString());
    console.log(opt.printLogs());
    // 目标代码生成
    const asm = new ASMGenerator_1.ASMGenerator(ir);
    fs.writeFileSync(path_1.default.join(__dirname, './output.asm'), asm.toAssembly());
}
catch (ex) {
    if (ex instanceof utils_1.SeuError)
        console.error('[SeuError] ' + ex.message);
    else
        throw ex;
}
