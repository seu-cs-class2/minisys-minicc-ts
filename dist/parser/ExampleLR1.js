"use strict";
// LR1语法分析使用示例
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
const LR1_1 = require("../seu-lex-yacc/seuyacc/LR1");
const ParseLR1_1 = require("./ParseLR1");
const CCode = String.raw `
int main() {
  int a = 10;
  int b = 100; // change = to # to get an UNMATCH
  float c = a + b / 2.5;
  printf("\2f", c);
  return 0;
}
`;
const lexDFA = DFA_1.DFA.fromFile(path.join(__dirname, '../../syntax/TestC-Lex.json'));
const tokens = Lex_1.lexSourceCode(CCode, lexDFA);
console.log(tokens);
const lr1 = LR1_1.LR1Analyzer.load(path.join(__dirname, '../../syntax/TestC-LR1Parse.json'));
ParseLR1_1.parseTokensLR1(tokens, lr1);
