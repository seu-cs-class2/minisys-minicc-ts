echo "--- Start generating TestC-Lex.json"
node ../dist/lexer/Generate.js ../syntax/TestC.l ../syntax
echo "--- Start generating TestC-LR1Parse.json"
node ../dist/parser/GenerateLR1.js ../syntax/TestC.y ../syntax
echo "--- Start generating TestC-LALRParse.json"
node ../dist/parser/GenerateLALR.js ../syntax/TestC.y ../syntax
echo "--- re-generate work done"
