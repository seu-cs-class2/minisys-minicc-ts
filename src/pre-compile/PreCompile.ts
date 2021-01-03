/**
 * 预编译器
 * 2021-01 @ https://github.com/seu-cs-class2/minisys-minicc-ts
 */

import * as fs from 'fs'
import * as path from 'path'
import { assert } from '../seu-lex-yacc/utils'

/**
 * 预编译
 *  - 处理include
 */
export function preCompile(sourceCode: string, basePath: string) {
  let lines = sourceCode
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map(v => v.trim())

  const patches = []

  const IncludePattern = /^#include\s+"(.*?)"$/
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim() && !lines[i].startsWith('//') && !lines[i].match(new RegExp(IncludePattern))) break // 结束
    if (!lines[i].trim() || lines[i].startsWith('//')) continue
    // 解析路径
    const relativePath = lines[i].match(new RegExp(IncludePattern))![1]
    const absolutePath = path.resolve(basePath, relativePath)
    // 读取文件
    assert(fs.existsSync(absolutePath), `找不到被include的文件：${relativePath}`)
    const fstat = fs.statSync(absolutePath)
    assert(fstat.isFile(), `找不到被include的文件：${relativePath}`)
    const fcontent = fs.readFileSync(absolutePath).toString().replace(/\r\n/g, '\n').split('\n')
    // 记录
    patches.push({ line: i, relativePath, content: fcontent })
  }

  // 应用
  let bias = 0
  for (let patch of patches) {
    lines.splice(
      patch.line + bias,
      1,
      ...[
        `// ****** ${patch.relativePath} ****** //`,
        ...patch.content,
        `// ****** ${patch.relativePath} ****** //`,
      ]
    )
    bias += patch.content.length + 2
  }

  return lines.join('\n')
}
