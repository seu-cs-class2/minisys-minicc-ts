// 目标代码生成样例

import { lexSourceCode } from '../lexer/Lex'
import { DFA } from '../seu-lex-yacc/seulex/DFA'
import { ASTNode } from '../ir/AST'
import { LALRAnalyzer } from '../seu-lex-yacc/seuyacc/LALR'
import { parseTokensLALR } from '../parser/ParseLALR'
import { IRGenerator } from '../ir/IRGenerator'
import fs from 'fs'
import path from 'path'
import { ASMGenerator } from './ASMGenerator'

// 测试代码
const CCode = `
  int main(void) {
    int a;
    int b;
    a = 10;
    b = 20;
    b = a + b;
    if (a > b) {
      a = a / b - 20;  
    }
  }
`

const lexDFA = DFA.fromFile(path.join(__dirname, '../../syntax/MiniC/MiniC-Lex.json'))
let tokens = lexSourceCode(CCode, lexDFA)

const lalr = LALRAnalyzer.load(path.join(__dirname, '../../syntax/MiniC/MiniC-LALRParse.json'))
const root = parseTokensLALR(tokens, lalr) as ASTNode

const ir = new IRGenerator(root)

const asm = new ASMGenerator(ir)
console.log(asm.toAssembly())
fs.writeFileSync(path.join(__dirname, './Example.asm'), asm.toAssembly())
