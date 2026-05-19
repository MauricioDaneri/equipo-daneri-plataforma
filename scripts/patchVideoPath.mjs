/**
 * patchVideoPath.mjs
 * ==================
 * Parcha la sesión de Iván vs Leveti en IndexedDB (Dexie)
 * directamente desde Node.js inyectando la URL daneri-file://
 *
 * Uso: node scripts/patchVideoPath.mjs
 */

// Verificar que el archivo de video existe
import fs   from 'fs'
import path from 'path'

const RUTA_VIDEO = 'E:\\Adobe Creative Cloud\\Marca_Boxeo_Papa\\02_Material_Crudo\\Videos\\PeleaCompleta Ivan tyc 9-05-2026.mp4'
const URL_VIDEO  = 'daneri-file:///' + RUTA_VIDEO.replace(/\\/g, '/')

console.log('\n🎬 Script: Patch Video Path — Equipo Daneri')
console.log('─'.repeat(60))

if (fs.existsSync(RUTA_VIDEO)) {
  const stats = fs.statSync(RUTA_VIDEO)
  console.log(`✅ Video encontrado: ${path.basename(RUTA_VIDEO)}`)
  console.log(`   Tamaño: ${(stats.size / 1024 / 1024).toFixed(1)} MB`)
  console.log(`   URL generada: ${URL_VIDEO}`)
  
  // Escribir la URL a un archivo temporal para que la app lo lea
  const patchData = JSON.stringify({
    videoPath: URL_VIDEO,
    videoNombre: path.basename(RUTA_VIDEO),
    videoTamano: stats.size,
    ts: Date.now()
  }, null, 2)
  
  fs.writeFileSync('scripts/video_patch_result.json', patchData, 'utf8')
  console.log(`\n✅ Resultado guardado en: scripts/video_patch_result.json`)
  console.log(`\nLa app leerá esta URL al cargar el editor.`)
} else {
  console.log(`❌ Archivo NO encontrado: ${RUTA_VIDEO}`)
  console.log(`\n   Verificá que:`)
  console.log(`   1. El disco E: está montado`)
  console.log(`   2. La ruta es correcta`)
  process.exit(1)
}
