const fs = require('fs');
const code = fs.readFileSync('src/vistas/EditorTactico.jsx', 'utf8');
const lines = code.split('\n');

const TABS = [
  { name: 'timeline', start: 2147, end: 2330 },
  { name: 'mapa', start: 2332, end: 2397 },
  { name: 'stats', start: 2400, end: 2504 },
  { name: 'ollama', start: 2507, end: 2762 },
  { name: 'voz', start: 2765, end: 2964 }
];

TABS.sort((a, b) => b.start - a.start);

let newLines = [...lines];
TABS.forEach(tab => {
  newLines.splice(tab.start - 1, tab.end - tab.start + 1, `              {/* REPLACED TAB ${tab.name} */}`);
});

// Print from 2040 to the end of the return statement
for (let i = 2039; i < 2995; i++) {
  if (newLines[i] !== undefined) {
    console.log((i+1) + ': ' + newLines[i]);
  }
}
