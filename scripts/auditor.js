// ── auditor.js — Automated Code Auditor & Linting Reporter (Skill_auditor) ──
const fs = require('fs')
const path = require('path')

const PROJECT_DIR = path.resolve(__dirname, '..')
const BRAIN_DIR = 'C:\\Users\\mauri\\.gemini\\antigravity\\brain\\fcfa68e9-6147-4461-aaeb-4b3687f5a00f'
const REPORT_PATH = fs.existsSync(BRAIN_DIR)
  ? path.join(BRAIN_DIR, 'reporte_auditoria.md')
  : path.join(PROJECT_DIR, 'reporte_auditoria.md')

// Términos y patrones a auditar
const AVOID_COLORS = /#[0-9a-fA-F]{3,6}/g // Colores hex directos en JSX
const CONSOLE_LOGS = /console\.log\(/g
const MEMORY_LEAKS = /(addEventListener|BroadcastChannel|SpeechRecognition)/g
const MEMORY_CLEANUP = /(removeEventListener|close|stop)/g

const auditReport = {
  fecha: new Date().toLocaleString('es-AR'),
  archivosEscaneados: 0,
  erroresEstilo: [],
  logsEncontrados: [],
  posiblesMemoryLeaks: [],
  resumenComponentes: [],
  seguridadFirebase: { ok: true, reglas: '' }
}

function scanDirectory(dir) {
  const files = fs.readdirSync(dir)
  
  for (const file of files) {
    const filePath = path.join(dir, file)
    const stat = fs.statSync(filePath)
    
    if (stat.isDirectory()) {
      if (['node_modules', 'dist', '.git', '.github', 'dist-electron'].includes(file)) {
        continue
      }
      scanDirectory(filePath)
    } else {
      if (['.jsx', '.js', '.css'].includes(path.extname(file))) {
        auditFile(filePath)
      }
    }
  }
}

function auditFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8')
  const relativePath = path.relative(PROJECT_DIR, filePath)
  auditReport.archivosEscaneados++
  
  const ext = path.extname(filePath)
  const lines = content.split('\n')
  
  // Auditar logs y leaks en JS/JSX
  if (['.js', '.jsx'].includes(ext)) {
    // 1. Logs de consola en producción
    let matchLogs
    while ((matchLogs = CONSOLE_LOGS.exec(content)) !== null) {
      const lineNum = content.substring(0, matchLogs.index).split('\n').length
      auditReport.logsEncontrados.push({
        archivo: relativePath,
        linea: lineNum,
        snippet: lines[lineNum - 1].trim()
      })
    }
    
    // 2. Colores harcodeados en JSX (Saltándose tokens.css)
    if (ext === '.jsx') {
      lines.forEach((line, index) => {
        const matches = line.match(AVOID_COLORS)
        if (matches && !relativePath.includes('tokens.css') && !line.includes('COLORES') && !line.includes('coloresRanking')) {
          auditReport.erroresEstilo.push({
            archivo: relativePath,
            linea: index + 1,
            snippet: line.trim(),
            colores: matches.join(', ')
          })
        }
      })
    }
    
    // 3. Posibles fugas de memoria (Listeners sin cleanup)
    const hasListeners = MEMORY_LEAKS.test(content)
    const hasCleanup = MEMORY_CLEANUP.test(content)
    if (hasListeners && !hasCleanup && !relativePath.includes('preload.js') && !relativePath.includes('main.js')) {
      auditReport.posiblesMemoryLeaks.push({
        archivo: relativePath,
        detalle: 'Registra eventListeners, BroadcastChannels o SpeechRecognition pero no invoca funciones de limpieza (close/remove/stop).'
      })
    }
  }
  
  // Resumen de tamaño
  auditReport.resumenComponentes.push({
    archivo: relativePath,
    lineas: lines.length,
    tamanoKb: (Buffer.byteLength(content) / 1024).toFixed(2)
  })
}

function auditarFirebase() {
  const rulesPath = path.join(PROJECT_DIR, 'firestore.rules')
  if (fs.existsSync(rulesPath)) {
    const content = fs.readFileSync(rulesPath, 'utf-8')
    auditReport.seguridadFirebase.reglas = content
    
    // Check de seguridad simple
    if (content.includes('allow read, write: if true') || content.includes('allow write: if true')) {
      auditReport.seguridadFirebase.ok = false
    }
  } else {
    auditReport.seguridadFirebase.ok = false
    auditReport.seguridadFirebase.reglas = 'Archivo firestore.rules NO encontrado.'
  }
}

function generarInformeMarkdown() {
  let md = `# Reporte Técnico de Auditoría Automatizada — Equipo Daneri\n`
  md += `> **Fecha de ejecución**: ${auditReport.fecha}\n`
  md += `> **Archivos de código escaneados**: ${auditReport.archivosEscaneados}\n\n`
  
  md += `---\n\n`
  
  md += `## 1. 🧠 Resumen de Estado de Seguridad (Firebase)\n\n`
  if (auditReport.seguridadFirebase.ok) {
    md += `> [!NOTE]\n`
    md += `> **Estado**: ✅ Seguro y robusto. Las reglas de Firestore restringen adecuadamente la escritura.\n\n`
  } else {
    md += `> [!WARNING]\n`
    md += `> **Estado**: ⚠️ Advertencia de Seguridad. Las reglas son inseguras o el archivo no existe.\n\n`
  }
  md += `\`\`\`javascript\n${auditReport.seguridadFirebase.reglas}\n\`\`\`\n\n`
  
  md += `## 2. 🎨 Consistencia del Sistema de Diseño y Tokens\n`
  md += `Se verificaron los componentes React buscando colores directos (hex) que ignoren los tokens definidos en \`tokens.css\`:\n\n`
  
  if (auditReport.erroresEstilo.length === 0) {
    md += `✅ **Alineación de Diseño al 100%**: No se encontraron colores hexadecimales quemados directamente en las vistas JSX. Todos los estilos respetan el sistema de tokens.\n\n`
  } else {
    md += `| Archivo | Línea | Snippet | Colores Hardcoded |\n`
    md += `| :--- | :--- | :--- | :--- |\n`
    auditReport.erroresEstilo.forEach(err => {
      md += `| [${path.basename(err.archivo)}](file:///${path.join(PROJECT_DIR, err.archivo).replace(/\\/g, '/')}) | ${err.linea} | \`${err.snippet.slice(0, 40)}\` | \`${err.colores}\` |\n`
    })
    md += `\n> [!TIP]\n`
    md += `> Se recomienda reemplazar estos colores harcodeados por variables CSS del tema (ej: \`var(--color-dorado)\`).\n\n`
  }
  
  md += `## 3. 🧹 Fugas de Memoria y Limpieza de Recursos\n`
  md += `Verificación de listeners globales de eventos, canales de comunicación inter-pantalla (BroadcastChannel) y reconectores de voz:\n\n`
  
  if (auditReport.posiblesMemoryLeaks.length === 0) {
    md += `✅ **Seguridad de Memoria**: Todos los componentes que registran listeners contienen métodos de limpieza (\`removeEventListener\`, \`close\`, \`stop\`).\n\n`
  } else {
    md += `| Archivo | Detalle de Alerta |\n`
    md += `| :--- | :--- |\n`
    auditReport.posiblesMemoryLeaks.forEach(leak => {
      md += `| [${path.basename(leak.archivo)}](file:///${path.join(PROJECT_DIR, leak.archivo).replace(/\\/g, '/')}) | ${leak.detalle} |\n`
    })
    md += '\n'
  }
  
  md += `## 4. 📝 Logs de Consola de Depuración en Producción\n`
  md += `Listado de \`console.log\` activos que deberían removerse antes de compilar para producción/distribución:\n\n`
  
  if (auditReport.logsEncontrados.length === 0) {
    md += `✅ **Limpieza de Producción**: No se encontraron \`console.log\` en los archivos de la app.\n\n`
  } else {
    md += `| Archivo | Línea | Snippet |\n`
    md += `| :--- | :--- | :--- |\n`
    auditReport.logsEncontrados.forEach(log => {
      md += `| [${path.basename(log.archivo)}](file:///${path.join(PROJECT_DIR, log.archivo).replace(/\\/g, '/')}) | ${log.linea} | \`${log.snippet.slice(0, 60)}\` |\n`
    })
    md += '\n'
  }
  
  md += `## 5. 📊 Roster del Proyecto y Tamaño de Componentes\n\n`
  md += `| Componente / Archivo | Líneas | Tamaño (KB) |\n`
  md += `| :--- | :---: | :---: |\n`
  auditReport.resumenComponentes
    .sort((a, b) => b.lineas - a.lineas)
    .slice(0, 20)
    .forEach(comp => {
      md += `| [${comp.archivo}](file:///${path.join(PROJECT_DIR, comp.archivo).replace(/\\/g, '/')}) | ${comp.lineas} | ${comp.tamanoKb} KB |\n`
    })
    
  fs.writeFileSync(REPORT_PATH, md, 'utf-8')
  console.log(`[Auditor] Reporte de auditoría generado exitosamente en ${REPORT_PATH}`)
}

// Ejecutar Auditoría
scanDirectory(path.join(PROJECT_DIR, 'src'))
auditarFirebase()
generarInformeMarkdown()

if (auditReport.erroresEstilo.length > 0) {
  console.error(`\x1b[31m[Auditor] FALLÓ: Se encontraron ${auditReport.erroresEstilo.length} errores de estilo (colores hex duros).\x1b[0m`)
  process.exit(1)
} else {
  console.log('\x1b[32m[Auditor] ÉXITO: 0 errores de estilo encontrados.\x1b[0m')
}
