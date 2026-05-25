const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'vistas', 'EditorTactico.jsx');
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

console.log("Lines 7465 to 7500:");
for (let i = 7464; i < 7500; i++) {
  console.log(`${i + 1}: ${lines[i]}`);
}
