"use strict";
/**
 * DEPRECATED!
 * 构造LR1的时间代价太大，不适合大规模文法的分析表构造。
 * 我们换用从LR0构造LALR的高效方法（龙书4.7.5节）
 *
 * LR1语法分析
 * 2020-05 @ https://github.com/z0gSh1u/seu-lex-yacc
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
exports.LR1Analyzer = void 0;
const Grammar_1 = require("./Grammar");
const utils_1 = require("../utils");
const progressbar_1 = require("../enhance/progressbar");
const fs = __importStar(require("fs"));
class LR1Analyzer {
    constructor(yaccParser) {
        this._symbols = [];
        this._producers = [];
        this._operators = [];
        this._ACTIONTable = [];
        this._GOTOTable = [];
        this._ACTIONReverseLookup = [];
        this._GOTOReverseLookup = [];
        this._first = [];
        if (yaccParser) {
            this._distributeId(yaccParser);
            this._convertProducer(yaccParser.producers);
            this._convertOperator(yaccParser.operatorDecl);
            this._epsilon = this._getSymbolId(Grammar_1.SpSymbol.EPSILON);
            process.stdout.write('\n[ constructLR1DFA, this might take a long time... ]\n');
            this._preCalculateFIRST();
            this._constructLR1DFA();
            process.stdout.write('\n[ constructACTIONGOTOTable, this might take a long time... ]\n');
            this._constructACTIONGOTOTable();
            process.stdout.write('\n');
        }
    }
    get symbols() {
        return this._symbols;
    }
    get dfa() {
        return this._dfa;
    }
    get producers() {
        return this._producers;
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
    /**
     * 将YaccParser解析的运算符转换为LR1Operator
     */
    _convertOperator(operatorDecl) {
        for (let decl of operatorDecl) {
            const id = decl.tokenName ? this._getSymbolId({ type: 'token', content: decl.tokenName }) : -1;
            utils_1.assert(id != -1, 'Operator declaration not found. This should never occur.');
            this._operators.push(new Grammar_1.LR1Operator(id, decl.assoc, decl.precedence));
        }
    }
    /**
     * 为文法符号（终结符、非终结符、特殊符号）分配编号
     */
    _distributeId(yaccParser) {
        // 处理方式参考《Flex与Bison》P165
        // 0~127 ASCII文字符号编号
        // 128~X Token编号
        // X+1~Y 非终结符编号
        // Y+1~Y+3 特殊符号
        for (let i = 0; i < 128; i++)
            this._symbols.push({ type: 'ascii', content: String.fromCharCode(i) });
        // 标记一下ASCII中的不可打印字符
        for (let i = 0; i < utils_1.ASCII_MIN; i++)
            this._symbols[i] = { type: 'ascii', content: '[UNPRINTABLE]' };
        this._symbols[utils_1.ASCII_MAX + 1] = { type: 'ascii', content: '[UNPRINTABLE]' };
        for (let token of yaccParser.tokenDecl)
            this._symbols.push({ type: 'token', content: token });
        for (let nonTerminal of yaccParser.nonTerminals)
            this._symbols.push({ type: 'nonterminal', content: nonTerminal });
        for (let spSymbol of Object.values(Grammar_1.SpSymbol))
            this._symbols.push(spSymbol);
        this._startSymbol = this._getSymbolId({ type: 'nonterminal', content: yaccParser.startSymbol });
        utils_1.assert(this._startSymbol != -1, 'LR1 startSymbol unset.');
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
    /**
     * 获取符号的字面值
     */
    getSymbolString(id) {
        return this._symbolTypeIs(id, 'ascii') ? `'${this._symbols[id].content}'` : this._symbols[id].content;
    }
    /**
     * 格式化打印产生式
     */
    formatPrintProducer(producer) {
        const lhs = this._symbols[producer.lhs].content;
        const rhs = producer.rhs.map(this.getSymbolString, this).join(' ');
        return lhs + ' -> ' + rhs;
    }
    getLHS(producer) {
        const lhs = this._symbols[producer.lhs].content;
        return lhs;
    }
    /**
     * 预先计算各符号的FIRST集（不动点法）
     */
    _preCalculateFIRST() {
        let changed = true;
        for (let index in this.symbols)
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
     * 将产生式转换为单条存储的、数字->数字[]形式
     */
    _convertProducer(stringProducers) {
        for (let stringProducer of stringProducers) {
            let lhs = this._getSymbolId({ type: 'nonterminal', content: stringProducer.lhs });
            utils_1.assert(lhs != -1, 'lhs not found in symbols. This error should never occur.');
            for (let [index, right] of stringProducer.rhs.entries()) {
                let rhs = [], PATTERN = new RegExp(/(' '|[^ ]+)/g), char;
                while ((char = PATTERN.exec(right))) {
                    let tmp = char[0].trim(), id;
                    if (/'.+'/.test(char[0])) {
                        tmp = char[0].substring(1, char[0].length - 1);
                        if (tmp[0] == '\\')
                            tmp = utils_1.cookString(tmp);
                        id = this._getSymbolId({ type: 'ascii', content: tmp });
                    }
                    else {
                        let a = this._getSymbolId({ type: 'nonterminal', content: tmp }), b = this._getSymbolId({ type: 'token', content: tmp });
                        id = id ? id : a != -1 ? a : b != -1 ? b : -1;
                    }
                    utils_1.assert(id != -1, `Symbol not found in symbols. This error should never occur. symbol=${tmp}`);
                    rhs.push(id);
                }
                this._producers.push(new Grammar_1.LR1Producer(lhs, rhs, `${stringProducer.actions[index]}`));
            }
        }
    }
    /**
     * 构造LR1DFA
     */
    _constructLR1DFA() {
        // 将C初始化为 {CLOSURE}({|S'->S, $|})
        let newStartSymbolContent = this._symbols[this._startSymbol].content + "'";
        while (this._symbols.some(symbol => symbol.content === newStartSymbolContent))
            newStartSymbolContent += "'";
        this._symbols.push({ type: 'nonterminal', content: newStartSymbolContent });
        this._producers.push(new Grammar_1.LR1Producer(this._symbols.length - 1, [this._startSymbol], `$$ = $1; reduceTo("${newStartSymbolContent}");`));
        this._startSymbol = this._symbols.length - 1;
        let initProducer = this._producersOf(this._startSymbol)[0];
        let I0 = this.CLOSURE(new Grammar_1.LR1State([new Grammar_1.LR1Item(initProducer, this._producers.indexOf(initProducer), this._getSymbolId(Grammar_1.SpSymbol.END))]));
        // 初始化自动机
        let dfa = new Grammar_1.LR1DFA(0);
        dfa.addState(I0);
        let stack = [0];
        while (stack.length) {
            let I = dfa.states[stack.pop()]; // for C中的每个项集I
            for (let X = 0; X < this._symbols.length; X++) {
                // for 每个文法符号X
                let gotoIX = this.GOTO(I, X);
                if (gotoIX.items.length === 0)
                    continue; // gotoIX要非空
                const sameStateCheck = dfa.states.findIndex(x => Grammar_1.LR1State.same(x, gotoIX)); // 存在一致状态要处理
                if (sameStateCheck !== -1) {
                    dfa.link(dfa.states.indexOf(I), sameStateCheck, X);
                }
                else {
                    // 新建状态并连接
                    dfa.addState(gotoIX);
                    dfa.link(dfa.states.indexOf(I), dfa.states.length - 1, X);
                    stack.push(dfa.states.length - 1);
                }
            }
        }
        this._dfa = dfa;
    }
    /**
     * 求取GOTO(I, X)
     * 见龙书算法4.53
     */
    GOTO(I, X) {
        let J = new Grammar_1.LR1State([]);
        for (let item of I.items) {
            // for I中的每一个项
            if (item.dotAtLast())
                continue;
            if (this._producers[item.producer].rhs[item.dotPosition] === X) {
                J.addItem(Grammar_1.LR1Item.copy(item, true));
            }
        }
        return this.CLOSURE(J);
    }
    /**
     * 求取CLOSURE(I)（I为某状态）
     * 见龙书算法4.53
     */
    CLOSURE(I) {
        let res = Grammar_1.LR1State.copy(I);
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
                    let newItem = new Grammar_1.LR1Item(extendProducer, this._producers.indexOf(extendProducer), lookahead);
                    if (res.items.some(item => Grammar_1.LR1Item.same(item, newItem)))
                        continue; // 重复的情况不再添加，避免出现一样的Item
                    allItemsOfI.every(item => !Grammar_1.LR1Item.same(item, newItem)) && allItemsOfI.push(newItem); // 继续扩展
                    res.addItem(newItem);
                }
            }
        }
        return res;
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
                    if (Grammar_1.LR1State.same(goto, dfaStates[j])) {
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
                    if (Grammar_1.LR1State.same(this.GOTO(dfaStates[i], A), dfaStates[j]))
                        this._GOTOTable[i][lookup(A)] = j;
    }
    /**
     * 序列化保存LR1Analyzer
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
        // LR1DFA
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
     * 加载导出的LR1Analyzer
     */
    static load(dumpPath) {
        const obj = JSON.parse(fs.readFileSync(dumpPath).toString());
        const lr1 = new LR1Analyzer(void 'empty');
        // symbols
        lr1._symbols = obj.symbols;
        // operators
        obj.operators.forEach(operator => {
            // @ts-ignore
            lr1._operators.push(new Grammar_1.LR1Operator(operator._symbolId, operator._assoc, operator._precedence));
        });
        // producers
        obj.producers.forEach(producer => {
            // @ts-ignore
            lr1._producers.push(new Grammar_1.LR1Producer(producer._lhs, producer._rhs, producer._action));
        });
        // startSymbol
        lr1._startSymbol = obj.startSymbol;
        // dfa
        // @ts-ignore
        lr1._dfa = new Grammar_1.LR1DFA(obj.dfa._startStateId);
        // @ts-ignore
        obj.dfa._states.forEach(state => {
            const itemsCopy = [];
            // @ts-ignore
            state._items.forEach(item => {
                // @ts-ignore
                itemsCopy.push(new Grammar_1.LR1Item(
                // @ts-ignore
                new Grammar_1.LR1Producer(item._rawProducer._lhs, item._rawProducer._rhs, item._rawProducer._action), 
                // @ts-ignore
                item._producer, 
                // @ts-ignore
                item._lookahead, 
                // @ts-ignore
                item._dotPosition));
            });
            const stateCopy = new Grammar_1.LR1State(itemsCopy);
            lr1._dfa.addState(stateCopy);
        });
        // @ts-ignore
        obj.dfa._adjList.forEach((records, i) => {
            records.forEach(record => {
                lr1._dfa.link(i, record.to, record.alpha);
            });
        });
        // ACTIONTable
        lr1._ACTIONTable = obj.ACTIONTable;
        // GOTOTable
        lr1._GOTOTable = obj.GOTOTable;
        // Reverse Lookup
        lr1._ACTIONReverseLookup = obj.ACTIONReverseLookup;
        lr1._GOTOReverseLookup = obj.GOTOReverseLookup;
        // first
        lr1._first = obj.first;
        // epsilon
        lr1._epsilon = obj.epsilon;
        return lr1;
    }
}
exports.LR1Analyzer = LR1Analyzer;
