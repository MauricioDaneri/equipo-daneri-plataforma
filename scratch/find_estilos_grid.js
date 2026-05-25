const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'vistas', 'EditorTactico.jsx');
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

lines.forEach((line, index) => {
  if (line.includes('gridFila1') || line.includes('gridFila2') || line.includes('btnAccionPrincipal')) {
    console.log(`Line ${index + 1}: ${line.trim()}`);
  }
});
