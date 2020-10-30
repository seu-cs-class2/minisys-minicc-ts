/**
 * 语法相关定义
 * 2020-05 @ https://github.com/z0gSh1u/seu-lex-yacc
 */

/**
 * 语法符号类型
 */
export type GrammarSymbol = {
  type: 'ascii' | 'token' | 'nonterminal' | 'sptoken'
  content: string
}

/**
 * 特殊Symbol
 */
export const SpSymbol = {
  END: { type: 'sptoken', content: 'SP_END' } as GrammarSymbol,
  EPSILON: { type: 'sptoken', content: 'SP_EPSILON' } as GrammarSymbol,
}

// ===================== YaccParser相关 =====================
/**
 * YaccParser在头部读出的运算符
 * @example %left ADD_OP
 */
export interface YaccParserOperator {
  tokenName?: string
  assoc: 'left' | 'right' | 'non'
  precedence: number // 越大优先级越高
}

/**
 * YaccParser读出的产生式
 */
export class YaccParserProducer {
  protected _lhs: string
  protected _rhs: string[]
  protected _actions: string[] // 与rhs一一对应
  get lhs() {
    return this._lhs
  }
  get rhs() {
    return this._rhs
  }
  get actions() {
    return this._actions
  }
  constructor(lhs: string, rhs: string[], actions: string[]) {
    this._lhs = lhs
    this._rhs = [...rhs]
    this._actions = [...actions]
  }
}

// ===================== 语法分析相关 =====================
class ProducerBase {
  protected _lhs: number
  protected _rhs: number[]
  protected _action: string
  get lhs() {
    return this._lhs
  }
  get rhs() {
    return this._rhs
  }
  get action() {
    return this._action
  }
  constructor(lhs: number, rhs: number[], action = '') {
    this._lhs = lhs
    this._rhs = [...rhs]
    this._action = action
  }
}

class ItemBase {
  protected _producer: number // 在Analyzer._producers中的下标
  protected _rawProducer: ProducerBase // 历史遗留产物
  protected _dotPosition: number // producer.rhs的点号位置，规定0号位为最左（所有符号之前）位置
  get producer() {
    return this._producer
  }
  get dotPosition() {
    return this._dotPosition
  }

  get rawProducer() {
    return this._rawProducer
  }
  constructor(rawProducer: ProducerBase, producer: number, dotPosition = 0) {
    this._rawProducer = rawProducer
    this._producer = producer
    this._dotPosition = dotPosition
  }
  dotAtLast() {
    return this._dotPosition === this._rawProducer.rhs.length
  }
  dotGo() {
    this._dotPosition += 1
  }
  static copy(item: ItemBase, go = false) {
    return new ItemBase(item._rawProducer, item._producer, item._dotPosition + (go ? 1 : 0))
  }
  static same(i1: ItemBase, i2: ItemBase) {
    return i1._dotPosition === i2._dotPosition && i1._producer === i2._producer
  }
}

class StateBase {
  protected _items: ItemBase[]
  constructor(items: ItemBase[]) {
    this._items = [...items]
  }
  get items() {
    return this._items
  }
  addItem(item: ItemBase) {
    this._items.push(item)
  }
  forceSetItems(items: ItemBase[]) {
    this._items = [...items]
  }
  static copy(state: StateBase) {
    return new StateBase(state._items.map(x => ItemBase.copy(x)))
  }
  static same(s1: StateBase, s2: StateBase) {
    return (
      s1._items.every(x => s2._items.some(y => ItemBase.same(x, y))) &&
      s2._items.every(x => s1._items.some(y => ItemBase.same(x, y)))
    )
  }
}

class DFABase {
  protected _startStateId: number
  protected _states: StateBase[]
  protected _adjList: { to: number; alpha: number }[][]
  get startStateId() {
    return this._startStateId
  }
  set startStateId(val: number) {
    this._startStateId = val
  }
  get states() {
    return this._states
  }
  get adjList() {
    return this._adjList
  }
  addState(state: StateBase) {
    this._states.push(state)
    this._adjList.push([])
  }
  link(from: number, to: number, alpha: number) {
    this._adjList[from].push({ to, alpha })
  }
  constructor(startStateId: number) {
    this._startStateId = startStateId
    this._states = []
    this._adjList = []
  }
}

class OperatorBase {
  protected _symbolId: number
  protected _assoc: 'left' | 'right' | 'non'
  protected _precedence: number // the bigger the higher
  get symbolId() {
    return this._symbolId
  }
  get assoc() {
    return this._assoc
  }
  get precedence() {
    return this._precedence
  }
  constructor(symbolId: number, assoc: 'left' | 'right' | 'non', precedence: number) {
    this._symbolId = symbolId
    this._assoc = assoc
    this._precedence = precedence
  }
}

// ===================== LR1相关 =====================
// LR1阶段对各文法符号都进行了编号
// 设计图：
/**
 *                 LR1DFA
 *  LR1State
 *  _________
 * |         |
 * | LR1Item |
 * | LR1Item | -----> ...
 * | ...     |
 * |_________|
 */

/**
 * LR1单条产生式
 * lhs->rhs {action}
 */
export class LR1Producer extends ProducerBase {}

/**
 * LR1项目
 * A->a, $就是一条项目
 * 将多个展望符的，拆分成不同的项目，每个项目只有一个展望符号
 */
export class LR1Item extends ItemBase {
  protected _lookahead: number // 展望符（终结符）
  get lookahead() {
    return this._lookahead
  }
  constructor(rawProducer: LR1Producer, producer: number, lookahead: number, dotPosition = 0) {
    super(rawProducer, producer, dotPosition)
    this._lookahead = lookahead
  }
  static copy(item: LR1Item, go = false) {
    return new LR1Item(item._rawProducer, item._producer, item._lookahead, item._dotPosition + (go ? 1 : 0))
  }
  static same(i1: LR1Item, i2: LR1Item) {
    return i1._dotPosition === i2._dotPosition && i1._lookahead === i2._lookahead && i1._producer === i2._producer
  }
}

/**
 * LR1项目集（LR1自动机状态）
 */
export class LR1State extends StateBase {
  protected _items: LR1Item[]
  constructor(items: LR1Item[]) {
    super([])
    this._items = [...items]
  }
  get items() {
    return this._items
  }
  addItem(item: LR1Item) {
    super.addItem(item)
  }
  forceSetItems(items: LR1Item[]) {
    super.forceSetItems(items)
  }
  static copy(state: LR1State) {
    return new LR1State(state._items.map(x => LR1Item.copy(x)))
  }
  static same(s1: LR1State, s2: LR1State) {
    return (
      s1._items.every(x => s2._items.some(y => LR1Item.same(x, y))) &&
      s2._items.every(x => s1._items.some(y => LR1Item.same(x, y)))
    )
  }
}

/**
 * LR1项目集族（LR1自动机）
 */
export class LR1DFA extends DFABase {
  protected _states!: LR1State[]
  get states() {
    return this._states
  }
  addState(state: LR1State) {
    super.addState(state)
  }
  constructor(startStateId: number) {
    super(startStateId)
  }
}

/**
 * LR1运算符
 */
export class LR1Operator extends OperatorBase {}

// ===================== LR0相关 =====================
export class LR0Producer extends ProducerBase {}
export class LR0Item extends ItemBase {}
export class LR0State extends StateBase {}
export class LR0DFA extends DFABase {}
export class LR0Operator extends OperatorBase {}

// ===================== LALR1相关 =====================
export class LALRProducer extends LR1Producer {}
export class LALRItem extends LR1Item {}
export class LALRState extends LR1State {}
export class LALRDFA extends LR1DFA {}
export class LALROperator extends LR1Operator {}
