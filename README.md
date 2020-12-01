# *minisys*-minicc-ts

## 开始

- 安装

  ```bash
  $ git clone git@github.com:seu-cs-class2/minisys-minicc-ts.git
  $ cd minisys-minicc-ts
  $ npm install
  ```

- 增量编译监视开发

  ```bash
  $ npm run tsc:watch
  ```

- 构建

  ```bash
  $ npm run build
  ```

## 进度

- 词法分析

  - [x] 改造 seulex，在 TypeScript 内完成词法分析

  - [x] DFA 序列化功能

- 语法分析

  - [x] 改造 seuyacc，在 TypeScript 内完成语法分析

  - [x] 分析表序列化功能

  - [x] 从 LR0 构造 LALR

  - [x] 动作代码的执行（AST 的构造）

  - [x] AST 可视化

- 中间代码生成

  - [ ] 从 AST 到 IR 的转换

  - [ ] IR 的优化

- 目标代码生成

  - [ ] 从 IR 到 ASM 的转换

  - [ ] ASM 的优化

## 文档

- [SEU-LEX-YACC README](https://github.com/seu-cs-class2/minisys-minicc-ts/blob/master/src/seu-lex-yacc/README.md)