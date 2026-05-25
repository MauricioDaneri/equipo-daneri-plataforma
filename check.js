
const fs = require('fs');
const code = fs.readFileSync('src/vistas/EditorTactico.jsx', 'utf8');
const lines = code.split('\n');
let openCount = 0;
for (let i = 1520; i <= 3300; i++) {
  const line = lines[i];
  for (let char of line) {
     if (char === '(') openCount++;
     if (char === ')') openCount--;
  }
}
console.log('Final paren count at 3300:', openCount);
