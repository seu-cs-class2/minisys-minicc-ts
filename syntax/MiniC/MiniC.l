D			[0-9]
L			[a-zA-Z_]
H     0x([a-zA-Z0-9])+

%{
  // nothing
  // 本词法定义文件基于“计算机系统综合课程设计”补充讲义121定义
%}

%%
"//"(.*)(\n)?     { return(_COMMENT); }
"break"			      { return(BREAK); }
"continue"	      { return(CONTINUE); }
"else"			      { return(ELSE); }
"for"			        { return(FOR); }
"if"			        { return(IF); }
"int"			        { return(INT); }
"string"          { return(STRING); }
"return"		      { return(RETURN); }
"void"			      { return(VOID); }
"while"			      { return(WHILE); }
{H}               { return(CONSTANT); }
{L}               { return(IDENTIFIER); }
{L}({L}|{D})*		  { return(IDENTIFIER); }
[1-9]{D}*					{ return(CONSTANT); }
{D}+							{ return(CONSTANT); }
\"[^"\n]*\"       { return (STRING_LITERAL); }
">>"			        { return(RIGHT_OP); }
"<<"			        { return(LEFT_OP); }
"&&"			        { return(AND_OP); }
"||"			        { return(OR_OP); }
"<="		        	{ return(LE_OP); }
">="	        		{ return(GE_OP); }
"=="	        		{ return(EQ_OP); }
"!="	        		{ return(NE_OP); }
";"		        		{ return(SEMICOLON); }
"{"	            	{ return(LBRACE); }
"}"	          		{ return(RBRACE); }
","			        	{ return(COMMA); }
":"			        	{ return(COLON); }
"="			        	{ return(ASSIGN); }
"(" 		        	{ return(LPAREN); }
")"			        	{ return(RPAREN); }
"["			          { return(LBRACKET); }
"]"	  	        	{ return(RBRACKET); }
"."			        	{ return(DOT); }
"&"			        	{ return(BITAND_OP); }
"!"			        	{ return(NOT_OP); }
"~"			        	{ return(BITINV_OP); }
"-"			        	{ return(MINUS); }
"+"			        	{ return(PLUS); }
"*"			        	{ return(MULTIPLY); }
"/"			        	{ return(SLASH); }
"%"               { return(PERCENT); }
"<"			        	{ return(LT_OP); }
">"			        	{ return(GT_OP); }
"^"			        	{ return(BITXOR_OP); }
"|"			        	{ return(BITOR_OP); }
"$"               { return(DOLLAR); }
[ \n\r\t]         { return (_WHITESPACE); }
.			 	 	        { return(_UNMATCH); }

%%

// nothing
