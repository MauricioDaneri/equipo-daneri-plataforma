import { db } from './db'

export async function seedPeleaTyC() {
  try {
    // 1. Obtener IDs de boxeadores (asumiendo que Iván ya existe, si no lo creamos)
    let ivan = await db.boxeadores.where('nombre').equals('Iván Danele').first()
    if (!ivan) {
      const ivanId = await db.boxeadores.add({
        nombre: 'Iván Danele',
        apodo: 'El Zurdo',
        categoriaPeso: 'Súper Pluma',
        estancia: 'Zurda',
        equipo: 'Equipo Daneri',
        estado: 'Activo',
        createdAt: Date.now(),
      })
      ivan = { id: ivanId, nombre: 'Iván Danele' }
    }

    // 2. Crear un oponente genérico (o específico si el usuario lo indica)
    let oponente = await db.boxeadores.where('nombre').equals('Oponente TyC').first()
    if (!oponente) {
      const opId = await db.boxeadores.add({
        nombre: 'Oponente TyC',
        apodo: 'Rival',
        categoriaPeso: 'Súper Pluma',
        estancia: 'Ortodoxa',
        equipo: 'Rival',
        estado: 'Activo',
        createdAt: Date.now(),
      })
      oponente = { id: opId, nombre: 'Oponente TyC' }
    }

    // 3. Crear la sesión
    const sesionId = await db.sesiones.add({
      fecha: '09/05/2026',
      rounds: 10,
      sintesis: 'Combate completo transmitido por TyC Sports. Iván Danele (Rojo). Pendiente de análisis detallado.',
      videoPath: 'PeleaCompleta Ivan tyc 9-05-2026.mp4',
      fullPath: 'E:\\Adobe Creative Cloud\\Marca_Boxeo_Papa\\02_Material_Crudo\\Videos\\PeleaCompleta Ivan tyc 9-05-2026.mp4',
      boxeadorRojoId: ivan.id,
      boxeadorAzulId: oponente.id,
      createdAt: Date.now(),
    })

    return { ok: true, sesionId, mensaje: 'Sesión TyC registrada con éxito.' }
  } catch (error) {
    console.error(error)
    return { ok: false, error: error.message }
  }
}
