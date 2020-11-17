"use strict";
// 词法分析使用示例
// 1 - 空白符的Token名为_WHITESPACE
// 2 - 非法符号的Token名为_UNMATCH
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
const Lex_1 = require("./Lex");
const DFA_1 = require("../seu-lex-yacc/seulex/DFA");
const path = __importStar(require("path"));
const CCode = String.raw `
int main() {
  int a = 10;
  int b = 100; // change = to # to get an UNMATCH
  float c = a + b / 2.5;
  printf("\2f", c);
  return 0;
}
`;
const lexDFA = DFA_1.DFA.fromFile(path.join(__dirname, '../../syntax/MiniC-Lex.json'));
const tokens = Lex_1.lexSourceCode(CCode, lexDFA);
console.log(tokens);
