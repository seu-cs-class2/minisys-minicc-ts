"use strict";
/**
 * 中间代码优化
 * 2020-12 @ https://github.com/seu-cs-class2/minisys-minicc-ts
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.IROptimizer = void 0;
class IROptimizer {
    constructor(ir) {
        this._ir = ir;
        this._quads = ir.quads;
        this._logs = [];
    }
    get quads() {
        return this._quads;
    }
    set quads(val) {
        this._quads = val;
    }
    get logs() {
        return this._logs;
    }
    set logs(val) {
        this._logs = val;
    }
    get ir() {
        return this._ir;
    }
    set ir(val) {
        this._ir = val;
    }
    /**
     * 死代码消除
     * // 消除从未成为跳转目标的函数
     * // TODO 消除不可能的if、while
     */
    deadCodeEliminate() {
        // FIXME 写的太烂了
        // 所有跳转目标
        const jTargets = this._quads.filter(v => ['j', 'j_false'].includes(v.op)).map(x => x.res);
        const callTargets = this._quads.filter(v => v.op == 'call').map(x => x.arg1);
        // 所有标签
        const labels = this._quads
            .filter(v => v.op == 'set_label')
            .map(x => ({
            name: x.res,
        }));
        // 消除从未成为跳转目标的函数
        const neverJLabels = labels.filter(v => jTargets.every(x => x != v.name));
        const neverJFuncs = neverJLabels
            .filter(v => v.name.endsWith('_entry'))
            .map(x => x.name.match(/^_label_\d+_(.*?)_entry$/)[1])
            .filter(y => y != 'main')
            .filter(z => !callTargets.includes(z));
        const rangesToRemove = [];
        for (let func of neverJFuncs) {
            const start = this._quads.findIndex(v => v.op == 'set_label' && v.res.endsWith(func + '_entry'));
            const end = this._quads.findIndex(v => v.op == 'set_label' && v.res.endsWith(func + '_exit'));
            rangesToRemove.push({ start, end });
        }
        for (let range of rangesToRemove) {
            for (let i = range.start; i <= range.end; i++) {
                // @ts-ignore
                this._quads[i] = void 0;
            }
        }
        this._quads = this._quads.filter(Boolean);
    }
    /**
     * 常量传播和常量折叠
     */
    constPropAndFold() {
        // 找出所有=var的四元式
        const eqVars = this._quads.map((v, i) => v.op == '=var' && { v, i }).filter(Boolean);
        // TODO 回溯每一个arg1，构建表达式树？
    }
}
exports.IROptimizer = IROptimizer;
