"use strict";
/**
 * 汇编代码（目标代码）生成器
 * 约定：
 *   - 布尔真：任何不是0x0的值；布尔假：0x0
 * 2021-01 @ https://github.com/seu-cs-class2/minisys-minicc-ts
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ASMGenerator = void 0;
const IR_1 = require("../ir/IR");
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
        this._GPRs = [...Arch_1.UsefulRegs];
        this._registerDescriptors = new Map();
        this._addressDescriptors = new Map();
        this._stackFrameInfos = new Map();
        this.calcFrameInfo();
        // initialize all GPRs
        for (const regName of this._GPRs) {
            this._registerDescriptors.set(regName, { usable: true, variables: new Set() });
        }
        this.newAsm('.data');
        this.initializeGlobalVars();
        this.newAsm('.text');
        this.processTextSegment();
        this.peepholeOptimize();
    }
    /**
     * 从内存取变量到寄存器
     */
    loadVar(varId, register) {
        var _a, _b, _c, _d;
        const varLoc = (_a = this._addressDescriptors.get(varId)) === null || _a === void 0 ? void 0 : _a.boundMemAddress;
        utils_1.assert(varLoc, `Cannot get the bound address for this variable: ${varId}`);
        this.newAsm(`lw ${register}, ${varLoc}`);
        this.newAsm(`nop`);
        this.newAsm(`nop`);
        // change the register descriptor so it holds only this var
        (_b = this._registerDescriptors.get(register)) === null || _b === void 0 ? void 0 : _b.variables.clear();
        (_c = this._registerDescriptors.get(register)) === null || _c === void 0 ? void 0 : _c.variables.add(varId);
        // change the address descriptor by adding this register as an additonal location
        (_d = this._addressDescriptors.get(varId)) === null || _d === void 0 ? void 0 : _d.currentAddresses.add(register);
    }
    /**
     * 回写寄存器内容到内存
     */
    storeVar(varId, register) {
        var _a, _b;
        const varLoc = (_a = this._addressDescriptors.get(varId)) === null || _a === void 0 ? void 0 : _a.boundMemAddress;
        utils_1.assert(varLoc, `Cannot get the bound address for this variable: ${varId}`);
        this.newAsm(`sw ${register}, ${varLoc}`);
        (_b = this._addressDescriptors.get(varId)) === null || _b === void 0 ? void 0 : _b.currentAddresses.add(varLoc);
    }
    /**
     * 生成汇编代码
     */
    toAssembly() {
        return this._asm.map(v => (!(v.startsWith('.') || v.includes(':')) ? '\t' : '') + v.replace(' ', '\t')).join('\n');
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
     * 生成声明全局变量代码
     */
    initializeGlobalVars() {
        const globalVars = this._ir.varPool.filter(v => IRGenerator_1.IRGenerator.sameScope(v.scope, IRGenerator_1.GlobalScope));
        for (let var_ of globalVars) {
            if (var_ instanceof IR_1.IRVar) {
                this.newAsm(`${var_.name}: ${this.toMinisysType(var_.type)} 0x0`); // 全局变量初始值给 0x0
            }
            else {
                this.newAsm(`${var_.name}: ${this.toMinisysType(var_.type)} ${Array(var_.len).fill('0x0').join(', ')}`); // 全局变量初始值给 0x0
            }
        }
    }
    /**
     * 为一条四元式获取每个变量可用的寄存器（龙书8.6.3）
     */
    getRegs(ir, blockIndex, irIndex) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
        const { op, arg1, arg2, res } = ir;
        const binaryOp = arg1.trim() && arg2.trim(); // 是二元表达式
        const unaryOp = !!(+!!arg1.trim() ^ +!!arg2.trim()); // 是一元表达式
        let regs = [''];
        if (['=$', 'call', 'j_false', '=var', '=const', '=[]', '[]'].includes(op)) {
            switch (op) {
                case '=$': {
                    let regY = this.allocateReg(blockIndex, irIndex, arg1, undefined, undefined);
                    if (!((_a = this._registerDescriptors.get(regY)) === null || _a === void 0 ? void 0 : _a.variables.has(arg1))) {
                        this.loadVar(arg1, regY);
                    }
                    let regZ = this.allocateReg(blockIndex, irIndex, arg2, undefined, undefined);
                    if (!((_b = this._registerDescriptors.get(regZ)) === null || _b === void 0 ? void 0 : _b.variables.has(arg2))) {
                        this.loadVar(arg2, regZ);
                    }
                    regs = [regY, regZ];
                    break;
                }
                case '=const':
                case 'call': {
                    let regX = this.allocateReg(blockIndex, irIndex, res, undefined, undefined);
                    regs = [regX];
                    break;
                }
                case 'j_false': {
                    let regY = this.allocateReg(blockIndex, irIndex, arg1, undefined, undefined);
                    if (!((_c = this._registerDescriptors.get(regY)) === null || _c === void 0 ? void 0 : _c.variables.has(arg1))) {
                        this.loadVar(arg1, regY);
                    }
                    regs = [regY];
                    break;
                }
                case '=var': {
                    let regY = this.allocateReg(blockIndex, irIndex, arg1, undefined, res);
                    if (!((_d = this._registerDescriptors.get(regY)) === null || _d === void 0 ? void 0 : _d.variables.has(arg1))) {
                        this.loadVar(arg1, regY);
                    }
                    // always choose RegX = RegY
                    let regX = regY;
                    regs = [regY, regX];
                    break;
                }
                case '=[]': {
                    let regY = this.allocateReg(blockIndex, irIndex, arg1, undefined, undefined);
                    if (!((_e = this._registerDescriptors.get(regY)) === null || _e === void 0 ? void 0 : _e.variables.has(arg1))) {
                        this.loadVar(arg1, regY);
                    }
                    let regZ = this.allocateReg(blockIndex, irIndex, arg2, undefined, undefined);
                    if (!((_f = this._registerDescriptors.get(regZ)) === null || _f === void 0 ? void 0 : _f.variables.has(arg2))) {
                        this.loadVar(arg2, regZ);
                    }
                    regs = [regY, regZ];
                    break;
                }
                case '[]': {
                    let regZ = this.allocateReg(blockIndex, irIndex, arg2, undefined, undefined);
                    if (!((_g = this._registerDescriptors.get(regZ)) === null || _g === void 0 ? void 0 : _g.variables.has(arg2))) {
                        this.loadVar(arg2, regZ);
                    }
                    let regX = this.allocateReg(blockIndex, irIndex, res, undefined, undefined);
                    regs = [regZ, regX];
                    break;
                }
                default:
                    break;
            }
        }
        else if (binaryOp) {
            let regY = this.allocateReg(blockIndex, irIndex, arg1, arg2, res);
            if (!((_h = this._registerDescriptors.get(regY)) === null || _h === void 0 ? void 0 : _h.variables.has(arg1))) {
                this.loadVar(arg1, regY);
            }
            let regZ = this.allocateReg(blockIndex, irIndex, arg2, arg1, res);
            if (!((_j = this._registerDescriptors.get(regZ)) === null || _j === void 0 ? void 0 : _j.variables.has(arg2))) {
                this.loadVar(arg2, regZ);
            }
            // if res is either of arg1 or arg2, then simply use the same register
            let regX = '';
            if (res == arg1) {
                regX = regY;
            }
            else if (res == arg2) {
                regX = regZ;
            }
            else {
                regX = this.allocateReg(blockIndex, irIndex, res, undefined, undefined);
            }
            regs = [regY, regZ, regX];
        }
        else if (unaryOp) {
            // unary op
            let regY = this.allocateReg(blockIndex, irIndex, arg1, undefined, res);
            if (!((_k = this._registerDescriptors.get(regY)) === null || _k === void 0 ? void 0 : _k.variables.has(arg1))) {
                this.loadVar(arg1, regY);
            }
            let regX = res == arg1 ? regY : this.allocateReg(blockIndex, irIndex, res, undefined, undefined);
            regs = [regY, regX];
        }
        else
            utils_1.assert(false, 'Illegal op.');
        return regs;
    }
    /**
     * 寄存器分配（龙书8.6.3）
     */
    allocateReg(blockIndex, irIndex, thisArg, otherArg, res) {
        var _a, _b, _c, _d, _e, _f;
        const addrDesc = (_a = this._addressDescriptors.get(thisArg)) === null || _a === void 0 ? void 0 : _a.currentAddresses;
        let finalReg = '';
        let alreadyInReg = false;
        if (addrDesc != undefined) {
            for (const addr of addrDesc) {
                if (addr[0] == '$') {
                    // 1. Currently in a register, just pick this one.
                    alreadyInReg = true;
                    finalReg = addr;
                    break;
                }
            }
        }
        if (!alreadyInReg) {
            let freeReg = '';
            for (let kvPair of this._registerDescriptors.entries()) {
                if (kvPair[1].variables.size == 0 && kvPair[1].usable) {
                    freeReg = kvPair[0];
                    break;
                }
            }
            if (freeReg.length > 0) {
                // 2. Not in a register, but there is a register that is currently empty, pick one such register.
                finalReg = freeReg;
            }
            else {
                const basicBlock = this._ir.basicBlocks[blockIndex];
                // 3. No free register. Need to pick one to replace.
                let scores = new Map(); // number of instructions needed to generate if pick such register
                for (let kvPair of this._registerDescriptors.entries()) {
                    let scoreKey = kvPair[0];
                    let scoreValue = 0;
                    if (!kvPair[1].usable) {
                        // Not avaibale
                        scoreValue = Infinity;
                        scores.set(scoreKey, scoreValue);
                        continue;
                    }
                    const curentVars = kvPair[1].variables;
                    for (const currentVar of curentVars) {
                        if (currentVar == res && currentVar != otherArg) {
                            // it is the result oprand and not another argument oprand, OK to replace because this value will never be used again
                            continue;
                        }
                        let reused = false;
                        let tempIndex = irIndex;
                        let procedureEnd = false;
                        while (!procedureEnd && !reused) {
                            const tempIR = basicBlock.content[++tempIndex];
                            if (tempIR.arg1 == currentVar || tempIR.arg2 == currentVar || tempIR.res == currentVar) {
                                reused = true;
                                break;
                            }
                            if (tempIR.op == 'set_label' && tempIR.res.endsWith('_exit'))
                                procedureEnd = true;
                        }
                        if (!reused) {
                            // this variable will never be used again as an argument in subsequent instructions of this procedure
                            continue;
                        }
                        else {
                            const boundMem = (_b = this._addressDescriptors.get(currentVar)) === null || _b === void 0 ? void 0 : _b.boundMemAddress;
                            if (boundMem != undefined) {
                                const addrs = (_c = this._addressDescriptors.get(currentVar)) === null || _c === void 0 ? void 0 : _c.currentAddresses;
                                if (addrs != undefined && addrs.size > 1) {
                                    // it has another current address, OK to directly replace this one without generating a store instruction
                                    continue;
                                }
                                else {
                                    // can replace this one but need to emit an additional store instruction
                                    scoreValue += 1;
                                }
                            }
                            else {
                                // this is a temporary variable and has no memory address so cannot be replaced!
                                scoreValue = Infinity;
                            }
                        }
                    }
                    scores.set(scoreKey, scoreValue);
                }
                let minScore = Infinity;
                let minKey = '';
                for (const kvPair of scores) {
                    if (kvPair[1] < minScore) {
                        minScore = kvPair[1];
                        minKey = kvPair[0];
                    }
                }
                utils_1.assert(minScore != Infinity, 'Cannot find a register to replace.');
                finalReg = minKey;
                if (minScore > 0) {
                    // need to emit instruction(s) to store back
                    const variables = (_d = this._registerDescriptors.get(finalReg)) === null || _d === void 0 ? void 0 : _d.variables;
                    utils_1.assert(variables, 'Undefined varibales');
                    for (const varID of variables) {
                        const tempAddrDesc = this._addressDescriptors.get(varID);
                        utils_1.assert(tempAddrDesc, 'Undefined address descriptor');
                        utils_1.assert(tempAddrDesc.boundMemAddress, 'Undefined bound address');
                        const tempBoundAddr = tempAddrDesc.boundMemAddress;
                        if (!tempAddrDesc.currentAddresses.has(tempBoundAddr)) {
                            this.storeVar(varID, finalReg);
                            (_e = this._registerDescriptors.get(finalReg)) === null || _e === void 0 ? void 0 : _e.variables.delete(varID);
                            (_f = this._addressDescriptors.get(varID)) === null || _f === void 0 ? void 0 : _f.currentAddresses.delete(finalReg);
                        }
                    }
                }
            }
        }
        return finalReg;
    }
    /**
     * 根据IRFunc计算该Procedure所需的Frame大小.
     * 默认使用所有通用寄存器.
     * 没有子函数则不用存返回地址，否则需要，并且分配至少4个outgoing args块
     */
    calcFrameInfo() {
        for (const outer of this._ir.funcPool) {
            // if it calls child function(s), it needs to save return address
            // and allocate a minimum of 4 outgoing argument slots
            let isLeaf = outer.childFuncs.length == 0;
            let maxArgs = 0;
            for (const inner of this._ir.funcPool) {
                if (inner.name in outer.childFuncs) {
                    maxArgs = Math.max(maxArgs, inner.paramList.length);
                }
            }
            let outgoingSlots = isLeaf ? 0 : Math.max(maxArgs, 4);
            let localData = 0;
            for (const localVar of outer.localVars) {
                if (localVar instanceof IR_1.IRVar) {
                    if (!outer.paramList.includes(localVar))
                        localData++;
                }
                else
                    localData += localVar.len;
            }
            let numGPRs2Save = outer.name == 'main' ? 0 : localData > 10 ? (localData > 18 ? 8 : localData - 8) : 0;
            let wordSize = (isLeaf ? 0 : 1) + localData + numGPRs2Save + outgoingSlots + numGPRs2Save; // allocate memory for all local variables (but not for temporary variables)
            if (wordSize % 2 != 0)
                wordSize++; // padding
            this._stackFrameInfos.set(outer.name, {
                isLeaf: isLeaf,
                wordSize: wordSize,
                outgoingSlots: outgoingSlots,
                localData: localData,
                numGPRs2Save: numGPRs2Save,
                numReturnAdd: isLeaf ? 0 : 1,
            }); // for now allocate all regs
        }
    }
    /**
     * 初始化该过程的寄存器和地址描述符
     */
    allocateProcMemory(func) {
        const frameInfo = this._stackFrameInfos.get(func === null || func === void 0 ? void 0 : func.name);
        utils_1.assert(frameInfo, 'Function name not in the pool');
        // must save args passed by register to memory, otherwise they can be damaged
        for (let index = 0; index < func.paramList.length; index++) {
            const memLoc = `${4 * (frameInfo.wordSize + index)}($sp)`;
            if (index < 4) {
                this.newAsm(`sw $a${index}, ${memLoc}`);
            }
            this._addressDescriptors.set(func.paramList[index].id, {
                currentAddresses: new Set().add(memLoc),
                boundMemAddress: memLoc,
            });
        }
        let remainingLVSlots = frameInfo.localData;
        for (const localVar of func.localVars) {
            if (localVar instanceof IR_1.IRVar) {
                if (func.paramList.includes(localVar))
                    continue;
                else {
                    const memLoc = `${4 * (frameInfo.wordSize - (frameInfo.isLeaf ? 0 : 1) - frameInfo.numGPRs2Save - remainingLVSlots--)}($sp)`;
                    this._addressDescriptors.set(localVar.id, {
                        currentAddresses: new Set().add(memLoc),
                        boundMemAddress: memLoc,
                    });
                }
            }
            else if (localVar instanceof IR_1.IRArray) {
                utils_1.assert(false, 'Arrays are only supported as global variables!');
            }
        }
        const availableRSs = func.name == 'main' ? 8 : frameInfo.numGPRs2Save;
        // allocate $s0 ~ $s8
        for (let index = 0; index < 8; index++) {
            let usable = index < availableRSs;
            this._registerDescriptors.set(`$s${index}`, { usable: usable, variables: new Set() });
        }
        this.allocateGlobalMemory();
    }
    /**
     * 初始化全局变量的描述符
     */
    allocateGlobalMemory() {
        const globalVars = this._ir.varPool.filter(v => IRGenerator_1.IRGenerator.sameScope(v.scope, IRGenerator_1.GlobalScope));
        for (const globalVar of globalVars) {
            if (globalVar instanceof IR_1.IRVar) {
                this._addressDescriptors.set(globalVar.id, {
                    currentAddresses: new Set().add(globalVar.name),
                    boundMemAddress: `${globalVar.name}($0)`,
                });
            }
            else {
                this._addressDescriptors.set(globalVar.id, {
                    currentAddresses: new Set().add(globalVar.name),
                    boundMemAddress: globalVar.name,
                });
            }
        }
    }
    /**
     * 清除只属于该过程的描述符，并在必要时写回寄存器中的变量
     */
    deallocateProcMemory() {
        for (const kvpair of this._addressDescriptors.entries()) {
            const boundMemAddress = kvpair[1].boundMemAddress;
            const currentAddresses = kvpair[1].currentAddresses;
            if (boundMemAddress != undefined && !currentAddresses.has(boundMemAddress)) {
                // need to write this back to its bound memory location
                if (currentAddresses.size > 0) {
                    for (const addr of currentAddresses.values()) {
                        if (addr[0] == '$') {
                            this.storeVar(kvpair[0], addr);
                            break;
                        }
                    }
                }
                else {
                    utils_1.assert(false, `Attempted to store a ghost variable: ${kvpair[0]}`);
                }
            }
        }
        this._addressDescriptors.clear();
        for (let pair of this._registerDescriptors) {
            pair[1].variables.clear();
        }
    }
    /**
     * 清除只属于该基本块的描述符，并在必要时写回寄存器中的变量
     */
    deallocateBlockMemory() {
        for (const kvpair of this._addressDescriptors.entries()) {
            const boundMemAddress = kvpair[1].boundMemAddress;
            const currentAddresses = kvpair[1].currentAddresses;
            if (boundMemAddress != undefined && !currentAddresses.has(boundMemAddress)) {
                // need to write this back to its bound memory location
                if (currentAddresses.size > 0) {
                    for (const addr of currentAddresses.values()) {
                        if (addr[0] == '$') {
                            this.storeVar(kvpair[0], addr);
                            break;
                        }
                    }
                }
                else {
                    utils_1.assert(false, `Attempted to store a ghost variable: ${kvpair[0]}`);
                }
            }
        }
        for (let pair of this._registerDescriptors) {
            pair[1].variables.clear();
        }
        for (let value of this._addressDescriptors.values()) {
            for (let addr of value.currentAddresses) {
                if (addr[0] == '$')
                    value.currentAddresses.delete(addr);
            }
        }
    }
    /**
     * 更新变量被赋值后的相应的描述符
     */
    manageResDescriptors(regX, res) {
        var _a, _b, _c, _d;
        // a. Change the register descriptor for regX so that it only holds res
        (_a = this._registerDescriptors.get(regX)) === null || _a === void 0 ? void 0 : _a.variables.clear();
        (_b = this._registerDescriptors.get(regX)) === null || _b === void 0 ? void 0 : _b.variables.add(res);
        if (this._addressDescriptors.has(res)) {
            // b. Remove regX from the address descriptor of any variable other than res
            for (let descriptor of this._addressDescriptors.values()) {
                if (descriptor.currentAddresses.has(regX)) {
                    descriptor.currentAddresses.delete(regX);
                }
            }
            // c. Change the address descriptor for res so that its only location is regX
            // Note the memory location for res is NOT now in the address descriptor for res!
            (_c = this._addressDescriptors.get(res)) === null || _c === void 0 ? void 0 : _c.currentAddresses.clear();
            (_d = this._addressDescriptors.get(res)) === null || _d === void 0 ? void 0 : _d.currentAddresses.add(regX);
        }
        else {
            // temporary vairable
            this._addressDescriptors.set(res, {
                boundMemAddress: undefined,
                currentAddresses: new Set().add(regX),
            });
        }
    }
    /**
     * 根据中间代码生成MIPS汇编
     * @see https://github.com/seu-cs-class2/minisys-minicc-ts/blob/master/docs/IR.md
     */
    processTextSegment() {
        var _a, _b, _c, _d, _e, _f, _g;
        let currentFunc, currentFrameInfo;
        for (let blockIndex = 0; blockIndex < this._ir.basicBlocks.length; blockIndex++) {
            const basicBlock = this._ir.basicBlocks[blockIndex];
            for (let irIndex = 0; irIndex < basicBlock.content.length; irIndex++) {
                const quad = basicBlock.content[irIndex];
                if (quad == undefined)
                    break;
                const { op, arg1, arg2, res } = quad;
                const binaryOp = !!(arg1.trim() && arg2.trim()); // 是二元表达式
                const unaryOp = !!(+!!arg1.trim() ^ +!!arg2.trim()); // 是一元表达式
                if (op == 'call') {
                    // parse the function name
                    const func = this._ir.funcPool.find(element => element.name == arg1);
                    utils_1.assert(func, `Unidentified function:${arg1}`);
                    utils_1.assert(func.name != 'main', 'Cannot call main!');
                    const actualArguments = arg2.split('&');
                    // has arguments
                    if (binaryOp) {
                        for (let argNum = 0; argNum < func.paramList.length; argNum++) {
                            const actualArg = actualArguments[argNum];
                            const ad = this._addressDescriptors.get(actualArg);
                            if (ad == undefined || ad.currentAddresses == undefined || ad.currentAddresses.size == 0) {
                                utils_1.assert(false, 'Actual argument does not have current address');
                            }
                            else {
                                for (const kvpair of this._addressDescriptors.entries()) {
                                    const boundMemAddress = kvpair[1].boundMemAddress;
                                    const currentAddresses = kvpair[1].currentAddresses;
                                    if (boundMemAddress != undefined && !currentAddresses.has(boundMemAddress)) {
                                        // need to write this back to its bound memory location
                                        if (currentAddresses.size > 0) {
                                            for (const addr of currentAddresses.values()) {
                                                if (addr.substr(0, 2) == '$t') {
                                                    this.storeVar(kvpair[0], addr);
                                                    break;
                                                }
                                            }
                                        }
                                        else {
                                            utils_1.assert(false, `Attempted to store a ghost variable: ${kvpair[0]}`);
                                        }
                                    }
                                }
                                let regLoc = '';
                                let memLoc = '';
                                for (const addr of ad.currentAddresses) {
                                    if (addr[0] == '$') {
                                        // register has higher priority
                                        regLoc = addr;
                                        break;
                                    }
                                    else {
                                        memLoc = addr;
                                    }
                                }
                                if (regLoc.length > 0) {
                                    if (argNum < 4) {
                                        this.newAsm(`move $a${argNum}, ${regLoc}`);
                                    }
                                    else {
                                        this.newAsm(`sw ${regLoc}, ${4 * argNum}($sp)`);
                                    }
                                }
                                else {
                                    if (argNum < 4) {
                                        this.newAsm(`lw $a${argNum}, ${memLoc}`);
                                        this.newAsm(`nop`);
                                        this.newAsm(`nop`);
                                    }
                                    else {
                                        // since $v1 will not be used elsewhere, it is used to do this!
                                        this.newAsm(`lw $v1, ${memLoc}`);
                                        this.newAsm(`nop`);
                                        this.newAsm(`nop`);
                                        this.newAsm(`sw $v1, ${4 * argNum}($sp)`);
                                    }
                                }
                            }
                        }
                    }
                    this.newAsm(`jal ${arg1}`); // jal will automatically save return address to $ra
                    this.newAsm('nop');
                    // clear temporary registers because they might have been damaged
                    for (let kvpair of this._addressDescriptors.entries()) {
                        for (let addr of kvpair[1].currentAddresses) {
                            if (addr.substr(0, 2) == '$t') {
                                kvpair[1].currentAddresses.delete(addr);
                                (_a = this._registerDescriptors.get(addr)) === null || _a === void 0 ? void 0 : _a.variables.delete(kvpair[0]);
                            }
                        }
                    }
                    if (res.length > 0) {
                        const [regX] = this.getRegs(quad, blockIndex, irIndex);
                        this.newAsm(`move ${regX}, $v0`);
                        this.manageResDescriptors(regX, res);
                    }
                }
                else if (binaryOp) {
                    switch (op) {
                        case '=[]': {
                            const [regY, regZ] = this.getRegs(quad, blockIndex, irIndex);
                            this.newAsm(`move $v1, ${regY}`);
                            this.newAsm(`sll $v1, $v1, 2`);
                            const baseAddr = (_b = this._addressDescriptors.get(res)) === null || _b === void 0 ? void 0 : _b.boundMemAddress;
                            this.newAsm(`sw ${regZ}, ${baseAddr}($v1)`);
                            break;
                        }
                        case '[]': {
                            const [regZ, regX] = this.getRegs(quad, blockIndex, irIndex);
                            this.newAsm(`move $v1, ${regZ}`);
                            this.newAsm(`sll $v1, $v1, 2`);
                            const baseAddr = (_c = this._addressDescriptors.get(arg1)) === null || _c === void 0 ? void 0 : _c.boundMemAddress;
                            this.newAsm(`lw ${regX}, ${baseAddr}($v1)`);
                            this.newAsm(`nop`);
                            this.newAsm(`nop`);
                            this.manageResDescriptors(regX, res);
                            break;
                        }
                        case '=$': {
                            const [regY, regZ] = this.getRegs(quad, blockIndex, irIndex);
                            this.newAsm(`sw ${regZ}, 0(${regY})`);
                            break;
                        }
                        // X = Y op Z
                        case 'OR_OP':
                        case 'AND_OP':
                        case 'LT_OP':
                        case 'PLUS':
                        case 'MINUS':
                        case 'BITAND_OP':
                        case 'BITOR_OP':
                        case 'BITXOR_OP':
                        case 'LEFT_OP':
                        case 'RIGHT_OP':
                        case 'EQ_OP':
                        case 'NE_OP':
                        case 'NE_OP':
                        case 'GT_OP':
                        case 'GE_OP':
                        case 'LE_OP':
                        case 'MULTIPLY':
                        case 'SLASH':
                        case 'PERCENT':
                            {
                                // register allocation
                                const [regY, regZ, regX] = this.getRegs(quad, blockIndex, irIndex);
                                // emit respective instructions
                                switch (op) {
                                    case 'BITOR_OP':
                                    case 'OR_OP': {
                                        this.newAsm(`or ${regX}, ${regY}, ${regZ}`);
                                        break;
                                    }
                                    case 'BITAND_OP':
                                    case 'AND_OP': {
                                        this.newAsm(`and ${regX}, ${regY}, ${regZ}`);
                                        break;
                                    }
                                    case 'BITXOR_OP': {
                                        this.newAsm(`xor ${regX}, ${regY}, ${regZ}`);
                                        break;
                                    }
                                    case 'PLUS': {
                                        this.newAsm(`add ${regX}, ${regY}, ${regZ}`);
                                        break;
                                    }
                                    case 'MINUS': {
                                        this.newAsm(`sub ${regX}, ${regY}, ${regZ}`);
                                        break;
                                    }
                                    case 'LEFT_OP': {
                                        this.newAsm(`sllv ${regX}, ${regY}, ${regZ}`);
                                        break;
                                    }
                                    case 'RIGHT_OP': {
                                        this.newAsm(`srlv ${regX}, ${regY}, ${regZ}`);
                                        break;
                                    }
                                    case 'EQ_OP': {
                                        this.newAsm(`sub ${regX}, ${regY}, ${regZ}`);
                                        this.newAsm(`nor ${regX}, ${regY}, ${regZ}`);
                                        break;
                                    }
                                    case 'NE_OP': {
                                        this.newAsm(`sub ${regX}, ${regY}, ${regZ}`);
                                        break;
                                    }
                                    case 'LT_OP': {
                                        this.newAsm(`slt ${regX}, ${regY}, ${regZ}`);
                                        break;
                                    }
                                    case 'GT_OP': {
                                        this.newAsm(`slt ${regX}, ${regZ}, ${regY}`);
                                        break;
                                    }
                                    case 'GE_OP': {
                                        this.newAsm(`slt ${regX}, ${regY}, ${regZ}`);
                                        this.newAsm(`nor ${regX}, ${regX}, ${regX}`);
                                        break;
                                    }
                                    case 'LE_OP': {
                                        this.newAsm(`slt ${regX}, ${regZ}, ${regY}`);
                                        this.newAsm(`nor ${regX}, ${regX}, ${regX}`);
                                        break;
                                    }
                                    case 'MULTIPLY': {
                                        this.newAsm(`mult ${regY}, ${regZ}`);
                                        this.newAsm(`mflo ${regX}`);
                                        break;
                                    }
                                    case 'SLASH': {
                                        this.newAsm(`div ${regY}, ${regZ}`);
                                        this.newAsm(`mflo ${regX}`);
                                        break;
                                    }
                                    case 'PERCENT': {
                                        this.newAsm(`div ${regY}, ${regZ}`);
                                        this.newAsm(`mfhi ${regX}`);
                                        break;
                                    }
                                }
                                this.manageResDescriptors(regX, res);
                            }
                            break;
                        default:
                            break;
                    }
                }
                else if (unaryOp) {
                    switch (op) {
                        case 'out_asm': {
                            // directly output assembly
                            utils_1.assert(arg1.match(/^".*"$/), `out_asm 动作接收到非字符串参数 ${arg1}`);
                            this.newAsm(arg1.substring(1, arg1.length - 1));
                            break;
                        }
                        case 'j_false': {
                            const [regY] = this.getRegs(quad, blockIndex, irIndex);
                            this.deallocateBlockMemory();
                            this.newAsm(`beq ${regY}, $zero, ${res}`);
                            this.newAsm(`nop`); // delay-slot
                            break;
                        }
                        case '=const': {
                            const [regX] = this.getRegs(quad, blockIndex, irIndex);
                            const immediateNum = parseInt(arg1);
                            if (immediateNum <= 65535 && immediateNum >= 0) {
                                this.newAsm(`addiu ${regX}, $zero, ${arg1}`);
                            }
                            else {
                                const lowerHalf = immediateNum & 0x0000ffff;
                                const higherHalf = immediateNum >> 16;
                                this.newAsm(`lui ${regX}, ${higherHalf}`);
                                this.newAsm(`ori ${regX}, ${regX}, ${lowerHalf}`);
                            }
                            this.manageResDescriptors(regX, res);
                            break;
                        }
                        case '=var':
                            const [regY] = this.getRegs(quad, blockIndex, irIndex);
                            // Add res to the register descriptor for regY
                            (_d = this._registerDescriptors.get(regY)) === null || _d === void 0 ? void 0 : _d.variables.add(res);
                            // Change the address descriptor for res so that its only location is regY
                            if (this._addressDescriptors.has(res)) {
                                (_e = this._addressDescriptors.get(res)) === null || _e === void 0 ? void 0 : _e.currentAddresses.clear();
                                (_f = this._addressDescriptors.get(res)) === null || _f === void 0 ? void 0 : _f.currentAddresses.add(regY);
                            }
                            else {
                                // temporary vairable
                                this._addressDescriptors.set(res, {
                                    boundMemAddress: undefined,
                                    currentAddresses: new Set().add(regY),
                                });
                            }
                            break;
                        case 'return_expr': {
                            const ad = this._addressDescriptors.get(arg1);
                            if (ad == undefined || ad.currentAddresses == undefined || ad.currentAddresses.size == 0) {
                                utils_1.assert(false, 'Return value does not have current address');
                            }
                            else {
                                let regLoc = '';
                                let memLoc = '';
                                for (const addr of ad.currentAddresses) {
                                    if (addr[0] == '$') {
                                        // register has higher priority
                                        regLoc = addr;
                                        break;
                                    }
                                    else {
                                        memLoc = addr;
                                    }
                                }
                                if (regLoc.length > 0) {
                                    this.newAsm(`move $v0, ${regLoc}`);
                                }
                                else {
                                    this.newAsm(`lw $v0, ${memLoc}`);
                                    this.newAsm(`nop`);
                                    this.newAsm(`nop`);
                                }
                            }
                            this.deallocateBlockMemory();
                            utils_1.assert(currentFrameInfo, 'Undefined frame info');
                            currentFrameInfo = currentFrameInfo;
                            for (let index = 0; index < currentFrameInfo.numGPRs2Save; index++) {
                                this.newAsm(`lw $s${index}, ${4 * (currentFrameInfo.wordSize - currentFrameInfo.numGPRs2Save + index)}($sp)`);
                                this.newAsm(`nop`);
                                this.newAsm(`nop`);
                            }
                            if (!currentFrameInfo.isLeaf) {
                                this.newAsm(`lw $ra, ${4 * (currentFrameInfo.wordSize - 1)}($sp)`);
                                this.newAsm(`nop`);
                                this.newAsm(`nop`);
                            }
                            this.newAsm(`addiu $sp, $sp, ${4 * currentFrameInfo.wordSize}`);
                            this.newAsm(`jr $ra`);
                            this.newAsm('nop');
                            break;
                        }
                        case 'NOT_OP':
                        case 'MINUS':
                        case 'PLUS':
                        case 'BITINV_OP': {
                            const [regY, regX] = this.getRegs(quad, blockIndex, irIndex);
                            if (!((_g = this._registerDescriptors.get(regY)) === null || _g === void 0 ? void 0 : _g.variables.has(arg1))) {
                                this.loadVar(arg1, regY);
                            }
                            switch (op) {
                                case 'NOT_OP':
                                    this.newAsm(`xor ${regX}, $zero, ${regY}`);
                                    break;
                                case 'MINUS':
                                    this.newAsm(`sub ${regX}, $zero, ${regY}`);
                                    break;
                                case 'PLUS':
                                    this.newAsm(`move ${regX}, ${regY}`);
                                    break;
                                case 'BITINV_OP':
                                    this.newAsm(`nor ${regX}, ${regY}, ${regY}`);
                                    break;
                                default:
                                    break;
                            }
                            this.manageResDescriptors(regX, res);
                            break;
                        }
                        case 'DOLLAR': {
                            const [regY, regX] = this.getRegs(quad, blockIndex, irIndex);
                            this.newAsm(`lw ${regX}, 0(${regY})`);
                            this.newAsm(`nop`);
                            this.newAsm(`nop`);
                            this.manageResDescriptors(regX, res);
                            break;
                        }
                        default:
                            break;
                    }
                }
                else {
                    switch (op) {
                        case 'set_label': {
                            // parse the label to identify type
                            const labelContents = res.split('_');
                            const labelType = labelContents[labelContents.length - 1];
                            if (labelType == 'entry') {
                                // find the function in symbol table
                                currentFunc = this._ir.funcPool.find(element => element.entryLabel == res);
                                utils_1.assert(currentFunc, `Function name not in the pool: ${res}`);
                                currentFrameInfo = this._stackFrameInfos.get(currentFunc === null || currentFunc === void 0 ? void 0 : currentFunc.name);
                                utils_1.assert(currentFrameInfo, `Function name not in the pool: ${res}`);
                                this.newAsm((currentFunc === null || currentFunc === void 0 ? void 0 : currentFunc.name) +
                                    ':' +
                                    `\t\t # vars = ${currentFrameInfo.localData}, regs to save($s#) = ${currentFrameInfo.numGPRs2Save}, outgoing args = ${currentFrameInfo.outgoingSlots}, ${currentFrameInfo.numReturnAdd ? '' : 'do not '}need to save return address`);
                                this.newAsm(`addiu $sp, $sp, -${4 * currentFrameInfo.wordSize}`);
                                if (!currentFrameInfo.isLeaf) {
                                    this.newAsm(`sw $ra, ${4 * (currentFrameInfo.wordSize - 1)}($sp)`);
                                }
                                for (let index = 0; index < currentFrameInfo.numGPRs2Save; index++) {
                                    this.newAsm(`sw $s${index}, ${4 * (currentFrameInfo.wordSize - currentFrameInfo.numGPRs2Save + index)}($sp)`);
                                }
                                this.allocateProcMemory(currentFunc);
                            }
                            else if (labelType == 'exit') {
                                this.deallocateProcMemory();
                            }
                            else {
                                this.newAsm(res + ':');
                            }
                            break;
                        }
                        case 'j': {
                            this.deallocateBlockMemory();
                            this.newAsm(`j ${res}`);
                            this.newAsm(`nop`); // delay-slot
                            break;
                        }
                        case 'return_void': {
                            this.deallocateBlockMemory();
                            utils_1.assert(currentFrameInfo, 'Undefined frame info');
                            currentFrameInfo = currentFrameInfo;
                            for (let index = 0; index < currentFrameInfo.numGPRs2Save; index++) {
                                this.newAsm(`lw $s${index}, ${4 * (currentFrameInfo.wordSize - currentFrameInfo.numGPRs2Save + index)}($sp)`);
                                this.newAsm(`nop`);
                                this.newAsm(`nop`);
                            }
                            if (!currentFrameInfo.isLeaf) {
                                this.newAsm(`lw $ra, ${4 * (currentFrameInfo.wordSize - 1)}($sp)`);
                                this.newAsm(`nop`);
                                this.newAsm(`nop`);
                            }
                            this.newAsm(`addiu $sp, $sp, ${4 * currentFrameInfo.wordSize}`);
                            this.newAsm(`jr $ra`);
                            this.newAsm('nop');
                            break;
                        }
                        default:
                            break;
                    }
                }
                if (op != 'set_label' && op != 'j' && op != 'j_false' && irIndex == basicBlock.content.length - 1) {
                    this.deallocateBlockMemory();
                }
            }
        }
    }
    /**
     * 窥孔优化
     */
    peepholeOptimize() {
        let newAsm = [];
        newAsm.push(this._asm[0]);
        for (let index = 1; index < this._asm.length; index++) {
            let asmElementsThisLine = this._asm[index].trim().split(/\,\s|\s/);
            let asmElementsLastLine = this._asm[index - 1].trim().split(/\,|\s/);
            if (asmElementsThisLine[0] == 'move' && index > 0 && !['nop', 'sw'].includes(asmElementsLastLine[0])) {
                let srcRegThisLine = asmElementsThisLine[2];
                let dstRegLastLine = asmElementsLastLine[1];
                if (srcRegThisLine == dstRegLastLine) {
                    let dstRegThisLine = asmElementsThisLine[1];
                    let newLastLine = this._asm[index - 1].replace(dstRegLastLine, dstRegThisLine);
                    newAsm.pop();
                    // 'move $v0, $v0'
                    let newElements = newLastLine.trim().split(/\,\s|\s/);
                    if (newElements[0] == 'move' && newElements[1] == newElements[2])
                        continue;
                    newAsm.push(newLastLine);
                }
                else {
                    newAsm.push(this._asm[index]);
                }
            }
            else {
                newAsm.push(this._asm[index]);
            }
        }
        this._asm = newAsm;
    }
}
exports.ASMGenerator = ASMGenerator;
