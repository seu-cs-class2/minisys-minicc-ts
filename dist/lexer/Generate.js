"use strict";
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
const DFA_1 = require("../seu-lex-yacc/seulex/DFA");
const LexParser_1 = require("../seu-lex-yacc/seulex/LexParser");
const NFA_1 = require("../seu-lex-yacc/seulex/NFA");
const path = __importStar(require("path"));
const dfa = DFA_1.DFA.fromNFA(NFA_1.NFA.fromLexParser(new LexParser_1.LexParser(path.join(__dirname, '../../src/lexer/MiniC.l'))));
dfa.dump(`Generated from MiniC.l @ ${new Date().toLocaleDateString()}`, path.join(__dirname, '../../src/lexer/MiniC-Lex.json'));
dfa.dump(`Generated from MiniC.l @ ${new Date().toLocaleDateString()}`, path.join(__dirname, '../../dist/lexer/MiniC-Lex.json'));
