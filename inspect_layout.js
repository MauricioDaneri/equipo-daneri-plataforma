const fs = require('fs');
const babel = require('@babel/core');

const code = fs.readFileSync('src/vistas/EditorTactico.jsx', 'utf8');
const lines = code.split('\n');

function tryParseBlocks(keepIzquierda, keepDerecha) {
  let newLines = [...lines];
  
  // If we remove Zona Derecha (lines 2040 to 2988), we need to ensure the parent layoutPrincipal (opened at 1833) is closed properly!
  // In the original file:
  // - layoutPrincipal starts at 1833 (index 1832)
  // - Zona Izquierda starts inside it and ends at 2038 (index 2037)
  // - Zona Derecha starts at 2041 (index 2040) and ends at 2989 (index 2988)
  //   Inside Zona Derecha, it ends with:
  //   2987:             </div>
  //   2988:           </div>
  //   2989:         )}
  //   Wait, line 2988 is the closing tag for layoutPrincipal.
  //   So if we remove Zona Derecha, we must make sure layoutPrincipal is closed.
  
  if (!keepDerecha) {
    // Replace lines 2040 (index 2039) to 2989 (index 2988) with a simple closing tag for layoutPrincipal + the closing for standard layout conditional.
    newLines.splice(2039, 2989 - 2039, '        </div>\n      )}');
  }
  
  if (!keepIzquierda) {
    // Replace lines 1834 (index 1833) to 2039 (index 2038) with simple div/content so parent layoutPrincipal remains open.
    newLines.splice(1833, 2039 - 1833, '        <div>Izquierda Placeholder</div>');
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

console.log('Test A: Keeping Izquierda, removing Derecha...');
let resA = tryParseBlocks(true, false);
console.log('Result:', resA === true ? 'Parsed perfectly!' : 'Failed: ' + resA.split('\n')[0]);

console.log('Test B: Keeping Derecha, removing Izquierda...');
let resB = tryParseBlocks(false, true);
console.log('Result:', resB === true ? 'Parsed perfectly!' : 'Failed: ' + resB.split('\n')[0]);
