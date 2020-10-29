MemoryToUse=8192

echo "--- Start generating MiniC-Parse.json"
node --inspect --max_old_space_size=${MemoryToUse} ../dist/parser/Generate.js
echo "--- re-generate work done"
