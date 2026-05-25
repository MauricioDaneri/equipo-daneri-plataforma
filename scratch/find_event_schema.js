const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'vistas', 'EditorTactico.jsx');
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

// Search for event construction, e.g. "registrarEvento" or "db.eventos.add"
lines.forEach((line, index) => {
  if (line.includes('registrarEvento') || line.includes('const nuevo') || line.includes('db.eventos.add') || line.includes('db.eventos.put') || line.includes('timestamp:')) {
    if (line.length < 150) {
      console.log(`Line ${index + 1}: ${line.trim()}`);
    }
  }
});
