const fs = require('fs');
const code = fs.readFileSync('src/vistas/EditorTactico.jsx', 'utf8');
const lines = code.split('\n');
let stack = [];
for (let i = 2623; i <= 2878; i++) {
  const line = lines[i] || '';
  // simple self-closing check
  let tempLine = line.trim();
  if (tempLine.startsWith('//') || tempLine.startsWith('{/*')) continue;
  
  const matches = tempLine.match(/<div\b|<\/div>/g) || [];
  for (let m of matches) {
    if (m === '<div') {
      // check if this specific tag on the line is self closing
      // A quick check: does the line contain '/>' and not '>' before it?
      let isSelfClosing = false;
      let idx = tempLine.indexOf('<div');
      let sub = tempLine.substring(idx);
      let endOfTag = sub.indexOf('>');
      if (endOfTag !== -1) {
        let tagContent = sub.substring(0, endOfTag + 1);
        if (tagContent.endsWith('/>')) {
          isSelfClosing = true;
        }
      }
      if (!isSelfClosing) {
        stack.push({ line: i + 1, content: tempLine });
      }
    } else {
      stack.pop();
    }
  }
}
console.log('Unclosed divs at line 2720:', stack.map(s => s.line));
