const fs = require('fs');
const babel = require('@babel/core');

const code = fs.readFileSync('src/vistas/EditorTactico.jsx', 'utf8');
const lines = code.split('\n');

// Let's identify the line ranges:
// - main block (analisisLimpio & !analisisLimpio): from line 1521 to 2990
// - edit modal (eventoAEditar): from line 2991 to 3155
// - manual modal (mostrarManual): from line 3156 to 3299

function tryParseJSX(mainBlock, editModal, manualModal) {
  let newLines = [...lines];
  
  // Replace from bottom to top so line indices don't shift!
  
  // 3. Manual modal (line 3157 to 3299)
  if (!manualModal) {
    newLines.splice(3156, 3299 - 3156, '      {/* manual modal removed */}');
  }
  
  // 2. Edit modal (line 2992 to 3154)
  if (!editModal) {
    newLines.splice(2991, 3154 - 2991, '      {/* edit modal removed */}');
  }
  
  // 1. Main block (line 1523 to 2989)
  if (!mainBlock) {
    newLines.splice(1522, 2989 - 1522, '      {/* main block removed */}');
  }
  
  const testCode = newLines.join('\n');
  try {
    babel.parseSync(testCode, {
      presets: ['@babel/preset-react'],
      filename: 'test.jsx'
    });
    return true;
  } catch (err) {
    return err.message;
  }
}

console.log('Test 1: Removing ONLY main block...');
let res1 = tryParseJSX(false, true, true);
console.log('Result:', res1 === true ? 'Parsed perfectly!' : 'Failed: ' + res1.split('\n')[0]);

console.log('Test 2: Removing ONLY edit modal...');
let res2 = tryParseJSX(true, false, true);
console.log('Result:', res2 === true ? 'Parsed perfectly!' : 'Failed: ' + res2.split('\n')[0]);

console.log('Test 3: Removing ONLY manual modal...');
let res3 = tryParseJSX(true, true, false);
console.log('Result:', res3 === true ? 'Parsed perfectly!' : 'Failed: ' + res3.split('\n')[0]);
