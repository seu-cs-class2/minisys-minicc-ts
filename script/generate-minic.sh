# Generate Serialized Files for MiniC.l / .y

echo "--- Start generating MiniC-Lex.json"
node ../dist/lexer/Generate.js ../syntax/MiniC/MiniC.l ../syntax/MiniC
echo "--- Start generating MiniC-LALRParse.json"
node ../dist/parser/GenerateLALR.js ../syntax/MiniC/MiniC.y ../syntax/MiniC
echo "--- re-generate work done"
