"use strict";
/**
 * 可视化工具
 * 2020-05 @ https://github.com/z0gSh1u/seu-lex-yacc
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
    if (mod != null) for (var k in mod) if (k !== "default" && Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.visualizeGOTOGraph = exports.visualizeLR1ACTIONGOTOTable = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const childProcess = __importStar(require("child_process"));
const Grammar_1 = require("./Grammar");
/**
 * 可视化LR1分析表（ACTIONGOTOTable）
 */
function visualizeLR1ACTIONGOTOTable(analyzer, viewNow = true) {
    let ACTIONHead = [];
    for (let i of analyzer.ACTIONReverseLookup)
        ACTIONHead.push(analyzer.getSymbolString(i));
    let GOTOHead = [];
    for (let i of analyzer.GOTOReverseLookup)
        GOTOHead.push(analyzer.getSymbolString(i));
    let colUsage = Array(ACTIONHead.length).fill(0);
    let ACTIONTable = [];
    for (let i = 0; i < analyzer.ACTIONTable.length; i++) {
        let row = [];
        for (let j = 0; j < analyzer.ACTIONTable[i].length; j++) {
            const cell = analyzer.ACTIONTable[i][j];
            switch (cell.type) {
                case 'acc':
                    row.push('acc');
                    colUsage[j] = 1;
                    break;
                case 'none':
                    row.push('');
                    break;
                case 'reduce':
                    row.push(`r(${analyzer.formatPrintProducer(analyzer.producers[cell.data]).trim()})`);
                    colUsage[j] = 1;
                    break;
                case 'shift':
                    row.push(`s${cell.data}`);
                    colUsage[j] = 1;
                    break;
            }
        }
        ACTIONTable.push(row);
    }
    let GOTOTable = [];
    for (let i = 0; i < analyzer.GOTOTable.length; i++) {
        let row = [];
        for (let cell of analyzer.GOTOTable[i])
            row.push(cell === -1 ? '' : cell);
        GOTOTable.push(row);
    }
    // 去除ACTIONTable的空列
    for (let col = colUsage.length - 1; col >= 0; col--) {
        if (colUsage[col] == 0) {
            ACTIONHead.splice(col, 1);
            for (let row = 0; row < ACTIONTable.length; row++)
                ACTIONTable[row].splice(col, 1);
        }
    }
    const dumpObject = { ACTIONHead, GOTOHead, ACTIONTable, GOTOTable };
    const dumpJSON = JSON.stringify(dumpObject, null, 2);
    const VisualizerPath = path_1.default.join(__dirname, '../enhance/TableVisualizer');
    fs_1.default.writeFileSync(path_1.default.join(VisualizerPath, './data.js'), `window._seulexyacc_data = ${dumpJSON}`);
    // 启动浏览器显示
    viewNow && childProcess.exec(`start ${path_1.default.join(VisualizerPath, './index.html')} `);
}
exports.visualizeLR1ACTIONGOTOTable = visualizeLR1ACTIONGOTOTable;
/**
 * 可视化GOTO图（自动机）
 */
function visualizeGOTOGraph(dfa, analyzer, viewNow = true) {
    let dumpObject = { nodes: [], edges: [] };
    // 设置点（项目集）
    for (let i = 0; i < dfa.states.length; i++) {
        let topPart = `I${i}\n=======\n`, stateLines = [], kernelItem = true;
        for (let item of dfa.states[i].items) {
            let leftPart = '';
            leftPart += analyzer.symbols[item.rawProducer.lhs].content;
            leftPart += ' -> ';
            let j = 0;
            for (; j < item.rawProducer.rhs.length; j++) {
                if (j == item.dotPosition)
                    leftPart += '●';
                leftPart += analyzer.getSymbolString(item.rawProducer.rhs[j]) + ' ';
            }
            if (j == item.dotPosition)
                leftPart = leftPart.substring(0, leftPart.length - 1) + '●';
            if (dfa instanceof Grammar_1.LR1DFA || dfa instanceof Grammar_1.LALRDFA) {
                leftPart += ' § ';
                let lookahead = analyzer.getSymbolString(item.lookahead);
                let sameLeftPos = stateLines.findIndex(x => x.leftPart == leftPart);
                if (sameLeftPos !== -1) {
                    stateLines[sameLeftPos].lookahead += '/' + lookahead;
                }
                else {
                    stateLines.push({ leftPart, lookahead });
                }
                if (kernelItem) {
                    leftPart = '-------\n';
                    lookahead = '';
                    stateLines.push({ leftPart, lookahead });
                    kernelItem = false;
                }
            }
            else if (dfa instanceof Grammar_1.LR0DFA) {
                let sameLeftPos = stateLines.findIndex(x => x.leftPart == leftPart);
                if (sameLeftPos === -1) {
                    stateLines.push({ leftPart });
                }
                if (kernelItem) {
                    leftPart = '-------\n';
                    stateLines.push({ leftPart });
                    kernelItem = false;
                }
            }
        }
        let stateString = topPart;
        stateLines.forEach(v => {
            stateString += v.leftPart + (v.lookahead || '') + '\n';
        });
        dumpObject.nodes.push({ key: `K${i}`, label: stateString.trim(), color: '#FFFFFF' });
    }
    // 设置边（迁移）
    for (let i = 0; i < dfa.states.length; i++) {
        dfa.adjList[i].forEach(x => {
            dumpObject.edges.push({
                source: `K${i}`,
                target: `K${x.to}`,
                name: `K${i}_${x.to}`,
                label: analyzer.symbols[x.alpha].content,
            });
        });
    }
    let dagreJSON = JSON.stringify(dumpObject, null, 2);
    const VisualizerPath = path_1.default.join(__dirname, '../enhance/FAVisualizer');
    const shape = 'rect';
    fs_1.default.writeFileSync(path_1.default.join(VisualizerPath, './data.js'), `window._seulexyacc_shape = '${shape}'; var data = ${dagreJSON}`);
    // 启动浏览器显示
    viewNow && childProcess.exec(`start ${path_1.default.join(VisualizerPath, './index.html')} `);
}
exports.visualizeGOTOGraph = visualizeGOTOGraph;
