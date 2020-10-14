import { assert } from '../../utils'
import { DFA } from './DFA'
import { SpAlpha } from './FA'
import { LexParser } from './LexParser'

export function lexit(code: string, lexParser: LexParser, dfa: DFA) {
  assert(dfa.startStates.length === 1, 'Too many DFA start states.')

  let yylineno = 1
  let yyleng = 0
  let yytext
  let curBuf = ''
  let curChar: string
  let curPtr: number
  const initState = dfa.states.indexOf(dfa.startStates[0])
  let curState = initState
  let latAccState = -1
  let latAccPtr: number

  let tokens: any[] = []

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

  function genAccs() {
    let accs = []
    for (let i = 0; i < dfa.states.length; i++)
      if (dfa.acceptStates.includes(dfa.states[i])) accs.push(i)
      else accs.push(-1)
    return accs
  }
  let accs = genAccs()

  function yylex() {
    let rollbackLines = 0
    if (curPtr === code.length) {
      return -1
    }
    while (curState != -1) {
      curChar = code[curPtr]
      curPtr += 1
      if (curChar === '\n') yylineno++, rollbackLines++
      curBuf += curChar
      curState = transMat[curState][curChar.charCodeAt(0)]
      if (accs[curState] !== -1) {
        latAccState = curState
        latAccPtr = curPtr - 1
        rollbackLines = 0
      }
    }
    if (latAccState != -1) {
      yylineno -= rollbackLines
      curPtr = latAccPtr
      curState = 0
      curBuf = ''
      yyleng = 0
      yytext = ''

      let action = dfa.acceptActionMap.get(dfa.states[latAccState])?.code
      tokens.push({ action, yytext })

      latAccState = -1
      latAccPtr = 0
    }
    return 0
  }

  while (yylex() != -1);

  return tokens
}
