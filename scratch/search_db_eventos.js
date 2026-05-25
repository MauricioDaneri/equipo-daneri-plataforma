const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    if (file === 'node_modules' || file === '.git' || file === 'dist') return;
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else {
      if (file.endsWith('.js') || file.endsWith('.jsx')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = walk('C:/Users/mauri/.gemini/antigravity/scratch/equipo-daneri-plataforma/src');
files.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  if (content.includes('TIPOS_EVENTO') || content.includes('EVENTOS_TIPO') || file.includes('eventType') || file.includes('evento')) {
    console.log(`Possible match in: ${file}`);
    const lines = content.split('\n');
    lines.forEach((line, index) => {
      if (line.includes('TIPOS_EVENTO') || line.includes('EVENT_TYPES') || line.includes('EVENTOS') || line.includes('TIPOS')) {
        if (line.trim().length > 10 && line.trim().length < 200) {
          console.log(`  ${index + 1}: ${line.trim()}`);
        }
      }
    });
  }
});
