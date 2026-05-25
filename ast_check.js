const fs = require('fs');
const parser = require('@babel/parser');

const code = fs.readFileSync('src/vistas/EditorTactico.jsx', 'utf8');
const lines = code.split('\n');

// Parse up to line 3303
const testCode = lines.slice(0, 3303).join('\n');

try {
  const ast = parser.parse(testCode, {
    sourceType: 'module',
    plugins: ['jsx']
  });
  console.log('Successfully parsed code up to line 3303!');
  const body = ast.program.body;
  const lastNode = body[body.length - 1];
  console.log('Last node type in AST:', lastNode.type);
  if (lastNode.type === 'ExportDefaultDeclaration') {
    console.log('Declaration type:', lastNode.declaration.type);
    console.log('Declaration body type:', lastNode.declaration.body.type);
  }
} catch (err) {
  console.error('Babel parser failed:');
  console.error(err.message);
  console.error('Stack:', err.stack);
}
