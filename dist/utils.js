"use strict";
// 工具函数
// by z0gSh1u @ 2020-05
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Ensure `condition`. Else throw `hint`.
 */
function assert(condition, hint) {
    if (!condition) {
        throw hint;
    }
}
exports.assert = assert;
/**
 * Print directly to stdout.
 */
function stdoutPrint(content) {
    process.stdout.write(content);
}
exports.stdoutPrint = stdoutPrint;
/**
 * Return true if ch can be found in str.
 */
function inStr(ch, str) {
    return str.indexOf(ch) !== -1;
}
exports.inStr = inStr;
/**
 * Return true if target is in some range of `ranges` (closed).
 * @param ranges [l, r][]
 */
function inRange(ranges, target) {
    return ranges.some((range) => target >= range[0] && target <= range[1]);
}
exports.inRange = inRange;
/**
 * Return all ranges (closed) of matches.
 * @param regex a RegExp with note `g`
 */
function getMatchedRanges(regex, str, resultGroup = 0) {
    let result, ranges = [];
    while ((result = regex.exec(str)) != null) {
        result = result;
        ranges.push([result.index, result.index + result[resultGroup].length - 1]);
    }
    return ranges;
}
exports.getMatchedRanges = getMatchedRanges;
/**
 * Split a string using any delim (1 character) in delims.
 * Return split array with delim remained.
 */
function splitAndKeep(str, delims) {
    let res = [], part = '';
    for (let i = 0; i < str.length; i++) {
        if (inStr(str[i], delims)) {
            !!part && res.push(part);
            part = '';
            res.push(str[i]);
        }
        else {
            part += str[i];
        }
    }
    part.length !== 0 && res.push(part);
    return res;
}
exports.splitAndKeep = splitAndKeep;
/**
 * Return true if ch is an English character.
 */
function isAlpha(ch) {
    return ch.length === 1 && !!ch.match(/[A-Za-z]/);
}
exports.isAlpha = isAlpha;
//# sourceMappingURL=utils.js.map