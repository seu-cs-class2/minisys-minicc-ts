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
const Lex_1 = require("./lexer/Lex");
const DFA_1 = require("./seu-lex-yacc/seulex/DFA");
const path = __importStar(require("path"));
const AST_1 = require("./ir/AST");
const LALR_1 = require("./seu-lex-yacc/seuyacc/LALR");
const ParseLALR_1 = require("./parser/ParseLALR");
const utils_1 = require("./seu-lex-yacc/utils");
const Visualizer_1 = require("./seu-lex-yacc/seuyacc/Visualizer");
const LR0_1 = require("./seu-lex-yacc/seuyacc/LR0");
const YaccParser_1 = require("./seu-lex-yacc/seuyacc/YaccParser");
const CCode = String.raw `
int main(void) {
  int a;
  int b;
  a = 10;
  b = 20;
  func(a, c);
  return 0;
}
`;
const lexDFA = DFA_1.DFA.fromFile(path.join(__dirname, '../syntax/MiniC/MiniC-Lex.json'));
const tokens = Lex_1.lexSourceCode(CCode, lexDFA);
console.log(tokens.filter(v => v.name != utils_1.WHITESPACE_TOKENNAME));
// const lr1 = LR1Analyzer.load(path.join(__dirname, '../syntax/MiniC/MiniC-LR1Parse.json'))
const lr0 = new LR0_1.LR0Analyzer(new YaccParser_1.YaccParser(path.join(__dirname, '../syntax/MiniC/MiniC.y')));
const lalr = new LALR_1.LALRAnalyzer(lr0);
// visualizeLR1ACTIONGOTOTable(lr1)
Visualizer_1.visualizeLALRACTIONGOTOTable(lalr);
// visualizeGOTOGraph(lr0.dfa, lr0)
// visualizeGOTOGraph(lalr.dfa, lalr)
// const ast = parseTokensLR1(tokens, lr1)
const ast = ParseLALR_1.parseTokensLALR(tokens, lalr);
AST_1.visualizeAST(ast);
