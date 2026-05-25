const fs = require('fs');
const babel = require('@babel/core');

const code = fs.readFileSync('src/vistas/EditorTactico.jsx', 'utf8');
const lines = code.split('\n');

const TABS = [
  { name: 'timeline', start: 2147, end: 2330 },
  { name: 'mapa', start: 2332, end: 2397 },
  { name: 'stats', start: 2400, end: 2504 },
  { name: 'ollama', start: 2507, end: 2762 },
  { name: 'voz', start: 2765, end: 2964 }
];

TABS.sort((a, b) => b.start - a.start);

let newLines = [...lines];

// Insert the closing div for the header container at line 2144 (index 2143 in original coordinates)
// Since we splice the tabs from bottom to top, we can do it safely.
// Let's first splice out all the tabs
TABS.forEach(tab => {
  newLines.splice(tab.start - 1, tab.end - tab.start + 1, `              {/* REPLACED TAB ${tab.name} */}`);
});

// Now let's find the position after line 2143 in the new array.
// The new array has modified line numbers. Let's find where "Pestañas (Tabs) tipo píldoras horizontales" is and insert after its closing div.
// Now let's find the position after line 2143 in the new array.
// Since all spliced tabs start at line 2147, the indices before 2147 do not shift!
// Line 2143 in 1-based indexing is index 2142. We want to insert right after it (index 2143).
let insertIndex = 2143;
newLines.splice(insertIndex, 0, '            </div>');
console.log(`Inserted closing div at line index ${insertIndex}`);


const testCode = newLines.join('\n');
try {
  babel.parseSync(testCode, {
    presets: ['@babel/preset-react'],
    filename: 'temp.jsx'
  });
  console.log('COMBINED FIX (TABS REMOVED + HEADER CLOSED) -> PARSED PERFECTLY!');
} catch (err) {
  console.log('COMBINED FIX -> FAILED:');
  console.log(err.message);
}
