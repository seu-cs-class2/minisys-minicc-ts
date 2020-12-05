"use strict";
/**
 * 语法树相关
 * 2020-11 @ https://github.com/seu-cs-class2/minisys-minicc-ts
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.visualizeAST = exports.$newNode = exports.ASTNode = void 0;
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const child_process_1 = __importDefault(require("child_process"));
const utils_1 = require("../seu-lex-yacc/utils");
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
    /**
     * 添加子节点
     */
    addChild(node) {
        this._children.push(node);
    }
    /**
     * 判断子节点name可匹配某串
     */
    match(rhs) {
        const seq = rhs.trim().split(' ');
        if (seq.length == this._children.length) {
            for (let i = 0; i < seq.length; i++) {
                if (seq[i] != this._children[i]._name)
                    return false;
            }
        }
        else {
            return false;
        }
        return true;
    }
    /**
     * one-based
     * !!! 注意
     * 这里取的是结点的children，取决于newNode时留了哪些参数，并不一定和产生式中相同
     */
    $(i) {
        utils_1.assert(i <= this.children.length, `$i超出范围：${i} out-of ${this.children.length}`);
        return this._children[i - 1];
    }
}
exports.ASTNode = ASTNode;
/**
 * 创建非终结符的ASTNode (语义动作执行用)
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
    const VisualizerPath = path_1.default.join(__dirname, './ASTVisualizer');
    const shape = 'rect';
    fs_1.default.writeFileSync(path_1.default.join(VisualizerPath, './data.js'), `window._seulexyacc_shape = '${shape}'; var data = ${dagreJSON}`);
    // 启动浏览器显示
    viewNow && child_process_1.default.exec(`start ${path_1.default.join(VisualizerPath, './index.html')} `);
}
exports.visualizeAST = visualizeAST;
