const fs = require('fs');
const code = fs.readFileSync('src/vistas/EditorTactico.jsx', 'utf8');
const lines = code.split('\n');
let tags = [];

let firstMismatchPrinted = false;

for (let i = 1520; i < 3300; i++) {
  const line = lines[i];
  
  let cleanLine = '';
  let braceCount = 0;
  let inQuote = false;
  let quoteChar = '';
  
  for (let j = 0; j < line.length; j++) {
    const char = line[j];
    if (inQuote) {
      if (char === quoteChar) inQuote = false;
      continue;
    }
    if (char === '"' || char === "'") {
      inQuote = true;
      quoteChar = char;
      continue;
    }
    if (char === '{') {
      braceCount++;
      continue;
    }
    if (char === '}') {
      braceCount--;
      continue;
    }
    if (braceCount === 0) {
      cleanLine += char;
    }
  }

  const matches = cleanLine.match(/<[a-zA-Z0-9\._\-]+(?:\s+\/>|\s*\/?>)|<\/[a-zA-Z0-9\._\-]+>/g) || [];
  
  for (let m of matches) {
    if (m.endsWith('/>')) {
      continue;
    }
    
    if (m.startsWith('</')) {
      const tagName = m.substring(2, m.length - 1).trim();
      const top = tags[tags.length - 1];
      if (top && top.name === tagName) {
        tags.pop();
      } else {
        if (!firstMismatchPrinted) {
          console.log(`FIRST MISMATCH at line ${i+1}: found closing tag ${m} but top of stack was ${top ? `<${top.name}> from line ${top.line}` : 'empty'}`);
          console.log('Current tag stack (last 10):');
          console.log(tags.slice(-10));
          firstMismatchPrinted = true;
        }
        if (top) tags.pop();
      }
    } else {
      const tagName = m.substring(1, m.length - 1).replace('/', '').trim().split(/\s+/)[0];
      if (tagName === 'img' || tagName === 'input' || tagName === 'br' || tagName === 'hr') continue;
      tags.push({ name: tagName, line: i+1 });
    }
  }
}
