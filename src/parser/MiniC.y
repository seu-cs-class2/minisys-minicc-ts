%{
	// nothing
	// 注：WHITESPACE并不会存在于`lexSourceCode`方法生成的Token序列中
  // 本语法定义文件基于“计算机系统综合课程设计”补充讲义121定义
%}

%token COMMENT BREAK CONTINUE DO ELSE
%token FOR IF INT RETURN VOID WHILE IDENTIFIER
%token CONSTANT RIGHT_OP LEFT_OP AND_OP OR_OP LE_OP GE_OP EQ_OP NE_OP
%token SEMICOLON LBRACE RBRACE COMMA COLON ASSIGN LPAREN RPAREN
%token LBRACKET RBRACKET DOT BITAND_OP NOT_OP BITINV_OP MINUS PLUS MULTIPLY SLASH PERCENT
%token LT_OP GT_OP BITXOR_OP BITOR_OP DOLLAR
%token _WHITESPACE _EPSILON _UNMATCH

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
	: decl_list	{ _ASTRoot = newNode('program', $1); }
	;

decl_list
	: decl_list decl { $$ = newNode('decl_list', $1, $2); } 																							
	| decl 																												
	;

decl
	: var_decl
	| fun_decl 																										
	;

var_decl
	: type_spec IDENTIFIER SEMICOLON 															
	| type_spec IDENTIFIER LBRACKET CONSTANT RBRACKET SEMICOLON 	
	;

type_spec
	: VOID 																												
	| INT 																												
	;

fun_decl
	: type_spec IDENTIFIER LPAREN params RPAREN compound_stmt 		
	;

params
	: param_list 																									
	| VOID 																												
	;

param_list
	: param_list COMMA param 																			
	| param 																											
	;

param
	: type_spec IDENTIFIER
	;

stmt_list
	: stmt_list stmt
	;

stmt
	: expr_stmt
	| block_stmt																									
	| if_stmt																											
	| while_stmt																									
	| return_stmt																									
	| continue_stmt																								
	| break_stmt																									
	;

expr_stmt
	: IDENTIFIER ASSIGN expr SEMICOLON
	| IDENTIFIER LBRACKET expr RBRACKET ASSIGN expr SEMICOLON
	| DOLLAR expr ASSIGN SEMICOLON
	| IDENTIFIER LPAREN args RPAREN SEMICOLON
	;

while_stmt
	: WHILE LPAREN expr RPAREN stmt 															
	;

block_stmt
	: LBRACE stmt_list RBRACE 																		
	;

compound_stmt
	: LBRACE local_decls stmt_list RBRACE
	;

local_decls
	: local_decls local_decl
	;

local_decl
	: type_spec IDENTIFIER SEMICOLON SEMICOLON
	| type_spec IDENTIFIER LBRACKET CONSTANT RBRACKET SEMICOLON
	;

if_stmt
	: IF LPAREN expr RPAREN stmt 																	
	;

return_stmt
	: RETURN SEMICOLON
	| RETURN expr SEMICOLON 																			
	;

expr
	: expr OR_OP expr 																								
	| expr AND_OP expr
	| expr EQ_OP expr																							
	| expr NE_OP expr																							
	| expr GT_OP expr																							
	| expr LT_OP expr																							
	| expr GE_OP expr																							
	| expr LE_OP expr																							
	| expr PLUS expr 																							
	| expr MINUS expr 																						
	| expr MULTIPLY expr 																					
	| expr SLASH expr 																						
	| expr PERCENT expr 																					
	| NOT_OP expr																									
	| MINUS expr																									
	| PLUS expr 																									
	| DOLLAR expr																									
	| LPAREN expr RPAREN 																					
	| IDENTIFIER 																									
	| IDENTIFIER LBRACKET expr RBRACKET
	| IDENTIFIER LPAREN args RPAREN
	| CONSTANT
	| expr BITAND_OP expr
	| expr BITXOR_OP expr
	| BITINV_OP expr
	| expr LEFT_OP expr
	| expr RIGHT_OP expr
	| expr BITOR_OP expr
	;

args
	: args COMMA expr
	| expr
	;

continue_stmt
	: CONTINUE SEMICOLON
	;

break_stmt
	: BREAK SEMICOLON
	;

%%

// nothing
