"use strict";
/**
 * LALR语法分析
 *
 * 2020-10 @ https://github.com/seu-cs-class2/minisys-minicc-ts
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
exports.LALRAnalyzer = void 0;
const Grammar_1 = require("./Grammar");
const progressbar_1 = require("../enhance/progressbar");
const fs = __importStar(require("fs"));
class LALRAnalyzer {
    constructor(lr0Analyzer) {
        this._symbols = [];
        this._producers = [];
        this._operators = [];
        this._ACTIONTable = [];
        this._GOTOTable = [];
        this._ACTIONReverseLookup = [];
        this._GOTOReverseLookup = [];
        this._first = [];
        this._startSymbol = 0;
        this._first = [];
        if (lr0Analyzer) {
            this._symbols = lr0Analyzer.symbols;
            this._producers = lr0Analyzer.producers;
            this._operators = lr0Analyzer.operators;
            this._lr0Analyzer = lr0Analyzer;
            this._lr0dfa = lr0Analyzer.dfa;
            this._startSymbol = lr0Analyzer.startSymbol;
            this._first = [];
            this._epsilon = this._getSymbolId(Grammar_1.SpSymbol.EPSILON);
            console.log('[LALR] Computing FIRST set...');
            this._preCalculateFIRST();
            console.log('[LALR] Start LALR DFA construction...');
            this._constructLALRDFA();
            console.log('[LALR] Start LALR ACTIONGOTOTable construction...');
            this._constructACTIONGOTOTable();
        }
    }
    get symbols() {
        return this._symbols;
    }
    set symbols(symbols) {
        this._symbols = symbols;
    }
    get operators() {
        return this._operators;
    }
    set operators(operators) {
        this._operators = operators;
    }
    get producers() {
        return this._producers;
    }
    set producers(producers) {
        this._producers = producers;
    }
    get startSymbol() {
        return this._startSymbol;
    }
    set startSymbol(startSymbol) {
        this._startSymbol = startSymbol;
    }
    get lr0Analyzer() {
        return this._lr0Analyzer;
    }
    set lr0Analyzer(lr0Analyzer) {
        this._lr0Analyzer = lr0Analyzer;
    }
    get lr0dfa() {
        return this._lr0dfa;
    }
    set lr0dfa(lr0dfa) {
        this._lr0dfa = lr0dfa;
    }
    get dfa() {
        return this._dfa;
    }
    set dfa(dfa) {
        this._dfa = dfa;
    }
    get first() {
        return this._first;
    }
    set first(first) {
        this._first = first;
    }
    get epsilon() {
        return this._epsilon;
    }
    set epsilon(epsilon) {
        this._epsilon = epsilon;
    }
    get ACTIONTable() {
        return this._ACTIONTable;
    }
    get GOTOTable() {
        return this._GOTOTable;
    }
    get ACTIONReverseLookup() {
        return this._ACTIONReverseLookup;
    }
    get GOTOReverseLookup() {
        return this._GOTOReverseLookup;
    }
    _getNext(state, symbol) {
        const alpha = this._getSymbolId(symbol);
        const target = this._lr0dfa.adjList[this._lr0dfa.states.indexOf(state)].findIndex(x => x.alpha === alpha);
        return target;
    }
    /**
     * 格式化打印产生式
     */
    formatPrintProducer(producer) {
        const lhs = this._symbols[producer.lhs].content;
        const rhs = producer.rhs.map(this.getSymbolString, this).join(' ');
        return lhs + ' -> ' + rhs;
    }
    watchState(stateIdx) {
        const prods = this.dfa.states[stateIdx].items.map(v => this.formatPrintProducer(this.producers[v.producer]));
        this.dfa.states[stateIdx].items.forEach((v, i) => (prods[i] = `[${v.dotPosition}] ` + prods[i] + ` [${this.getSymbolString(v.lookahead)}]`));
        return prods.join('\n');
    }
    getLHS(producer) {
        const lhs = this._symbols[producer.lhs].content;
        return lhs;
    }
    /**
     * 获取编号后的符号的编号
     */
    _getSymbolId(grammarSymbol) {
        for (let i = 0; i < this._symbols.length; i++)
            if ((!grammarSymbol.type ? true : this._symbols[i].type === grammarSymbol.type) &&
                this._symbols[i].content === grammarSymbol.content)
                return i;
        return -1;
    }
    /**
     * 判断符号是否是某个类型
     */
    _symbolTypeIs(id, type) {
        return this._symbols[id].type === type;
    }
    getSymbolString(id) {
        return this._symbolTypeIs(id, 'ascii') ? `'${this._symbols[id].content}'` : this._symbols[id].content;
    }
    /**
     * 获取指定非终结符为左侧的所有产生式
     */
    _producersOf(nonterminal) {
        let ret = [];
        for (let producer of this._producers)
            if (producer.lhs == nonterminal)
                ret.push(producer);
        return ret;
    }
    /**
     * 预先计算各符号的FIRST集（不动点法）
     */
    _preCalculateFIRST() {
        let changed = true;
        for (let index in this._symbols)
            this._first.push(this._symbols[index].type == 'nonterminal' ? [] : [Number(index)]);
        while (changed) {
            changed = false;
            for (let index in this._symbols) {
                if (this._symbols[index].type != 'nonterminal')
                    continue;
                this._producersOf(Number(index)).forEach(producer => {
                    let i = 0, hasEpsilon = false;
                    do {
                        hasEpsilon = false;
                        if (i >= producer.rhs.length) {
                            if (!this._first[index].includes(this._epsilon))
                                this._first[index].push(this._epsilon), (changed = true);
                            break;
                        }
                        this._first[producer.rhs[i]].forEach(symbol => {
                            if (!this._first[index].includes(symbol))
                                this._first[index].push(symbol), (changed = true);
                            if (symbol == this._epsilon)
                                hasEpsilon = true;
                        });
                    } while ((i++, hasEpsilon));
                });
            }
        }
    }
    /**
     * 求取FIRST集
     */
    FIRST(symbols) {
        let ret = [];
        let i = 0, hasEpsilon = false;
        do {
            hasEpsilon = false;
            if (i >= symbols.length) {
                ret.push(this._epsilon);
                break;
            }
            this._first[symbols[i]].forEach(symbol => {
                if (symbol == this._epsilon) {
                    hasEpsilon = true;
                }
                else {
                    if (!ret.includes(symbol))
                        ret.push(symbol);
                }
            });
        } while ((i++, hasEpsilon));
        return ret;
    }
    /**
     * 求取CLOSURE(I)（I为某状态）
     * 见龙书算法4.53
     */
    CLOSURE(I) {
        let res = Grammar_1.LALRState.copy(I);
        let allItemsOfI = [...I.items]; // for I中的每一个项
        while (allItemsOfI.length) {
            let oneItemOfI = allItemsOfI.pop();
            if (oneItemOfI.dotAtLast())
                continue; // 点号到最后，不能扩展
            let currentSymbol = this._producers[oneItemOfI.producer].rhs[oneItemOfI.dotPosition];
            if (!this._symbolTypeIs(currentSymbol, 'nonterminal'))
                continue; // 非终结符打头才有CLOSURE
            let extendProducers = [];
            for (let producerInG of this._producers) // for G'中的每个产生式
                producerInG.lhs === currentSymbol && extendProducers.push(producerInG); // 左手边是当前符号的，就可以作为扩展用
            let lookahead = oneItemOfI.lookahead;
            for (let extendProducer of extendProducers) {
                // 求取新的展望符号
                let newLookaheads = this.FIRST(this._producers[oneItemOfI.producer].rhs.slice(oneItemOfI.dotPosition + 1));
                // 存在epsilon作为FIRST符，可以用它“闪过”
                if (newLookaheads.includes(this._getSymbolId(Grammar_1.SpSymbol.EPSILON))) {
                    newLookaheads = newLookaheads.filter(v => v != this._getSymbolId(Grammar_1.SpSymbol.EPSILON));
                    !newLookaheads.includes(lookahead) && newLookaheads.push(lookahead); // 闪过，用旧的展望符号
                }
                // for FIRST(βa)中的每个终结符号b
                for (let lookahead of newLookaheads) {
                    let newItem = new Grammar_1.LALRItem(extendProducer, this._producers.indexOf(extendProducer), lookahead);
                    if (res.items.some(item => Grammar_1.LALRItem.same(item, newItem)))
                        continue; // 重复的情况不再添加，避免出现一样的Item
                    allItemsOfI.every(item => !Grammar_1.LALRItem.same(item, newItem)) && allItemsOfI.push(newItem); // 继续扩展
                    res.addItem(newItem);
                }
            }
        }
        return res;
    }
    /**
     * 从LR0构造LALR
     * 龙书算法4.63
     */
    _constructLALRDFA() {
        // 1) 构造G的LR0项目集族的内核
        // 从现有的LR0中删除非内核项
        this._lr0dfa.states.forEach((state, idx) => {
            // 增广开始项固定保留
            if (idx === 0)
                return;
            const kernelizedItems = state.items.filter(item => item.dotPosition > 0);
            state.forceSetItems(kernelizedItems);
        });
        // 传播法则
        const propRules = [];
        function newPropRule(rule) {
            const check = propRules.some(v => JSON.stringify(v) == JSON.stringify(rule));
            if (!check)
                propRules.push(rule);
        }
        const lookaheadTable = Array(this._lr0dfa.states.length)
            .fill(0)
            .map(_ => Array(0));
        // [状态号][状态内项目号] -> 展望符[]
        this._lr0dfa.states.forEach((state, idx) => {
            lookaheadTable[idx] = Array(state.items.length)
                .fill(0)
                .map(_ => Array(0));
        });
        // 作为一个特殊情况，向前看符号$对于初始项目集族中的项而言是自发生成的
        lookaheadTable[this._lr0dfa.startStateId].forEach(item => {
            item.push(this._getSymbolId(Grammar_1.SpSymbol.END));
        });
        // 令#为一个不在当前文法中的符号
        const sharp = -10086;
        for (let K of this._lr0dfa.states) {
            // for K中的每一个项A→α`β
            for (let KItem of K.items) {
                // J = CLOSURE( { [A→α`β, #] } )
                let J = this.CLOSURE(new Grammar_1.LALRState([new Grammar_1.LALRItem(KItem.rawProducer, KItem.producer, sharp, KItem.dotPosition)]));
                for (let JItem of J.items) {
                    if (JItem.dotAtLast())
                        continue;
                    let X = this._producers[JItem.producer].rhs[JItem.dotPosition];
                    let targetState = this._lr0dfa.adjList[this._lr0dfa.states.indexOf(K)].find(x => x.alpha == X).to;
                    let targetItem = this._lr0dfa.states[targetState].items.findIndex(x => Grammar_1.LR0Item.same(x, new Grammar_1.LR0Item(JItem.rawProducer, JItem.producer, JItem.dotPosition + 1)));
                    // if ( [B→γ`Xδ,a]在J中，且a不等于# )
                    if (JItem.lookahead !== sharp) {
                        // 发现了新的自发生成符号
                        !lookaheadTable[targetState][targetItem].includes(JItem.lookahead) &&
                            lookaheadTable[targetState][targetItem].push(JItem.lookahead);
                    }
                    // if ( [B→γ`Xδ,#]在J中 )
                    if (JItem.lookahead === sharp) {
                        // 发现了新的传播规则
                        newPropRule({
                            fromState: this._lr0dfa.states.indexOf(K),
                            fromItem: K.items.indexOf(KItem),
                            toState: targetState,
                            toItem: targetItem,
                        });
                    }
                }
            }
        }
        // 3) 不动点法进行传播
        while (true) {
            let unfix = false;
            for (let rule of propRules) {
                let source = lookaheadTable[rule.fromState][rule.fromItem];
                let target = lookaheadTable[rule.toState][rule.toItem];
                let beforeLen = target.length;
                lookaheadTable[rule.toState][rule.toItem] = [...new Set([...target, ...source].filter(x => x !== sharp))];
                let afterLen = lookaheadTable[rule.toState][rule.toItem].length;
                unfix = unfix || afterLen > beforeLen;
            }
            if (!unfix)
                break;
        }
        // 4) 形成LALRDFA
        this._dfa = new Grammar_1.LALRDFA(this._lr0dfa.startStateId);
        this._lr0dfa.states.forEach((state, idx1) => {
            let items = [];
            state.items.forEach((item, idx2) => {
                for (let lookahead of lookaheadTable[idx1][idx2])
                    items.push(new Grammar_1.LALRItem(item.rawProducer, item.producer, lookahead, item.dotPosition));
            });
            this._dfa.addState(this.CLOSURE(new Grammar_1.LALRState(items)));
        });
        this._lr0dfa.adjList.forEach((records, idx) => {
            records.forEach(({ to, alpha }) => {
                this._dfa.link(idx, to, alpha);
            });
        });
    }
    /**
     * 求取GOTO(I, X)
     * 见龙书算法4.53
     */
    GOTO(I, X) {
        let J = new Grammar_1.LALRState([]);
        for (let item of I.items) {
            // for I中的每一个项
            if (item.dotAtLast())
                continue;
            if (this._producers[item.producer].rhs[item.dotPosition] === X) {
                J.addItem(Grammar_1.LALRItem.copy(item, true));
            }
        }
        return this.CLOSURE(J);
    }
    /**
     * 生成语法分析表
     * 见龙书算法4.56
     */
    _constructACTIONGOTOTable() {
        let dfaStates = this._dfa.states;
        // 初始化ACTIONTable
        for (let i = 0; i < dfaStates.length; i++) {
            let row = [];
            for (let j = 0; j < this._symbols.length; j++) {
                if (this._symbolTypeIs(j, 'nonterminal'))
                    continue;
                row.push({ type: 'none', data: -1 });
            }
            this._ACTIONTable.push(row);
        }
        // 初始化GOTOTable
        for (let i = 0; i < dfaStates.length; i++) {
            let row = [];
            for (let j = 0; j < this._symbols.length; j++) {
                this._symbolTypeIs(j, 'nonterminal') && row.push(-1); // GOTO nowhere
            }
            this._GOTOTable.push(row);
        }
        // 初始化倒查表（由于前两个函数通过continue的方式排除不合适的符号，造成编号的错乱，故需要两张倒查表）
        // FIXME: 这个解决方式有亿点点蠢
        for (let j = 0; j < this._symbols.length; j++) {
            !this._symbolTypeIs(j, 'nonterminal') && this._ACTIONReverseLookup.push(j);
            this._symbolTypeIs(j, 'nonterminal') && this._GOTOReverseLookup.push(j);
        }
        // ===========================
        // ===== 填充ACTIONTable =====
        // ===========================
        let lookup = Array.prototype.indexOf.bind(this._ACTIONReverseLookup);
        let pb = new progressbar_1.ProgressBar();
        // 在该过程中，我们强制处理了所有冲突，保证文法是LR(1)的
        for (let i = 0; i < dfaStates.length; i++) {
            pb.render({ completed: i, total: dfaStates.length });
            // 处理移进的情况
            // ① [A->α`aβ, b], GOTO(Ii, a) = Ij, ACTION[i, a] = shift(j)
            for (let item of dfaStates[i].items) {
                if (item.dotAtLast())
                    continue; // 没有aβ
                let a = this._producers[item.producer].rhs[item.dotPosition];
                if (this._symbolTypeIs(a, 'nonterminal'))
                    continue;
                let goto = this.GOTO(dfaStates[i], a);
                for (let j = 0; j < dfaStates.length; j++)
                    if (Grammar_1.LALRState.same(goto, dfaStates[j])) {
                        this._ACTIONTable[i][lookup(a)] = { type: 'shift', data: j };
                    }
            }
            // 处理规约的情况
            // ② [A->α`, a], A!=S', ACTION[i, a] = reduce(A->α)
            for (let item of dfaStates[i].items) {
                if (!item.dotAtLast())
                    continue; // 点到最后才可能规约
                if (item.producer === this._producers.length - 1)
                    continue; // 增广产生式也不处理
                if (this._symbolTypeIs(item.lookahead, 'nonterminal'))
                    continue; // 展望非终结符的归GOTO表管
                let shouldReplace = false;
                if (this._ACTIONTable[i][lookup(item.lookahead)].type === 'shift') {
                    // 处理移进-规约冲突
                    // 展望符的优先级就是移进的优先级
                    let shiftOperator = this._operators.find(x => x.symbolId == item.lookahead);
                    let shiftPrecedence = shiftOperator === null || shiftOperator === void 0 ? void 0 : shiftOperator.precedence;
                    // 最后一个终结符的优先级就是规约的优先级
                    let reduceOperator;
                    for (let i = item.dotPosition - 1; i >= 0; i--) {
                        let symbol = this._producers[item.producer].rhs[i];
                        if (!this._symbolTypeIs(symbol, 'nonterminal')) {
                            reduceOperator = this._operators.find(x => x.symbolId == symbol);
                            break;
                        }
                    }
                    let reducePrecedence = reduceOperator === null || reduceOperator === void 0 ? void 0 : reduceOperator.precedence;
                    if (!reduceOperator || !shiftOperator || reducePrecedence == -1 || shiftPrecedence == -1) {
                        // 没有完整地定义优先级，就保持原有的移进
                    }
                    else {
                        if (reducePrecedence == shiftPrecedence) {
                            if (reduceOperator.assoc == 'left')
                                // 同级的运算符必然具备相同的结合性（因为在.y同一行声明）
                                shouldReplace = true; // 左结合就规约
                        }
                        else if (reducePrecedence > shiftPrecedence) {
                            shouldReplace = true; // 规约优先级更高，替换为规约
                        }
                    }
                }
                else if (this._ACTIONTable[i][lookup(item.lookahead)].type === 'reduce') {
                    // 处理规约-规约冲突，越早定义的产生式优先级越高
                    // 不可能出现同级产生式
                    if (this._ACTIONTable[i][lookup(item.lookahead)].data < item.producer) {
                        shouldReplace = true;
                    }
                }
                else {
                    // 没有冲突
                    this._ACTIONTable[i][lookup(item.lookahead)] = { type: 'reduce', data: item.producer }; // 使用item.producer号产生式规约
                }
                if (shouldReplace) {
                    this._ACTIONTable[i][lookup(item.lookahead)] = { type: 'reduce', data: item.producer }; // 使用item.producer号产生式规约
                }
            }
            // 处理接受的情况
            // ③ [S'->S`, $], ACTION[i, $] = acc
            for (let item of dfaStates[i].items) {
                if (item.producer === this._producers.length - 1 &&
                    item.dotAtLast() &&
                    item.lookahead === this._getSymbolId(Grammar_1.SpSymbol.END)) {
                    this._ACTIONTable[i][lookup(this._getSymbolId(Grammar_1.SpSymbol.END))] = { type: 'acc', data: 0 };
                }
            }
        }
        // ===========================
        // ====== 填充GOTOTable ======
        // ===========================
        lookup = Array.prototype.indexOf.bind(this._GOTOReverseLookup);
        for (let i = 0; i < dfaStates.length; i++)
            for (let A = 0; A < this._symbols.length; A++)
                for (let j = 0; j < dfaStates.length; j++)
                    if (Grammar_1.LALRState.same(this.GOTO(dfaStates[i], A), dfaStates[j]))
                        this._GOTOTable[i][lookup(A)] = j;
    }
    /**
     * 序列化保存LALRAnalyzer
     */
    dump(desc, savePath) {
        // @ts-ignore
        let obj = { desc };
        // symbols
        obj['symbols'] = this._symbols;
        // operators
        obj['operators'] = this._operators;
        // producers
        obj['producers'] = this._producers;
        // startSymbol
        obj['startSymbol'] = this._startSymbol;
        // LALRDFA
        obj['dfa'] = this._dfa;
        // ACTIONTable
        obj['ACTIONTable'] = this._ACTIONTable;
        // GOTOTable
        obj['GOTOTable'] = this._GOTOTable;
        // Reverse Lookup
        obj['ACTIONReverseLookup'] = this._ACTIONReverseLookup;
        obj['GOTOReverseLookup'] = this._GOTOReverseLookup;
        // first
        obj['first'] = this._first;
        // epsilon
        obj['epsilon'] = this._epsilon;
        fs.writeFileSync(savePath, JSON.stringify(obj, null, 2));
    }
    /**
     * 加载导出的LALRAnalyzer
     */
    static load(dumpPath) {
        const obj = JSON.parse(fs.readFileSync(dumpPath).toString());
        const lalr = new LALRAnalyzer(void 'empty');
        // symbols
        lalr._symbols = obj.symbols;
        // operators
        obj.operators.forEach(operator => {
            // @ts-ignore
            lalr._operators.push(new Grammar_1.LALROperator(operator._symbolId, operator._assoc, operator._precedence));
        });
        // producers
        obj.producers.forEach(producer => {
            // @ts-ignore
            lalr._producers.push(new Grammar_1.LALRProducer(producer._lhs, producer._rhs, producer._action));
        });
        // startSymbol
        lalr._startSymbol = obj.startSymbol;
        // dfa
        // @ts-ignore
        lalr._dfa = new Grammar_1.LALRDFA(obj.dfa._startStateId);
        // @ts-ignore
        obj.dfa._states.forEach(state => {
            let itemsCopy = [];
            // @ts-ignore
            state._items.forEach(item => {
                // @ts-ignore
                itemsCopy.push(new Grammar_1.LALRItem(
                // @ts-ignore
                new Grammar_1.LALRProducer(item._rawProducer._lhs, item._rawProducer._rhs, item._rawProducer._action), 
                // @ts-ignore
                item._producer, 
                // @ts-ignore
                item._lookahead, 
                // @ts-ignore
                item._dotPosition));
            });
            const stateCopy = new Grammar_1.LALRState(itemsCopy);
            lalr._dfa.addState(stateCopy);
        });
        // @ts-ignore
        obj.dfa._adjList.forEach((records, i) => {
            records.forEach(record => {
                lalr._dfa.link(i, record.to, record.alpha);
            });
        });
        // ACTIONTable
        lalr._ACTIONTable = obj.ACTIONTable;
        // GOTOTable
        lalr._GOTOTable = obj.GOTOTable;
        // Reverse Lookup
        lalr._ACTIONReverseLookup = obj.ACTIONReverseLookup;
        lalr._GOTOReverseLookup = obj.GOTOReverseLookup;
        // first
        lalr._first = obj.first;
        // epsilon
        lalr._epsilon = obj.epsilon;
        return lalr;
    }
}
exports.LALRAnalyzer = LALRAnalyzer;
