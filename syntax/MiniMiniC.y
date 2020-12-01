%{
  // 测试用
%}

%token COMMENT BREAK CONTINUE DO ELSE
%token FOR IF INT RETURN VOID WHILE IDENTIFIER
%token CONSTANT RIGHT_OP LEFT_OP AND_OP OR_OP LE_OP GE_OP EQ_OP NE_OP
%token SEMICOLON LBRACE RBRACE COMMA COLON ASSIGN LPAREN RPAREN
%token LBRACKET RBRACKET DOT BITAND_OP NOT_OP BITINV_OP MINUS PLUS MULTIPLY SLASH PERCENT
%token LT_OP GT_OP BITXOR_OP BITOR_OP DOLLAR _WHITESPACE

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
	: fun_decl { $$ = newNode('decl', $1); }
	;

type_spec
	: VOID { $$ = newNode('type_spec', $1); }
	| INT { $$ = newNode('type_spec', $1); }
	;

fun_decl
	: type_spec IDENTIFIER LPAREN params RPAREN LBRACE local_decls stmt_list RBRACE { $$ = newNode('fun_decl', $1, $2, $4, $7, $8); }
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
	;

expr_stmt
	: IDENTIFIER ASSIGN expr SEMICOLON { $$ = newNode('expr_stmt', $1, $2, $3); }
	| IDENTIFIER LPAREN args RPAREN SEMICOLON { $$ = newNode('expr_stmt', $1, $3); }
	;

local_decls
	: local_decls local_decl { $$ = newNode('local_decls', $1, $2); }
	| local_decl { $$ = newNode('local_decls', $1); }
	;

local_decl
	: type_spec IDENTIFIER SEMICOLON { $$ = newNode('local_decl', $1, $2); }
	;

return_stmt
	: RETURN expr SEMICOLON { $$ = newNode('return_stmt', $2); }
	;

expr
	: IDENTIFIER { $$ = newNode('expr', $1); }
	| CONSTANT { $$ = newNode('expr', $1); }
	;

args
	: args COMMA expr { $$ = newNode('args', $1, $3); }
	| expr { $$ = newNode('args', $1); }
	;

%%

// nothing
