const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'vistas', 'EditorTactico.jsx');
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

console.log("Lines 40 to 110:");
for (let i = 39; i < 110; i++) {
  console.log(`${i + 1}: ${lines[i]}`);
}
