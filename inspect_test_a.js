const fs = require('fs');

const code = fs.readFileSync('src/vistas/EditorTactico.jsx', 'utf8');
const lines = code.split('\n');

let newLines = [...lines];
newLines.splice(2040, 2989 - 2040, '      {/* standard block removed */}');

const testCode = newLines.join('\n');
const testLines = testCode.split('\n');

console.log('--- Lines 2345 to 2365 of Test A ---');
for (let i = 2344; i < Math.min(testLines.length, 2365); i++) {
  console.log(`${i+1}: ${testLines[i]}`);
}
