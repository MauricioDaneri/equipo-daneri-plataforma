const fs = require('fs');
const babel = require('@babel/core');

const code = fs.readFileSync('src/vistas/EditorTactico.jsx', 'utf8');
const lines = code.split('\n');

function checkDerechaAt(lineCount) {
  let newLines = [...lines];
  
  // Keep up to lineCount
  let subLines = newLines.slice(0, lineCount);
  
  // Append dummy closing tags to close any open elements
  let subCode = subLines.join('\n');
  subCode += '\n';
  
  // We append many closing tags to satisfy any open JSX structures in Zona Derecha
  for (let i = 0; i < 20; i++) {
    subCode += '</div>';
  }
  // Close standard layout and page container and function
  subCode += '\n)\n}\n</div>\n)\n}\n';
  
  try {
    babel.parseSync(subCode, {
      presets: ['@babel/preset-react'],
      filename: 'temp.jsx'
    });
    return true; // Parses successfully without syntax errors
  } catch (err) {
    if (err.message.includes('Unterminated JSX contents') || err.message.includes('Unexpected content after JSX') || err.message.includes('expected "}"')) {
      return false; // Still has unterminated JSX or brace mismatch
    }
    // Any other error means it's closed, just standard JS details mismatched
    return true;
  }
}

let low = 2040;
let high = 2989;
let answer = -1;

while (low <= high) {
  let mid = Math.floor((low + high) / 2);
  if (checkDerechaAt(mid)) {
    // mid lines are terminated or fine
    low = mid + 1;
  } else {
    // mid lines contain the unterminated structure
    answer = mid;
    high = mid - 1;
  }
}

console.log('Unterminated JSX/brace is introduced at line:', answer);
if (answer !== -1) {
  console.log('Lines around it:');
  for (let i = Math.max(0, answer - 8); i < Math.min(lines.length, answer + 8); i++) {
    console.log(`${i+1}: ${lines[i]}`);
  }
}
