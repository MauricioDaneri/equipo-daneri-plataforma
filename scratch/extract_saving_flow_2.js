const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'vistas', 'EditorTactico.jsx');
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

console.log("Lines 1900 to 1940:");
for (let i = 1899; i < 1940; i++) {
  console.log(`${i + 1}: ${lines[i]}`);
}
