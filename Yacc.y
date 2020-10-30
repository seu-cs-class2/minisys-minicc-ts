%{
  // for lr0->lalr test
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
