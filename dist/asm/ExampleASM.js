"use strict";
// 目标代码生成样例
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Lex_1 = require("../lexer/Lex");
const DFA_1 = require("../seu-lex-yacc/seulex/DFA");
const LALR_1 = require("../seu-lex-yacc/seuyacc/LALR");
const ParseLALR_1 = require("../parser/ParseLALR");
const IRGenerator_1 = require("../ir/IRGenerator");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const ASMGenerator_1 = require("./ASMGenerator");
// 测试代码
const CCode = `
  int main(void) {
    int a;
    int b;
    a = 10;
    b = 20;
    b = a + b;
    if (a > b) {
      a = a / b - 20;  
    }
  }
`;
const lexDFA = DFA_1.DFA.fromFile(path_1.default.join(__dirname, '../../syntax/MiniC/MiniC-Lex.json'));
let tokens = Lex_1.lexSourceCode(CCode, lexDFA);
const lalr = LALR_1.LALRAnalyzer.load(path_1.default.join(__dirname, '../../syntax/MiniC/MiniC-LALRParse.json'));
const root = ParseLALR_1.parseTokensLALR(tokens, lalr);
const ir = new IRGenerator_1.IRGenerator(root);
const asm = new ASMGenerator_1.ASMGenerator(ir);
console.log(asm.toAssembly());
fs_1.default.writeFileSync(path_1.default.join(__dirname, './Example.asm'), asm.toAssembly());
