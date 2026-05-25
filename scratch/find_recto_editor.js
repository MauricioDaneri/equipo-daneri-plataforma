const fs = require('fs');

const f1 = 'C:/Users/mauri/.gemini/antigravity/scratch/equipo-daneri-plataforma/src/vistas/EditorTactico.jsx';
const f2 = 'C:/Users/mauri/.gemini/antigravity/scratch/equipo-daneri-plataforma/src/vistas/EditorTactico.jsx.bak';

const c1 = fs.readFileSync(f1, 'utf8');
const c2 = fs.readFileSync(f2, 'utf8');

console.log('f1 has "Estadísticos":', c1.toLowerCase().includes('estadísticos'));
console.log('f2 has "Estadísticos":', c2.toLowerCase().includes('estadísticos'));

console.log('f1 has "Out-Fighter":', c1.toLowerCase().includes('out-fighter'));
console.log('f2 has "Out-Fighter":', c2.toLowerCase().includes('out-fighter'));
