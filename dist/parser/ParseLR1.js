"use strict";
/**
 * 借助 LR1 分析表对源代码进行语法分析
 * 2020-10 @ https://github.com/seu-cs-class2/minisys-minicc-ts
 * --- 我们删掉了 Yacc 生成 C 代码的行为，转而直接借助 LR1 分析表完成语法分析
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.yyparse = exports.WHITESPACE_SYMBOL_ID = void 0;
exports.WHITESPACE_SYMBOL_ID = -10;
/**
 * 语法分析
 */
function yyparse(tokens, analyzer) {
    // Token编号表，Token名->Token编号
    const tokenIds = (function () {
        let map = new Map();
        for (let i = 0; i < analyzer.symbols.length; i++)
            if (analyzer.symbols[i].type == 'sptoken' || analyzer.symbols[i].type == 'token')
                map.set(analyzer.symbols[i].content, i);
        map.set('WHITESPACE', exports.WHITESPACE_SYMBOL_ID);
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
                            action = 'default'; // WTF is this?
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
    // 状态栈
    const stateStack = [analyzer.dfa.startStateId];
    function dealWith(symbol) {
        if (symbol === exports.WHITESPACE_SYMBOL_ID)
            return symbol;
        console.log(analyzer.symbols[symbol].content);
        switch (table[stateStack.slice(-1)[0]][symbol].action) {
            case 'nonterminal':
            case 'shift':
                stateStack.push(table[stateStack.slice(-1)[0]][symbol].target);
                return symbol;
            case 'reduce':
                let producer = analyzer.producers[table[stateStack.slice(-1)[0]][symbol].target];
                //TODO: 动作代码执行
                console.log(`reduce by ${table[stateStack.slice(-1)[0]][symbol].target}\n`);
                let i = producer.rhs.length;
                while (i--)
                    stateStack.pop();
                return producer.lhs;
            case 'acc':
                return -1;
            default:
                //WTF is this?
                throw Error(`语法分析表中存在未定义行为：在状态${stateStack.slice(-1)[0]}下收到${analyzer.symbols[symbol].content}时进行${table[stateStack.slice(-1)[0]][symbol].action}`);
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
exports.yyparse = yyparse;
