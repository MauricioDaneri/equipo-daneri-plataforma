const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'vistas', 'EditorTactico.jsx');
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

console.log("Lines 6180 to 6295:");
for (let i = 6179; i < 6295; i++) {
  console.log(`${i + 1}: ${lines[i]}`);
}
