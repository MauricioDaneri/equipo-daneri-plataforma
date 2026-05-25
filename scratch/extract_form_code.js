const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'vistas', 'EditorTactico.jsx');
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

console.log("Lines 6180 to 6480:");
for (let i = 6179; i < 6480; i++) {
  console.log(`${i + 1}: ${lines[i]}`);
}
