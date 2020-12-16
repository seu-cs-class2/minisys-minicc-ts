"use strict";
// 中间代码生成样例
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Lex_1 = require("../lexer/Lex");
const DFA_1 = require("../seu-lex-yacc/seulex/DFA");
const LALR_1 = require("../seu-lex-yacc/seuyacc/LALR");
const ParseLALR_1 = require("../parser/ParseLALR");
const IRGenerator_1 = require("./IRGenerator");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
// 测试代码
const CCode = fs_1.default
    .readFileSync(path_1.default.join(__dirname, './Example.c'))
    .toString()
    .replace(/\r\n/g, '\n')
    .split('\n')
    .slice(3)
    .join('\n');
const lexDFA = DFA_1.DFA.fromFile(path_1.default.join(__dirname, '../../syntax/MiniC/MiniC-Lex.json'));
let tokens = Lex_1.lexSourceCode(CCode, lexDFA);
const lalr = LALR_1.LALRAnalyzer.load(path_1.default.join(__dirname, '../../syntax/MiniC/MiniC-LALRParse.json'));
const root = ParseLALR_1.parseTokensLALR(tokens, lalr);
const ir = new IRGenerator_1.IRGenerator(root);
console.log(ir.toIRString());
fs_1.default.writeFileSync(path_1.default.join(__dirname, './Example.ir'), ir.toIRString());
let basicBlocksSplit = '';
ir.basicBlocks.forEach(block => {
    basicBlocksSplit += `\nB${block.id}`.padEnd(65, '-') + '\n';
    basicBlocksSplit += block.content.map(v => v.toString()).join('\n');
});
fs_1.default.writeFileSync(path_1.default.join(__dirname, './Example.split.ir'), basicBlocksSplit.trim());
