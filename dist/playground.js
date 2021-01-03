"use strict";
// Try something here.
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
const IROptimizer_1 = require("./ir/IROptimizer");
const PreCompile_1 = require("./pre-compile/PreCompile");
// 测试代码
const CCode1 = `
// hello
#include "./test.c"

string a;
void proc(void) {
  return;
}
int main(void) {
  a = "hello, world!";
  a = proc();
  proc();
  return 0;
}
`;
const CCode = `
int a;
int main(void) {
  int b;
  int c;
  c = 5;
  a = 20;
  b = a + 20 * 2;
  // c = b;
  return c;
}
`;
const after = PreCompile_1.preCompile(CCode, path_1.default.join(__dirname, './'));
console.log(after);
const lexDFA = DFA_1.DFA.fromFile(path_1.default.join(__dirname, '../syntax/MiniC/MiniC-Lex.json'));
let tokens = Lex_1.lexSourceCode(after, lexDFA);
const lalr = LALR_1.LALRAnalyzer.load(path_1.default.join(__dirname, '../syntax/MiniC/MiniC-LALRParse.json'));
const root = ParseLALR_1.parseTokensLALR(tokens, lalr);
const ir = new IRGenerator_1.IRGenerator(root);
console.log(ir.toIRString());
const opt = new IROptimizer_1.IROptimizer(ir);
console.log(opt.quads.map(v => v.toString()));
console.log(opt.printLogs());
