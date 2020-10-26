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
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const LR1_1 = require("../seu-lex-yacc/seuyacc/LR1");
const YaccParser_1 = require("../seu-lex-yacc/seuyacc/YaccParser");
const path = __importStar(require("path"));
const lr1 = new LR1_1.LR1Analyzer(new YaccParser_1.YaccParser(path.join(__dirname, '../../src/parser/MiniC.y')));
lr1.dump(`Generated from MiniC.y @ ${new Date().toLocaleDateString()}`, path.join(__dirname, '../../src/parser/MiniC-Parse.json'));
lr1.dump(`Generated from MiniC.y @ ${new Date().toLocaleDateString()}`, path.join(__dirname, '../../dist/parser/MiniC-Parse.json'));
