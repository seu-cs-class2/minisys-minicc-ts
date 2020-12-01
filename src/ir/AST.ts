/**
 * 语法树相关
 * 
 * 2020-11 @ https://github.com/seu-cs-class2/minisys-minicc-ts
 */

import * as path from 'path'
import * as fs from 'fs'
import * as childProcess from 'child_process'
import { SymbolStackElement } from '../parser/ParseLR1'

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
