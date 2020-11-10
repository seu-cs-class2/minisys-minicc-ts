"use strict";
/**
 * 从.y文件生成序列化的LR1Analyzer
 */
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
const LR1_1 = require("../seu-lex-yacc/seuyacc/LR1");
const YaccParser_1 = require("../seu-lex-yacc/seuyacc/YaccParser");
const path = __importStar(require("path"));
const utils_1 = require("../seu-lex-yacc/utils");
// eslint-disable-next-line @typescript-eslint/no-var-requires
const args = require('minimist')(process.argv.slice(2));
// args looks like { _: [ 'example/md.l' ], v: true }
utils_1.assert(args._.length == 2, '[usage]: node GenerateLR1.js <path_to_.y> <path_output>');
const dotYPath = args._[0];
const dotYName = path.basename(dotYPath).replace('.y', '');
const outJSONPath = args._[1];
const lr1 = new LR1_1.LR1Analyzer(new YaccParser_1.YaccParser(dotYPath));
lr1.dump(`Generated from ${dotYName} @ ${new Date().toLocaleDateString()}`, path.join(outJSONPath, dotYName + '-LR1Parse.json'));
