/**
 * LALR语法分析
 *
 * 2020-10 @ https://github.com/seu-cs-class2/minisys-minicc-ts
 */

import { assert } from '../utils'
import {
  GrammarSymbol,
  LALRDFA,
  LALRItem,
  LALROperator,
  LALRProducer,
  LALRState,
  LR0DFA,
  LR0Item,
  LR0State,
  LR1Item,
  SpSymbol,
} from './Grammar'
import { LR0Analyzer } from './LR0'

export class LALRAnalyzer {
  private _symbols: GrammarSymbol[]
  private _operators: LALROperator[]
  private _producers: LALRProducer[]
  private _startSymbol: number
  private _lr0Analyzer: LR0Analyzer
  private _lr0dfa: LR0DFA
  private _dfa!: LALRDFA
  private _first: number[][]
  private _epsilon!: number

  get symbols(): GrammarSymbol[] {
    return this._symbols
  }

  set symbols(symbols: GrammarSymbol[]) {
    this._symbols = symbols
  }

  get operators(): LALROperator[] {
    return this._operators
  }

  set operators(operators: LALROperator[]) {
    this._operators = operators
  }

  get producers(): LALRProducer[] {
    return this._producers
  }

  set producers(producers: LALRProducer[]) {
    this._producers = producers
  }

  get startSymbol(): number {
    return this._startSymbol
  }

  set startSymbol(startSymbol: number) {
    this._startSymbol = startSymbol
  }

  get lr0Analyzer(): LR0Analyzer {
    return this._lr0Analyzer
  }

  set lr0Analyzer(lr0Analyzer: LR0Analyzer) {
    this._lr0Analyzer = lr0Analyzer
  }

  get lr0dfa(): LR0DFA {
    return this._lr0dfa
  }

  set lr0dfa(lr0dfa: LR0DFA) {
    this._lr0dfa = lr0dfa
  }

  get dfa(): LALRDFA {
    return this._dfa
  }

  set dfa(dfa: LALRDFA) {
    this._dfa = dfa
  }

  get first(): number[][] {
    return this._first
  }

  set first(first: number[][]) {
    this._first = first
  }

  get epsilon(): number {
    return this._epsilon
  }

  set epsilon(epsilon: number) {
    this._epsilon = epsilon
  }

  constructor(lr0Analyzer: LR0Analyzer) {
    this._symbols = lr0Analyzer.symbols
    this._producers = lr0Analyzer.producers
    this._operators = lr0Analyzer.operators
    this._lr0Analyzer = lr0Analyzer
    this._lr0dfa = lr0Analyzer.dfa
    this._startSymbol = lr0Analyzer.startSymbol
    this._first = []
    this._epsilon = this._getSymbolId(SpSymbol.EPSILON)
    this._preCalculateFIRST()
    this._constructLALRDFA()
  }

  _getNext(state: LR0State, symbol: GrammarSymbol) {
    const alpha = this._getSymbolId(symbol)
    const target = this._lr0dfa.adjList[this._lr0dfa.states.indexOf(state)].findIndex(x => x.alpha === alpha)
    return target
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
   * 预先计算各符号的FIRST集（不动点法）
   */
  _preCalculateFIRST() {
    let changed = true
    for (let index in this._symbols) this._first.push(this._symbols[index].type == 'nonterminal' ? [] : [Number(index)])
    while (changed) {
      changed = false
      for (let index in this._symbols) {
        if (this._symbols[index].type != 'nonterminal') continue
        this._producersOf(Number(index)).forEach(producer => {
          let i = 0,
            hasEpsilon = false
          do {
            hasEpsilon = false
            if (i >= producer.rhs.length) {
              if (!this._first[index].includes(this._epsilon)) this._first[index].push(this._epsilon), (changed = true)
              break
            }
            this._first[producer.rhs[i]].forEach(symbol => {
              if (!this._first[index].includes(symbol)) this._first[index].push(symbol), (changed = true)
              if (symbol == this._epsilon) hasEpsilon = true
            })
          } while ((i++, hasEpsilon))
        })
      }
    }
  }

  /**
   * 求取FIRST集
   */
  FIRST(symbols: number[]): number[] {
    let ret: number[] = []
    let i = 0,
      hasEpsilon = false
    do {
      hasEpsilon = false
      if (i >= symbols.length) {
        ret.push(this._epsilon)
        break
      }
      this._first[symbols[i]].forEach(symbol => {
        if (symbol == this._epsilon) {
          hasEpsilon = true
        } else {
          if (!ret.includes(symbol)) ret.push(symbol)
        }
      })
    } while ((i++, hasEpsilon))
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
   * 求取GOTO(I, X)
   */
  private GOTO_LR0(I: LR0State, X: number) {
    let J = new LR0State([])
    for (let item of I.items) {
      // for I中的每一个项
      if (item.dotAtLast()) continue
      if (this._producers[item.producer].rhs[item.dotPosition] === X) {
        J.addItem(LR0Item.copy(item, true))
      }
    }
    return this.CLOSURE_LR0(J)
  }

  /**
   * 求取CLOSURE（LR0）
   * 龙书图4-32
   */
  private CLOSURE_LR0(I: LR0State) {
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

  /**
   * 从LR0构造LALR
   * // FIXME
   * 龙书算法4.63
   */
  _constructLALRDFA() {
    // 1) 构造G的LR0项目集族的内核
    // 从现有的LR0中删除非内核项
    this._lr0dfa.states.forEach((state, idx) => {
      // 增广开始项固定保留
      if (idx === 0) return
      const kernelizedItems = state.items.filter(item => item.dotPosition > 0)
      state.forceSetItems(kernelizedItems)
    })

    // 2) 将算法4.62应用于每个内核和文法符号（发现传播的和自发生成的向前看符号）
    interface PropRule {
      fromState: number
      fromItem: number
      toState: number
      toItem: number
    }
    // 传播法则
    const propRules: PropRule[] = []
    function newPropRule(rule: PropRule) {
      const check = propRules.some(v => JSON.stringify(v) == JSON.stringify(rule))
      if (!check) propRules.push(rule)
    }
    const lookaheadTable: number[][][] = Array(this._lr0dfa.states.length)
      .fill(0)
      .map(_ => Array(0))
    // [状态号][状态内项目号] -> 展望符[]
    this._lr0dfa.states.forEach((state, idx) => {
      lookaheadTable[idx] = Array(state.items.length)
        .fill(0)
        .map(_ => Array(0))
    })
    // 作为一个特殊情况，向前看符号$对于初始项目集族中的项而言是自发生成的
    lookaheadTable[this._lr0dfa.startStateId].forEach(item => {
      item.push(this._getSymbolId(SpSymbol.END))
    })
    // 令#为一个不在当前文法中的符号
    const sharp = -10086
    for (let K of this._lr0dfa.states) {
      // for K中的每一个项A→α`β
      for (let KItem of K.items) {
        // J = CLOSURE( { [A→α`β, #] } )
        let J = this.CLOSURE(new LALRState([new LALRItem(KItem.rawProducer, KItem.producer, sharp, KItem.dotPosition)]))
        for (let JItem of J.items) {
          if (JItem.dotAtLast()) continue
          let X = this._producers[JItem.producer].rhs[JItem.dotPosition]
          // FIXME: Which is right?
          // let gotoIX = this.GOTO_LR0(K, X)
          // let targetState = this._lr0dfa.adjList[this._lr0dfa.states.indexOf(gotoIX)].find(x => x.alpha == X)!.to
          let targetState = this._lr0dfa.adjList[this._lr0dfa.states.indexOf(K)].find(x => x.alpha == X)!.to
          let targetItem = this._lr0dfa.states[targetState].items.findIndex(x =>
            LR0Item.same(x, new LR0Item(JItem.rawProducer, JItem.producer, JItem.dotPosition + 1))
          )
          // if ( [B→γ`Xδ,a]在J中，且a不等于# )
          if (JItem.lookahead !== sharp) {
            // 发现了新的自发生成符号
            !lookaheadTable[targetState][targetItem].includes(JItem.lookahead) &&
              lookaheadTable[targetState][targetItem].push(JItem.lookahead)
          }
          // if ( [B→γ`Xδ,#]在J中 )
          if (JItem.lookahead === sharp) {
            // 发现了新的传播规则
            newPropRule({
              fromState: this._lr0dfa.states.indexOf(K),
              fromItem: K.items.indexOf(KItem),
              toState: targetState,
              toItem: targetItem,
            })
          }
        }
      }
    }

    console.log(propRules)
    console.log(lookaheadTable)

    // 3) 不动点法进行传播
    while (true) {
      let unfix = false
      for (let rule of propRules) {
        let source = lookaheadTable[rule.fromState][rule.fromItem]
        let target = lookaheadTable[rule.toState][rule.toItem]
        let beforeLen = target.length
        lookaheadTable[rule.toState][rule.toItem] = [...new Set([...target, ...source].filter(x => x !== sharp))]
        let afterLen = lookaheadTable[rule.toState][rule.toItem].length
        unfix = unfix || afterLen > beforeLen
      }
      if (!unfix) break
    }

    // 4) 形成LALRDFA
    this._dfa = new LALRDFA(this._lr0dfa.startStateId)
    this._lr0dfa.states.forEach((state, idx1) => {
      let items: LALRItem[] = []
      state.items.forEach((item, idx2) => {
        for (let lookahead of lookaheadTable[idx1][idx2])
          items.push(new LALRItem(item.rawProducer, item.producer, lookahead, item.dotPosition))
      })
      this._dfa.addState(new LALRState(items))
    })
    this._lr0dfa.adjList.forEach((records, idx) => {
      records.forEach(({ to, alpha }) => {
        this._dfa.link(idx, to, alpha)
      })
    })
  }
}
