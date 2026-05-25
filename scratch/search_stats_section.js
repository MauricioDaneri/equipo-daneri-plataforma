const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'vistas', 'EditorTactico.jsx');
const content = fs.readFileSync(filePath, 'utf-8');
const lines = content.split('\n');

console.log("=== SEARCH FOR 'stats' or 'Estadísticas' ===");
lines.forEach((line, i) => {
  if (line.includes('stats') || line.includes('Estadísticas') || line.includes('clasificarPerfiles')) {
    console.log(`${i + 1}: ${line.trim()}`);
  }
});
