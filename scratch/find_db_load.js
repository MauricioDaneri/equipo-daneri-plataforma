const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'vistas', 'EditorTactico.jsx');
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

lines.forEach((line, index) => {
  if (line.includes('db.eventos.where') || line.includes('setTimeline(') || line.includes('db.eventos.toArray')) {
    if (line.length < 150) {
      console.log(`Line ${index + 1}: ${line.trim()}`);
    }
  }
});
