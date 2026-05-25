const fs = require('fs');
const babel = require('@babel/core');

const code = fs.readFileSync('src/vistas/EditorTactico.jsx', 'utf8');
const lines = code.split('\n');

let newLines = [...lines];

// Replace from bottom to top so indices don't shift!
const TABS = [
  { name: 'timeline', start: 2147, end: 2330 },
  { name: 'mapa', start: 2332, end: 2397 },
  { name: 'stats', start: 2400, end: 2504 },
  { name: 'ollama', start: 2507, end: 2762 },
  { name: 'voz', start: 2765, end: 2964 }
];

// Sort descending by start line
TABS.sort((a, b) => b.start - a.start);

TABS.forEach(tab => {
  newLines.splice(tab.start - 1, tab.end - tab.start + 1, '              {/* REPLACED TAB ' + tab.name + ' */}');
});

const testCode = newLines.join('\n');
try {
  babel.parseSync(testCode, {
    presets: ['@babel/preset-react'],
    filename: 'temp.jsx'
  });
  console.log('REMOVING ALL TABS TOGETHER -> PARSED SUCCESSFULLY! The error is indeed inside the tabs.');
} catch (err) {
  console.log('REMOVING ALL TABS TOGETHER -> Still Fails with:');
  console.log(err.message);
}
