import { db } from './db'
import { dbFirestore } from './firebase'
import { collection, doc, setDoc, getDocs, writeBatch } from 'firebase/firestore'

/**
 * Módulo de sincronización en la nube (Firestore) para la Plataforma Equipo Daneri
 * Permite respaldar la base de datos IndexedDB en Firestore y restaurarla.
 *
 * NOTA: Los batches se envían en bloques de 10 docs con 300ms de pausa entre ellos
 * para evitar saturar el write stream de Firestore (error resource-exhausted).
 * Se implementa un lock de concurrencia para evitar syncs paralelos.
 */

// ── Lock de concurrencia global ─────────────────────────────────────────────
let _syncEnProgreso = false
export function isSyncEnProgreso() { return _syncEnProgreso }

// Función para comprimir una imagen base64 de forma asíncrona usando canvas
async function comprimirBase64(base64Str, maxWidth = 256, maxHeight = 256) {
  if (!base64Str || typeof window === 'undefined' || !globalThis.Image || !base64Str.startsWith('data:image')) {
    return base64Str
  }
  
  if (base64Str.length < 50000) {
    return base64Str
  }

  return new Promise((resolve) => {
    try {
      const img = new Image()
      img.src = base64Str
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas')
          let width = img.width
          let height = img.height

          if (width > height) {
            if (width > maxWidth) {
              height = Math.round((height * maxWidth) / width)
              width = maxWidth
            }
          } else {
            if (height > maxHeight) {
              width = Math.round((width * maxHeight) / height)
              height = maxHeight
            }
          }

          canvas.width = width
          canvas.height = height
          const ctx = canvas.getContext('2d')
          if (!ctx) {
            resolve(base64Str)
            return
          }
          ctx.drawImage(img, 0, 0, width, height)
          
          const compressed = canvas.toDataURL('image/jpeg', 0.75)
          resolve(compressed)
        } catch (innerErr) {
          console.warn('[Sync] Fallo interno al dibujar en canvas:', innerErr)
          resolve(base64Str)
        }
      }
      img.onerror = () => {
        resolve(base64Str)
      }
    } catch (e) {
      console.warn('[Sync] Error creando Image:', e)
      resolve(base64Str)
    }
  })
}

// Helper recursivo para purgar cualquier propiedad con valor 'undefined' antes de enviar a Firestore
function sanitizarParaFirestore(obj) {
  if (obj === null || typeof obj !== 'object') return obj;
  const result = Array.isArray(obj) ? [] : {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      result[key] = typeof value === 'object' ? sanitizarParaFirestore(value) : value;
    }
  }
  return result;
}

// Sincroniza todos los datos locales hacia la nube (Firestore)
export async function sincronizarLocalHaciaNube(uid) {
  if (!uid) throw new Error('Se requiere el UID del usuario para sincronizar con la nube.')

  // Protección contra syncs concurrentes que saturan Firestore
  if (_syncEnProgreso) {
    console.warn('[Sync] Sincronización ya en progreso. Omitiendo solicitud duplicada.')
    return null
  }
  _syncEnProgreso = true

  try {
    console.log('[Sync] Iniciando sincronización de local a la nube para UID:', uid)

    // Obtener datos locales de las tablas clave
    const boxeadores = await db.boxeadores.toArray()
    const sesiones = await db.sesiones.toArray()
    const eventos = await db.eventos.toArray()
    const anotaciones = await db.anotaciones.toArray()
    const configuracion = await db.configuracion.toArray()
    const analistas = await db.analistas.toArray()

    // Helper para subir datos con throttling dinámico y reintentos con backoff
    const MAX_RETRIES = 3

    const subirColeccion = async (nombreColeccion, items, sizeLimit = 10, delayMs = 300) => {
      if (!items || items.length === 0) return

      let batch = writeBatch(dbFirestore)
      let contador = 0

      for (const item of items) {
        const idStr = String(item.id)
        const docRef = doc(dbFirestore, 'usuarios', uid, nombreColeccion, idStr)
        
        let itemToSync = sanitizarParaFirestore(item)
        
        // Comprimir foto base64 pesada de los boxeadores antes de sincronizar a Firestore
        if (nombreColeccion === 'boxeadores' && itemToSync.foto) {
          try {
            itemToSync.foto = await comprimirBase64(itemToSync.foto)
          } catch (errFoto) {
            console.warn('[Sync] Error comprimiendo foto de boxeador:', errFoto)
          }
        }
        
        // Sanitizar el videoPath en la nube para no revelar rutas de disco locales absolutas de Windows.
        // Guardamos sólo el nombre del archivo de video.
        if (nombreColeccion === 'sesiones' && itemToSync.videoPath) {
          const partes = itemToSync.videoPath.split(/[\\/]/)
          itemToSync.videoPath = partes[partes.length - 1] // E.g., "Ivan_vs_Leveti_22min.mp4"
        }

        batch.set(docRef, itemToSync)
        contador++

        if (contador === sizeLimit) {
          await commitBatchConRetry(batch, nombreColeccion, MAX_RETRIES)
          await new Promise(resolve => setTimeout(resolve, delayMs))
          batch = writeBatch(dbFirestore)
          contador = 0
        }
      }

      if (contador > 0) {
        await commitBatchConRetry(batch, nombreColeccion, MAX_RETRIES)
        await new Promise(resolve => setTimeout(resolve, delayMs))
      }
    }

    // Ejecutar subidas ordenadas con throttling adaptativo y períodos de enfriamiento (cooldown)
    // para permitir al SDK de Firestore vaciar su write stream interno y evitar resource-exhausted.
    await subirColeccion('boxeadores', boxeadores, 5, 500) // Lote pequeño por fotos base64
    await new Promise(resolve => setTimeout(resolve, 1200)) // Enfriamiento entre colecciones
    
    await subirColeccion('sesiones', sesiones, 10, 400)
    await new Promise(resolve => setTimeout(resolve, 1200))
    
    await subirColeccion('eventos', eventos, 100, 600) // Lote grande y espaciado para reducir 90% los commits
    await new Promise(resolve => setTimeout(resolve, 1200))
    
    await subirColeccion('anotaciones', anotaciones, 10, 500) // Puede contener JSONs pesados de Fabric
    await new Promise(resolve => setTimeout(resolve, 1200))
    
    await subirColeccion('configuracion', configuracion, 20, 300)
    await new Promise(resolve => setTimeout(resolve, 1200))
    
    await subirColeccion('analistas', analistas, 20, 300)

    console.log('[Sync] Sincronización de local a nube finalizada con éxito.')
    return {
      boxeadoresCount: boxeadores.length,
      sesionesCount: sesiones.length,
      eventosCount: eventos.length,
      anotacionesCount: anotaciones.length
    }
  } finally {
    _syncEnProgreso = false
  }
}

// Helper: Commit un batch con reintentos y backoff exponencial
async function commitBatchConRetry(batch, coleccion, maxRetries) {
  for (let intento = 0; intento < maxRetries; intento++) {
    try {
      await batch.commit()
      return
    } catch (err) {
      const esRecursoAgotado = err?.code === 'resource-exhausted' || err?.message?.includes('resource-exhausted')
      if (esRecursoAgotado && intento < maxRetries - 1) {
        const backoffMs = Math.min(1000 * Math.pow(2, intento), 8000) // 1s, 2s, 4s, max 8s
        console.warn(`[Sync] Firestore resource-exhausted en ${coleccion}. Reintentando en ${backoffMs}ms... (intento ${intento + 1}/${maxRetries})`)
        await new Promise(resolve => setTimeout(resolve, backoffMs))
      } else {
        throw err
      }
    }
  }
}

// Descarga todos los datos desde la nube (Firestore) y los aplica en la base de datos local
export async function sincronizarNubeHaciaLocal(uid) {
  if (!uid) throw new Error('Se requiere el UID del usuario para descargar los datos de la nube.')

  console.log('[Sync] Sincronización de nube a local para UID:', uid)

  const descargarColeccion = async (nombreColeccion) => {
    const colRef = collection(dbFirestore, 'usuarios', uid, nombreColeccion)
    const snapshot = await getDocs(colRef)
    const items = []
    snapshot.forEach(doc => {
      const data = doc.data()
      // Asegurarnos de mantener el id en formato numérico si corresponde
      if (data.id !== undefined && !isNaN(Number(data.id))) {
        data.id = Number(data.id)
      }
      // También mapear otros IDs forzando tipos numéricos
      if (data.boxeadorRojoId !== undefined && !isNaN(Number(data.boxeadorRojoId))) {
        data.boxeadorRojoId = Number(data.boxeadorRojoId)
      }
      if (data.boxeadorAzulId !== undefined && !isNaN(Number(data.boxeadorAzulId))) {
        data.boxeadorAzulId = Number(data.boxeadorAzulId)
      }
      if (data.sesionId !== undefined && !isNaN(Number(data.sesionId))) {
        data.sesionId = Number(data.sesionId)
      }
      items.push(data)
    })
    return items
  }

  // Descargar colecciones
  const boxeadores = await descargarColeccion('boxeadores')
  const sesiones = await descargarColeccion('sesiones')
  const eventos = await descargarColeccion('eventos')
  const anotaciones = await descargarColeccion('anotaciones')
  const configuracion = await descargarColeccion('configuracion')
  const analistas = await descargarColeccion('analistas')

  // Escribir en base de datos local mediante transacción Dexie
  await db.transaction('rw', [db.boxeadores, db.sesiones, db.eventos, db.anotaciones, db.configuracion, db.analistas], async () => {
    for (const item of boxeadores) {
      await db.boxeadores.put(item)
    }
    
    for (const item of sesiones) {
      // Si la sesión ya existe localmente y posee una ruta local absoluta válida de Windows,
      // preservamos esa ruta en lugar de sobreescribirla con el nombre plano de la nube.
      if (item.id) {
        const sesionLocal = await db.sesiones.get(item.id)
        if (sesionLocal && sesionLocal.videoPath && sesionLocal.videoPath.includes('\\')) {
          item.videoPath = sesionLocal.videoPath
        }
      }
      await db.sesiones.put(item)
    }
    
    for (const item of eventos) {
      await db.eventos.put(item)
    }
    
    for (const item of anotaciones) {
      await db.anotaciones.put(item)
    }
    
    for (const item of analistas) {
      await db.analistas.put(item)
    }
    
    for (const item of configuracion) {
      await db.configuracion.put(item)
    }
  })

  console.log('[Sync] Sincronización de nube a local finalizada con éxito.')
  return {
    boxeadoresCount: boxeadores.length,
    sesionesCount: sesiones.length,
    eventosCount: eventos.length,
    anotacionesCount: anotaciones.length
  }
}
