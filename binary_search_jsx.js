const fs = require('fs');
const parser = require('@babel/parser');

const code = fs.readFileSync('src/vistas/EditorTactico.jsx', 'utf8');
const lines = code.split('\n');

function checkJSXAt(lineCount) {
  // Take lines from 0 to lineCount
  // We want to see if we can close it with dummy JSX closers.
  // Since we don't know the exact tag stack, we can try appending multiple closing divs/braces.
  let subCode = lines.slice(0, lineCount).join('\n');
  
  // Append dummy closers to close any open elements and the function itself
  subCode += '\n';
  for (let i = 0; i < 20; i++) {
    subCode += '</div>';
  }
  subCode += '\n)\n}\n';
  
  try {
    parser.parse(subCode, {
      sourceType: 'module',
      plugins: ['jsx']
    });
    return true; // Parsed without "Unterminated JSX contents" (or parsed completely)
  } catch (err) {
    if (err.message.includes('Unterminated JSX contents') || err.message.includes('Unexpected content after JSX')) {
      return false; // has unterminated JSX
    }
    // Any other parse error means the JSX was terminated, but there are other syntax issues
    return true;
  }
}

let low = 1520;
let high = 3300;
let answer = -1;

while (low <= high) {
  let mid = Math.floor((low + high) / 2);
  if (checkJSXAt(mid)) {
    // mid lines are terminated or fine
    low = mid + 1;
  } else {
    // mid lines contain the unterminated JSX
    answer = mid;
    high = mid - 1;
  }
}

console.log('Unterminated JSX contents is introduced at line:', answer);
if (answer !== -1) {
  console.log('Lines around it:');
  for (let i = Math.max(0, answer - 5); i < Math.min(lines.length, answer + 5); i++) {
    console.log(`${i+1}: ${lines[i]}`);
  }
}
