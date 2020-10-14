import { assert } from '../utils'
import { DFA } from './DFA'
import { SpAlpha } from './FA'

export interface Token {
  type: string
  literal: string
}

export function lexSourceCode(code: string, dfa: DFA) {
  assert(dfa.startStates.length === 1, 'Too many DFA start states.')
  code = code.replace(/\r\n/g, '\n')

  // 生成自带的变量
  const initState = dfa.states.indexOf(dfa.startStates[0])
  let yylineno = 1, // 行号
    yytext = '', // 本轮最终匹配的字符串
    curBuf: string = '', // 当前匹配的字符串
    curChar: string = '', // 当前字符
    curPtr: number = 0, // 当前指针位置
    curState = initState, // 当前状态
    latAccState = -1, // 最近接收状态
    latAccPtr: number = -1 // 最近接收指针位置
  let tokens: Token[] = []

  // 生成状态转移矩阵
  function genTransformMatrix() {
    let transformMatrix = []
    for (let i = 0; i < dfa.transformAdjList.length; i++) {
      let targets = Array(128).fill(-1) // -1表示没有此转移
      let othersTarget = -1 // 仍未设置转移的字符应转移到的状态
      for (let transform of dfa.transformAdjList[i]) {
        if (transform.alpha == SpAlpha.OTHER || transform.alpha == SpAlpha.ANY)
          othersTarget = transform.target
        else targets[dfa.alphabet[transform.alpha].charCodeAt(0)] = transform.target
      }
      if (othersTarget != -1)
        for (let alpha in targets) if (targets[alpha] == -1) targets[alpha] = othersTarget
      transformMatrix.push(JSON.parse(JSON.stringify(targets)))
    }
    return transformMatrix
  }
  let transMat = genTransformMatrix()

  // 生成接收态列表
  function genAccs() {
    let accs = []
    for (let i = 0; i < dfa.states.length; i++)
      if (dfa.acceptStates.includes(dfa.states[i])) accs.push(i)
      else accs.push(-1)
    return accs
  }
  let accs = genAccs()

  function getTokenName(action: string) {
    action = action
      .replace(/\s+/g, '')
      .replace('return', '')
      .replace(/[\(\)]/g, '')
    return action
  }

  // yylex
  // @returns 0-到达代码尾部 1-尚未到达代码尾部
  function yylex() {
    let rollbackLines = 0
    if (curPtr === code.length) return 0
    // 将当前串尽可能长地送入DFA进行识别
    while (curState != -1) {
      curChar = code[curPtr++]
      // 更新行号
      if (curChar === '\n') yylineno++, rollbackLines++
      curBuf += curChar
      // 进行状态转移
      curState = transMat[curState][curChar.charCodeAt(0)]
      // 实现最长匹配要求，到达接收态时先暂存
      if (accs[curState] !== -1) {
        latAccState = curState
        latAccPtr = curPtr - 1
        rollbackLines = 0
      }
    }
    // 当前为最长匹配后的结果，保存token
    if (latAccState != -1) {
      yylineno -= rollbackLines
      curPtr = latAccPtr
      curState = 0
      yytext = ''

      let action = dfa.acceptActionMap.get(dfa.states[latAccState])?.code
      tokens.push({ action, yytext })

      latAccState = -1
      latAccPtr = 0
    } else {
      throw new Error(`串识别失败，最后的指针位置：${curPtr}，行号：${yylineno}`)
    }
    return 0
  }

  while (yylex() != -1);

  return tokens
}
