"use strict";
/**
 * Minisys架构相关
 * 2020-11 @ https://github.com/seu-cs-class2/minisys-minicc-ts
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.IOMaxAddr = exports.ROMSize = exports.RAMSize = exports.WordLengthByte = exports.WordLengthBit = exports.UsefulRegs = exports.AllRegs = void 0;
// prettier-ignore
exports.AllRegs = [
    '$zero', '$at',
    '$v0', '$v1',
    '$a0', '$a1', '$a2', '$a3',
    '$t0', '$t1', '$t2', '$t3', '$t4', '$t5', '$t6', '$t7',
    '$s0', '$s1', '$s2', '$s3', '$s4', '$s5', '$s6', '$s7',
    '$k0', '$k1',
    '$gp', '$sp', '$fp',
    '$ra',
];
// prettier-ignore
exports.UsefulRegs = [
    '$t0', '$t1', '$t2', '$t3', '$t4', '$t5', '$t6', '$t7', '$t8', '$t9',
    '$s0', '$s1', '$s2', '$s3', '$s4', '$s5', '$s6', '$s7',
];
exports.WordLengthBit = 32;
exports.WordLengthByte = 4;
exports.RAMSize = 65536; // bytes
exports.ROMSize = 65536; // bytes
exports.IOMaxAddr = 0xffffffff;
