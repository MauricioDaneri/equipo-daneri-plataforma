const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    if (file === 'node_modules' || file === '.git' || file === 'dist' || file === 'dist-electron') return;
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else {
      if (file.endsWith('.js') || file.endsWith('.jsx') || file.endsWith('.html') || file.endsWith('.bak')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = walk('C:/Users/mauri/.gemini/antigravity/scratch/equipo-daneri-plataforma');
const terms = ['Out-Fighter', 'Fajador', 'ESTADOS FÍSICOS', 'Guardia Baja', 'Fatiga'];

files.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');
  
  terms.forEach(term => {
    let found = false;
    lines.forEach((line, index) => {
      if (line.toLowerCase().includes(term.toLowerCase())) {
        if (!found) {
          console.log(`\n--- Found "${term}" in: ${file} ---`);
          found = true;
        }
        console.log(`  ${index + 1}: ${line.trim()}`);
      }
    });
  });
});
