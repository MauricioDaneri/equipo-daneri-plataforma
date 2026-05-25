const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'vistas', 'EditorTactico.jsx');
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

console.log("Lines 410 to 450:");
for (let i = 409; i < 450; i++) {
  console.log(`${i + 1}: ${lines[i]}`);
}
