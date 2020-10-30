"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const LR0_1 = require("./seu-lex-yacc/seuyacc/LR0");
const YaccParser_1 = require("./seu-lex-yacc/seuyacc/YaccParser");
// const lr1 = LR1Analyzer.load('F:\\minisys-minicc-ts\\src\\parser\\MiniC-Parse.json')
// console.log(lr1)
const lr0 = new LR0_1.LR0Analyzer(new YaccParser_1.YaccParser('F:\\minisys-minicc-ts\\src\\parser\\MiniC.y'));
