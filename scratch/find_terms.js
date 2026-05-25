const fs = require('fs');
const content = fs.readFileSync('C:/Users/mauri/.gemini/antigravity/scratch/equipo-daneri-plataforma/src/vistas/EditorTactico.jsx', 'utf8');
const lines = content.split('\n');

const terms = ['estilista', 'fajador', 'slugger', 'counter', 'mixto', 'fatiga', 'guardia', 'centro de ring', 'compacto', 'estad'];
terms.forEach(term => {
  console.log(`=== Matches for "${term}" ===`);
  let count = 0;
  lines.forEach((line, index) => {
    if (line.toLowerCase().includes(term.toLowerCase())) {
      count++;
      if (count <= 10) {
        console.log(`${index + 1}: ${line.trim()}`);
      }
    }
  });
  if (count > 10) {
    console.log(`... and ${count - 10} more matches.`);
  }
});
