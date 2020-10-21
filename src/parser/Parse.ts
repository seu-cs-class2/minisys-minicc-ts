/**
 * 借助 LR1 分析表对源代码进行语法分析
 * 2020-10 @ https://github.com/seu-cs-class2/minisys-minicc-ts
 * --- 我们删掉了 Yacc 生成 C 代码的行为，转而直接借助 LR1 分析表完成语法分析
 */

import { Token } from '../lexer/Lex'
import { LR1Analyzer } from '../seu-lex-yacc/seuyacc/LR1'

export const WHITESPACE_SYMBOL_ID = -10

/**
 * 分析表格子
 */
interface TableCell {
  action: 'nonterminal' | 'shift' | 'reduce' | 'acc' | 'default' // 动作
  target: number // 动作目标格
}

/**
 * 语法分析
 */
function yyparse(tokens: Token[], analyzer: LR1Analyzer) {
  // Token编号表，Token名->Token编号
  const tokenIds = (function () {
    let map = new Map<string, number>()
    for (let i = 0; i < analyzer.symbols.length; i++)
      if (analyzer.symbols[i].type == 'sptoken' || analyzer.symbols[i].type == 'token')
        map.set(analyzer.symbols[i].content, i)
    map.set('WHITESPACE', WHITESPACE_SYMBOL_ID)
    return map
  })()

  // LR1语法分析表（合并ACTION和GOTO）
  // table[i][k]表示在i状态遇到符号k的转移
  const table = (function () {
    let table: TableCell[][] = []
    for (let state = 0; state < analyzer.dfa.states.length; state++) {
      let nonCnt = 0,
        nonnonCnt = 0
      let row: TableCell[] = []
      for (let symbol = 0; symbol < analyzer.symbols.length; symbol++) {
        let action = '',
          target = 0
        if (analyzer.symbols[symbol].type == 'nonterminal') {
          // 遇到非终结符的处理
          action = 'nonterminal'
          target = analyzer.GOTOTable[state][nonCnt++]
        } else {
          switch (analyzer.ACTIONTable[state][nonnonCnt].type) {
            case 'shift':
              action = 'shift'
              target = analyzer.ACTIONTable[state][nonnonCnt].data
              break
            case 'reduce':
              action = 'reduce'
              target = analyzer.ACTIONTable[state][nonnonCnt].data
              break
            case 'acc':
              action = 'acc'
              break
            default:
              action = 'default' // WTF is this?
          }
          nonnonCnt++
        }
        // @ts-ignore
        row.push({ action, target })
      }
      table.push(row)
    }
    return table
  })()

  const DealWithResult = {
    YACC_NOTHING: -2,
    YACC_ACCPET: -42,
    YACC_ERROR: -1,
  }
  const stateStack: number[] = []
  function dealWith(symbol: number) {
    if (symbol == WHITESPACE_SYMBOL_ID) return DealWithResult.YACC_NOTHING
    if (stateStack.length < 1) throw new Error('在解析过程中，状态栈变空。')
    let state = stateStack[stateStack.length - 1]
    const cell = table[state][symbol]
    switch (cell.action) {
      case ActionCode.default:
        return DealWithResult.YACC_NOTHING
      case ActionCode.acc:
        return DealWithResult.YACC_ACCPET
      case ActionCode.nonterminal:
        stateStack.push(cell.target)
        return DealWithResult.YACC_NOTHING
      case ActionCode.shift:
        stateStack.push(cell.target)
        return DealWithResult.YACC_NOTHING
      case ActionCode.reduce:
      // TODO:
      default:
        return symbol
    }
    return DealWithResult.YACC_NOTHING
  }

  let currentTokenIndex = 0
  function _yylex() {
    return tokens[currentTokenIndex++]
  }

  let token: Token
  stateStack.push(analyzer.dfa.startStateId)

  while (token != DealWithResult.YACC_ACCPET && (token = _yylex())) {
    // TODO:
  }
}
