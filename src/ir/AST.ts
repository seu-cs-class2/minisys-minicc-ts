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

  constructor(name: string, type: string) {
    this._name = name
    this._type = type
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
export class Block {
  private _funcName: string
  private _func?: FuncNode
  private _forFunc: boolean
  private _vars: Map<string, VarNode>
  private _labelName: string
  private _breakable: boolean

  get func() {
    return this._func
  }
  set func(v: FuncNode | undefined) {
    this._func = v
  }
  get funcName() {
    return this._funcName
  }
  set funcName(v: string) {
    this._funcName = v
  }
  get forFunc() {
    return this._forFunc
  }
  set forFunc(v: boolean) {
    this._forFunc = v
  }
  get vars() {
    return this._vars
  }
  get labelName() {
    return this._labelName
  }
  set labelName(v: string) {
    this._labelName = v
  }
  get breakable() {
    return this._breakable
  }
  set breakable(v: boolean) {
    this._breakable = v
  }

  constructor(
    funcName: string,
    forFunc: boolean,
    func: FuncNode | undefined,
    vars: Map<string, VarNode>,
    labelName: string,
    breakable: boolean
  ) {
    this._funcName = funcName
    this._func = func
    this._forFunc = forFunc
    this._vars = vars
    this._labelName = labelName
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
