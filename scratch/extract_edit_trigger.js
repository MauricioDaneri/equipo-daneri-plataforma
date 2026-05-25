const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'vistas', 'EditorTactico.jsx');
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

console.log("Lines 4290 to 4330:");
for (let i = 4289; i < 4330; i++) {
  console.log(`${i + 1}: ${lines[i]}`);
}
