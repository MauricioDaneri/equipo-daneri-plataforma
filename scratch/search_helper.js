const fs = require('fs');
const path = require('path');

const filePath = path.resolve(__dirname, '..', 'src', 'vistas', 'PerfilBoxeador.jsx');
if (!fs.existsSync(filePath)) {
  console.log("PerfilBoxeador.jsx no existe");
  process.exit(1);
}
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

const terms = [
  'Radar',
  'Huella',
  'HUELLA TÁCTICA',
  'Arsenal',
  'ARSENAL OFENSIVO',
  'gridTemplateColumns',
  'useLiveQuery',
  'distribucion',
  'tieneEventosLegados'
];

terms.forEach(term => {
  console.log(`=== Matches for "${term}": ===`);
  lines.forEach((line, idx) => {
    if (line.includes(term)) {
      console.log(`${idx + 1}: ${line.trim()}`);
    }
  });
  console.log('\n');
});
