<p align="center">
  <img src="https://github.com/z0gSh1u/seu-lex-yacc/raw/master/doc/LogoWithText.png">
</p>

SEU-LEX-YACC 是东南大学计算机学院的《编译原理课程设计》，主要包括 seulex 和 seuyacc 两部分。

*最初版代码请查看：https://github.com/z0gSh1u/seu-lex-yacc*

## 改造

为了在 minisys-minicc-ts 中应用自己的 Lex 和 Yacc，我们进行了如下改造：

- 删去了 SEU-LEX-YACC 中不在 Minisys 课程设计组中的合作者贡献的部分，避免原创性问题
- 不再生成词法分析器、语法分析器的 C 代码，所有分析过程都将直接在 TypeScript 下完成
- 补充从 LR0 构造 LALR 的方法（LALR 分析表的高效构造法），以适应大规模文法分析表的快速构造

## 设计简介

为了让新同学能更快上手，下面简要介绍 SEU-LEX-YACC 的一些设计：

*实验报告也是不错的参考资料：https://github.com/z0gSh1u/seu-lex-yacc/tree/master/doc*

### seulex

- seulex 支持下列 lex 特性：
  - 正则表达式五大元符号：`? + * | . `（0或1次，1次或以上，0次或以上，或，任意字符）
  - 正则表达式范围与范围补：`[A-Za-z0-9_] [^"]`
  - 正则别名定义
  - 正则定义时，引号内保留原样
  - 可以使用范围型转义字符\d（`[0-9]`）和\s（`[ \t\r\n]`）
  - 最长匹配原则，即使用当前位置能匹配最长串的正则。如果有等长的情况，越早出现的正则优先级越高

- LexParser.ts

  将解析 .l 文件，主要读出了正则-动作代码部分，向上层返回 `_regexActionMap: Map<Regex, Action>`。鉴于我们对 seulex 的改造，.l 文件有如下变化：

  - 与 C 代码有关的部分将全部被忽略
  - 动作代码必须形如 `return(TOKEN_NAME);` ；Token 的字面值会被自动处理，无需保存 yytext

- FA.ts

  定义了自动机的表示方式：

  - 字母表 `_alphabet: string[]` 表示 FA 中涉及的所有字母

  - 状态数组 `_states: State[]` 表示 FA 中涉及的所有状态

  - 邻接链表 `_transformAdjList: Transform[][]` 表示 FA 中边的连接状态。例如，`_transformAdjList[i]` 表示下标为 i 的状态的所有出边，其中每个元素是 `Transform` 类型

  - `Transform` 的定义如下：

    ```ts
    type Transform = {
      alpha: number // 边上的字母在_alphabets中的下标
      target: number // 目标状态在_states中的下标
    }
    ```

  - 一些特殊字母的下标可见 `enum SpAlpha`：

    ```ts
    enum SpAlpha {
      EPSILON = -1, // ε
      // ANY边和OTHER边是seulex的设计亮点，不必深究，具体可见课设报告
      ANY = -2,
      OTHER = -3,
    }
    ```

- NFA.ts

  非确定有限状态自动机相关逻辑。核心方法是 `static fromLexParser(lexParser: LexParser)`，即从 LexParser 构造 NFA。

- DFA.ts

  确定有限状态自动机相关逻辑。核心方法是 `static fromNFA(nfa: NFA)`，即从 NFA 构造 DFA。注意，该 DFA 不会被最小化。

  拥有 DFA 后，我们就能进行可靠的词法分析了。

- Visualizer.ts

  可视化展示 FA。

### seuyacc

- YaccParser.ts

  将解析 .y 文件，主要读出了正则-动作代码部分，向上层返回文字形式表示的 Token 定义、运算符定义、产生式定义、非终结符定义、开始符号定义。鉴于我们对 seuyacc 的改造，.y 文件有如下变化：

  - 与 C 代码有关的部分将全部被忽略
  - 产生式、运算符中只能使用 Token 名形式的终结符，不可以使用单引号引起的符号
  - 动作代码的执行逻辑需要自己在 TypeScript 中处理，因此动作代码实际上是 TypeScript 代码

- Grammar.ts

  语法相关定义。我们按照下面的分层架构设计了 seuyacc：

  - Analyzer 将会对 YaccParser 送来的信息进行处理、编号，从而填充 `_symbols: GrammarSymbol[]` ，这个数组里包含了所有的文法符号（Token、特殊 Token、非终结符）

  - 产生式 Producer 会被转换成 `数字 → 数字[]` 的形式，其中的数字是对应符号在 `_symbols` 数组中的下标
  - 项目 Item 指的是产生式 + 点号位置的组合。对于有多个展望符的 Item，会被 unwind 成单独的一个个 Item，即使它们的产生式是一样的
  - 状态 State 是一系列项目的集合，也就是我们看到的 GOTO 图上的一个小方格
  - DFA 是一系列状态 + 连接边的集合，也就是我们看到的 GOTO 图，其中连接边的表示法与 seulex 中一致
  - 运算符 Operator 存储了 .y 文件中定义了结合性的运算符

- LR1.ts

  构造 LR1 DFA 和分析表，在构造函数中传入 YaccParser 即可。这种方法的效率很低。

- LR0.ts

  构造 LR0 DFA。主要目的是支持 LR0 到 LALR 的快速构造法。

- LALR.ts **[WIP]**

  从 LR0 DFA 构造 LALR DFA 和分析表。这种方法的效率更高。此处代码仍在调试中。

- Visualizer.ts

  可视化展示 GOTO 图或 ACTION-GOTO 表。

 