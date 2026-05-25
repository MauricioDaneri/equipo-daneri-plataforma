const fs = require('fs');
const code = fs.readFileSync('temp.jsx', 'utf8');
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

    if (inComment) {
      if (char === '*' && line[j + 1] === '/') {
        inComment = false;
        j++;
      }
      continue;
    }

    if (inJSXComment) {
      if (char === '*' && line[j + 1] === '/' && line[j + 2] === '}') {
        inJSXComment = false;
        j += 2;
      }
      continue;
    }

    if (inString) {
      if (char === '\\') {
        j++;
        continue;
      }
      if (char === stringChar) {
        inString = false;
      }
      continue;
    }

    if (char === '/' && line[j + 1] === '*') {
      inComment = true;
      j++;
      continue;
    }
    if (char === '/' && line[j + 1] === '/') {
      break;
    }
    if (char === '{' && line[j + 1] === '/' && line[j + 2] === '*') {
      inJSXComment = true;
      j += 2;
      continue;
    }

    if (char === '"' || char === "'" || char === '`') {
      inString = true;
      stringChar = char;
      continue;
    }

    if (char === '{' || char === '(' || char === '[') {
      stack.push({ char, line: i + 1, col: j + 1 });
    } else if (char === '}' || char === ')' || char === ']') {
      if (stack.length === 0) {
        console.log(`EXTRA CLOSING '${char}' at line ${i+1}, col ${j+1}`);
      } else {
        const top = stack.pop();
        const matches = (top.char === '{' && char === '}') ||
                        (top.char === '(' && char === ')') ||
                        (top.char === '[' && char === ']');
        if (!matches) {
          console.log(`MISMATCH: opened '${top.char}' at line ${top.line}:${top.col}, but closed with '${char}' at line ${i+1}:${j+1}`);
        }
      }
    }
  }
}

if (stack.length > 0) {
  console.log('UNCLOSED BRACES:');
  stack.forEach(item => {
    console.log(`'${item.char}' opened at line ${item.line}:${item.col}`);
  });
} else {
  console.log('All character-level braces match in temp.jsx!');
}
