// 中间代码生成样例

import { lexSourceCode } from '../lexer/Lex'
import { DFA } from '../seu-lex-yacc/seulex/DFA'
import { ASTNode, visualizeAST } from './AST'
import { LALRAnalyzer } from '../seu-lex-yacc/seuyacc/LALR'
import { parseTokensLALR } from '../parser/ParseLALR'
import { IRGenerator } from './IRGenerator'
import fs from 'fs'
import path from 'path'

// 测试代码
const CCode = fs
  .readFileSync(path.join(__dirname, './Example.c'))
  .toString()
  .replace(/\r\n/g, '\n')
  .split('\n')
  .slice(3)
  .join('\n')

const lexDFA = DFA.fromFile(path.join(__dirname, '../../syntax/MiniC/MiniC-Lex.json'))
let tokens = lexSourceCode(CCode, lexDFA)

const lalr = LALRAnalyzer.load(path.join(__dirname, '../../syntax/MiniC/MiniC-LALRParse.json'))
const root = parseTokensLALR(tokens, lalr) as ASTNode

const ir = new IRGenerator(root)
console.log(ir.toIRString())
fs.writeFileSync(path.join(__dirname, './Example.ir'), ir.toIRString())
