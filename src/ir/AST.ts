/**
 * 语法树相关
 *
 * 2020-11 @ https://github.com/seu-cs-class2/minisys-minicc-ts
 */

import * as path from 'path'
import * as fs from 'fs'
import * as childProcess from 'child_process'
import { SymbolStackElement } from '../parser/ParseLALR'

/**
 * 变量结点
 */
export class VarNode {
  private _name: string // 变量名
  private _type: string // 变量类型
  private _id: string

  get id() {
    return this._id
  }
  set id(v: string) {
    this._id = v
  }

  get name() {
    return this._name
  }
  set name(v: string) {
    this._name = v
  }
  get type() {
    return this._type
  }
  set type(v: string) {
    this._type = v
  }

  constructor(name: string, type: string, id: string) {
    this._name = name
    this._type = type
    this._id = id
  }
}

/**
 * 函数结点
 */
export class FuncNode {
  private _name: string // 函数名
  private _retType: string // 函数返回值类型
  private _paramList: VarNode[] // 形参列表

  get name() {
    return this._name
  }
  set name(v: string) {
    this._name = v
  }
  get retType() {
    return this._retType
  }
  set retType(v: string) {
    this._retType = v
  }
  get paramList() {
    return this._paramList
  }
  set paramList(v: VarNode[]) {
    this._paramList = v
  }

  constructor(name: string, retType: string, paramList: VarNode[]) {
    this._name = name
    this._retType = retType
    this._paramList = paramList
  }
}

/**
 * 块级作用域
 */
type BlockType = 'func' | 'compound'
export class Block {
  private _type: BlockType
  private _vars: Map<string, VarNode> // 局部变量
  // 函数信息
  private _func?: FuncNode
  private _funcName?: string
  // compound statement信息
  private _label?: string
  private _breakable?: boolean

  get type() {
    return this._type
  }
  set type(v: BlockType) {
    this._type = v
  }
  get vars() {
    return this._vars
  }
  get func() {
    return this._func
  }
  set func(v: FuncNode | undefined) {
    this._func = v
  }
  get funcName() {
    return this._funcName
  }
  set funcName(v: string | undefined) {
    this._funcName = v
  }
  get label() {
    return this._label
  }
  set label(v: string | undefined) {
    this._label = v
  }
  get breakable() {
    return this._breakable
  }
  set breakable(v: boolean | undefined) {
    this._breakable = v
  }

  static newFunc(funcName: string, func: FuncNode) {
    return new Block('func', new Map(), funcName, func, void 0, void 0)
  }

  static newCompound(label: string, breakable: boolean) {
    return new Block('compound', new Map(), void 0, void 0, label, breakable)
  }

  private constructor(
    type: BlockType,
    vars: Map<string, VarNode>,
    funcName: string | undefined,
    func: FuncNode | undefined,
    label: string | undefined,
    breakable: boolean | undefined
  ) {
    this._type = type
    this._vars = vars
    this._func = func
    this._funcName = funcName
    this._label = label
    this._breakable = breakable
  }
}

/**
 * 语法树结点
 */
export class ASTNode {
  private _name: string // 节点名
  private _type: 'token' | 'nonterminal' // 节点类型：Token（终结符）节点 / 非终结符节点
  private _literal: string // 字面量，非终结符的字面量没有意义
  private _children: ASTNode[] // 子节点

  get name() {
    return this._name
  }
  set name(val: string) {
    this._name = val
  }
  get type() {
    return this._type
  }
  set type(val: 'token' | 'nonterminal') {
    this._type = val
  }
  get literal() {
    return this._literal
  }
  set literal(val: string) {
    this._literal = val
  }
  get children() {
    return this._children
  }
  set children(val: ASTNode[]) {
    this._children = Array.from(val)
  }

  constructor(name: string, type: 'token' | 'nonterminal', literal: string) {
    this._name = name
    this._type = type
    this._literal = literal
    this._children = []
  }

  addChild(node: ASTNode) {
    this._children.push(node)
  }

  fit(rhs: string) {
    const seq = rhs.trim().split(' ')
    if (seq.length == this._children.length)
      for (let i = 0; i < seq.length; i++) if (seq[i] != this._children[i]._name) return false
    return true
  }
}

/**
 * .y语义动作执行中用到的创建非终结符的ASTNode的方法
 */
export function $newNode(name: string, ...args: SymbolStackElement[]) {
  const node = new ASTNode(name, 'nonterminal', name)
  const argNodes: ASTNode[] = args.map(v => v.node)
  let element: SymbolStackElement = { type: 'nonterminal', name, node }
  argNodes.forEach(_node => node.addChild(_node))
  return element
}

/**
 * 可视化AST
 */
export function visualizeAST(astRoot: ASTNode, viewNow = true) {
  let dumpObject: {
    nodes: {
      key: string
      label: string
      color: string
    }[]
    edges: {
      source: string
      target: string
      name: string
      label: string
    }[]
  } = { nodes: [], edges: [] }

  // 树转图
  const allNodes: ASTNode[] = []
  const allLinks: { from: number; to: number }[] = []
  ;(function dfs1(root: ASTNode) {
    allNodes.push(root)
    root.children.forEach(dfs1)
  })(astRoot)
  ;(function dfs2(root: ASTNode) {
    root.children.forEach(child => {
      allLinks.push({ from: allNodes.indexOf(root), to: allNodes.indexOf(child) })
    })
    root.children.forEach(dfs2)
  })(astRoot)

  // 建点
  for (let i = 0; i < allNodes.length; i++) {
    dumpObject.nodes.push({
      key: String(i),
      label: `[type] ${allNodes[i].type}\n[name] ${allNodes[i].name}\n[literal] ${allNodes[i].literal}`,
      color: '#FFFFFF',
    })
  }

  // 建边
  for (let link of allLinks) {
    dumpObject.edges.push({
      source: String(link.from),
      target: String(link.to),
      name: `${link.from}_${link.to}`,
      label: '',
    })
  }

  // 计算布局并导出
  let dagreJSON = JSON.stringify(dumpObject, null, 2)
  const VisualizerPath = path.join(__dirname, './ASTVisualizer')
  const shape = 'rect'
  fs.writeFileSync(
    path.join(VisualizerPath, './data.js'),
    `window._seulexyacc_shape = '${shape}'; var data = ${dagreJSON}`
  )
  // 启动浏览器显示
  viewNow && childProcess.exec(`start ${path.join(VisualizerPath, './index.html')} `)
}
