const fs = require('fs');
const babel = require('@babel/core');

const code = fs.readFileSync('src/vistas/EditorTactico.jsx', 'utf8');
const lines = code.split('\n');

// Line ranges:
// - analisisLimpio: from line 1524 to 2038
// - !analisisLimpio: from line 2041 to 2989

function tryParseMainSubblocks(limpioActive, standardActive) {
  let newLines = [...lines];
  
  // Replace standard block first (bottom)
  if (!standardActive) {
    newLines.splice(2040, 2989 - 2040, '      {/* standard block removed */}');
  }
  
  // Replace limpio block (top)
  if (!limpioActive) {
    newLines.splice(1523, 2038 - 1523, '      {/* limpio block removed */}');
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

console.log('Test A: Removing standard layout block (keeping clean mode block)...');
let resA = tryParseMainSubblocks(true, false);
console.log('Result:', resA === true ? 'Parsed perfectly!' : 'Failed: ' + resA.split('\n')[0]);

console.log('Test B: Removing clean mode block (keeping standard layout block)...');
let resB = tryParseMainSubblocks(false, true);
console.log('Result:', resB === true ? 'Parsed perfectly!' : 'Failed: ' + resB.split('\n')[0]);
