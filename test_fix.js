const fs = require('fs');
const babel = require('@babel/core');

const code = fs.readFileSync('src/vistas/EditorTactico.jsx', 'utf8');
const lines = code.split('\n');

// Insert </div> at line 2144 (index 2143)
let newLines = [...lines];
newLines.splice(2143, 0, '            </div>');

const testCode = newLines.join('\n');
try {
  babel.parseSync(testCode, {
    presets: ['@babel/preset-react'],
    filename: 'temp.jsx'
  });
  console.log('OH MY GOD! INSERTING </div> AT LINE 2144 FIXED THE ENTIRE COMPILATION!');
} catch (err) {
  console.log('Adding </div> did not fully fix. Current error:');
  console.log(err.message);
}
