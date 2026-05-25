const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'vistas', 'EditorTactico.jsx');
const content = fs.readFileSync(filePath, 'utf-8');
const lines = content.split('\n');

console.log("=== SEARCH FOR ALL RETURNS ===");
lines.forEach((line, i) => {
  if (line.includes('return (') && !line.includes('=>') && (line.trim().startsWith('return') || line.trim().startsWith('return ('))) {
    console.log(`${i + 1}: ${line.trim()}`);
  }
});
