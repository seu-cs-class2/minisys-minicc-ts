"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const LALR_1 = require("./seu-lex-yacc/seuyacc/LALR");
const LR0_1 = require("./seu-lex-yacc/seuyacc/LR0");
const Visualizer_1 = require("./seu-lex-yacc/seuyacc/Visualizer");
const YaccParser_1 = require("./seu-lex-yacc/seuyacc/YaccParser");
// const lr1 = LR1Analyzer.load('F:\\minisys-minicc-ts\\src\\parser\\MiniC-Parse.json')
// console.log(lr1)
// const lr0 = new LR0Analyzer(new YaccParser('F:\\minisys-minicc-ts\\Yacc.y'))
// visualizeLR0GOTOGraph(lr0.dfa, lr0)
const lalr = new LALR_1.LALRAnalyzer(new LR0_1.LR0Analyzer(new YaccParser_1.YaccParser('F:\\minisys-minicc-ts\\Yacc.y')));
// console.log(lalr)
Visualizer_1.visualizeGOTOGraph(lalr.lr0dfa, lalr.lr0Analyzer);
// visualizeGOTOGraph(lalr.dfa, lalr)
