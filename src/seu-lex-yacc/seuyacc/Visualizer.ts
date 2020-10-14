/**
 * 可视化工具
 * 2020-05 @ https://github.com/z0gSh1u/seu-lex-yacc
 */

import fs from 'fs'
import path from 'path'
import * as childProcess from 'child_process'
import { LR1DFA } from './Grammar'
import { LR1Analyzer } from './LR1'

/**
 * 可视化LR1分析表（ACTIONGOTOTable）
 */
export function visualizeACTIONGOTOTable(lr1Analyzer: LR1Analyzer, viewNow = true) {
  let ACTIONHead = []
  for (let i of lr1Analyzer.ACTIONReverseLookup) ACTIONHead.push(lr1Analyzer.getSymbolString(i))
  let GOTOHead = []
  for (let i of lr1Analyzer.GOTOReverseLookup) GOTOHead.push(lr1Analyzer.getSymbolString(i))
  let colUsage = Array(ACTIONHead.length).fill(0)
  let ACTIONTable = []
  for (let i = 0; i < lr1Analyzer.ACTIONTable.length; i++) {
    let row = []
    for (let j = 0; j < lr1Analyzer.ACTIONTable[i].length; j++) {
      const cell = lr1Analyzer.ACTIONTable[i][j]
      switch (cell.type) {
        case 'acc':
          row.push('acc')
          colUsage[j] = 1
          break
        case 'none':
          row.push('')
          break
        case 'reduce':
          row.push(`r(${lr1Analyzer.formatPrintProducer(lr1Analyzer.producers[cell.data]).trim()})`)
          colUsage[j] = 1
          break
        case 'shift':
          row.push(`s${cell.data}`)
          colUsage[j] = 1
          break
      }
    }
    ACTIONTable.push(row)
  }
  let GOTOTable = []
  for (let i = 0; i < lr1Analyzer.GOTOTable.length; i++) {
    let row = []
    for (let cell of lr1Analyzer.GOTOTable[i]) row.push(cell === -1 ? '' : cell)
    GOTOTable.push(row)
  }
  // 去除ACTIONTable的空列
  for (let col = colUsage.length - 1; col >= 0; col--) {
    if (colUsage[col] == 0) {
      ACTIONHead.splice(col, 1)
      for (let row = 0; row < ACTIONTable.length; row++) ACTIONTable[row].splice(col, 1)
    }
  }
  const dumpObject = { ACTIONHead, GOTOHead, ACTIONTable, GOTOTable }
  const dumpJSON = JSON.stringify(dumpObject, null, 2)
  const VisualizerPath = path.join(__dirname, '../../../enhance/TableVisualizer')
  fs.writeFileSync(path.join(VisualizerPath, './data.js'), `window._seulex_data = ${dumpJSON}`)
  // 启动浏览器显示
  viewNow && childProcess.exec(`start ${path.join(VisualizerPath, './index.html')} `)
}

/**
 * 可视化GOTO图（LR1DFA）
 */
export function visualizeGOTOGraph(lr1dfa: LR1DFA, lr1Analyzer: LR1Analyzer, viewNow = true) {
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
  // 设置点（项目集）
  for (let i = 0; i < lr1dfa.states.length; i++) {
    let topPart = `I${i}\n=======\n`,
      stateLines = [],
      kernelItem = true
    for (let item of lr1dfa.states[i].items) {
      let leftPart = ''
      leftPart += lr1Analyzer.symbols[item.rawProducer.lhs].content
      leftPart += ' -> '
      let j = 0
      for (; j < item.rawProducer.rhs.length; j++) {
        if (j == item.dotPosition) leftPart += '●'
        leftPart += lr1Analyzer.getSymbolString(item.rawProducer.rhs[j]) + ' '
      }
      if (j == item.dotPosition) leftPart = leftPart.substring(0, leftPart.length - 1) + '●'
      leftPart += ' § '
      let lookahead = lr1Analyzer.getSymbolString(item.lookahead)
      let sameLeftPos = stateLines.findIndex(x => x.leftPart == leftPart)
      if (sameLeftPos !== -1) {
        stateLines[sameLeftPos].lookahead += '/' + lookahead
      } else {
        stateLines.push({ leftPart, lookahead })
      }
      if (kernelItem) {
        leftPart = '-------\n'
        lookahead = ''
        stateLines.push({ leftPart, lookahead })
        kernelItem = false
      }
    }
    let stateString = topPart
    stateLines.forEach(v => {
      stateString += v.leftPart + v.lookahead + '\n'
    })
    dumpObject.nodes.push({ key: `K${i}`, label: stateString.trim(), color: '#FFFFFF' })
  }
  // 设置边（迁移）
  for (let i = 0; i < lr1dfa.states.length; i++) {
    lr1dfa.adjList[i].forEach(x => {
      dumpObject.edges.push({
        source: `K${i}`,
        target: `K${x.to}`,
        name: `K${i}_${x.to}`,
        label: lr1Analyzer.symbols[x.alpha].content,
      })
    })
  }
  let dagreJSON = JSON.stringify(dumpObject, null, 2)
  const VisualizerPath = path.join(__dirname, '../../../enhance/FAVisualizer')
  const shape = 'rect'
  fs.writeFileSync(
    path.join(VisualizerPath, './data.js'),
    `window._seulex_shape = '${shape}'; let data = ${dagreJSON}`
  )
  // 启动浏览器显示
  viewNow && childProcess.exec(`start ${path.join(VisualizerPath, './index.html')} `)
}
