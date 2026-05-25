const fs = require('fs');
const babel = require('@babel/core');

const code = fs.readFileSync('src/vistas/EditorTactico.jsx', 'utf8');
const lines = code.split('\n');

const TABS = [
  { name: 'timeline', start: 2147, end: 2330 },
  { name: 'mapa', start: 2332, end: 2397 },
  { name: 'stats', start: 2400, end: 2504 },
  { name: 'ollama', start: 2507, end: 2762 },
  { name: 'voz', start: 2765, end: 2964 }
];

TABS.forEach(tab => {
  let newLines = [...lines];
  // Replace lines from start to end (1-indexed)
  // start is line number, which is index start - 1
  // number of lines is end - start + 1
  newLines.splice(tab.start - 1, tab.end - tab.start + 1, '              {/* REPLACED TAB ' + tab.name + ' */}');
  
  const testCode = newLines.join('\n');
  try {
    babel.parseSync(testCode, {
      presets: ['@babel/preset-react'],
      filename: 'temp.jsx'
    });
    console.log(`REMOVING TAB '${tab.name}' -> PARSED SUCCESSFULLY! The error is in this tab.`);
  } catch (err) {
    console.log(`REMOVING TAB '${tab.name}' -> Still Fails with: ${err.message.split('\n')[0]}`);
  }
});
