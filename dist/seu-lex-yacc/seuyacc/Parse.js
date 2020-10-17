"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const LR1_1 = require("./LR1");
const YaccParser_1 = require("./YaccParser");
const filePath = 'F:\\minisys-minicc-ts\\src\\parser\\MiniC.y';
const dumpPath = 'F:\\minisys-minicc-ts\\src\\parser\\dump.json';
const lr1 = new LR1_1.LR1Analyzer(new YaccParser_1.YaccParser(filePath));
lr1.dump(dumpPath);
// console.log(lr1);
