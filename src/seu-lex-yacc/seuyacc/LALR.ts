/**
 * LALR
 */

import {
  GrammarSymbol,
  LALRDFA,
  LALRItem,
  LALROperator,
  LALRProducer,
  LALRState,
  LR0DFA,
  LR0State,
  LR1Item,
  SpSymbol,
} from './Grammar'
import { LR0Analyzer } from './LR0'

// FIXME: 目前从LR0中删除非内核项对LR0Analyzer有破坏性

export class LALRAnalyzer {
  private _symbols: GrammarSymbol[]
  private _operators: LALROperator[]
  private _producers: LALRProducer[]
  private _startSymbol!: number
  private _lr0Analyzer: LR0Analyzer
  private _lr0dfa: LR0DFA
  private _dfa!: LALRDFA

  constructor(lr0Analyzer: LR0Analyzer) {
    this._symbols = lr0Analyzer.symbols
    this._producers = lr0Analyzer.producers
    this._operators = lr0Analyzer.operators
    this._lr0Analyzer = lr0Analyzer
    this._lr0dfa = lr0Analyzer.dfa
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
   * 求取CLOSURE(I)（I为某状态）
   * 见龙书算法4.53
   */
  private CLOSURE(I: LALRState): LALRState {
    let res = LALRState.copy(I)
    let allItemsOfI = [...I.items] // for I中的每一个项
    while (allItemsOfI.length) {
      let oneItemOfI = allItemsOfI.pop() as LALRItem
      if (oneItemOfI.dotAtLast()) continue // 点号到最后，不能扩展
      let currentSymbol = this._producers[oneItemOfI.producer].rhs[oneItemOfI.dotPosition]
      if (!this._symbolTypeIs(currentSymbol, 'nonterminal')) continue // 非终结符打头才有CLOSURE
      let extendProducers = []
      for (let producerInG of this._producers) // for G'中的每个产生式
        producerInG.lhs === currentSymbol && extendProducers.push(producerInG) // 左手边是当前符号的，就可以作为扩展用
      let lookahead = oneItemOfI.lookahead
      for (let extendProducer of extendProducers) {
        // 求取新的展望符号
        let newLookaheads = this.FIRST(this._producers[oneItemOfI.producer].rhs.slice(oneItemOfI.dotPosition + 1))
        // 存在epsilon作为FIRST符，可以用它“闪过”
        if (newLookaheads.includes(this._getSymbolId(SpSymbol.EPSILON))) {
          newLookaheads = newLookaheads.filter(v => v != this._getSymbolId(SpSymbol.EPSILON))
          !newLookaheads.includes(lookahead) && newLookaheads.push(lookahead) // 闪过，用旧的展望符号
        }
        // for FIRST(βa)中的每个终结符号b
        for (let lookahead of newLookaheads) {
          let newItem = new LR1Item(extendProducer, this._producers.indexOf(extendProducer), lookahead)
          if (res.items.some(item => LALRItem.same(item, newItem))) continue // 重复的情况不再添加，避免出现一样的Item
          allItemsOfI.every(item => !LALRItem.same(item, newItem)) && allItemsOfI.push(newItem) // 继续扩展
          res.addItem(newItem)
        }
      }
    }
    return res
  }

  /**
   * 向前看符号确定法（符号传播、自发生成）
   * 龙书算法4.62
   */
  private _determineLookahead(K: LR0State, X: GrammarSymbol) {
    // for K中的每一个项A→α`β
    for (let item of K.items) {
      if (item.dotAtLast()) continue // 点号到最后的排除
      const currentSymbol = this._producers[item.producer].rhs[item.dotPosition]
      if (!this._symbolTypeIs(currentSymbol, 'nonterminal')) continue // 不是非终结符打头的排除
      // J := CLOSURE({[A→α`β,#]})
      let J = this.CLOSURE(
        new LALRState([new LALRItem(item.rawProducer, item.producer, this._getSymbolId(SpSymbol.END))])
      )
      for (let item of J.items) {
        // if [B→γ`Xδ,a]在J中，并且a不等于#
        // FIXME: _symbolTypeIs后面那坨能不能短一点啊
        if (
          !item.dotAtLast() &&
          !this._symbolTypeIs(this._producers[item.producer].rhs[item.dotPosition], 'nonterminal') &&
          item.lookahead !== this._getSymbolId(SpSymbol.END)
        ) {
          // 断定GOTO(I,X)中的项B→γ`Xδ的向前看符号a是自发生成的
        } else if (
          !item.dotAtLast() &&
          !this._symbolTypeIs(this._producers[item.producer].rhs[item.dotPosition], 'nonterminal') &&
          item.lookahead === this._getSymbolId(SpSymbol.END)
        ) {
          // 断定向前看符号从I中的项A→α`β传播到了GOTO(I,X)中的项B→γ`Xδ之上
        }
      }
    }
  }

  /**
   * 从LR0构造LALR
   * 龙书算法4.63
   * 妙啊
   */
  _constructLALRDFA() {
    // 构造G的LR0项目集族的内核 - 从现有的LR0中删除非内核项
    this._lr0dfa.states.forEach((state, idx) => {
      if (idx === 0) return // 增广开始项固定保留
      const kernelizedItems = state.items.filter(item => item.dotPosition > 0)
      state.forceSetItems(kernelizedItems)
    })
    // 将算法4.62应用于每个LR0项集的内核和每个文法符号X
    const propagationTable: number[] = Array(this._lr0dfa.states.length).fill([]) // 状态号→传播到的状态号
    const lookaheadTable: number[] = Array(this._lr0dfa.states.length).fill([]) // 状态号→向前看符号
    // 传播

  }
}
