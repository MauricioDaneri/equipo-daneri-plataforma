import { db } from '../servicios/db'

/**
 * Utilidades de Importación/Exportación de Showfiles (.daneri) estilo GrandMA
 * Permite empaquetar sesiones completas (boxeadores, eventos, anotaciones canvas)
 * y llevarlas a otra PC vinculándolas al video local correspondiente.
 */

/**
 * Exporta una sesión de análisis completa como archivo .daneri (JSON empaquetado)
 * @param {number} sesionId - ID de la sesión local
 */
export async function exportarSesionAShowfile(sesionId) {
  if (!sesionId) throw new Error('ID de sesión no proporcionado')

  // 1. Obtener la sesión
  const sesion = await db.sesiones.get(Number(sesionId))
  if (!sesion) throw new Error(`No se encontró la sesión con ID ${sesionId}`)

  // 2. Obtener los boxeadores asociados
  const boxeadorRojo = await db.boxeadores.get(Number(sesion.boxeadorRojoId))
  const boxeadorAzul = await db.boxeadores.get(Number(sesion.boxeadorAzulId))

  // 3. Obtener eventos y anotaciones asociados
  const eventos = await db.eventos.where('sesionId').equals(Number(sesionId)).toArray()
  const anotaciones = await db.anotaciones.where('sesionId').equals(Number(sesionId)).toArray()

  // 4. Estructurar el paquete del Showfile
  const showfileData = {
    tipo: 'daneri-showfile',
    version: '1.0',
    fechaExportacion: new Date().toISOString(),
    sesion: {
      fecha: sesion.fecha,
      rounds: sesion.rounds,
      sintesis: sesion.sintesis,
      videoPath: sesion.videoPath,
      createdAt: sesion.createdAt || Date.now()
    },
    boxeadores: [
      boxeadorRojo ? { nombre: boxeadorRojo.nombre, apodo: boxeadorRojo.apodo, categoriaPeso: boxeadorRojo.categoriaPeso, estancia: boxeadorRojo.estancia, foto: boxeadorRojo.foto, notas: boxeadorRojo.notas } : null,
      boxeadorAzul ? { nombre: boxeadorAzul.nombre, apodo: boxeadorAzul.apodo, categoriaPeso: boxeadorAzul.categoriaPeso, estancia: boxeadorAzul.estancia, foto: boxeadorAzul.foto, notas: boxeadorAzul.notas } : null
    ].filter(Boolean),
    eventos: eventos.map(ev => ({
      timestamp: ev.timestamp,
      tipo: ev.tipo,
      esquina: ev.esquina,
      nota: ev.nota
    })),
    anotaciones: anotaciones.map(an => ({
      videoTimestamp: an.videoTimestamp,
      canvasData: an.canvasData
    }))
  }

  // 5. Descargar archivo en el navegador/Electron
  const jsonString = JSON.stringify(showfileData, null, 2)
  const blob = new Blob([jsonString], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  
  const tempLink = document.createElement('a')
  tempLink.href = url
  
  const nombreRojo = boxeadorRojo ? boxeadorRojo.nombre.replace(/\s+/g, '_') : 'Desconocido'
  const nombreAzul = boxeadorAzul ? boxeadorAzul.nombre.replace(/\s+/g, '_') : 'Desconocido'
  tempLink.download = `${nombreRojo}_vs_${nombreAzul}_Showfile.daneri`
  
  document.body.appendChild(tempLink)
  tempLink.click()
  document.body.removeChild(tempLink)
  URL.revokeObjectURL(url)

  console.log(`[Showfile] Sesión ${sesionId} exportada correctamente.`)
  return true
}

/**
 * Importa un archivo .daneri en la base de datos local y lo vincula a un archivo de video local
 * @param {string} fileContent - Contenido JSON string del showfile
 * @param {string} localVideoPath - Ruta del archivo de video en la máquina local actual
 */
export async function importarShowfileEnEquipo(fileContent, localVideoPath) {
  if (!fileContent) throw new Error('Contenido del archivo vacío')
  if (!localVideoPath) throw new Error('Se requiere especificar un archivo de video local para el análisis')

  // 1. Parsear y validar
  const data = JSON.parse(fileContent)
  if (data.tipo !== 'daneri-showfile') {
    throw new Error('El archivo seleccionado no es un Showfile de Equipo Daneri válido (.daneri)')
  }

  const { sesion, boxeadores, eventos, anotaciones } = data
  if (!sesion) throw new Error('Estructura de sesión no encontrada en el Showfile')

  // 2. Procesar boxeadores e indexar mapeo de IDs
  const boxerMapping = {} // Mapeo de índices de origen a IDs locales de destino

  for (let i = 0; i < boxeadores.length; i++) {
    const b = boxeadores[i]
    if (!b) continue

    // Buscar si ya existe un boxeador con el mismo nombre en la base de datos
    const existente = await db.boxeadores.where('nombre').equals(b.nombre).first()
    
    if (existente) {
      boxerMapping[i] = existente.id
      console.log(`[Showfile Import] Boxeador existente mapeado: ${b.nombre} -> ID ${existente.id}`)
    } else {
      // Agregar como nuevo boxeador
      const nuevoId = await db.boxeadores.add({
        nombre: b.nombre,
        apodo: b.apodo || '',
        categoriaPeso: b.categoriaPeso || '',
        estancia: b.estancia || 'Ortodoxa',
        foto: b.foto || '',
        notas: b.notas || '',
        createdAt: Date.now()
      })
      boxerMapping[i] = nuevoId
      console.log(`[Showfile Import] Nuevo boxeador creado: ${b.nombre} -> ID ${nuevoId}`)
    }
  }

  // 3. Crear la nueva sesión vinculando los boxeadores correspondientes y el video local
  // Asignar IDs de boxeadores rojo y azul según correspondencia
  const localRojoId = boxerMapping[0] || null
  const localAzulId = boxerMapping[1] || null

  const nuevaSesion = {
    fecha: sesion.fecha,
    rounds: Number(sesion.rounds) || 4,
    sintesis: sesion.sintesis || '',
    videoPath: localVideoPath, // Vincular a la ruta local especificada
    boxeadorRojoId: localRojoId,
    boxeadorAzulId: localAzulId,
    createdAt: Date.now()
  }

  const nuevaSesionId = await db.sesiones.add(nuevaSesion)
  console.log(`[Showfile Import] Sesión creada con éxito. ID: ${nuevaSesionId}`)

  // 4. Inyectar eventos técnicos mapeados a la nueva sesión
  if (eventos && eventos.length > 0) {
    const eventosMapeados = eventos.map(ev => ({
      sesionId: nuevaSesionId,
      timestamp: Number(ev.timestamp),
      tipo: ev.tipo,
      esquina: ev.esquina,
      nota: ev.nota || ''
    }))
    await db.eventos.bulkAdd(eventosMapeados)
    console.log(`[Showfile Import] ${eventosMapeados.length} eventos tácticos importados.`)
  }

  // 5. Inyectar anotaciones vectoriales canvas mapeadas a la nueva sesión
  if (anotaciones && anotaciones.length > 0) {
    const anotacionesMapeadas = anotaciones.map(an => ({
      sesionId: nuevaSesionId,
      videoTimestamp: Number(an.videoTimestamp),
      canvasData: an.canvasData
    }))
    await db.anotaciones.bulkAdd(anotacionesMapeadas)
    console.log(`[Showfile Import] ${anotacionesMapeadas.length} trazos canvas importados.`)
  }

  return nuevaSesionId
}
