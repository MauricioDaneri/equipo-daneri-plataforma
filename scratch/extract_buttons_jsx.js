const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'vistas', 'EditorTactico.jsx');
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

console.log("Lines 3550 to 3650:");
for (let i = 3549; i < 3650; i++) {
  console.log(`${i + 1}: ${lines[i]}`);
}
