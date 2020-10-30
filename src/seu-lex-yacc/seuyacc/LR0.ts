/**
 * 太快了！LR0太快了！
 *
 * LR0语法分析
 * 2020-10 @ https://github.com/seu-cs-class2/minisys-minicc-ts
 */

import { ASCII_MIN, ASCII_MAX, cookString, assert } from '../utils'
import {
  GrammarSymbol,
  LR0DFA,
  LR0Item,
  LR0Operator,
  LR0Producer,
  LR0State,
  SpSymbol,
  YaccParserOperator,
  YaccParserProducer,
} from './Grammar'
import { YaccParser } from './YaccParser'

export class LR0Analyzer {
  private _symbols: GrammarSymbol[]
  private _operators: LR0Operator[]
  private _producers: LR0Producer[]
  private _startSymbol!: number
  private _dfa!: LR0DFA

  constructor(yaccParser: YaccParser) {
    this._symbols = []
    this._producers = []
    this._operators = []
    this._distributeId(yaccParser)
    this._convertProducer(yaccParser.producers)
    this._convertOperator(yaccParser.operatorDecl)
    this._construrctLR0DFA()
  }

  get symbols() {
    return this._symbols
  }
  get dfa() {
    return this._dfa
  }
  get producers() {
    return this._producers
  }
  get operators() {
    return this._operators
  }
  get startSymbol() {
    return this._startSymbol
  }

  /**
   * 将产生式转换为单条存储的、数字->数字[]形式
   */
  private _convertProducer(stringProducers: YaccParserProducer[]) {
    for (let stringProducer of stringProducers) {
      let lhs = this._getSymbolId({ type: 'nonterminal', content: stringProducer.lhs })
      assert(lhs != -1, 'lhs not found in symbols. This error should never occur.')
      for (let [index, right] of stringProducer.rhs.entries()) {
        let rhs = [],
          PATTERN = new RegExp(/(' '|[^ ]+)/g),
          char
        while ((char = PATTERN.exec(right))) {
          let tmp = char[0].trim(),
            id
          if (/'.+'/.test(char[0])) {
            tmp = char[0].substring(1, char[0].length - 1)
            if (tmp[0] == '\\') tmp = cookString(tmp)
            id = this._getSymbolId({ type: 'ascii', content: tmp })
          } else {
            let a = this._getSymbolId({ type: 'nonterminal', content: tmp }),
              b = this._getSymbolId({ type: 'token', content: tmp })
            id = id ? id : a != -1 ? a : b != -1 ? b : -1
          }
          assert(id != -1, `Symbol not found in symbols. This error should never occur. symbol=${tmp}`)
          rhs.push(id)
        }
        this._producers.push(
          new LR0Producer(lhs, rhs, `reduceTo("${stringProducer.lhs}"); \n${stringProducer.actions[index]}`)
        )
      }
    }
  }

  /**
   * 将.y文件解析器解析的Operator转换为LR0Operator
   */
  private _convertOperator(operatorDecl: YaccParserOperator[]) {
    for (let decl of operatorDecl) {
      let id = decl.tokenName ? this._getSymbolId({ type: 'token', content: decl.tokenName }) : -1
      assert(id != -1, 'Operator declaration not found. This should never occur.')
      this._operators.push(new LR0Operator(id, decl.assoc, decl.precedence))
    }
  }

  /**
   * 为文法符号（终结符、非终结符、特殊符号）分配编号
   */
  private _distributeId(yaccParser: YaccParser) {
    // 处理方式参考《Flex与Bison》P165
    // 0~127 ASCII文字符号编号
    // 128~X Token编号
    // X+1~Y 非终结符编号
    // Y+1~Y+3 特殊符号
    for (let i = 0; i < 128; i++) this._symbols.push({ type: 'ascii', content: String.fromCharCode(i) })
    // 标记一下ASCII中的不可打印字符
    for (let i = 0; i < ASCII_MIN; i++) this._symbols[i] = { type: 'ascii', content: '[UNPRINTABLE]' }
    this._symbols[ASCII_MAX + 1] = { type: 'ascii', content: '[UNPRINTABLE]' }
    for (let token of yaccParser.tokenDecl) this._symbols.push({ type: 'token', content: token })
    for (let nonTerminal of yaccParser.nonTerminals) this._symbols.push({ type: 'nonterminal', content: nonTerminal })
    for (let spSymbol of Object.values(SpSymbol)) this._symbols.push(spSymbol)
    this._startSymbol = this._getSymbolId({ type: 'nonterminal', content: yaccParser.startSymbol })
    assert(this._startSymbol != -1, 'LR1 startSymbol unset.')
  }

  /**
   * 获取编号后的符号的编号
   */
  _getSymbolId(grammarSymbol: { type?: 'ascii' | 'token' | 'nonterminal' | 'sptoken'; content: string }) {
    for (let i = 0; i < this._symbols.length; i++)
      if (
        (!grammarSymbol.type ? true : this._symbols[i].type === grammarSymbol.type) &&
        this._symbols[i].content === grammarSymbol.content
      )
        return i
    return -1
  }

  /**
   * 判断符号是否是某个类型
   */
  private _symbolTypeIs(id: number, type: 'ascii' | 'token' | 'nonterminal' | 'sptoken') {
    return this._symbols[id].type === type
  }

  /**
   * 求取GOTO(I, X)
   */
  private GOTO(I: LR0State, X: number) {
    let J = new LR0State([])
    for (let item of I.items) {
      // for I中的每一个项
      if (item.dotAtLast()) continue
      if (this._producers[item.producer].rhs[item.dotPosition] === X) {
        J.addItem(LR0Item.copy(item, true))
      }
    }
    return this.CLOSURE(J)
  }

  /**
   * 求取CLOSURE（LR0）
   * 龙书图4-32
   */
  private CLOSURE(I: LR0State) {
    let J = LR0State.copy(I)
    while (true) {
      let lenBefore = J.items.length
      // for J中的每一个项A→α`Bβ
      for (let oneItemOfJ of J.items) {
        if (oneItemOfJ.dotAtLast()) continue // 点号到最后，不能扩展
        let currentSymbol = this._producers[oneItemOfJ.producer].rhs[oneItemOfJ.dotPosition]
        if (!this._symbolTypeIs(currentSymbol, 'nonterminal')) continue // 非终结符打头才有CLOSURE
        // for G中的每个产生式B→γ
        let extendProducers = []
        for (let producerInG of this._producers) producerInG.lhs === currentSymbol && extendProducers.push(producerInG) // 左手边是当前符号的，就可以作为扩展用
        for (let extendProducer of extendProducers) {
          let newItem = new LR0Item(extendProducer, this._producers.indexOf(extendProducer), 0)
          // if 项B→`γ不在J中
          J.items.every(item => !LR0Item.same(item, newItem)) && J.addItem(newItem)
        }
      }
      let lenAfter = J.items.length
      if (lenBefore === lenAfter) break
    }
    return J
  }

  getSymbolString(id: number) {
    return this._symbolTypeIs(id, 'ascii') ? `'${this._symbols[id].content}'` : this._symbols[id].content
  }

  /**
   * 获取指定非终结符为左侧的所有产生式
   */
  private _producersOf(nonterminal: number) {
    let ret = []
    for (let producer of this._producers) if (producer.lhs == nonterminal) ret.push(producer)
    return ret
  }

  /**
   * 构造LR0自动机
   */
  _construrctLR0DFA() {
    // 将C初始化为 {CLOSURE}({|S'->S, $|})
    let newStartSymbolContent = this._symbols[this._startSymbol].content + "'"
    while (this._symbols.some(symbol => symbol.content === newStartSymbolContent)) newStartSymbolContent += "'"
    this._symbols.push({ type: 'nonterminal', content: newStartSymbolContent })
    this._producers.push(
      new LR0Producer(this._symbols.length - 1, [this._startSymbol], `$$ = $1; reduceTo("${newStartSymbolContent}");`)
    )
    this._startSymbol = this._symbols.length - 1
    let initProducer = this._producersOf(this._startSymbol)[0]
    let I0 = this.CLOSURE(new LR0State([new LR0Item(initProducer, this._producers.indexOf(initProducer))]))
    // 初始化自动机
    let dfa = new LR0DFA(0)
    dfa.addState(I0)
    let stack = [0]
    while (stack.length) {
      let I = dfa.states[stack.pop() as number] // for C中的每个项集I
      for (let X = 0; X < this._symbols.length; X++) {
        // for 每个文法符号X
        let gotoIX = this.GOTO(I, X)
        if (gotoIX.items.length === 0) continue // gotoIX要非空
        const sameStateCheck = dfa.states.findIndex(x => LR0State.same(x, gotoIX)) // 存在一致状态要处理
        if (sameStateCheck !== -1) {
          dfa.link(dfa.states.indexOf(I), sameStateCheck, X)
        } else {
          // 新建状态并连接
          dfa.addState(gotoIX)
          dfa.link(dfa.states.indexOf(I), dfa.states.length - 1, X)
          stack.push(dfa.states.length - 1)
        }
      }
    }
    this._dfa = dfa
  }
}
