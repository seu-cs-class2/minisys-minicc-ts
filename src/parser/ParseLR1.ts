/**
 * 借助 LR1 分析表对源代码进行语法分析
 * 2020-10 @ https://github.com/seu-cs-class2/minisys-minicc-ts
 * --- 我们删掉了 Yacc 生成 C 代码的行为，转而直接借助 LR1 分析表完成语法分析
 */

import { ASTNode, $newNode } from '../ir/AST'
import { Token } from '../lexer/Lex'
import { LR1Analyzer } from '../seu-lex-yacc/seuyacc/LR1'
import { assert, UNMATCH_TOKENNAME, WHITESPACE_TOKENNAME } from '../seu-lex-yacc/utils'

export const WHITESPACE_SYMBOL_ID = -10

/**
 * 分析表格子
 */
interface TableCell {
  action: 'nonterminal' | 'shift' | 'reduce' | 'acc' | 'default' // 动作
  target: number // 动作目标格
}

/**
 * 符号栈内元素
 */
export interface SymbolStackElement {
  type: 'token' | 'nonterminal'
  name: string
  node: ASTNode
}

/**
 * 进行基于LR1的语法分析，返回语法树根节点
 */
export function parseTokensLR1(tokens: Token[], analyzer: LR1Analyzer): ASTNode | null {
  // 预处理
  assert(
    tokens.every(v => v.name !== UNMATCH_TOKENNAME),
    'Token序列中存在未匹配的非法符号'
  )
  tokens = tokens.filter(v => v.name !== WHITESPACE_TOKENNAME)

  // Token编号表，Token名->Token编号
  const tokenIds = (function () {
    let map = new Map<string, number>()
    for (let i = 0; i < analyzer.symbols.length; i++)
      if (analyzer.symbols[i].type == 'sptoken' || analyzer.symbols[i].type == 'token')
        map.set(analyzer.symbols[i].content, i)
    map.set(WHITESPACE_TOKENNAME, WHITESPACE_SYMBOL_ID)
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
              action = 'default' // 不会到这里
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

  // 属性值处理逻辑
  const symbolStack: SymbolStackElement[] = []
  let curRhsLen = 0
  let curSymbol: SymbolStackElement
  /**
   * 以Token的形式获取当前归约产生式右侧符号的属性值
   * @param num 符号在产生式右侧的序号，例如取$2则num传2
   */
  function getDollar(num: number) {
    assert(num > 0 && num <= curRhsLen, `动作代码中存在错误的属性值引用：$${num}`)
    return symbolStack.slice(num - curRhsLen - 1)[0]
  }
  /**
   * 暂存当前产生式左侧符号的属性值（即$$）
   * 调用该函数后不会立刻改变属性值栈，而是在完成此次归约后真正存储
   * @param literal 所要存储的$$的值
   */
  function setDollar2(name: string, node: ASTNode) {
    curSymbol = { type: 'nonterminal', name, node }
  }

  // 状态栈
  const stateStack: number[] = [analyzer.dfa.startStateId]

  // 处理当前情况遇到symbol
  function dealWith(symbol: number) {
    if (symbol === WHITESPACE_SYMBOL_ID) return symbol
    switch (table[stateStack.slice(-1)[0]][symbol].action) {
      case 'shift':
        const prevToken = tokens[currentTokenIndex - 1]
        symbolStack.push({
          type: 'token',
          name: prevToken.name,
          node: new ASTNode(prevToken.name, 'token', prevToken.literal),
        })
      case 'nonterminal':
        stateStack.push(table[stateStack.slice(-1)[0]][symbol].target)
        return symbol
      case 'reduce':
        const producer = analyzer.producers[table[stateStack.slice(-1)[0]][symbol].target]
        curRhsLen = producer.rhs.length
        curSymbol = symbolStack.slice(-curRhsLen)[0]
        // 准备动作代码执行的上下文
        const newNode = $newNode
        // 执行动作代码
        const execAction = () => {
          let actionCode = producer.action // 动作代码
          actionCode = actionCode.substr(actionCode.indexOf('newNode'))
          actionCode = actionCode.replace(/\$(\d+)/g, 'getDollar($1)')
          const node = eval(actionCode) as SymbolStackElement
          setDollar2(analyzer.getLHS(producer) + '_DOLLAR2', node.node)
        }
        execAction()
        // 查表逻辑
        while (curRhsLen--) stateStack.pop(), symbolStack.pop()
        symbolStack.push(curSymbol)
        return producer.lhs
      case 'acc':
        return -1
      default:
        assert(
          false,
          `语法分析表中存在未定义行为：在状态${stateStack.slice(-1)[0]}下收到${analyzer.symbols[symbol].content}时进行${
            table[stateStack.slice(-1)[0]][symbol].action
          }`
        )
    }
  }

  let currentTokenIndex = 0
  function _yylex() {
    return tokens[currentTokenIndex++]
  }

  let token = tokenIds.get(_yylex().name)
  while (token) {
    let ret = dealWith(token)
    while (token != ret) {
      if (ret == -1) {
        assert(symbolStack.length == 1, 'acc时符号栈元素过多。')
        return symbolStack[0]!.node
      }
      dealWith(ret!)
      ret = dealWith(token)
    }
    token = tokenIds.get(_yylex().name)
  }

  return null
}
