const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'vistas', 'EditorTactico.jsx');
const content = fs.readFileSync(filePath, 'utf-8');
const lines = content.split('\n');

console.log("=== SEARCH FOR LIST MAPPING ===");
lines.forEach((line, i) => {
  if (line.includes('ev-list-item-') || line.includes('eventosConNumero') || line.includes('.map((ev') || line.includes('panelActivo === "timeline"')) {
    if (i > 4000 && i < 5000) { // Focusing on the middle-bottom layout section
      console.log(`${i + 1}: ${line.trim()}`);
    }
  }
});
