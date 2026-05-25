const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'vistas', 'EditorTactico.jsx');
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

console.log("Lines 2400 to 2500:");
for (let i = 2399; i < 2500; i++) {
  console.log(`${i + 1}: ${lines[i]}`);
}
