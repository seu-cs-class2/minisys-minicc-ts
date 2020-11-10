# re-generate MiniC-Lex.json and MiniC-Parse.json using seu-lex-yacc

MemoryToUse=4096

echo "--- Start generating MiniC-Lex.json"
node --inspect --max_old_space_size=${MemoryToUse} ../dist/lexer/Generate.js
echo "--- Start generating MiniC-Parse.json"
node --inspect --max_old_space_size=${MemoryToUse} ../dist/parser/Generate.js
echo "--- re-generate work done"
