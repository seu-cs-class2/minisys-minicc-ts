echo "--- Start generating MiniC-Lex.json"
node ../dist/lexer/Generate.js ../syntax/MiniC.l ../syntax
echo "--- Start generating MiniC-LALRParse.json"
node ../dist/parser/GenerateLALR.js ../syntax/MiniC.y ../syntax
echo "--- re-generate work done"
