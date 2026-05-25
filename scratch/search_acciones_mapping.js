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
  if (content.includes('VideoTimelineOverlay') || content.includes('timeline') || file.includes('VideoTimelineOverlay')) {
    const lines = content.split('\n');
    console.log(`\n=== Matches in ${file} ===`);
    lines.forEach((line, index) => {
      if (line.includes('Jab') || line.includes('Recto') || line.includes('Cross') || line.includes('Swing') || line.includes('Golpe Conectado') || line.includes('tipo ===') || line.includes('tipo:')) {
        if (line.trim().length > 5 && line.trim().length < 150) {
          console.log(`  ${index + 1}: ${line.trim()}`);
        }
      }
    });
  }
});
