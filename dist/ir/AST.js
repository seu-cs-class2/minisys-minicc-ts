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
exports.visualizeAST = exports.$newNode = exports.ASTNode = exports.Block = exports.FuncNode = exports.VarNode = void 0;
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const childProcess = __importStar(require("child_process"));
/**
 * 变量结点
 */
class VarNode {
    constructor(name, type) {
        this._name = name;
        this._type = type;
    }
    get name() {
        return this._name;
    }
    set name(v) {
        this._name = v;
    }
    get type() {
        return this._type;
    }
    set type(v) {
        this._type = v;
    }
}
exports.VarNode = VarNode;
/**
 * 函数结点
 */
class FuncNode {
    constructor(name, retType, paramList) {
        this._name = name;
        this._retType = retType;
        this._paramList = paramList;
    }
    get name() {
        return this._name;
    }
    set name(v) {
        this._name = v;
    }
    get retType() {
        return this._retType;
    }
    set retType(v) {
        this._retType = v;
    }
    get paramList() {
        return this._paramList;
    }
    set paramList(v) {
        this._paramList = v;
    }
}
exports.FuncNode = FuncNode;
/**
 * 块级作用域
 */
class Block {
    constructor(funcName, forFunc, func, vars, labelName, breakable) {
        this._funcName = funcName;
        this._func = func;
        this._forFunc = forFunc;
        this._vars = vars;
        this._labelName = labelName;
        this._breakable = breakable;
    }
    get func() {
        return this._func;
    }
    set func(v) {
        this._func = v;
    }
    get funcName() {
        return this._funcName;
    }
    set funcName(v) {
        this._funcName = v;
    }
    get forFunc() {
        return this._forFunc;
    }
    set forFunc(v) {
        this._forFunc = v;
    }
    get vars() {
        return this._vars;
    }
    get labelName() {
        return this._labelName;
    }
    set labelName(v) {
        this._labelName = v;
    }
    get breakable() {
        return this._breakable;
    }
    set breakable(v) {
        this._breakable = v;
    }
}
exports.Block = Block;
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
