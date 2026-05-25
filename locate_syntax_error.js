const fs = require('fs');
const babel = require('@babel/core');

const code = fs.readFileSync('src/vistas/EditorTactico.jsx', 'utf8');
const lines = code.split('\n');

// The return starts at line 1520 (index 1519)
// Let's replace from line 1520 to line 3302 with "return null;\n}"
const testLines = [
  ...lines.slice(0, 1519),
  '  return null;',
  '}',
  ...lines.slice(3303)
];

const testCode = testLines.join('\n');

try {
  babel.parseSync(testCode, {
    presets: ['@babel/preset-react'],
    filename: 'test.jsx'
  });
  console.log('SUCCESS: The logic and styles parsed perfectly when JSX return is null!');
} catch (err) {
  console.error('FAILED: Parsing failed even with empty return:');
  console.error(err.message);
}
