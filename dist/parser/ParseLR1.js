"use strict";
/**
 * 借助 LR1 分析表对源代码进行语法分析
 * 2020-10 @ https://github.com/seu-cs-class2/minisys-minicc-ts
 * --- 我们删掉了 Yacc 生成 C 代码的行为，转而直接借助 LR1 分析表完成语法分析
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseTokensLR1 = exports.WHITESPACE_SYMBOL_ID = void 0;
const utils_1 = require("../seu-lex-yacc/utils");
exports.WHITESPACE_SYMBOL_ID = -10;
/**
 * 语法分析
 */
function parseTokensLR1(tokens, analyzer) {
    // 预处理
    utils_1.assert(tokens.every(v => v.name !== utils_1.UNMATCH_TOKENNAME), 'Token序列中存在未匹配的非法符号');
    // Token编号表，Token名->Token编号
    const tokenIds = (function () {
        let map = new Map();
        for (let i = 0; i < analyzer.symbols.length; i++)
            if (analyzer.symbols[i].type == 'sptoken' || analyzer.symbols[i].type == 'token')
                map.set(analyzer.symbols[i].content, i);
        map.set(utils_1.WHITESPACE_TOKENNAME, exports.WHITESPACE_SYMBOL_ID);
        return map;
    })();
    // LR1语法分析表（合并ACTION和GOTO）
    // table[i][k]表示在i状态遇到符号k的转移
    const table = (function () {
        let table = [];
        for (let state = 0; state < analyzer.dfa.states.length; state++) {
            let nonCnt = 0, nonnonCnt = 0;
            let row = [];
            for (let symbol = 0; symbol < analyzer.symbols.length; symbol++) {
                let action = '', target = 0;
                if (analyzer.symbols[symbol].type == 'nonterminal') {
                    // 遇到非终结符的处理
                    action = 'nonterminal';
                    target = analyzer.GOTOTable[state][nonCnt++];
                }
                else {
                    switch (analyzer.ACTIONTable[state][nonnonCnt].type) {
                        case 'shift':
                            action = 'shift';
                            target = analyzer.ACTIONTable[state][nonnonCnt].data;
                            break;
                        case 'reduce':
                            action = 'reduce';
                            target = analyzer.ACTIONTable[state][nonnonCnt].data;
                            break;
                        case 'acc':
                            action = 'acc';
                            break;
                        default:
                            action = 'default'; // 不会到这里
                    }
                    nonnonCnt++;
                }
                // @ts-ignore
                row.push({ action, target });
            }
            table.push(row);
        }
        return table;
    })();
    // 属性值栈
    const literalStack = [];
    let curRhsLen = 0;
    let curLiteral = { name: '', literal: '' };
    /**
     * 以Token的形式获取当前归约产生式右侧符号的属性值
     * @param num 符号在产生式右侧的序号，例如取$2则num传2
     */
    function getLiteral(num) {
        utils_1.assert(num > 0 && num <= curRhsLen, `动作代码中存在错误的属性值引用：$${num}`);
        return literalStack.slice(num - curRhsLen - 1)[0];
    }
    /**
     * 暂存当前产生式左侧符号的属性值（即$$）
     * 调用该函数后不会立刻改变属性值栈，而是在完成此次归约后真正存储
     * @param literal 所要存储的$$的值
     */
    function setLiteral(literal) {
        curLiteral = { name: 'nonterminal', literal: literal };
    }
    // 状态栈
    const stateStack = [analyzer.dfa.startStateId];
    // 处理当前情况遇到symbol
    function dealWith(symbol) {
        if (symbol === exports.WHITESPACE_SYMBOL_ID)
            return symbol;
        switch (table[stateStack.slice(-1)[0]][symbol].action) {
            case 'shift':
                literalStack.push(tokens[symbol]);
            case 'nonterminal':
                stateStack.push(table[stateStack.slice(-1)[0]][symbol].target);
                return symbol;
            case 'reduce':
                let producer = analyzer.producers[table[stateStack.slice(-1)[0]][symbol].target];
                curRhsLen = producer.rhs.length;
                curLiteral = literalStack.slice(-curRhsLen)[0];
                const execAction = () => {
                    // TODO: 在此添加动作代码的执行逻辑
                    const actionCode = producer.action; // 动作代码
                    // TODO: 请gl添加获取$i的操作、保存$$的操作接口
                    console.log(analyzer.formatPrintProducer(producer));
                };
                execAction();
                while (curRhsLen--)
                    stateStack.pop(), literalStack.pop();
                literalStack.push(curLiteral);
                return producer.lhs;
            case 'acc':
                return -1;
            default:
                utils_1.assert(false, `语法分析表中存在未定义行为：在状态${stateStack.slice(-1)[0]}下收到${analyzer.symbols[symbol].content}时进行${table[stateStack.slice(-1)[0]][symbol].action}`);
        }
    }
    let currentTokenIndex = 0;
    function _yylex() {
        return tokens[currentTokenIndex++];
    }
    let token = tokenIds.get(_yylex().name);
    while (token) {
        let ret = dealWith(token);
        while (token != ret) {
            if (ret == -1)
                return true;
            dealWith(ret);
            ret = dealWith(token);
        }
        token = tokenIds.get(_yylex().name);
    }
    return false;
}
exports.parseTokensLR1 = parseTokensLR1;
