"use strict";
/**
 * 语法相关定义
 * 2020-05 @ https://github.com/z0gSh1u/seu-lex-yacc
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.LALROperator = exports.LALRDFA = exports.LALRState = exports.LALRItem = exports.LALRProducer = exports.LR0Operator = exports.LR0DFA = exports.LR0State = exports.LR0Item = exports.LR0Producer = exports.LR1Operator = exports.LR1DFA = exports.LR1State = exports.LR1Item = exports.LR1Producer = exports.YaccParserProducer = exports.SpSymbol = void 0;
/**
 * 特殊Symbol
 */
exports.SpSymbol = {
    END: { type: 'sptoken', content: 'SP_END' },
    EPSILON: { type: 'sptoken', content: 'SP_EPSILON' },
};
/**
 * YaccParser读出的产生式
 */
class YaccParserProducer {
    constructor(lhs, rhs, actions) {
        this._lhs = lhs;
        this._rhs = [...rhs];
        this._actions = [...actions];
    }
    get lhs() {
        return this._lhs;
    }
    get rhs() {
        return this._rhs;
    }
    get actions() {
        return this._actions;
    }
}
exports.YaccParserProducer = YaccParserProducer;
// ===================== 语法分析相关 =====================
class ProducerBase {
    constructor(lhs, rhs, action = '') {
        this._lhs = lhs;
        this._rhs = [...rhs];
        this._action = action;
    }
    get lhs() {
        return this._lhs;
    }
    get rhs() {
        return this._rhs;
    }
    get action() {
        return this._action;
    }
}
class ItemBase {
    constructor(rawProducer, producer, dotPosition = 0) {
        this._rawProducer = rawProducer;
        this._producer = producer;
        this._dotPosition = dotPosition;
    }
    get producer() {
        return this._producer;
    }
    get dotPosition() {
        return this._dotPosition;
    }
    get rawProducer() {
        return this._rawProducer;
    }
    dotAtLast() {
        return this._dotPosition === this._rawProducer.rhs.length;
    }
    dotGo() {
        this._dotPosition += 1;
    }
    static copy(item, dotGo = false) {
        return new ItemBase(item._rawProducer, item._producer, item._dotPosition + (dotGo ? 1 : 0));
    }
    static same(i1, i2) {
        return i1._dotPosition === i2._dotPosition && i1._producer === i2._producer;
    }
}
class StateBase {
    constructor(items) {
        this._items = [...items];
    }
    get items() {
        return this._items;
    }
    addItem(item) {
        this._items.push(item);
    }
    forceSetItems(items) {
        this._items = [...items];
    }
    static copy(state) {
        return new StateBase(state._items.map(x => ItemBase.copy(x)));
    }
    static same(s1, s2) {
        return (s1._items.every(x => s2._items.some(y => ItemBase.same(x, y))) &&
            s2._items.every(x => s1._items.some(y => ItemBase.same(x, y))));
    }
}
class DFABase {
    constructor(startStateId) {
        this._startStateId = startStateId;
        this._states = [];
        this._adjList = [];
    }
    get startStateId() {
        return this._startStateId;
    }
    set startStateId(val) {
        this._startStateId = val;
    }
    get states() {
        return this._states;
    }
    get adjList() {
        return this._adjList;
    }
    addState(state) {
        this._states.push(state);
        this._adjList.push([]);
    }
    link(from, to, alpha) {
        this._adjList[from].push({ to, alpha });
    }
}
class OperatorBase {
    constructor(symbolId, assoc, precedence) {
        this._symbolId = symbolId;
        this._assoc = assoc;
        this._precedence = precedence;
    }
    get symbolId() {
        return this._symbolId;
    }
    get assoc() {
        return this._assoc;
    }
    get precedence() {
        return this._precedence;
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
class LR1Producer extends ProducerBase {
}
exports.LR1Producer = LR1Producer;
/**
 * LR1项目
 * A->a, $就是一条项目
 * 将多个展望符的，拆分成不同的项目，每个项目只有一个展望符号
 */
class LR1Item extends ItemBase {
    constructor(rawProducer, producer, lookahead, dotPosition = 0) {
        super(rawProducer, producer, dotPosition);
        this._lookahead = lookahead;
    }
    get lookahead() {
        return this._lookahead;
    }
    static copy(item, go = false) {
        return new LR1Item(item._rawProducer, item._producer, item._lookahead, item._dotPosition + (go ? 1 : 0));
    }
    static same(i1, i2) {
        return i1._dotPosition === i2._dotPosition && i1._lookahead === i2._lookahead && i1._producer === i2._producer;
    }
}
exports.LR1Item = LR1Item;
/**
 * LR1项目集（LR1自动机状态）
 */
class LR1State extends StateBase {
    constructor(items) {
        super([]);
        this._items = [...items];
    }
    get items() {
        return this._items;
    }
    addItem(item) {
        super.addItem(item);
    }
    forceSetItems(items) {
        super.forceSetItems(items);
    }
    static copy(state) {
        return new LR1State(state._items.map(x => LR1Item.copy(x)));
    }
    static same(s1, s2) {
        return (s1._items.every(x => s2._items.some(y => LR1Item.same(x, y))) &&
            s2._items.every(x => s1._items.some(y => LR1Item.same(x, y))));
    }
}
exports.LR1State = LR1State;
/**
 * LR1项目集族（LR1自动机）
 */
class LR1DFA extends DFABase {
    constructor(startStateId) {
        super(startStateId);
    }
    get states() {
        return this._states;
    }
    addState(state) {
        super.addState(state);
    }
}
exports.LR1DFA = LR1DFA;
/**
 * LR1运算符
 */
class LR1Operator extends OperatorBase {
}
exports.LR1Operator = LR1Operator;
// ===================== LR0相关 =====================
class LR0Producer extends ProducerBase {
}
exports.LR0Producer = LR0Producer;
class LR0Item extends ItemBase {
}
exports.LR0Item = LR0Item;
class LR0State extends StateBase {
}
exports.LR0State = LR0State;
class LR0DFA extends DFABase {
}
exports.LR0DFA = LR0DFA;
class LR0Operator extends OperatorBase {
}
exports.LR0Operator = LR0Operator;
// ===================== LALR1相关 =====================
class LALRProducer extends LR1Producer {
}
exports.LALRProducer = LALRProducer;
class LALRItem extends LR1Item {
}
exports.LALRItem = LALRItem;
class LALRState extends LR1State {
}
exports.LALRState = LALRState;
class LALRDFA extends LR1DFA {
}
exports.LALRDFA = LALRDFA;
class LALROperator extends LR1Operator {
}
exports.LALROperator = LALROperator;
