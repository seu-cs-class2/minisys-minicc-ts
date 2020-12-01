"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// Try something here.
const fs_1 = __importDefault(require("fs"));
const fcontent = fs_1.default.readFileSync('F:\\minisys-minicc-ts\\syntax\\MiniC-LALRParse.json').toString();
const j = JSON.parse(fcontent);
const states = j.dfa._states;
const state = states[24];
console.log(state._items.length);
console.log(state._items);
