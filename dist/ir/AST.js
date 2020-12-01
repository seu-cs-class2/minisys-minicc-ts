"use strict";
/**
 * 语法树相关
 *
 * 2020-11 @ https://github.com/seu-cs-class2/minisys-minicc-ts
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.visualizeAST = exports.$newNode = exports.ASTNode = void 0;
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const childProcess = __importStar(require("child_process"));
/**
 * 语法树结点
 */
class ASTNode {
    constructor(name, type, literal) {
        this._name = name;
        this._type = type;
        this._literal = literal;
        this._children = [];
    }
    get name() {
        return this._name;
    }
    set name(val) {
        this._name = val;
    }
    get type() {
        return this._type;
    }
    set type(val) {
        this._type = val;
    }
    get literal() {
        return this._literal;
    }
    set literal(val) {
        this._literal = val;
    }
    get children() {
        return this._children;
    }
    set children(val) {
        this._children = Array.from(val);
    }
    addChild(node) {
        this._children.push(node);
    }
}
exports.ASTNode = ASTNode;
/**
 * .y语义动作执行中用到的创建非终结符的ASTNode的方法
 */
function $newNode(name, ...args) {
    const node = new ASTNode(name, 'nonterminal', name);
    const argNodes = args.map(v => v.node);
    let element = { type: 'nonterminal', name, node };
    argNodes.forEach(_node => node.addChild(_node));
    return element;
}
exports.$newNode = $newNode;
/**
 * 可视化AST
 */
function visualizeAST(astRoot, viewNow = true) {
    let dumpObject = { nodes: [], edges: [] };
    // 树转图
    const allNodes = [];
    const allLinks = [];
    (function dfs1(root) {
        allNodes.push(root);
        root.children.forEach(dfs1);
    })(astRoot);
    (function dfs2(root) {
        root.children.forEach(child => {
            allLinks.push({ from: allNodes.indexOf(root), to: allNodes.indexOf(child) });
        });
        root.children.forEach(dfs2);
    })(astRoot);
    // 建点
    for (let i = 0; i < allNodes.length; i++) {
        dumpObject.nodes.push({
            key: String(i),
            label: `[type] ${allNodes[i].type}\n[name] ${allNodes[i].name}\n[literal] ${allNodes[i].literal}`,
            color: '#FFFFFF',
        });
    }
    // 建边
    for (let link of allLinks) {
        dumpObject.edges.push({
            source: String(link.from),
            target: String(link.to),
            name: `${link.from}_${link.to}`,
            label: '',
        });
    }
    // 计算布局并导出
    let dagreJSON = JSON.stringify(dumpObject, null, 2);
    const VisualizerPath = path.join(__dirname, './ASTVisualizer');
    const shape = 'rect';
    fs.writeFileSync(path.join(VisualizerPath, './data.js'), `window._seulexyacc_shape = '${shape}'; var data = ${dagreJSON}`);
    // 启动浏览器显示
    viewNow && childProcess.exec(`start ${path.join(VisualizerPath, './index.html')} `);
}
exports.visualizeAST = visualizeAST;
