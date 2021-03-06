D			[0-9]
L			[a-zA-Z_]

%{
  // 本词法文件可搭配简化版的TestC.y
%}

%%
"//"(.*)(\n)?  { return(_COMMENT); }
"auto"			{ return(AUTO); }
"break"			{ return(BREAK); }
"case"			{ return(CASE); }
"char"			{ return(CHAR); }
"const"			{ return(CONST); }
"continue"	{ return(CONTINUE); }
"default"		{ return(DEFAULT); }
"do"			  { return(DO); }
"double"		{ return(DOUBLE); }
"else"			{ return(ELSE); }
"enum"			{ return(ENUM); }
"extern"		{ return(EXTERN); }
"float"			{ return(FLOAT); }
"for"			  { return(FOR); }
"goto"			{ return(GOTO); }
"if"			  { return(IF); }
"inline"		{ return(INLINE); }
"int"			  { return(INT); }
"long"			{ return(LONG); }
"register"	{ return(REGISTER); }
"restrict"	{ return(RESTRICT); }
"return"		{ return(RETURN); }
"short"			{ return(SHORT); }
"signed"		{ return(SIGNED); }
"sizeof"		{ return(SIZEOF); }
"static"		{ return(STATIC); }
"struct"		{ return(STRUCT); }
"switch"		{ return(SWITCH); }
"typedef"		{ return(TYPEDEF); }
"union"			{ return(UNION); }
"unsigned"	{ return(UNSIGNED); }
"void"			{ return(VOID); }
"volatile"	{ return(VOLATILE); }
"while"			{ return(WHILE); }
{L}         { return(IDENTIFIER); }
{L}({L}|{D})*		{ return(IDENTIFIER); }
[1-9]{D}*						{ return(CONSTANT); }
{D}+								{ return(CONSTANT); }
{D}*"."{D}*					{ return(CONSTANT); }
{D}+"."{D}*					{ return(CONSTANT); }
\"[^"\n]*\" { return (STRING_LITERAL); }
"..."			{ return(ELLIPSIS); }
">>="			{ return(RIGHT_ASSIGN); }
"<<="			{ return(LEFT_ASSIGN); }
"+="			{ return(ADD_ASSIGN); }
"-="			{ return(SUB_ASSIGN); }
"*="			{ return(MUL_ASSIGN); }
"/="			{ return(DIV_ASSIGN); }
"%="			{ return(MOD_ASSIGN); }
"&="			{ return(AND_ASSIGN); }
"^="			{ return(XOR_ASSIGN); }
"|="			{ return(OR_ASSIGN); }
">>"			{ return(RIGHT_OP); }
"<<"			{ return(LEFT_OP); }
"++"			{ return(INC_OP); }
"--"			{ return(DEC_OP); }
"->"			{ return(PTR_OP); }
"&&"			{ return(AND_OP); }
"||"			{ return(OR_OP); }
"<="			{ return(LE_OP); }
">="			{ return(GE_OP); }
"=="			{ return(EQ_OP); }
"!="			{ return(NE_OP); }
";"				{ return(SEMICOLON); }
"{"	    	{ return(LBRACE); }
"}"	  		{ return(RBRACE); }
","				{ return(COMMA); }
":"				{ return(COLON); }
"="				{ return(ASSIGN); }
"(" 			{ return(LPAREN); }
")"				{ return(RPAREN); }
"["			  { return(LBRACKET); }
"]"	  		{ return(RBRACKET); }
"."				{ return(DOT); }
"&"				{ return(BITAND_OP); }
"!"				{ return(BITNOT_OP); }
"~"				{ return(BITINV_OP); }
"-"				{ return(MINUS); }
"+"				{ return(PLUS); }
"*"				{ return(MULTIPLY); }
"/"				{ return(SLASH); }
"%"				{ return(PERCENT); }
"<"				{ return(LT_OP); }
">"				{ return(GT_OP); }
"^"				{ return(BITXOR_OP); }
"|"				{ return(BITOR_OP); }
"?"				{ return(QUESTION); }
[ \n\r\t] { return (_WHITESPACE);}
.			 	 	{ return(_UNMATCH); }

%%