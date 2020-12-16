"use strict";
/**
 * 汇编代码（目标代码）生成器
 * 约定：
 *   - 布尔真：0x1；布尔假：0x0
 * 2020-12 @ https://github.com/seu-cs-class2/minisys-minicc-ts
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ASMGenerator = void 0;
const IRGenerator_1 = require("../ir/IRGenerator");
const utils_1 = require("../seu-lex-yacc/utils");
const Arch_1 = require("./Arch");
/**
 * 汇编代码生成器
 */
class ASMGenerator {
    constructor(ir) {
        this._ir = ir;
        this._asm = [];
        // 初始化全体寄存器为空闲状态
        this._regStatus = new Map();
        for (let reg of Arch_1.usefulRegs)
            this._regStatus.set(reg, 'free');
        // 初始化全体变量为未分配状态
        this._varLocTable = new Map();
        for (let var_ of ir.varPool)
            this._varLocTable.set(var_.id, {
                type: 'unassigned',
                location: ' ',
            });
        this.newAsm('.DATA 0x0');
        this.processGlobalVars();
        this.newAsm('.TEXT 0x0');
        this.processTextSegment();
    }
    /**
     * 生成汇编代码
     */
    toAssembly() {
        return this._asm
            .map(v => (!(v.startsWith('.') || v.startsWith(IRGenerator_1.LabelPrefix)) ? '\t' : '') + v.replace(' ', '\t'))
            .join('\n');
    }
    /**
     * 添加一行新汇编代码
     */
    newAsm(line) {
        this._asm.push(line);
    }
    /**
     * 将MiniC类型转换为Minisys汇编类型
     */
    toMinisysType(type) {
        const table = {
            int: '.word',
        };
        return table[type];
    }
    /**
     * 处理全局变量
     */
    processGlobalVars() {
        const globalVars = this._ir.varPool.filter(v => IRGenerator_1.IRGenerator.sameScope(v.scope, IRGenerator_1.GlobalScope));
        for (let var_ of globalVars) {
            // FIXME 数组、初始值，怎么处理
            this.newAsm(`${var_.name}: ${this.toMinisysType(var_.type)} 0x0`);
        }
    }
    /**
     * LLVM Fast 寄存器分配算法
     * @see
     *   A Detailed Analysis of the LLVM’s Register Allocators,
     *   Tiago Cariolano de Souza Xavier et al.
     * 策略：
     *   - 按照变量出现顺序依次分配
     *   - 全满时从开头开始spill
     */
    RAFast(varId, protect, mustExist = false /* 是否要求该变量当前一定在寄存器内 */) {
        // 检查是否已经为该变量分配过寄存器
        const allocatedCheck = this._varLocTable.get(varId).type == 'register';
        if (allocatedCheck)
            return this._varLocTable.get(varId).location;
        if (mustExist && !allocatedCheck)
            utils_1.assert(false, `找不到变量：${varId}`);
        // 检查是否有空寄存器可以分配
        // FIXME: 考虑s系寄存器的破坏问题
        for (let [reg, status] of this._regStatus.entries())
            if (status == 'free') {
                this._regStatus.set(reg, 'busy');
                this._varLocTable.set(varId, { type: 'register', location: '$' + reg });
                return '$' + reg;
            }
        // 仍然没有分配出去，则spill
        // 保护所有在protect数组中的寄存器，以免覆盖该条指令中某个已经分配的寄存器
        const availableRegisters = Arch_1.usefulRegs.filter(v => !protect.includes('$' + v));
        // 牺牲第一个可用寄存器
        const regToSacrifice = availableRegisters[0];
        let varToSacrifice = '';
        for (let [var_, loc] of this._varLocTable.entries())
            if (loc.type == 'register' && loc.location == '$' + regToSacrifice)
                varToSacrifice = var_;
        utils_1.assert(varToSacrifice.trim(), `未找到寄存器 $${regToSacrifice} 放置的变量。`);
        this._regStatus.set(regToSacrifice, 'busy');
        this._varLocTable.set(varToSacrifice, { type: 'stack', location: '' });
        // TODO: ...
    }
    /**
     * 为变量varId分配寄存器
     */
    getRegister(varId, mustExist = false) {
        // TODO: 实现线性扫描寄存器分配算法（需要先进行变量存活区间分析，在IR优化时一起做）
        return this.RAFast(varId, [], mustExist);
    }
    // $2 <- $1  -->  or $1, $zero, $2
    // $2 <- immed  -->  addi $zero, $2, immed
    processTextSegment() {
        for (let quad of this._ir.quads) {
            const { op, arg1, arg2, res } = quad;
            const binaryOp = !!(arg1.trim() && arg2.trim()); // 是二元表达式
            const unaryOp = !!(+!!arg1.trim() ^ +!!arg2.trim()); // 是一元表达式
            switch (op) {
                case 'OR_OP': {
                }
                case 'AND_OP': {
                }
                case 'BITAND_OP': {
                    const lhs = this.getRegister(arg1);
                    const rhs = this.getRegister(arg2);
                    const saveTo = this.getRegister(res);
                    this.newAsm(`and ${lhs}, ${rhs}, ${saveTo}`);
                    break;
                }
                case 'BITXOR_OP': {
                    const lhs = this.getRegister(arg1);
                    const rhs = this.getRegister(arg2);
                    const saveTo = this.getRegister(res);
                    this.newAsm(`xor ${lhs}, ${rhs}, ${saveTo}`);
                    break;
                }
                case 'BITOR_OP': {
                    const lhs = this.getRegister(arg1);
                    const rhs = this.getRegister(arg2);
                    const saveTo = this.getRegister(res);
                    this.newAsm(`or ${lhs}, ${rhs}, ${saveTo}`);
                    break;
                }
                case 'EQ_OP': {
                    const lhs = this.getRegister(arg1);
                    const rhs = this.getRegister(arg2);
                    const saveTo = this.getRegister(res);
                    this.newAsm(`sub ${lhs}, ${rhs}, ${saveTo}`);
                    this.newAsm(`nor ${saveTo}, ${saveTo}, ${saveTo}`);
                    break;
                }
                case 'NE_OP': {
                    const lhs = this.getRegister(arg1);
                    const rhs = this.getRegister(arg2);
                    const saveTo = this.getRegister(res);
                    this.newAsm(`sub ${lhs}, ${rhs}, ${saveTo}`);
                    break;
                }
                case 'LT_OP': {
                    const lhs = this.getRegister(arg1);
                    const rhs = this.getRegister(arg2);
                    const saveTo = this.getRegister(res);
                    this.newAsm(`slt ${lhs}, ${rhs}, ${saveTo}`);
                    break;
                }
                case 'GT_OP': {
                    const lhs = this.getRegister(arg1);
                    const rhs = this.getRegister(arg2);
                    const saveTo = this.getRegister(res);
                    this.newAsm(`slt ${rhs}, ${lhs}, ${saveTo}`);
                    break;
                }
                case 'GE_OP': {
                }
                case 'LE_OP': {
                }
                case 'PLUS': {
                }
                case 'MINUS': {
                    if (binaryOp) {
                        const lhs = this.getRegister(arg1);
                        const rhs = this.getRegister(arg2);
                        const saveTo = this.getRegister(res);
                        this.newAsm(`sub ${lhs}, ${rhs}, ${saveTo}`);
                    }
                    if (unaryOp) {
                        const oprand = this.getRegister(arg1);
                        const saveTo = this.getRegister(res);
                        this.newAsm(`sub $zero, ${oprand}, ${saveTo}`);
                    }
                    break;
                }
                case 'MULTIPLY': {
                    if (binaryOp) {
                        const lhs = this.getRegister(arg1);
                        const rhs = this.getRegister(arg2);
                        const saveTo = this.getRegister(res);
                        this.newAsm(`add ${lhs}, ${rhs}, ${saveTo}`);
                    }
                    if (unaryOp) {
                        const oprand = this.getRegister(arg1);
                        const saveTo = this.getRegister(res);
                        this.newAsm(`add $zero, ${oprand}, ${saveTo}`);
                    }
                    break;
                }
                case 'SLASH': {
                    const lhs = this.getRegister(arg1);
                    const rhs = this.getRegister(arg2);
                    const saveTo = this.getRegister(res);
                    this.newAsm(`div ${lhs}, ${rhs}`);
                    this.newAsm(`mflo ${saveTo}`);
                }
                case 'PERCENT': {
                    const lhs = this.getRegister(arg1);
                    const rhs = this.getRegister(arg2);
                    const saveTo = this.getRegister(res);
                    this.newAsm(`div ${lhs}, ${rhs}`);
                    this.newAsm(`mfhi ${saveTo}`);
                }
                case 'NOT_OP': {
                }
                case 'set_label': {
                    // 添加标号
                    this.newAsm(res + ':');
                    break;
                }
                case '=': {
                    // 互相赋值
                    const sourceReg = this.getRegister(arg1);
                    const targetReg = this.getRegister(res);
                    this.newAsm(`or ${sourceReg}, $zero, ${targetReg}`);
                    break;
                }
                case '=const': {
                    // 赋常量
                    const sourceData = arg1;
                    const targetReg = this.getRegister(res);
                    this.newAsm(`addi $zero, ${targetReg}, ${sourceData}`);
                    break;
                }
                case 'j_if_not': {
                    const boolResult = this.getRegister(arg1, true);
                    const targetLabel = res;
                    this.newAsm(`beq ${boolResult}, $zero, ${targetLabel}`);
                    break;
                }
                case 'j_if_yes': {
                    const boolResult = this.getRegister(arg1, true);
                    const targetLabel = res;
                    this.newAsm(`bne ${boolResult}, $zero, ${targetLabel}`);
                    break;
                }
                case 'j': {
                    const label = res;
                    this.newAsm(`j ${label}`);
                    break;
                }
                case 'call': {
                    // 先准备参数
                    const args = arg2.split('&');
                    const argRegs = args.map(v => this.getRegister(v));
                    // 然后调函数
                    this.newAsm(`addi $sp, $sp, -4`);
                    // TODO:
                }
                default:
                    break;
            }
        }
    }
}
exports.ASMGenerator = ASMGenerator;
