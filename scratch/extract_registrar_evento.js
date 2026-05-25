const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'vistas', 'EditorTactico.jsx');
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

console.log("Lines 1580 to 1640:");
for (let i = 1579; i < 1640; i++) {
  console.log(`${i + 1}: ${lines[i]}`);
}
