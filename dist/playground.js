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
Object.defineProperty(exports, "__esModule", { value: true });
// 中间代码生成样例
const Lex_1 = require("./lexer/Lex");
const DFA_1 = require("./seu-lex-yacc/seulex/DFA");
const path = __importStar(require("path"));
const LALR_1 = require("./seu-lex-yacc/seuyacc/LALR");
const ParseLALR_1 = require("./parser/ParseLALR");
const CCode1 = String.raw `
int a;
void foo(int x) {
  int y;
  return x + y;
}
void func(int a, int b) {
  int z;
  return;
}
int main(void) {
  int a;
  int b;
  a = 10;
  b = 20;
  if (a > b) {
    func(a, b);
  }
  while (a > b) {
    int a;
    if (a < b) {
      int c = a;
      foo(b);
    }
  }
  return;
}
`;
const CCode = String.raw `
int a;
void foo(int x) {
  int y;
  return x + y;
}
void func(int a, int b) {
  int z;
  return;
}
int main(void) {
  int a;
  int b;
  a = 10;
  b = 20;
  if (a > b) {
    func(a, b);
  }
  while (a > b) {
    int a;
    if (a < b) {
      int c = a;
      foo(b);
    }
  }
  return;
}
`;
const lexDFA = DFA_1.DFA.fromFile(path.join(__dirname, '../syntax/MiniC/MiniC-Lex.json'));
const tokens = Lex_1.lexSourceCode(CCode, lexDFA);
const lalr = LALR_1.LALRAnalyzer.load(path.join(__dirname, '../syntax/MiniC/MiniC-LALRParse.json'));
// visualizeGOTOGraph(lalr.dfa, lalr)
// visualizeLALRACTIONGOTOTable(lalr)
const root = ParseLALR_1.parseTokensLALR(tokens, lalr);
// visualizeAST(root)
// const ir = new IRGenerator(root)
// console.log(ir.toIRString())
// const asm = new ASMGenerator(ir)
// console.log(asm.toAssembly())
