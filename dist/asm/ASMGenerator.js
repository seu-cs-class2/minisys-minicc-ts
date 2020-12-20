"use strict";
/**
 * 汇编代码（目标代码）生成器
 * 约定：
 *   - 布尔真：0x1；布尔假：0x0
 *   - $2 <- $1  -->  or $1, $zero, $2
 *   - $2 <- immed  -->  addi $zero, $2, immed // FIXME 32bit immed assign
 * // TODO: 目前写好的是最蠢的汇编生成，每条指令前后均访存，不考虑寄存器复用，并且不支持函数调用、数组特性
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
        this._stackStartAddr = 1023; // 1024 * 32 bit
        this._stackPtr = this._stackStartAddr; // 高地址向低地址增长
        this._stackArea = Array(this._stackStartAddr + 1).fill('none');
        this._freeRegs = [...Arch_1.UsefulRegs];
        // 给main函数局部变量分配栈位置 // TODO: 设计栈空间，支持函数调用
        // FIXME: 规定main函数不准递归
        // TODO: 数组支持
        let allVar = [];
        this._ir.quads.forEach(v => {
            v.arg1.startsWith(IRGenerator_1.VarPrefix) && allVar.push(v.arg1);
            v.arg2.startsWith(IRGenerator_1.VarPrefix) && allVar.push(v.arg2);
            v.res.startsWith(IRGenerator_1.VarPrefix) && allVar.push(v.res);
        });
        allVar = [...new Set(allVar)];
        for (let var_ of allVar) {
            this._stackArea[this._stackPtr--] = var_;
        }
        // TODO: 科学的寄存器分配
        this.newAsm('.DATA 0x0');
        this.processGlobalVars();
        this.newAsm('.TEXT 0x0');
        this.processTextSegment();
    }
    /**
     * 从内存取变量到寄存器
     */
    loadVar(varId, register) {
        const varLoc = this._stackArea.findIndex(v => v == varId);
        utils_1.assert(varLoc !== -1, '?');
        const offset = (this._stackStartAddr - varLoc) * Arch_1.WordLengthByte;
        this.newAsm(`addi $at, $zero, ${offset}`);
        this.newAsm(`lw ${register}, ${this._stackStartAddr}($at)`);
    }
    /**
     * 回写寄存器内容到内存
     */
    storeVar(varId, register) {
        const varLoc = this._stackArea.findIndex(v => v == varId);
        utils_1.assert(varLoc !== -1, '?');
        const offset = (this._stackStartAddr - varLoc) * Arch_1.WordLengthByte;
        this.newAsm(`addi $at, $zero, ${offset}`);
        this.newAsm(`sw ${register}, ${this._stackStartAddr}($at)`);
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
    getRegs(count = 1) {
        let res = [];
        for (let i = 0; i < count; i++) {
            res.push(this._freeRegs.shift());
        }
        return res;
    }
    freeRegs(regs) {
        this._freeRegs.unshift(...regs);
    }
    /**
     * @see https://github.com/seu-cs-class2/minisys-minicc-ts/blob/master/docs/IR.md
     */
    processTextSegment() {
        for (let quad of this._ir.quads) {
            const { op, arg1, arg2, res } = quad;
            const binaryOp = !!(arg1.trim() && arg2.trim()); // 是二元表达式
            const unaryOp = !!(+!!arg1.trim() ^ +!!arg2.trim()); // 是一元表达式
            switch (op) {
                case 'set_label': {
                    this.newAsm(res + ':');
                    break;
                }
                case 'j_false': {
                    const [reg1] = this.getRegs(1);
                    this.loadVar(arg1, reg1);
                    this.newAsm(`beq ${reg1}, $zero, ${res}`);
                    this.newAsm(`nop`); // delay-slot
                    this.freeRegs([reg1]);
                    break;
                }
                case 'j': {
                    this.newAsm(`j ${res}`);
                    this.newAsm(`nop`); // delay-slot
                    break;
                }
                case '=var': {
                    const [reg1, reg2] = this.getRegs(2);
                    this.loadVar(arg1, reg1);
                    this.newAsm(`or ${reg1}, $zero, ${reg2}`);
                    this.storeVar(res, reg2);
                    this.freeRegs([reg1, reg2]);
                    break;
                }
                case '=const': {
                    // TODO: 位数扩展
                    const [reg1] = this.getRegs(1);
                    this.newAsm(`addi ${reg1}, $zero, ${arg1}`);
                    this.storeVar(res, reg1);
                    this.freeRegs([reg1]);
                    break;
                }
                case '=[]': {
                    // TODO: 数组支持
                    break;
                }
                case '[]': {
                    // TODO: 数组支持
                    break;
                }
                case '=$': {
                    // TODO: 需要硬件侧约定端口访问方法（编址等）
                    break;
                }
                case 'call': {
                    // TODO: 设计函数调用
                    break;
                }
                case 'return_void': {
                    // TODO: 设计函数调用
                    // 利用$ra
                    break;
                }
                case 'return_expr': {
                    // TODO: 设计函数调用
                    // 利用$ra
                    break;
                }
                case 'OR_OP': {
                    // TODO: 参考布尔值约定进行运算
                    break;
                }
                case 'AND_OP': {
                    // TODO: 参考布尔值约定进行运算
                    break;
                }
                case 'BITAND_OP': {
                    const [reg1, reg2, reg3] = this.getRegs(3);
                    this.loadVar(arg1, reg1);
                    this.loadVar(arg2, reg2);
                    this.newAsm(`and ${reg1}, ${reg2}, ${reg3}`);
                    this.storeVar(res, reg3);
                    this.freeRegs([reg1, reg2, reg3]);
                    break;
                }
                case 'BITXOR_OP': {
                    const [reg1, reg2, reg3] = this.getRegs(3);
                    this.loadVar(arg1, reg1);
                    this.loadVar(arg2, reg2);
                    this.newAsm(`xor ${reg1}, ${reg2}, ${reg3}`);
                    this.storeVar(res, reg3);
                    this.freeRegs([reg1, reg2, reg3]);
                    break;
                }
                case 'BITOR_OP': {
                    const [reg1, reg2, reg3] = this.getRegs(3);
                    this.loadVar(arg1, reg1);
                    this.loadVar(arg2, reg2);
                    this.newAsm(`or ${reg1}, ${reg2}, ${reg3}`);
                    this.storeVar(res, reg3);
                    this.freeRegs([reg1, reg2, reg3]);
                    break;
                }
                case 'EQ_OP': {
                    const [reg1, reg2, reg3] = this.getRegs(3);
                    this.loadVar(arg1, reg1);
                    this.loadVar(arg2, reg2);
                    this.newAsm(`sub ${reg1}, ${reg2}, ${reg3}`);
                    this.newAsm(`nor ${reg3}, ${reg3}, ${reg3}`);
                    this.storeVar(res, reg3);
                    this.freeRegs([reg1, reg2, reg3]);
                    break;
                }
                case 'NE_OP': {
                    const [reg1, reg2, reg3] = this.getRegs(3);
                    this.loadVar(arg1, reg1);
                    this.loadVar(arg2, reg2);
                    this.newAsm(`sub ${reg1}, ${reg2}, ${reg3}`);
                    this.storeVar(res, reg3);
                    this.freeRegs([reg1, reg2, reg3]);
                    break;
                }
                case 'LT_OP': {
                    const [reg1, reg2, reg3] = this.getRegs(3);
                    this.loadVar(arg1, reg1);
                    this.loadVar(arg2, reg2);
                    this.newAsm(`slt ${reg1}, ${reg2}, ${reg3}`);
                    this.storeVar(res, reg3);
                    this.freeRegs([reg1, reg2, reg3]);
                    break;
                }
                case 'GT_OP': {
                    const [reg1, reg2, reg3] = this.getRegs(3);
                    this.loadVar(arg1, reg1);
                    this.loadVar(arg2, reg2);
                    this.newAsm(`slt ${reg2}, ${reg1}, ${reg3}`);
                    this.storeVar(res, reg3);
                    this.freeRegs([reg1, reg2, reg3]);
                    break;
                }
                case 'GE_OP': {
                    // TODO
                    break;
                }
                case 'LE_OP': {
                    // TODO
                    break;
                }
                case 'PLUS': {
                    // TODO
                    break;
                }
                case 'MINUS': {
                    if (binaryOp) {
                        const [reg1, reg2, reg3] = this.getRegs(3);
                        this.loadVar(arg1, reg1);
                        this.loadVar(arg2, reg2);
                        this.newAsm(`sub ${reg1}, ${reg2}, ${reg3}`);
                        this.storeVar(res, reg3);
                        this.freeRegs([reg1, reg2, reg3]);
                    }
                    if (unaryOp) {
                        const [reg1, reg2] = this.getRegs(2);
                        this.loadVar(arg1, reg1);
                        this.newAsm(`sub $zero, ${reg1}, ${reg2}`);
                        this.storeVar(res, reg2);
                        this.freeRegs([reg1, reg2]);
                    }
                    break;
                }
                case 'MULTIPLY': {
                    // TODO
                    break;
                }
                case 'SLASH': {
                    const [reg1, reg2, reg3] = this.getRegs(3);
                    this.loadVar(arg1, reg1);
                    this.loadVar(arg2, reg2);
                    this.newAsm(`div ${reg1}, ${reg2}`);
                    this.newAsm(`mflo ${reg3}`);
                    this.storeVar(res, reg3);
                    this.freeRegs([reg1, reg2, reg3]);
                    break;
                }
                case 'PERCENT': {
                    const [reg1, reg2, reg3] = this.getRegs(3);
                    this.loadVar(arg1, reg1);
                    this.loadVar(arg2, reg2);
                    this.newAsm(`div ${reg1}, ${reg2}`);
                    this.newAsm(`mfhi ${reg3}`);
                    this.storeVar(res, reg3);
                    this.freeRegs([reg1, reg2, reg3]);
                    break;
                }
                case 'NOT_OP': {
                    // TODO
                    break;
                }
                // TODO: 其他op
                default:
                    break;
            }
        }
    }
}
exports.ASMGenerator = ASMGenerator;
