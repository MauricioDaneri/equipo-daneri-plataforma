const fs = require('fs');
const babel = require('@babel/core');

try {
  const code = fs.readFileSync('src/vistas/EditorTactico.jsx', 'utf8');
  babel.parseSync(code, {
    presets: ['@babel/preset-react'],
    filename: 'EditorTactico.jsx'
  });
  console.log('Babel successfully parsed the file!');
} catch (err) {
  console.error('Babel syntax error:');
  console.error(err.message);
}
