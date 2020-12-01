// 清理以准备构建

'use strict'

const fs = require('fs')
const path = require('path')
function rmRf(_path) {
  let files = fs.readdirSync(_path)
  files.forEach(file => {
    let filePath = path.join(_path, file)
    if (fs.statSync(filePath).isDirectory()) {
      rmRf(filePath)
    } else {
      fs.unlinkSync(filePath)
    }
  })
  fs.rmdirSync(_path)
}

// dist/
const DIST_PATH = path.join(__dirname, '../dist')
rmRf(DIST_PATH)
fs.mkdirSync(DIST_PATH)

// data.js
fs.writeFileSync(path.join(__dirname, '../src/seu-lex-yacc/enhance/FAVisualizer/data.js'), '')
fs.writeFileSync(path.join(__dirname, '../src/seu-lex-yacc/enhance/TableVisualizer/data.js'), '')
fs.writeFileSync(path.join(__dirname, '../src/ir/ASTVisualizer/data.js'), '')

console.log('Clean task finished.')
