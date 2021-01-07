# 中间代码四元式约定

| op                                                           | arg1  | arg2  | res   | 说明                                     |
| ------------------------------------------------------------ | ----- | ----- | ----- | ---------------------------------------- |
| set_label                                                    | -     | -     | label | 放置标号 label                           |
| j_false                                                      | expr  | -     | label | if (!expr) goto label                    |
| j                                                            | -     | -     | label | goto label                               |
| =var                                                         | rhs   | -     | lhs   | 将**变量** rhs 赋值给 lhs                |
| =const                                                       | rhs   | -     | lhs   | 将**字面常量** rhs 赋值给 lhs            |
| =[]                                                          | index | rhs   | arr   | 写数组， arr[index]  = rhs               |
| []                                                           | arr   | index | res   | 读数组，res = arr[index]                 |
| =$                                                           | addr  | rhs   | -  | 向端口地址 addr 送 rhs                   |
| call                                                         | id    | args  | -     | 调用函数 id，参数是一系列变量组成的 args |
| return_void                                                  | -     | -     | label | 无返回值，返回到 label 位置              |
| return_expr                                                  | expr  | -     | label | 有返回值 expr，返回到 label 位置         |
| OR_OP, AND_OP, EQ_OP, NE_OP, GT_OP, LT_OP, <br>GE_OP, LE_OP, PLUS, MINUS, MULTIPLY, SLASH, <br/>PERCENT, BITAND_OP, BITOR_OP, LEFT_OP, <br/>RIGHT_OP, BITXOR_OP | op1   | op2   | res   | 二元表达式，res = op1 op op2             |
| NOT_OP, MINUS, PLUS, DOLLAR, BITINV_OP                       | op1   | -     | res   | 一元表达式，res = op op1                 |


