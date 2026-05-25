const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'vistas', 'EditorTactico.jsx');
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

console.log(`Total lines: ${lines.length}`);

// Search for selected event, edit event, panel of actions
lines.forEach((line, index) => {
  if (line.includes('eventoSeleccionado') || line.includes('selectedEvent') || line.includes('actualizarEvento') || line.includes('form') || line.includes('editar') || line.includes('Tipo de Golpe') || line.includes('detalle') || line.includes('observacion')) {
    if (line.length < 150) {
      console.log(`Line ${index + 1}: ${line.trim()}`);
    }
  }
});
