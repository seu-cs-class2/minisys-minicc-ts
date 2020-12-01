"use strict";
/**
 * 借助 DFA 对源代码进行词法分析
 * 2020-10 @ https://github.com/seu-cs-class2/minisys-minicc-ts
 * - 我们删掉了 Lex 生成 C 代码的行为，转而直接借助 DFA 完成词法分析
 * - 要求 .l 文件的动作代码必须形如 { return (TOKEN_NAME); }
 * - 无需手动处理yytext
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.lexSourceCode = void 0;
const utils_1 = require("../seu-lex-yacc/utils");
const FA_1 = require("../seu-lex-yacc/seulex/FA");
/**
 * 借助DFA对源代码进行词法分析，返回Token序列
 */
function lexSourceCode(code, dfa) {
    utils_1.assert(dfa.startStates.length === 1, 'Too many DFA start states.');
    code = code.replace(/\r\n/g, '\n');
    // 词法分析用到的变量
    const initState = dfa.states.indexOf(dfa.startStates[0]);
    let yylineno = 1, // 行号
    yytext = '', // 本轮最终匹配的字符串
    curChar = '', // 当前字符
    curBuf = '', // 当前匹配的字符串
    curState = initState, // 当前状态
    curPtr = 0, // 当前指针位置
    latAccState = -1, // 最近接收状态
    latAccPtr = 0; // 最近接收指针位置
    // 结果为Token流
    const tokens = [];
    // 生成状态转移矩阵
    // transMat[i][k]: 在i状态下接受到字符k（ASCII）转移到的状态
    const transMat = (function () {
        let transMat = [];
        for (let i = 0; i < dfa.transformAdjList.length; i++) {
            let targets = Array(128).fill(-1); // -1表示没有此转移
            let othersTarget = -1; // 仍未设置转移的字符应转移到的状态
            for (let transform of dfa.transformAdjList[i]) {
                if (transform.alpha == FA_1.SpAlpha.OTHER || transform.alpha == FA_1.SpAlpha.ANY)
                    othersTarget = transform.target;
                else
                    targets[dfa.alphabet[transform.alpha].charCodeAt(0)] = transform.target;
            }
            if (othersTarget != -1)
                for (let alpha in targets)
                    if (targets[alpha] == -1)
                        targets[alpha] = othersTarget;
            transMat.push(targets);
        }
        return transMat;
    })();
    // 生成接收态列表
    // 值为-1：非接收态；值非-1：接收态，值为对应动作的编号
    const accs = (function () {
        let accs = [];
        for (let i = 0; i < dfa.states.length; i++)
            if (dfa.acceptStates.includes(dfa.states[i]))
                accs.push(i);
            else
                accs.push(-1);
        return accs;
    })();
    // 拆解动作代码，获得Token名
    function getTokenName(action) {
        return action
            .replace(/\s+/g, '')
            .replace('return', '')
            .replace(';', '')
            .replace(/[\(\)]/g, '')
            .trim();
    }
    // 反复调用以实现词法分析
    // 0-到达代码尾部 1-尚未到达代码尾部
    function yylex() {
        let rollbackLines = 0;
        if (curPtr === code.length)
            return 0;
        // 当前状态非尽头
        while (curState !== -1) {
            // 读入一个新字符
            curChar = code[curPtr];
            curBuf += curChar;
            curPtr += 1;
            // 如果是换行符要处理行号
            if (curChar === '\n')
                yylineno++, rollbackLines++;
            // 尝试借助它进行状态转移
            curState = transMat[curState][curChar.charCodeAt(0)];
            // 特别地，如果半路触到接收态，只是暂存，然后继续跑，以实现最长匹配
            if (curState !== -1 && accs[curState] !== -1) {
                latAccState = curState;
                latAccPtr = curPtr - 1;
                rollbackLines = 0;
            }
            if (curPtr >= code.length)
                break;
        }
        // 开始处理接收的情况
        if (latAccState !== -1) {
            // 回退多余的失败匹配
            curPtr = latAccPtr + 1;
            yylineno -= rollbackLines;
            curBuf = curBuf.substring(0, curBuf.length - 1);
            // 重置相关状态
            curState = 0; // 开始状态下标固定为0
            yytext = String(curBuf);
            curBuf = '';
            // 保存Token
            tokens.push({
                name: getTokenName(dfa.acceptActionMap.get(dfa.states[latAccState]).code),
                literal: yytext,
            });
            // 重置相关状态
            latAccPtr = 0;
            latAccState = -1;
        }
        else {
            utils_1.assert(false, `无法识别的字符。行号=${yylineno}，指针=${curPtr}`);
        }
        return 1;
    }
    while (yylex())
        ;
    // 手动添加END Token
    tokens.push({
        name: 'SP_END',
        literal: '',
    });
    return tokens;
}
exports.lexSourceCode = lexSourceCode;
