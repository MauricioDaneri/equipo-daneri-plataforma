const fs = require('fs');
const content = fs.readFileSync('C:/Users/mauri/.gemini/antigravity/scratch/equipo-daneri-plataforma/src/vistas/EditorTactico.jsx', 'utf8');
const lines = content.split('\n');

lines.forEach((line, index) => {
  if (line.includes('const registrarEvento') || line.includes('function registrarEvento')) {
    console.log(`${index + 1}: ${line.trim()}`);
  }
});
