# *minisys*-minicc-ts

这是一个将 [MiniC 语言](https://github.com/seu-cs-class2/minisys-minicc-ts/blob/master/docs/MiniC.md) 编译到 [Minisys 体系](http://www.icourse163.org/course/SEU-1003566002)（类 MIPS）汇编的编译器。包括自己设计的 Lex 和 Yacc 工具、[中间代码](https://github.com/seu-cs-class2/minisys-minicc-ts/blob/master/docs/IR.md)（IR）生成、目标代码生成，以及代码优化相关工作。100% TypeScript。

<p align="center">
  <img src="https://i.loli.net/2020/12/10/luzhMIY7PF65rks.png" />
</p>

## 编译 MiniC 代码

```shell
$ npm install # just once
$ node ./dist/cli.js <path_to_c_code> [options]
```

可用的选项（options）有：

| 参数             | 作用                              |
| ---------------- | --------------------------------- |
| -o <output_path> | 指定输出路径，默认与 C 代码同路径 |
| -i               | 一并输出中间代码                  |
| -v               | 显示编译过程详细信息              |

## 重新生成 MiniC 相关序列化

来自 `syntax/MiniC.l` 的词法分析 DFA 以及 `syntax/MiniC.y` 的 LALR 语法分析表会被序列化保存为 `MiniC-Lex.json` 和 `MiniC-LALRParse.json`。执行下面命令可以重新生成它们：

```shell
$ cd script
$ chmod 755 *
$ ./generate-minic.sh
```

## 参与开发

- 安装

  ```bash
  $ git clone git@github.com:seu-cs-class2/minisys-minicc-ts.git
  $ cd minisys-minicc-ts
  $ npm install
  ```

- 增量监视编译

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

  - [x] 从 AST 到 IR 的转换
  
  - [x] IR 的优化
  
- 目标代码生成

  - [x] 从 IR 到 ASM 的转换
    
  - [x] ASM 的优化

## 文档

- [Minisys 体系结构](http://www.icourse163.org/course/SEU-1003566002)
- [seu-lex-yacc README](https://github.com/seu-cs-class2/minisys-minicc-ts/blob/master/docs/seu-lex-yacc.md)
- [MiniC 语言](https://github.com/seu-cs-class2/minisys-minicc-ts/blob/master/docs/MiniC.md)
- [中间代码约定](https://github.com/seu-cs-class2/minisys-minicc-ts/blob/master/docs/IR.md)
- [运行时设计](https://github.com/seu-cs-class2/minisys-minicc-ts/blob/master/docs/runtime.md)
