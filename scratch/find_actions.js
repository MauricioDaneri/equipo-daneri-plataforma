const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'vistas', 'EditorTactico.jsx');
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

console.log(`Total lines: ${lines.length}`);

// Search for mentions of 'Jab' or 'Finta' or 'esquiva' to see what variables define actions
lines.forEach((line, index) => {
  if (line.includes('Jab') || line.includes('Finta') || line.includes('tipo: \'Jab\'') || line.includes('const TIPO_') || line.includes('const tiposGolpe') || line.includes('const TIPOS_') || line.includes('const PANEL_ACCIONES') || line.includes('botonesAcciones') || line.includes('BOTONES_')) {
    if (line.length < 150) {
      console.log(`Line ${index + 1}: ${line.trim()}`);
    }
  }
});
