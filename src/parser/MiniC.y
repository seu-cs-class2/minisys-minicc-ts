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
	: decl_list
	;

decl_list
	: decl_list decl 																							{ backpatch($1.nextlist, $2.instr); $$.nextlist = $2.nextlist; }
	| decl 																												{ $$.nextlist = $1.nextlist; }
	;

decl
	: var_decl
	| fun_decl 																										{ toscope('global'); }
	;

var_decl
	: type_spec IDENTIFIER SEMICOLON 															{ newentry($2.literal, $1.type); }
	| type_spec IDENTIFIER LBRACKET CONSTANT RBRACKET SEMICOLON 	{ newentry($2.literal, $1.type, $4.literal); }
	;

type_spec
	: VOID 																												{ $$.type = 'void'; }
	| INT 																												{ $$.type = 'int'; }
	;

fun_decl
	: type_spec IDENTIFIER LPAREN params RPAREN compound_stmt 		{ $$.name = $2.literal; regfunc($2.literal, ??); newtable($2.literal); tablepush($4.itemlist); }
	;

params
	: param_list 																									{ $$.itemlist = $1.itemlist; }
	| VOID 																												{ $$.itemlist = null; }
	;

param_list
	: param_list COMMA param 																			{ $$.itemlist = concatparam($1.itemlist, $3.itemlist); }
	| param 																											{ $$.itemlist = $1.itemlist; }
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
	| if_stmt																											{ $$.nextlist = $1.nextlist; }
	| while_stmt																									{ $$.nextlist = $1.nextlist; }
	| return_stmt																									
	| continue_stmt																								{ // jump somewhere }
	| break_stmt																									{ // jump somewhere }
	;

expr_stmt
	: IDENTIFIER ASSIGN expr SEMICOLON
	| IDENTIFIER LBRACKET expr RBRACKET ASSIGN expr SEMICOLON
	| DOLLAR expr ASSIGN SEMICOLON
	| IDENTIFIER LPAREN args RPAREN SEMICOLON
	;

while_stmt
	: WHILE LPAREN expr RPAREN stmt 															{ backpatch($5.nextlist, $3.instr?); backpatch($3.truelist, $5.instr?); $$.nextlist = $3.falselist; genquad('j', '', '', ???); }
	;

block_stmt
	: LBRACE stmt_list RBRACE 																		{ $$.nextlist = $2.nextlist; }
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
	: IF LPAREN expr RPAREN stmt 																	{ backpatch($3.truelist, $5.instr); $$.nextlist = merge($3.falselist, $5.nextlist); }
	;

return_stmt
	: RETURN SEMICOLON
	| RETURN expr SEMICOLON 																			{ genquad('return', $2.place, '', ''); markalive($2.place); }
	;

expr
	: expr OR_OP _M expr 																								
	| expr AND_OP _M expr
	| expr EQ_OP expr																							{ $$.truelist = makelist(nextinstr); $$.falselist = makelist(nextinstr + 1); genquad('j_eq', $1.place, $3.place, '_'); genquad('j', '', '', '_'); }
	| expr NE_OP expr																							{ $$.truelist = makelist(nextinstr); $$.falselist = makelist(nextinstr + 1); genquad('j_ne', $1.place, $3.place, '_'); genquad('j', '', '', '_'); }
	| expr GT_OP expr																							{ $$.truelist = makelist(nextinstr); $$.falselist = makelist(nextinstr + 1); genquad('j_gt', $1.place, $3.place, '_'); genquad('j', '', '', '_'); }
	| expr LT_OP expr																							{ $$.truelist = makelist(nextinstr); $$.falselist = makelist(nextinstr + 1); genquad('j_lt', $1.place, $3.place, '_'); genquad('j', '', '', '_'); }
	| expr GE_OP expr																							{ $$.truelist = makelist(nextinstr); $$.falselist = makelist(nextinstr + 1); genquad('j_ge', $1.place, $3.place, '_'); genquad('j', '', '', '_'); }
	| expr LE_OP expr																							{ $$.truelist = makelist(nextinstr); $$.falselist = makelist(nextinstr + 1); genquad('j_le', $1.place, $3.place, '_'); genquad('j', '', '', '_'); }
	| expr PLUS expr 																							{ $$.place = newtemp($1.place); genquad('+', $1.place, $3.place, $$.place); }
	| expr MINUS expr 																						{ $$.place = newtemp($1.place); genquad('-', $1.place, $3.place, $$.place); }
	| expr MULTIPLY expr 																					{ $$.place = newtemp($1.place); genquad('*', $1.place, $3.place, $$.place); }
	| expr SLASH expr 																						{ $$.place = newtemp($1.place); genquad('/', $1.place, $3.place, $$.place); }
	| expr PERCENT expr 																					{ $$.place = newtemp($1.place); genquad('%', $1.place, $3.place, $$.place); }
	| NOT_OP expr																									{ $$.truelist = $2.falselist; $$.falselist = $2.truelist; }
	| MINUS expr																									{ $$.place = newtemp($2.place); genquad('-', $2.place, '', $$.place); }
	| PLUS expr 																									{ $$.place = $2.place; }
	| DOLLAR expr																									{ //FIXME: $$.place = newtemp($2.place); genquad('$', '$2.place', '', $$.place); }
	| LPAREN expr RPAREN 																					{ $$.place = $2.place; }
	| IDENTIFIER 																									{ $$.place = findsymbol($1.literal); }
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

_M
	: _EPSILON																														{ $$.instr = makelabel(nextinstr); }
	;

_N
	: _EPSILON
	; 																														{ $$.instr = makelist(nextinstr); }

%%

// nothing
