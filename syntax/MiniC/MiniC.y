%{
  // 本语法定义文件基于“计算机系统综合课程设计”补充讲义121定义
%}

%token BREAK CONTINUE
%token IF INT RETURN VOID WHILE IDENTIFIER
%token CONSTANT RIGHT_OP LEFT_OP AND_OP OR_OP LE_OP GE_OP EQ_OP NE_OP
%token SEMICOLON LBRACE RBRACE COMMA COLON ASSIGN LPAREN RPAREN
%token LBRACKET RBRACKET DOT BITAND_OP NOT_OP BITINV_OP MINUS PLUS MULTIPLY SLASH PERCENT
%token LT_OP GT_OP BITXOR_OP BITOR_OP DOLLAR STRING STRING_LITERAL

%left OR_OP
%left AND_OP
%left EQ_OP NE_OP LE_OP GE_OP LT_OP GT_OP
%left PLUS MINUS
%left BITOR_OP
%left BITAND_OP BITXOR_OP
%left MULTIPLY SLASH PERCENT

%right LEFT_OP RIGHT_OP
%right NOT_OP
%right BITINV_OP

%start program
%%

program
	: decl_list	{ $$ = newNode('program', $1); }
	;

decl_list
	: decl_list decl { $$ = newNode('decl_list', $1, $2); }
	| decl 	{ $$ = newNode('decl_list', $1); }
	;

decl
	: var_decl { $$ = newNode('decl', $1); }
	| fun_decl { $$ = newNode('decl', $1); }
	;

var_decl
	: type_spec IDENTIFIER SEMICOLON { $$ = newNode('var_decl', $1, $2); }
	| type_spec IDENTIFIER LBRACKET CONSTANT RBRACKET SEMICOLON { $$ = newNode('var_decl', $1, $2, $4); }
	;

type_spec
	: VOID { $$ = newNode('type_spec', $1); }
	| INT { $$ = newNode('type_spec', $1); }
	| STRING { $$ = newNode('type_spec', $1); }
	;

fun_decl
	: type_spec IDENTIFIER LPAREN params RPAREN LBRACE local_decls stmt_list RBRACE { $$ = newNode('fun_decl', $1, $2, $4, $7, $8); }
	| type_spec IDENTIFIER LPAREN params RPAREN LBRACE stmt_list RBRACE { $$ = newNode('fun_decl', $1, $2, $4, $7); }
	;

params
	: param_list { $$ = newNode('params', $1); }
	| VOID { $$ = newNode('params', $1); }
	;

param_list
	: param_list COMMA param { $$ = newNode('param_list', $1, $3); }
	| param { $$ = newNode('param_list', $1); }
	;

param
	: type_spec IDENTIFIER { $$ = newNode('param', $1, $2); }
	;

stmt_list
	: stmt_list stmt { $$ = newNode('stmt_list', $1, $2); }
	| stmt { $$ = newNode('stmt_list', $1); }
	;

stmt
	: expr_stmt { $$ = newNode('stmt', $1); }
	| compound_stmt { $$ = newNode('stmt', $1); }
	| if_stmt { $$ = newNode('stmt', $1); }
	| while_stmt { $$ = newNode('stmt', $1); }
	| return_stmt { $$ = newNode('stmt', $1); }
	| continue_stmt { $$ = newNode('stmt', $1); }
	| break_stmt { $$ = newNode('stmt', $1); }
	;

compound_stmt
	: LBRACE local_decls stmt_list RBRACE { $$ = newNode('compound_stmt', $2, $3); }
	| LBRACE stmt_list RBRACE { $$ = newNode('compound_stmt', $2); }
	;

if_stmt
	: IF LPAREN expr RPAREN stmt { $$ = newNode('if_stmt', $3, $5); }
	;

while_stmt
	: WHILE LPAREN expr RPAREN stmt { $$ = newNode('while_stmt', $3, $5); }
	;

continue_stmt
	: CONTINUE SEMICOLON { $$ = newNode('continue_stmt'); }
	;

break_stmt
	: BREAK SEMICOLON { $$ = newNode('break_stmt'); }
	;

expr_stmt
	: IDENTIFIER ASSIGN expr SEMICOLON { $$ = newNode('expr_stmt', $1, $2, $3); }
	| IDENTIFIER LBRACKET expr RBRACKET ASSIGN expr SEMICOLON { $$ = newNode('expr_stmt', $1, $3, $5, $6); }
	| DOLLAR expr ASSIGN expr SEMICOLON { $$ = newNode('expr_stmt', $1, $2, $3, $4); }
	| IDENTIFIER LPAREN args RPAREN SEMICOLON { $$ = newNode('expr_stmt', $1, $3); }
	| IDENTIFIER LPAREN RPAREN SEMICOLON { $$ = newNode('expr_stmt', $1, $2, $3); }
	;

local_decls
	: local_decls local_decl { $$ = newNode('local_decls', $1, $2); }
	| local_decl { $$ = newNode('local_decls', $1); }
	;

local_decl
	: type_spec IDENTIFIER SEMICOLON { $$ = newNode('local_decl', $1, $2); }
	| type_spec IDENTIFIER LBRACKET CONSTANT RBRACKET SEMICOLON { $$ = newNode('local_decl', $1, $2, $4); }
	;

return_stmt
	: RETURN SEMICOLON { $$ = newNode('return_stmt'); }
	| RETURN expr SEMICOLON { $$ = newNode('return_stmt', $2); }
	;

expr
	: expr OR_OP expr { $$ = newNode('expr', $1, $2, $3); }
	| expr AND_OP expr { $$ = newNode('expr', $1, $2, $3); }
	| expr EQ_OP expr { $$ = newNode('expr', $1, $2, $3); }
	| expr NE_OP expr { $$ = newNode('expr', $1, $2, $3); }
	| expr GT_OP expr { $$ = newNode('expr', $1, $2, $3); }
	| expr LT_OP expr { $$ = newNode('expr', $1, $2, $3); }
	| expr GE_OP expr { $$ = newNode('expr', $1, $2, $3); }
	| expr LE_OP expr { $$ = newNode('expr', $1, $2, $3); }
	| expr PLUS expr  { $$ = newNode('expr', $1, $2, $3); }
	| expr MINUS expr { $$ = newNode('expr', $1, $2, $3); }
	| expr MULTIPLY expr { $$ = newNode('expr', $1, $2, $3); }
	| expr SLASH expr { $$ = newNode('expr', $1, $2, $3); }
	| expr PERCENT expr { $$ = newNode('expr', $1, $2, $3); }
	| NOT_OP expr { $$ = newNode('expr', $1, $2); }
	| MINUS expr { $$ = newNode('expr', $1, $2); }
	| PLUS expr { $$ = newNode('expr', $1, $2); }
	| DOLLAR expr { $$ = newNode('expr', $1, $2); }
	| LPAREN expr RPAREN { $$ = newNode('expr', $1, $2, $3); }
	| IDENTIFIER { $$ = newNode('expr', $1); }
	| IDENTIFIER LBRACKET expr RBRACKET { $$ = newNode('expr', $1, $3); }
	| IDENTIFIER LPAREN args RPAREN { $$ = newNode('expr', $1, $3); }
	| IDENTIFIER LPAREN RPAREN { $$ = newNode('expr', $1, $2, $3); }
	| CONSTANT { $$ = newNode('expr', $1); }
	| STRING_LITERAL { $$ = newNode('expr', $1); }
	| expr BITAND_OP expr { $$ = newNode('expr', $1, $2, $3); }
	| expr BITXOR_OP expr { $$ = newNode('expr', $1, $2, $3); }
	| BITINV_OP expr { $$ = newNode('expr', $1, $2); }
	| expr LEFT_OP expr { $$ = newNode('expr', $1, $2, $3); }
	| expr RIGHT_OP expr { $$ = newNode('expr', $1, $2, $3); }
	| expr BITOR_OP expr { $$ = newNode('expr', $1, $2, $3); }
	;

args
	: args COMMA expr { $$ = newNode('args', $1, $3); }
	| expr { $$ = newNode('args', $1); }
	;

%%

// nothing
