%{
  // 本文法仅用于测试从LR0构造LALR的正确性
  // 与龙书上算例一致
%}

%token EQ STAR ID

%start s

%%

s
  : l EQ r
  | r
  ;

l
  : STAR r
  | ID
  ;

r
  : l
  ;

%%

// nothing
