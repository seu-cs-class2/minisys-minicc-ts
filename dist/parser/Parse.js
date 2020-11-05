"use strict";
/**
 * 借助 LR1 分析表对源代码进行语法分析
 * 2020-10 @ https://github.com/seu-cs-class2/minisys-minicc-ts
 * --- 我们删掉了 Yacc 生成 C 代码的行为，转而直接借助 LR1 分析表完成语法分析
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.WHITESPACE_SYMBOL_ID = void 0;
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
    }
    let currentTokenIndex = 0;
    function _yylex() {
        return tokens[currentTokenIndex++];
    }
}
