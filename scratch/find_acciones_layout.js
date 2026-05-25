const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'vistas', 'EditorTactico.jsx');
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

lines.forEach((line, index) => {
  if (line.includes('ACCIONES_FILA_1') || line.includes('ACCIONES_FILA_2')) {
    console.log(`Line ${index + 1}: ${line.trim()}`);
  }
});
