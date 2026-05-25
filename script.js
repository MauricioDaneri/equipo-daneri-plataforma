const babel = require('@babel/core');
const fs = require('fs');
const code = fs.readFileSync('src/vistas/EditorTactico.jsx', 'utf8').split('\n');
let low = 2000, high = 3109;
while(low <= high) {
  let mid = Math.floor((low + high) / 2);
  let chunk = code.slice(0, mid).join('\n') + '\n</div></div></div></div></div></div></div></div></div></div>';
  try {
    babel.transformSync(chunk, { presets: ['@babel/preset-react'], filename: 'EditorTactico.jsx' });
    low = mid + 1;
  } catch(e) {
    if(e.message.includes('expected ","')) {
      high = mid - 1;
    } else {
      low = mid + 1;
    }
  }
}
console.log('First line with expected comma is around', low);
