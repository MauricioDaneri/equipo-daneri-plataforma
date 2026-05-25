const fs = require('fs');
const code = fs.readFileSync('src/vistas/Inicio.jsx', 'utf8');
const lines = code.split('\n');
let stack = [];
let inString = false;
let stringChar = '';
let inComment = false;
let inJSXComment = false;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];

  for (let j = 0; j < line.length; j++) {
    const char = line[j];

    // Handle multi-line comment
    if (inComment) {
      if (char === '*' && line[j + 1] === '/') {
        inComment = false;
        j++;
      }
      continue;
    }

    // Handle JSX comments: {/* ... */}
    if (inJSXComment) {
      if (char === '*' && line[j + 1] === '/' && line[j + 2] === '}') {
        inJSXComment = false;
        j += 2;
      }
      continue;
    }

    // Handle strings
    if (inString) {
      if (char === '\\') {
        j++; // skip next char
        continue;
      }
      if (char === stringChar) {
        inString = false;
      }
      continue;
    }

    // Only look for comments when NOT inside a string
    if (char === '/' && line[j + 1] === '*') {
      inComment = true;
      j++;
      continue;
    }
    if (char === '/' && line[j + 1] === '/') {
      // Rest of the line is a comment
      break;
    }
    if (char === '{' && line[j + 1] === '/' && line[j + 2] === '}') {
      inJSXComment = true;
      j += 2;
      continue;
    }

    if (char === '"' || char === "'" || char === '`') {
      inString = true;
      stringChar = char;
      continue;
    }

    // Track braces
    if (char === '{' || char === '(' || char === '[') {
      stack.push({ char, line: i + 1, col: j + 1 });
    } else if (char === '}' || char === ')' || char === ']') {
      const top = stack[stack.length - 1];
      if (top) {
        const matches = (top.char === '{' && char === '}') ||
                        (top.char === '(' && char === ')') ||
                        (top.char === '[' && char === ']');
        if (matches) {
          stack.pop();
        } else {
          stack.pop();
        }
      }
    }
  }

  // Print stack size at useMemo scope
  if (i >= 28 && i < 185) {
    const hasUseMemo = stack.some(item => item.line === 29);
    if (!hasUseMemo) {
      console.log(`At line ${i + 1}, useMemo is NO LONGER on the stack! Stack size: ${stack.length}`);
      stack.forEach((item, idx) => {
        console.log(`  ${idx}: ${item.char} at line ${item.line}, col ${item.col}`);
      });
      break;
    }
  }
}
