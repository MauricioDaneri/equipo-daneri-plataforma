const fs = require('fs');
const path = require('path');

const srcPath = path.join(__dirname, '..', 'src');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    if (isDirectory) {
      walkDir(dirPath, callback);
    } else {
      callback(dirPath);
    }
  });
}

const filesWithCounts = [];

walkDir(srcPath, (filePath) => {
  if (path.extname(filePath) === '.jsx' || path.extname(filePath) === '.js') {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    lines.forEach((line, index) => {
      if (line.includes('Golpe Conectado') || line.includes('Golpe Errado') || line.includes('tipo === \'Jab\'') || line.includes('tipo === "Jab"') || line.includes('.tipo ===') || line.includes('counts.')) {
        filesWithCounts.push({
          file: path.relative(srcPath, filePath),
          lineNum: index + 1,
          text: line.trim()
        });
      }
    });
  }
});

console.log(`Found ${filesWithCounts.length} matching lines:`);
filesWithCounts.forEach(item => {
  if (item.text.length < 150) {
    console.log(`${item.file}:${item.lineNum}: ${item.text}`);
  }
});
