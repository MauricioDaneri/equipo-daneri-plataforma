const fs = require('fs');
const babel = require('@babel/core');

const code = fs.readFileSync('src/vistas/EditorTactico.jsx', 'utf8');
const lines = code.split('\n');

function tryParse(lineCount) {
  let subCode = lines.slice(0, lineCount).join('\n');
  
  // To make it parseable, we need to close any unclosed functions/JSX/braces.
  // We can count how many unclosed { and ( there are in the slice, and append matching close chars.
  let stack = [];
  let inString = false;
  let stringChar = '';
  let inComment = false;
  let inJSXComment = false;

  for (let i = 0; i < lineCount; i++) {
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
      if (char === '{' || char === '(') {
        stack.push(char);
      } else if (char === '}' || char === ')') {
        if (stack.length > 0) stack.pop();
      }
    }
  }

  // Close comments/strings
  if (inComment) subCode += ' */';
  if (inJSXComment) subCode += ' */}';
  if (inString) subCode += stringChar;

  // Append dummy closing braces
  while (stack.length > 0) {
    const top = stack.pop();
    if (top === '{') subCode += '\n}';
    if (top === '(') subCode += '\n)';
  }

  try {
    babel.parseSync(subCode, {
      presets: ['@babel/preset-react'],
      filename: 'temp.jsx'
    });
    return true;
  } catch (err) {
    return err.message;
  }
}

// Let's run a binary search between line 1500 and 3300
let low = 1500;
let high = 3300;
let answer = -1;

while (low <= high) {
  let mid = Math.floor((low + high) / 2);
  let res = tryParse(mid);
  if (res === true) {
    // mid lines parsed fine, error is later
    low = mid + 1;
  } else {
    // error is at mid or earlier
    answer = mid;
    high = mid - 1;
  }
}

console.log('First line where syntax error appears:', answer);
if (answer !== -1) {
  console.log('Error message at that line:');
  console.log(tryParse(answer));
  console.log('Lines around it:');
  for (let i = Math.max(0, answer - 5); i < Math.min(lines.length, answer + 5); i++) {
    console.log(`${i+1}: ${lines[i]}`);
  }
}
