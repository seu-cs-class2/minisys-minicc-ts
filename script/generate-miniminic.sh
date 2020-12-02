# Generate Serialized Files for MiniMiniC.y

echo "--- Start generating MiniMiniC-LR1Parse.json"
node ../dist/parser/GenerateLR1.js ../syntax/MiniMiniC/MiniMiniC.y ../syntax/MiniMiniC
echo "--- Start generating MiniMiniC-LALRParse.json"
node ../dist/parser/GenerateLALR.js ../syntax/MiniMiniC/MiniMiniC.y ../syntax/MiniMiniC
echo "--- re-generate work done"
