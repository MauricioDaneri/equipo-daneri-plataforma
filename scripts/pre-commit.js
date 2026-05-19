const { spawnSync } = require('child_process');
const path = require('path');

const PROJECT_DIR = path.resolve(__dirname, '..');

console.log('\x1b[36m%s\x1b[0m', '🛡️  [Pre-Commit Hook] Iniciando verificaciones de calidad...');

// 1. Ejecutar el Auditor de Estilos y Seguridad
console.log('\x1b[33m%s\x1b[0m', '🔍 [Pre-Commit] 1/2. Ejecutando auditoría estática (npm run audit)...');
const auditRes = spawnSync('npm', ['run', 'audit'], {
  cwd: PROJECT_DIR,
  stdio: 'inherit',
  shell: true
});

if (auditRes.status !== 0) {
  console.error('\x1b[31m%s\x1b[0m', '❌ [Pre-Commit] Error: La auditoría detectó fallos. Commit rechazado.');
  process.exit(1);
}

// 2. Ejecutar la suite de pruebas unitarias
console.log('\x1b[33m%s\x1b[0m', '🧪 [Pre-Commit] 2/2. Ejecutando pruebas unitarias (npm run test)...');
const testRes = spawnSync('npm', ['run', 'test'], {
  cwd: PROJECT_DIR,
  stdio: 'inherit',
  shell: true
});

if (testRes.status !== 0) {
  console.error('\x1b[31m%s\x1b[0m', '❌ [Pre-Commit] Error: Algunas pruebas fallaron. Commit rechazado.');
  process.exit(1);
}

console.log('\x1b[32m%s\x1b[0m', '✅ [Pre-Commit] ¡Excelente! Todas las verificaciones pasaron con éxito. Procediendo con el commit...');
process.exit(0);
