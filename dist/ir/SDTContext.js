"use strict";
/**
 * 为语法制导翻译（SDT）使用到的语义动作提供上下文
 */
Object.defineProperty(exports, "__esModule", { value: true });
const IR_1 = require("./IR");
// ======== 配置选项 ========
// 指令标号前缀
const LabelPrefix = '__lbl_';
// 临时变量前缀
const TempPrefix = '__T';
// ======== 相关变量 ========
// 所有中间代码（四元式）
const IRs = [];
// 所有用到的符号表
const symbolTables = [];
// 全局符号表
const globalSymbolTable = new IR_1.SymTab();
// 当前解析阶段符号表
let currentSymbolTable;
// 当前临时变量序号
let currentTemp;
// 切换符号表
function toscope(scope) {
    currentSymbolTable = globalSymbolTable;
}
// 标号回填
function backpatch(list, label) {
    const irs = list.split(',').map(v => v.trim());
}
// 产生四元式
// res为_表示待回填
function genquad(op, arg1, arg2, res) { }
// 合并列表
function merge(list1, list2) {
    return list1
        .split(',')
        .map(v => v.trim())
        .concat(list2.split(',').map(v => v.trim()))
        .join(',');
}
// 基于参数产生新的临时变量
function newtemp(baseon) {
    // TODO:
    return `${TempPrefix}${currentTemp++}`;
}
