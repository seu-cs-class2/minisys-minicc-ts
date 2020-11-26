"use strict";
/**
 * 借助 LALR 分析表对源代码进行语法分析
 *
 * 2020-11 @ https://github.com/seu-cs-class2/minisys-minicc-ts
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseTokensLALR = exports.WHITESPACE_SYMBOL_ID = void 0;
const AST_1 = require("../ir/AST");
const utils_1 = require("../seu-lex-yacc/utils");
exports.WHITESPACE_SYMBOL_ID = -10;
/**
 * 进行基于LALR的语法分析，返回语法树根节点
 */
function parseTokensLALR(tokens, analyzer) {
    // 预处理
    utils_1.assert(tokens.every(v => v.name !== utils_1.UNMATCH_TOKENNAME), 'Token序列中存在未匹配的非法符号');
    tokens = tokens.filter(v => v.name !== utils_1.WHITESPACE_TOKENNAME);
    tokens = tokens.filter(v => v.name !== utils_1.COMMENT_TOKENNAME);
    // Token编号表，Token名->Token编号
    const tokenIds = (function () {
        let map = new Map();
        for (let i = 0; i < analyzer.symbols.length; i++)
            if (analyzer.symbols[i].type == 'sptoken' || analyzer.symbols[i].type == 'token')
                map.set(analyzer.symbols[i].content, i);
        map.set(utils_1.WHITESPACE_TOKENNAME, exports.WHITESPACE_SYMBOL_ID);
        return map;
    })();
    // LALR语法分析表（合并ACTION和GOTO）
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
    // 属性值处理逻辑
    const symbolStack = [];
    let curRhsLen = 0;
    let curSymbol;
    /**
     * 以Token的形式获取当前归约产生式右侧符号的属性值
     * @param num 符号在产生式右侧的序号，例如取$2则num传2
     */
    function getDollar(num) {
        utils_1.assert(num > 0 && num <= curRhsLen, `动作代码中存在错误的属性值引用：$${num}`);
        return symbolStack.slice(num - curRhsLen - 1)[0];
    }
    /**
     * 暂存当前产生式左侧符号的属性值（即$$）
     * 调用该函数后不会立刻改变属性值栈，而是在完成此次归约后真正存储
     * @param literal 所要存储的$$的值
     */
    function setDollar2(name, node) {
        curSymbol = { type: 'nonterminal', name, node }; // `node` this name just means a `payload`
    }
    // 状态栈
    const stateStack = [analyzer.dfa.startStateId];
    // 处理当前情况遇到symbol
    function dealWith(symbol) {
        if (symbol === exports.WHITESPACE_SYMBOL_ID)
            return symbol;
        switch (table[stateStack.slice(-1)[0]][symbol].action) {
            case 'shift':
                const prevToken = tokens[currentTokenIndex - 1];
                symbolStack.push({
                    type: 'token',
                    name: prevToken.name,
                    node: new AST_1.ASTNode(prevToken.name, 'token', prevToken.literal),
                });
            case 'nonterminal':
                stateStack.push(table[stateStack.slice(-1)[0]][symbol].target);
                return symbol;
            case 'reduce':
                const producer = analyzer.producers[table[stateStack.slice(-1)[0]][symbol].target];
                curRhsLen = producer.rhs.length;
                curSymbol = symbolStack.slice(-curRhsLen)[0];
                // 准备动作代码执行的上下文
                const newNode = AST_1.$newNode;
                // 执行动作代码
                const execAction = () => {
                    let actionCode = producer.action; // 动作代码
                    let $$;
                    actionCode = actionCode.replace(/\$(\d+)/g, 'getDollar($1)');
                    eval(actionCode);
                    setDollar2(analyzer.getLHS(producer) + '_DOLLAR2', $$.node);
                };
                execAction();
                // 查表逻辑
                while (curRhsLen--)
                    stateStack.pop(), symbolStack.pop();
                symbolStack.push(curSymbol);
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
            if (ret == -1) {
                utils_1.assert(symbolStack.length == 1, 'acc时符号栈元素过多。');
                return symbolStack[0].node;
            }
            dealWith(ret);
            ret = dealWith(token);
        }
        token = tokenIds.get(_yylex().name);
    }
    return null;
}
exports.parseTokensLALR = parseTokensLALR;
