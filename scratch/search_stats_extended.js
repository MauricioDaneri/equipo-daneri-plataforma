const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'vistas', 'EditorTactico.jsx');
const content = fs.readFileSync(filePath, 'utf-8');
const lines = content.split('\n');

console.log("=== SEARCH FOR EXTENDED TABS ===");
lines.forEach((line, i) => {
  if (line.includes('EXTEND') || line.includes('Extend') || line.includes('panel-analisis-extendido') || line.includes('PANEL DE ANÁLISIS EXTENDIDO')) {
    console.log(`${i + 1}: ${line.trim()}`);
  }
});
