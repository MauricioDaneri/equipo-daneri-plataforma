const fs = require('fs');

const code = fs.readFileSync('temp.jsx', 'utf8');

// A very simple regex-based JSX tag parser to track tag nesting
// We only scan inside the return (...) block of EditorTactico
const lines = code.split('\n');

let inReturn = false;
let returnIndent = 0;
let stack = [];
let braceCount = 0;

for (let i = 0; i < lines.length; i++) {
  const lineNum = i + 1;
  const line = lines[i];

  if (line.includes('return (') && lineNum > 1500) {
    inReturn = true;
    console.log(`[Line ${lineNum}] Started return statement.`);
    continue;
  }

  if (!inReturn) continue;

  // Check for braces to see if we exit the component
  for (let ch of line) {
    if (ch === '{') braceCount++;
    else if (ch === '}') braceCount--;
  }

  // Look for JSX tags on this line
  // We want to find tag opens like <TagName and tag closes like </TagName> and self-closing like <TagName />
  // To avoid matching comparison operators, we can do some regex parsing
  let pos = 0;
  while (pos < line.length) {
    const nextLt = line.indexOf('<', pos);
    if (nextLt === -1) break;

    // Check if it's a comment
    if (line.substr(nextLt, 4) === '<!--' || line.substr(nextLt, 3) === '{/*') {
      pos = nextLt + 1;
      continue;
    }

    // Check if it's a closing tag like </div
    if (line.substr(nextLt, 2) === '</') {
      const endGt = line.indexOf('>', nextLt);
      if (endGt !== -1) {
        const tagContent = line.substring(nextLt + 2, endGt).trim().split(/\s+/)[0];
        const lastOpen = stack.pop();
        if (lastOpen !== tagContent) {
          console.log(`[Line ${lineNum}] ERROR: Mismatch! Closed </${tagContent}> but expected </${lastOpen}>. Active stack: ${stack.join(' > ')}`);
          // Put lastOpen back so we can keep going
          if (lastOpen) stack.push(lastOpen);
        } else {
          // console.log(`[Line ${lineNum}] Closed </${tagContent}>. Active stack: ${stack.join(' > ')}`);
        }
        pos = endGt + 1;
        continue;
      }
    }

    // Check if it's a standard tag open or self-closing
    // Must be < followed by a letter (or motion., etc)
    const afterLt = line.substr(nextLt + 1);
    const tagMatch = afterLt.match(/^([a-zA-Z0-9\.\_]+)/);
    if (tagMatch) {
      const tagName = tagMatch[1];
      const endGt = line.indexOf('>', nextLt);
      if (endGt !== -1) {
        // Is it self closing like <TagName ... />
        const tagSub = line.substring(nextLt, endGt + 1);
        if (tagSub.endsWith('/>')) {
          // Self closing, do nothing
          // console.log(`[Line ${lineNum}] Self-closed <${tagName}/>`);
        } else {
          stack.push(tagName);
          // console.log(`[Line ${lineNum}] Opened <${tagName}>. Active stack: ${stack.join(' > ')}`);
        }
        pos = endGt + 1;
        continue;
      }
    }

    pos = nextLt + 1;
  }

  if (line.trim() === ')' || line.trim() === ');') {
    console.log(`[Line ${lineNum}] Found end of return. Active stack: ${stack.join(' > ')}`);
  }
  if (line.trim() === '}') {
    console.log(`[Line ${lineNum}] Found closing brace of component. Active stack: ${stack.join(' > ')}`);
  }
}

console.log('Final remaining open tags:', stack);
