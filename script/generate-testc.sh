# Generate Serialized Files for TestC.l / .y

echo "--- Start generating TestC-Lex.json"
node ../dist/lexer/Generate.js ../syntax/TestC/TestC.l ../syntax/TestC
echo "--- Start generating TestC-LR1Parse.json"
node ../dist/parser/GenerateLR1.js ../syntax/TestC/TestC.y ../syntax/TestC
echo "--- re-generate work done"
