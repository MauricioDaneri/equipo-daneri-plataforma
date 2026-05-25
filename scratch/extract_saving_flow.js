const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'vistas', 'EditorTactico.jsx');
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

console.log("Lines 1730 to 1770:");
for (let i = 1729; i < 1770; i++) {
  console.log(`${i + 1}: ${lines[i]}`);
}
