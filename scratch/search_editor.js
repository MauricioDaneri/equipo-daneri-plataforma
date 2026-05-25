const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'vistas', 'EditorTactico.jsx');
const content = fs.readFileSync(filePath, 'utf-8');
const lines = content.split('\n');

console.log("=== SEARCH FOR MAIN RETURN ===");
let count = 0;
lines.forEach((line, i) => {
  if (line.trim().startsWith('return (') && i > 1900 && i < 2200) {
    console.log(`${i + 1}: ${line.trim()}`);
  }
});
