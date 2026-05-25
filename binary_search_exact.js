const fs = require('fs');
const babel = require('@babel/core');

const code = fs.readFileSync('src/vistas/EditorTactico.jsx', 'utf8');
const lines = code.split('\n');

function tryParseDerechaUpTo(X) {
  let newLines = [...lines];
  
  // Keep from 0 up to X (index X - 1)
  let subLines = newLines.slice(0, X);
  
  // Now we need to close the open tags.
  // We know at line 1833 we opened:
  //   <div style={estilos.layoutPrincipal}>
  // And at line 2041 we opened:
  //   {!analisisLimpio && (
  //     <div style={{...}}>
  // So we need to close:
  // 1. the div inside the {!analisisLimpio && (
  // 2. the {!analisisLimpio && ( itself
  // 3. the layoutPrincipal div
  // 4. the main page div (estilos.pagina)
  // 5. the return (
  // 6. the component function
  
  // Let's add these exact closers!
  let subCode = subLines.join('\n');
  subCode += `
        </div>
      )}
    </div>
  )
}
`;

  try {
    babel.parseSync(subCode, {
      presets: ['@babel/preset-react'],
      filename: 'temp.jsx'
    });
    return true; // parsed fine!
  } catch (err) {
    return err.message; // failed
  }
}

// Let's do a binary search on X from 2041 to 2989
let low = 2041;
let high = 2989;
let answer = -1;
let lastError = '';

while (low <= high) {
  let mid = Math.floor((low + high) / 2);
  let res = tryParseDerechaUpTo(mid);
  if (res === true) {
    // It parsed perfectly, meaning the error is introduced AFTER mid!
    low = mid + 1;
  } else {
    // It failed, meaning the error has already been introduced by line mid!
    answer = mid;
    lastError = res;
    high = mid - 1;
  }
}

console.log('The syntax error is introduced at line:', answer);
if (answer !== -1) {
  console.log('Error message at that point:');
  console.log(lastError.split('\n')[0]);
  console.log('\nLines around it in the original file:');
  for (let i = Math.max(0, answer - 10); i < Math.min(lines.length, answer + 10); i++) {
    console.log(`${i+1}: ${lines[i]}`);
  }
}
