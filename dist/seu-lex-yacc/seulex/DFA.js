"use strict";
/**
 * DFA（确定有限状态自动机）
 * 2020-05 @ https://github.com/Withod/seu-lex-yacc
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
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DFA = void 0;
const FA_1 = require("./FA");
const fs = __importStar(require("fs"));
/**
 * 确定有限状态自动机
 */
class DFA extends FA_1.FiniteAutomata {
    /**
     * 利用子集构造法通过一个NFA构造DFA；或者构造一个空DFA
     */
    constructor() {
        super();
        this._startStates = []; // 开始状态
        this._acceptStates = []; // 接收状态
        this._states = []; // 全部状态
        this._alphabet = []; // 字母表
        this._transformAdjList = []; // 状态转移矩阵
        this._acceptActionMap = new Map(); // 接收态对应的动作
    }
    get acceptActionMap() {
        return this._acceptActionMap;
    }
    /**
     * 使用子集构造法由NFA构造此DFA
     * @param nfa 子集构造法所使用的NFA
     */
    static fromNFA(nfa) {
        let res = new DFA();
        if (nfa.startStates.length === 0)
            return res;
        // 设置第一个开始状态
        let stateSets = [nfa.epsilonClosure(nfa.startStates)];
        res._alphabet = nfa.alphabet;
        res._startStates = [new FA_1.State()];
        res._transformAdjList = [[]];
        stateSets[0].forEach(s => {
            if (nfa.acceptStates.includes(s)) {
                let action = res._acceptActionMap.get(res._startStates[0]);
                let compare = nfa.acceptActionMap.get(s);
                if (action && action.code !== compare.code) {
                    if (action.order > compare.order) {
                        // 优先级不足，替换
                        res._acceptActionMap.set(res._startStates[0], compare);
                    }
                }
                else if (!action) {
                    // 没有重复
                    res._acceptStates = [res._startStates[0]];
                    res._acceptActionMap.set(res._startStates[0], nfa.acceptActionMap.get(s));
                }
            }
        });
        res._states = [res._startStates[0]];
        // 遍历设置DFA中第i个状态读入第alpha个字母时的转换
        for (let i = 0; i < res._states.length; i++) {
            let anyTargetState = -1; // 由any出边指向的状态
            for (let alpha = 0; alpha < res._alphabet.length; alpha++) {
                let newStateSet = nfa.epsilonClosure(nfa.move(stateSets[i], alpha));
                if (newStateSet.length < 1)
                    continue;
                let j = 0;
                for (; j < stateSets.length; j++) {
                    if (stateSets[j].every(s => newStateSet.includes(s)) && newStateSet.every(s => stateSets[j].includes(s)))
                        break; // 与已有的状态集合相同
                }
                if (j == stateSets.length) {
                    // 与已有的状态集合均不相同，因此新建一个状态
                    stateSets.push(newStateSet);
                    let newState = new FA_1.State();
                    res._states.push(newState);
                    res._transformAdjList.push([]);
                    newStateSet.forEach(s => {
                        if (nfa.acceptStates.includes(s)) {
                            let action = res._acceptActionMap.get(newState);
                            let compare = nfa.acceptActionMap.get(s);
                            if (action && action.code !== compare.code) {
                                if (action.order > compare.order) {
                                    // 优先级不足，替换
                                    res._acceptActionMap.set(newState, compare);
                                }
                            }
                            else if (!action) {
                                res._acceptStates.push(newState);
                                res._acceptActionMap.set(newState, compare);
                            }
                        }
                    });
                }
                if (res._alphabet[alpha] == FA_1.getSpAlpha(FA_1.SpAlpha.ANY)) {
                    res._transformAdjList[i].push({ alpha: FA_1.SpAlpha.ANY, target: j });
                    anyTargetState = j;
                }
                else {
                    res._transformAdjList[i].push({ alpha, target: j });
                }
            }
            if (anyTargetState != -1) {
                for (let index = 0; index < res._transformAdjList[i].length; index++) {
                    if (res._transformAdjList[i][index].target == anyTargetState)
                        res._transformAdjList[i].splice(index--, 1);
                }
                if (res._transformAdjList[i].length < 1)
                    res._transformAdjList[i].push({
                        alpha: FA_1.SpAlpha.ANY,
                        target: anyTargetState,
                    });
                else
                    res._transformAdjList[i].push({
                        alpha: FA_1.SpAlpha.OTHER,
                        target: anyTargetState,
                    });
            }
        }
        return res;
    }
    /**
     * 返回从当前状态收到一个字母后能到达的所有状态
     * @param state 当前状态
     * @param alpha 字母在字母表的下标
     * @returns `结果状态`
     */
    expand(state, alpha) {
        let transforms = this.getTransforms(state), otherTarget = -1;
        for (let transform of transforms) {
            if (transform.alpha === alpha || (transform.alpha === FA_1.SpAlpha.ANY && this._alphabet[alpha] !== '\n')) {
                return this._states[transform.target];
            }
            else if (transform.alpha === FA_1.SpAlpha.OTHER) {
                otherTarget = transform.target;
            }
        }
        return otherTarget == -1 ? null : this._states[otherTarget];
    }
    /**
     * 把`from`中的每个状态到`to`状态用字母alpha建立边
     * @param alpha 字母在字母表的下标
     */
    link(from, to, alpha) {
        for (let i = 0; i < from.length; i++) {
            let transforms = this.getTransforms(from[i]);
            transforms.push({
                alpha,
                target: this._states.indexOf(to),
            });
            this.setTransforms(from[i], transforms);
        }
    }
    /**
     * 序列化保存DFA
     */
    dump(desc, savePath) {
        // @ts-ignore
        let obj = { desc };
        // alphabet
        obj['alphabet'] = Array.from(this._alphabet);
        // states
        obj['stateCount'] = this._states.length;
        // startStates
        obj['startStatesIndex'] = [];
        this._startStates.forEach(v => obj['startStatesIndex'].push(this._states.indexOf(v)));
        // acceptStates
        obj['acceptStatesIndex'] = [];
        this._acceptStates.forEach(v => obj['acceptStatesIndex'].push(this._states.indexOf(v)));
        // transformAdjList
        obj['transformAdjList'] = Array.from(this._transformAdjList);
        // acceptActionMap
        obj['acceptActionMap'] = [];
        for (let [state, action] of this._acceptActionMap.entries())
            obj['acceptActionMap'].push({ accpetStateIndex: this._states.indexOf(state), action });
        // output
        fs.writeFileSync(savePath, JSON.stringify(obj, null, 2));
    }
    /**
     * 从DFA的序列化结果装载DFA
     */
    static fromFile(dumpPath) {
        const obj = JSON.parse(fs.readFileSync(dumpPath).toString());
        const dfa = new DFA();
        // alphabet
        dfa._alphabet = Array.from(obj.alphabet);
        // states
        for (let i = 0; i < obj.stateCount; i++)
            dfa._states.push(new FA_1.State());
        // startStates
        obj.startStatesIndex.forEach(v => dfa._startStates.push(dfa._states[v]));
        // acceptStates
        obj.acceptStatesIndex.forEach(v => dfa._acceptStates.push(dfa._states[v]));
        // transformAdjList
        dfa._transformAdjList = Array.from(obj.transformAdjList);
        // acceptActionMap
        obj.acceptActionMap.forEach(({ accpetStateIndex, action }) => {
            dfa._acceptActionMap.set(dfa._states[accpetStateIndex], action);
        });
        // return
        return dfa;
    }
}
exports.DFA = DFA;
