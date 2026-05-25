const fs = require('fs');
const babel = require('@babel/core');

const code = fs.readFileSync('src/vistas/EditorTactico.jsx', 'utf8');
const lines = code.split('\n');

function checkDerechaAt(lineCount) {
  let newLines = [...lines];
  let subLines = newLines.slice(0, lineCount);
  let subCode = subLines.join('\n');
  subCode += '\n';
  
  for (let i = 0; i < 20; i++) {
    subCode += '</div>';
  }
  subCode += '\n)\n}\n</div>\n)\n}\n';
  
  try {
    babel.parseSync(subCode, {
      presets: ['@babel/preset-react'],
      filename: 'temp.jsx'
    });
    return "SUCCESS";
  } catch (err) {
    return err.message.split('\n')[0];
  }
}

for (let i = 2040; i <= 2990; i += 100) {
  console.log(`Line ${i}: ${checkDerechaAt(i)}`);
}
