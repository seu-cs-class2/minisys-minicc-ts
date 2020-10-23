echo "--- Start generating MiniC-Lex.json"
ts-node ../src/lexer/Generate.ts
echo "--- Start generating MiniC-Parse.json"
ts-node ../src/parser/Generate.ts
echo "--- re-generate work done"
