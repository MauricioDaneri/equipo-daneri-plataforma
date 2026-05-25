const fs = require('fs');
const code = fs.readFileSync('temp.jsx', 'utf8');
const lines = code.split('\n');

let tagStack = [];

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  
  // Strip out comments and strings to make regex matching safe
  let cleanLine = line;
  cleanLine = cleanLine.replace(/\{\/\*.*?\*\/\}/g, ''); // strip JSX inline comments
  cleanLine = cleanLine.replace(/\/\/.*/g, ''); // strip single-line comments
  
  // Find JSX tags
  // A regex that matches:
  // 1. Closing tags: <\/([a-zA-Z0-9\._\-]+)>
  // 2. Self-closing tags: <([a-zA-Z0-9\._\-]+)(?:\s+[^>]*?)?\/>
  // 3. Opening tags: <([a-zA-Z0-9\._\-]+)(?:\s+[^>]*?)?>
  // Note: We need to parse them in order.
  
  const tagRegex = /<\/([a-zA-Z0-9\._\-]+)>|<([a-zA-Z0-9\._\-]+)(?:\s+[^>]*?)?(\/?)>/g;
  let match;
  
  while ((match = tagRegex.exec(cleanLine)) !== null) {
    const fullMatch = match[0];
    const closingTagName = match[1];
    const openingTagName = match[2];
    const isSelfClosing = match[3] === '/';
    
    // Ignore native self-closing HTML tags
    const ignoreSelfClosing = ['img', 'input', 'br', 'hr', 'link', 'meta'];
    
    if (closingTagName) {
      // It is a closing tag
      if (ignoreSelfClosing.includes(closingTagName.toLowerCase())) continue;
      
      const top = tagStack[tagStack.length - 1];
      if (top && top.name === closingTagName) {
        tagStack.pop();
      } else {
        console.log(`Mismatch at line ${i+1}: Closing </${closingTagName}> but stack top is ${top ? `<${top.name}> opened at line ${top.line}` : 'empty'}`);
        if (top) tagStack.pop();
      }
    } else if (openingTagName) {
      // It is an opening or self-closing tag
      const nameLower = openingTagName.toLowerCase();
      if (ignoreSelfClosing.includes(nameLower) || isSelfClosing) {
        // It is self-closing, ignore
        continue;
      }
      
      tagStack.push({ name: openingTagName, line: i + 1 });
    }
  }
}

console.log('--- FINAL TAG STACK ---');
tagStack.forEach(t => {
  console.log(`<${t.name}> opened at line ${t.line}`);
});
