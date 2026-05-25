import { db } from './db'
import { dbFirestore } from './firebase'
import { collection, doc, setDoc, getDocs, writeBatch } from 'firebase/firestore'

/**
 * Módulo de sincronización en la nube (Firestore) para la Plataforma Equipo Daneri
 * Permite respaldar la base de datos IndexedDB en Firestore y restaurarla.
 */

// Sincroniza todos los datos locales hacia la nube (Firestore)
export async function sincronizarLocalHaciaNube(uid) {
  if (!uid) throw new Error('Se requiere el UID del usuario para sincronizar con la nube.')

  console.log('[Sync] Iniciando sincronización de local a la nube para UID:', uid)

  // Obtener datos locales de las tablas clave
  const boxeadores = await db.boxeadores.toArray()
  const sesiones = await db.sesiones.toArray()
  const eventos = await db.eventos.toArray()
  const anotaciones = await db.anotaciones.toArray()
  const configuracion = await db.configuracion.toArray()
  const analistas = await db.analistas.toArray()

  // Helper para subir datos en batches de 500 (límite de Firestore)
  const subirColeccion = async (nombreColeccion, items) => {
    if (!items || items.length === 0) return

    let batch = writeBatch(dbFirestore)
    let contador = 0

    for (const item of items) {
      const idStr = String(item.id)
      const docRef = doc(dbFirestore, 'usuarios', uid, nombreColeccion, idStr)
      
      let itemToSync = { ...item }
      
      // Sanitizar el videoPath en la nube para no revelar rutas de disco locales absolutas de Windows.
      // Guardamos sólo el nombre del archivo de video.
      if (nombreColeccion === 'sesiones' && itemToSync.videoPath) {
        const partes = itemToSync.videoPath.split(/[\\/]/)
        itemToSync.videoPath = partes[partes.length - 1] // E.g., "Ivan_vs_Leveti_22min.mp4"
      }

      batch.set(docRef, itemToSync)
      contador++

      if (contador === 500) {
        await batch.commit()
        batch = writeBatch(dbFirestore)
        contador = 0
      }
    }

    if (contador > 0) {
      await batch.commit()
    }
  }

  // Ejecutar subidas ordenadas
  await subirColeccion('boxeadores', boxeadores)
  await subirColeccion('sesiones', sesiones)
  await subirColeccion('eventos', eventos)
  await subirColeccion('anotaciones', anotaciones)
  await subirColeccion('configuracion', configuracion)
  await subirColeccion('analistas', analistas)

  console.log('[Sync] Sincronización de local a nube finalizada con éxito.')
  return {
    boxeadoresCount: boxeadores.length,
    sesionesCount: sesiones.length,
    eventosCount: eventos.length,
    anotacionesCount: anotaciones.length
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
