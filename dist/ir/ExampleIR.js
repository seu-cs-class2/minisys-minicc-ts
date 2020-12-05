"use strict";
// 中间代码生成样例
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
const Lex_1 = require("../lexer/Lex");
const DFA_1 = require("../seu-lex-yacc/seulex/DFA");
const path = __importStar(require("path"));
const LALR_1 = require("../seu-lex-yacc/seuyacc/LALR");
const ParseLALR_1 = require("../parser/ParseLALR");
const IRGenerator_1 = require("./IRGenerator");
const CCode = String.raw `
int main(void) {
  int a;
  int b;
  a = 10;
  b = 20;
  func(a, b);
}
`;
const lexDFA = DFA_1.DFA.fromFile(path.join(__dirname, '../../syntax/MiniC/MiniC-Lex.json'));
const tokens = Lex_1.lexSourceCode(CCode, lexDFA);
const lalr = LALR_1.LALRAnalyzer.load(path.join(__dirname, '../../syntax/MiniC/MiniC-LALRParse.json'));
const root = ParseLALR_1.parseTokensLALR(tokens, lalr);
const ir = new IRGenerator_1.IRGenerator(root);
console.dir(ir, {
    depth: 4,
});
console.log('\n=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=\n');
console.log(ir.toIRString());
