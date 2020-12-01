// 构建过程脚本

const childProcess = require('child_process')
const fs = require('fs')
const path = require('path')
const cpdir = require('copy-dir')

// 清理
childProcess.execSync('npm run clean', { stdio: 'inherit' })

// 建目录
fs.mkdirSync(path.join(__dirname, '../dist/seu-lex-yacc'))
fs.mkdirSync(path.join(__dirname, '../dist/seu-lex-yacc/enhance'))
fs.mkdirSync(path.join(__dirname, '../dist/ir'))
fs.mkdirSync(path.join(__dirname, '../dist/ir/ASTVisualizer'))
cpdir.sync(path.join(__dirname, '../src/seu-lex-yacc/enhance'), path.join(__dirname, '../dist/seu-lex-yacc/enhance'))
cpdir.sync(path.join(__dirname, '../src/ir/ASTVisualizer'), path.join(__dirname, '../dist/ir/ASTVisualizer'))

// 编译
childProcess.execSync('npm run tsc:full', { stdio: 'inherit' })

// 完成
process.stdout.write('Build complete. \n')
