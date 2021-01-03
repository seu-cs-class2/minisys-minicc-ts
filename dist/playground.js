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
// 测试代码
const CCode1 = `
int main(void) {
  int a;
  int b;
  a = 10;
  b = a + 20;
  return 0;
}
`;
const CCode2 = `
int main(void) {
  int a;
  a = 10;
  if (0) {
    a = 20;
  }
  return 0;
}
int some_proc(void) {
  return 0;
}
`;
const CCode = `
string a;
void proc(void) {
  return;
}
int main(void) {
  a = "hello, world!";
  proc(a);
  return 0;
}
`;
const lexDFA = DFA_1.DFA.fromFile(path_1.default.join(__dirname, '../syntax/MiniC/MiniC-Lex.json'));
let tokens = Lex_1.lexSourceCode(CCode, lexDFA);
const lalr = LALR_1.LALRAnalyzer.load(path_1.default.join(__dirname, '../syntax/MiniC/MiniC-LALRParse.json'));
const root = ParseLALR_1.parseTokensLALR(tokens, lalr);
const ir = new IRGenerator_1.IRGenerator(root);
// console.log(ir.toIRString())
const opt = new IROptimizer_1.IROptimizer(ir);
console.log(opt.quads.map(v => v.toString()));
opt.deadCodeEliminate();
console.log('==================================================');
console.log(opt.quads.map(v => v.toString()));
