%{
	// 本文法为简化的C文法，在此上构造LR1的时间成本是可接受的
%}

%token IDENTIFIER CONSTANT STRING_LITERAL
%token INC_OP EQ_OP NE_OP ASSIGN PLUS MULTIPLY
%token AND_OP OR_OP ADD_ASSIGN LBRACE RBRACE
%token INT FLOAT VOID TRUE FALSE SEMICOLON COMMA LPAREN RPAREN
%token IF RETURN ELSE WHILE

%start program
%%

program
  : declarations { _ASTRoot = newNode('program', $1); }
	;

declarations
  : declaration declarations { $$ = newNode('declarations', $1, $2); }
	| declaration { $$ = newNode('declarations', $1); }
	;

declaration
  : func_declaration { $$ = newNode('declaration', $1); }
	| var_declaration { $$ = newNode('declaration', $1); }
	;

var_declaration
  : type IDENTIFIER SEMICOLON { $$ = newNode('var_declaration', $1, $2); }
	| type assign_expr SEMICOLON { $$ = newNode('var_declaration', $1, $2); }
	;

func_declaration
  : type IDENTIFIER LPAREN parameter_list RPAREN block_stmt { $$ = newNode('func_declaration', $1, $2, $4, $6); }
	| type IDENTIFIER LPAREN RPAREN block_stmt { $$ = newNode('func_declaration', $1, $2, $5); }
	;

parameter_list
  : type IDENTIFIER COMMA parameter_list { $$ = newNode('parameter_list', $1, $2, $4); }
	| type IDENTIFIER { $$ = newNode('parameter_list', $1, $2); }
	;

stmt
  : IF LPAREN logic_expr RPAREN stmt { $$ = newNode('stmt', $1, $3, $5); }
	| IF LPAREN logic_expr RPAREN stmt ELSE stmt { $$ = newNode('stmt', $1, $3, $5, $7); }
	| WHILE LPAREN logic_expr RPAREN stmt { $$ = newNode('stmt', $1, $3, $5); }
	| var_declaration { $$ = newNode('stmt', $1); }
	| assign_expr SEMICOLON { $$ = newNode('stmt', $1); }
	| function_call SEMICOLON { $$ = newNode('stmt', $1); }
	| RETURN arithmetic_expr SEMICOLON { $$ = newNode('stmt', $1, $2); }
	| block_stmt { $$ = newNode('stmt', $1); }
	;

stmts
  : stmt stmts { $$ = newNode('stmts', $1, $2); }
	| stmt { $$ = newNode('stmts', $1); }
	;

block_stmt
  : LBRACE stmts RBRACE { $$ = newNode('block_stmt', $2); }
  | LBRACE RBRACE { $$ = newNode('block_stmt'); }
	;

type
  : INT { $$ = newNode('type', $1); }
	| FLOAT { $$ = newNode('type', $1); }
	;

expr
	: assign_expr { $$ = newNode('expr', $1); }
	| arithmetic_expr { $$ = newNode('expr', $1); }
	| logic_expr { $$ = newNode('expr', $1); }
	;

assign_expr
	: IDENTIFIER ASSIGN arithmetic_expr { $$ = newNode('assign_expr', $1, $2, $3); }
	| IDENTIFIER ADD_ASSIGN arithmetic_expr { $$ = newNode('assign_expr', $1, $2, $3); }
	;

arithmetic_expr
  : arithmetic_expr PLUS arithmetic_expr { $$ = newNode('arithmetic_expr', $1, $2, $3); }
	| arithmetic_expr MULTIPLY arithmetic_expr { $$ = newNode('arithmetic_expr', $1, $2, $3); }
	| LPAREN arithmetic_expr RPAREN { $$ = newNode('arithmetic_expr', $2); }
	| IDENTIFIER { $$ = newNode('arithmetic_expr', $1); }
	| CONSTANT { $$ = newNode('arithmetic_expr', $1); }
	| STRING_LITERAL { $$ = newNode('arithmetic_expr', $1); }
	| function_call { $$ = newNode('arithmetic_expr', $1); }
	;

logic_expr
	: logic_expr AND_OP logic_expr { $$ = newNode('logic_expr', $1, $2, $3); }
	| logic_expr OR_OP logic_expr { $$ = newNode('logic_expr', $1, $2, $3); }
	| LPAREN logic_expr RPAREN { $$ = newNode('logic_expr', $2); }
	| arithmetic_expr EQ_OP arithmetic_expr { $$ = newNode('logic_expr', $1, $2, $3); }
	| arithmetic_expr NE_OP arithmetic_expr { $$ = newNode('logic_expr', $1, $2, $3); }
	| TRUE { $$ = newNode('logic_expr', $1); }
	| FALSE { $$ = newNode('logic_expr', $1); }
	;

function_call
  : IDENTIFIER LPAREN argument_list RPAREN { $$ = newNode('function_call', $1, $3); }
	| IDENTIFIER LPAREN RPAREN { $$ = newNode('function_call', $1); }
	;

argument_list
  : arithmetic_expr COMMA argument_list { $$ = newNode('argument_list', $1, $3); }
	| arithmetic_expr { $$ = newNode('argument_list', $1); }
	;

%%

// nothing
