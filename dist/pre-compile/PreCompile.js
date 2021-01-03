"use strict";
/**
 * 预编译器
 * 2021-01 @ https://github.com/seu-cs-class2/minisys-minicc-ts
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
exports.preCompile = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const utils_1 = require("../seu-lex-yacc/utils");
/**
 * 预编译
 *  - 处理include
 */
function preCompile(sourceCode, basePath) {
    let lines = sourceCode
        .replace(/\r\n/g, '\n')
        .split('\n')
        .map(v => v.trim());
    const patches = [];
    const IncludePattern = /^#include\s+"(.*?)"$/;
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].trim() && !lines[i].startsWith('//') && !lines[i].match(new RegExp(IncludePattern)))
            break; // 结束
        if (!lines[i].trim() || lines[i].startsWith('//'))
            continue;
        // 解析路径
        const relativePath = lines[i].match(new RegExp(IncludePattern))[1];
        const absolutePath = path.resolve(basePath, relativePath);
        // 读取文件
        utils_1.assert(fs.existsSync(absolutePath), `找不到被include的文件：${relativePath}`);
        const fstat = fs.statSync(absolutePath);
        utils_1.assert(fstat.isFile(), `找不到被include的文件：${relativePath}`);
        const fcontent = fs.readFileSync(absolutePath).toString().replace(/\r\n/g, '\n').split('\n');
        // 记录
        patches.push({ line: i, relativePath, content: fcontent });
    }
    // 应用
    let bias = 0;
    for (let patch of patches) {
        lines.splice(patch.line + bias, 1, ...[
            `// ****** ${patch.relativePath} ****** //`,
            ...patch.content,
            `// ****** ${patch.relativePath} ****** //`,
        ]);
        bias += patch.content.length + 2;
    }
    return lines.join('\n');
}
exports.preCompile = preCompile;
