const fs = require('fs');
const code = fs.readFileSync('src/vistas/EditorTactico.jsx', 'utf8');
const lines = code.split('\n');
let tags = [];

for (let i = 2040; i < 2989; i++) {
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

  // Find tags
  const matches = cleanLine.match(/<[a-zA-Z0-9\._\-]+(?:\s+\/>|\s*\/?>)|<\/[a-zA-Z0-9\._\-]+>/g) || [];
  
  for (let m of matches) {
    if (m.endsWith('/>')) continue;
    
    if (m.startsWith('</')) {
      const tagName = m.substring(2, m.length - 1).trim();
      const top = tags[tags.length - 1];
      if (top && top.name === tagName) {
        tags.pop();
      } else {
        // Only print mismatch if it's really a mismatch of a known top tag
        if (top) {
          console.log(`Mismatch at line ${i+1}: closing </${tagName}>, but top was <${top.name}> from line ${top.line}`);
          tags.pop();
        }
      }
    } else {
      const tagName = m.substring(1, m.length - 1).replace('/', '').trim().split(/\s+/)[0];
      if (tagName === 'img' || tagName === 'input' || tagName === 'br' || tagName === 'hr') continue;
      tags.push({ name: tagName, line: i+1 });
    }
  }
}

console.log('--- Open tags at line 2989 ---');
tags.forEach(t => console.log(`<${t.name}> opened at line ${t.line}`));
