/**
 * 为语法制导翻译（SDT）使用到的语义动作提供上下文
 */

import { SymTab } from './IR'

// ======== 配置选项 ========
// 指令标号前缀
const LabelPrefix = '__lbl_'
// 临时变量前缀
const TempPrefix = '__T'

// ======== 相关变量 ========
// 所有中间代码（四元式）
const IRs = []
// 所有用到的符号表
const symbolTables: SymTab[] = []
// 全局符号表
const globalSymbolTable = new SymTab()
// 当前解析阶段符号表
let currentSymbolTable: SymTab
// 当前临时变量序号
let currentTemp: number

// 切换符号表
function toscope(scope: 'global' | '?') {
  currentSymbolTable = globalSymbolTable
}

// 标号回填
function backpatch(list: string, label: string) {
  const irs = list.split(',').map(v => v.trim())
}

// 产生四元式
// res为_表示待回填
function genquad(op: string, arg1: string, arg2: string, res: string) {}

// 合并列表
function merge(list1: string, list2: string) {
  return list1
    .split(',')
    .map(v => v.trim())
    .concat(list2.split(',').map(v => v.trim()))
    .join(',')
}

// 基于参数产生新的临时变量
function newtemp(baseon: string) {
  // TODO:
  return `${TempPrefix}${currentTemp++}`
}
