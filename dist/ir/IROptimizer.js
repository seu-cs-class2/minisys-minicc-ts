"use strict";
/**
 * 中间代码优化
 * 2020-12 @ https://github.com/seu-cs-class2/minisys-minicc-ts
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.IROptimizer = void 0;
const IR_1 = require("./IR");
const IRGenerator_1 = require("./IRGenerator");
/**
 * 中间代码优化器
 */
class IROptimizer {
    constructor(ir) {
        this._ir = ir;
        this._quads = [...ir.quads];
        this._logs = [];
        this._varPool = [...ir.varPool];
        // 不动点法
        let unfix;
        do {
            unfix = false;
            // 死代码消除
            unfix = unfix || this.deadVarEliminate();
            unfix = unfix || this.deadFuncEliminate();
            unfix = unfix || this.deadVarUseEliminate();
            // 常量传播和常量折叠
            unfix = unfix || this.constPropPeepHole();
            unfix = unfix || this.constPropAndFold();
            // 代数优化
            // TODO
        } while (unfix);
    }
    get ir() {
        return this._ir;
    }
    set ir(val) {
        this._ir = val;
    }
    get quads() {
        return this._quads;
    }
    set quads(val) {
        this._quads = val;
    }
    get varPool() {
        return this._varPool;
    }
    set varPool(val) {
        this._varPool = val;
    }
    printLogs() {
        return this._logs.join('\n');
    }
    /**
     * 删除在赋值后从未使用的变量的赋值语句
     */
    deadVarUseEliminate() {
        const varUpdates = new Map(); // VarId -> QuadIndex[]，变量更新的地方
        // 找出所有变量被更新的所有地方
        for (let i = 0; i < this._ir.varCount; i++)
            varUpdates.set(IRGenerator_1.VarPrefix + String(i), []);
        for (let i = 0; i < this._quads.length; i++) {
            const quad = this._quads[i];
            quad.res.startsWith(IRGenerator_1.VarPrefix) && varUpdates.set(quad.res, varUpdates.get(quad.res).concat([i]));
        }
        const quadsToRemove = [];
        for (let [var_, indices] of varUpdates) {
            // 变量从未被更新，说明已经是死变量，在varPool中的会被deadVarEliminate处理，不在的则已经没有相关四元式
            if (indices.length == 0)
                continue;
            // 向后寻找该变量是否被使用过
            const finalIndex = indices.sort((a, b) => b - a)[0];
            let used = false;
            for (let i = finalIndex + 1; i < this._quads.length; i++) {
                const quad = this._quads[i];
                // 只要出现在arg1 / arg2 / res，就是被使用过的活变量？
                if (quad.arg1 == var_ || quad.arg2 == var_ || quad.arg2.split('&').includes(var_) || quad.res == var_) {
                    used = true;
                    break;
                }
            }
            // 没被使用过，那么之前对它的所有赋值都没有意义
            if (!used) {
                this._logs.push(`删除从未被使用的变量 ${var_}，对应四元式索引 ${indices}`);
                quadsToRemove.push(...indices);
            }
        }
        // 执行删除
        // @ts-ignore
        for (let quadIndex of quadsToRemove)
            this._quads[quadIndex] = void 0;
        this._quads = this._quads.filter(Boolean);
        return !!quadsToRemove.length;
    }
    /**
     * 删除变量池中的死变量（从未出现在任何四元式中的变量）
     */
    deadVarEliminate() {
        //
        let usedVars = [];
        for (let quad of this._quads) {
            if (quad.op == 'call') {
                quad.arg2.trim() && usedVars.push(...quad.arg2.split('&'));
            }
            else {
                quad.arg2.startsWith(IRGenerator_1.VarPrefix) && usedVars.push(quad.arg2);
            }
            quad.arg1.startsWith(IRGenerator_1.VarPrefix) && usedVars.push(quad.arg1);
            quad.res.startsWith(IRGenerator_1.VarPrefix) && usedVars.push(quad.res);
        }
        usedVars = [...new Set(usedVars)];
        const unusedVars = this._varPool.filter(v => !usedVars.includes(v.id));
        unusedVars.length && this._logs.push(`消除了死变量：${JSON.stringify(unusedVars.map(v => v.id))}`);
        this._varPool = this._varPool.filter(v => usedVars.includes(v.id));
        return !!unusedVars.length;
    }
    /**
     * 删除从未成为跳转目标的函数
     */
    deadFuncEliminate() {
        // 所有跳转目标
        const jTargets = this._quads.filter(v => ['j', 'j_false'].includes(v.op)).map(x => x.res);
        // 所有调用目标
        const callTargets = this._quads.filter(v => v.op == 'call').map(x => x.arg1);
        // 所有声明过的标签
        const labels = this._quads.filter(v => v.op == 'set_label').map(x => x.res);
        // 消除从未成为跳转目标的函数
        const neverJLabels = labels.filter(v => jTargets.every(x => x != v));
        const neverJFuncs = neverJLabels
            .filter(v => v.endsWith('_entry'))
            .map(x => x.match(new RegExp(/^_label_\d+_(.*?)_entry$/))[1])
            .filter(y => y != 'main')
            .filter(z => !callTargets.includes(z));
        const rangesToRemove = [];
        // 找到对应的四元式下标
        for (let func of neverJFuncs) {
            const start = this._quads.findIndex(v => v.op == 'set_label' && v.res == this._ir.funcPool.find(x => x.name == func).entryLabel);
            const end = this._quads.findIndex(v => v.op == 'set_label' && v.res == this._ir.funcPool.find(x => x.name == func).exitLabel);
            rangesToRemove.push({ start, end });
            this._logs.push(`消除了函数 ${func}`);
        }
        // 删除之
        for (let range of rangesToRemove)
            for (let i = range.start; i <= range.end; i++)
                // @ts-ignore
                this._quads[i] = void 0;
        this._quads = this._quads.filter(Boolean);
        return !!rangesToRemove.length;
    }
    /**
     * 处理常量传播的一种窥孔级边界情况
     *  - (=const, xxx, , _var_1), (=var, _var_1, , _var_2) --> (=const, xxx, , _var_2)
     */
    constPropPeepHole() {
        // 找出所有=var的四元式
        const eqVars = this._quads.map((v, i) => v.op == '=var' && { v, i }).filter(Boolean);
        const patches = [];
        // 替换符合上述模式的四元式
        for (let eqVar of eqVars) {
            const rhs = eqVar.v.arg1;
            for (let i = eqVar.i - 1; i >= 0; i--) {
                if (this._quads[i].op == '=const' && this._quads[i].res == rhs) {
                    patches.push({
                        index: eqVar.i,
                        source: this._quads[i].toString(0),
                        target: new IR_1.Quad('=const', this._quads[i].arg1, '', eqVar.v.res),
                    });
                    // 不需要删除原有的=const产生式，因为死代码消除部分会负责清除
                }
            }
        }
        // 应用修改
        for (let patch of patches) {
            this._quads[patch.index] = patch.target;
            this._logs.push(`常量传播，将位于 ${patch.index} 的 ${patch.source} 改写为 ${patch.target.toString(0)}`);
        }
        return !!patches.length;
    }
    /**
     * 常量传播和常量折叠
     */
    constPropAndFold() {
        // 找出所有=var的四元式
        const eqVars = this._quads.map((v, i) => v.op == '=var' && { v, i }).filter(Boolean);
        // 处理复杂的常量传播和常量折叠情况
        // 借助回溯法构造表达式树，可以同时完成常量传播和常量折叠
        for (let eqVar of eqVars) {
            // TODO
        }
    }
    /**
     * 代数规则优化
     * PLUS: a+0=a
     * MINUS: a-0=0; 0-a=-a
     * MULTIPLY: a*1=a; a*0=0
     * SLASH: 0/a=0; a/1=a
     */
    algebraOptimize() {
        // 找出所有算术计算四元式
        const calcQuads = this._quads
            .filter(v => ['PLUS', 'MINUS', 'MULTIPLY', 'SLASH'].includes(v.op))
            .map((v, i) => ({ v, i }));
        // 对每条四元式的arg1、arg2
        for (let { v, i } of calcQuads) {
            let record = {
                arg1: {
                    optimizable: void 0,
                    constant: void 0,
                },
                arg2: {
                    optimizable: void 0,
                    constant: void 0,
                },
            };
            const that = this;
            // 向上找最近相关的=const，并且过程中不应被作为其他res覆写过
            function checkHelper(varId, record) {
                for (let j = i - 1; j >= 0; j--) {
                    const quad = that._quads[j];
                    if (quad.op == '=const' && quad.res == varId) {
                        record.optimizable = true;
                        record.constant = quad.arg1;
                        return;
                    }
                    if (quad.res == varId) {
                        record.optimizable = false;
                        return;
                    }
                }
                record.optimizable = false;
                return;
            }
            checkHelper(v.arg1, record.arg1);
            checkHelper(v.arg2, record.arg2);
            // 应用规则优化之
            function optimHelper(record) { }
            // TODO
        }
    }
}
exports.IROptimizer = IROptimizer;
