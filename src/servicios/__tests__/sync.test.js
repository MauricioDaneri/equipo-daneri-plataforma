import { describe, it, expect, beforeEach, vi } from 'vitest'
import { db } from '../db'
import { importarShowfileEnEquipo } from '../../utils/showfile'

describe('Portabilidad de Combates - Showfiles (.daneri)', () => {
  beforeEach(async () => {
    // Limpiar base de datos mockeada antes de cada test
    await db.boxeadores.clear()
    await db.sesiones.clear()
    await db.eventos.clear()
    await db.anotaciones.clear()
  })

  it('debe poder importar un showfile (.daneri) correctamente mapeando boxeadores e inyectando eventos y marcas', async () => {
    // 1. Crear un boxeador existente localmente para verificar el mapeo inteligente
    const boxeadorRojoId = await db.boxeadores.add({
      nombre: 'Iván Danele',
      apodo: 'El Zurdo',
      categoriaPeso: 'Súper Pluma',
      estancia: 'Ortodoxa',
      foto: '',
      notas: 'Existente localmente.',
      createdAt: Date.now()
    })

    // 2. Definir los datos mock de un archivo .daneri
    const mockShowfile = {
      tipo: 'daneri-showfile',
      version: '1.0',
      fechaExportacion: new Date().toISOString(),
      sesion: {
        fecha: '2026-05-20',
        rounds: 4,
        sintesis: 'Excelente combate táctico.',
        videoPath: 'E:\\Origen\\pelea_original.mp4'
      },
      boxeadores: [
        { nombre: 'Iván Danele', apodo: 'El Zurdo', categoriaPeso: 'Súper Pluma', estancia: 'Ortodoxa', foto: '', notas: 'Existente localmente.' },
        { nombre: 'Marcelo Leveti', apodo: 'La Roca', categoriaPeso: 'Súper Pluma', estancia: 'Ortodoxa', foto: '', notas: 'Nuevo en esta PC.' }
      ],
      eventos: [
        { timestamp: 12.5, tipo: 'Jab', esquina: 'roja', nota: 'Buen jab para abrir guardia' },
        { timestamp: 15.2, tipo: 'Cross', esquina: 'azul', nota: 'Contragolpe de cross' }
      ],
      anotaciones: [
        { videoTimestamp: 12.5, canvasData: '{"objects":[]}' }
      ]
    }

    const jsonString = JSON.stringify(mockShowfile)
    const localVideoPath = 'C:\\Destino\\VideosLocal\\pelea_local.mp4'

    // 3. Importar showfile
    const nuevaSesionId = await importarShowfileEnEquipo(jsonString, localVideoPath)
    expect(nuevaSesionId).toBeDefined()

    // 4. Verificar mapeos de boxeadores
    const todosLosBoxeadores = await db.boxeadores.toArray()
    expect(todosLosBoxeadores.length).toBe(2) // Iván Danele (mapeado a existente) + Marcelo Leveti (creado nuevo)

    const leveti = todosLosBoxeadores.find(b => b.nombre === 'Marcelo Leveti')
    expect(leveti).toBeDefined()
    expect(leveti.apodo).toBe('La Roca')

    // 5. Verificar sesión creada y su videoPath mapeado localmente
    const sesionImportada = await db.sesiones.get(nuevaSesionId)
    expect(sesionImportada).toBeDefined()
    expect(sesionImportada.videoPath).toBe(localVideoPath) // Mapeado correctamente al local
    expect(sesionImportada.rounds).toBe(4)
    expect(sesionImportada.boxeadorRojoId).toBe(boxeadorRojoId) // Mapeado al boxeador local pre-existente
    expect(sesionImportada.boxeadorAzulId).toBe(leveti.id) // Mapeado al nuevo boxeador creado

    // 6. Verificar inyección de eventos técnicos
    const eventosSesion = await db.eventos.where('sesionId').equals(nuevaSesionId).toArray()
    expect(eventosSesion.length).toBe(2)
    expect(eventosSesion[0].tipo).toBe('Jab')
    expect(eventosSesion[0].esquina).toBe('roja')
    expect(eventosSesion[0].timestamp).toBe(12.5)

    // 7. Verificar inyección de anotaciones canvas
    const anotacionesSesion = await db.anotaciones.where('sesionId').equals(nuevaSesionId).toArray()
    expect(anotacionesSesion.length).toBe(1)
    expect(anotacionesSesion[0].videoTimestamp).toBe(12.5)
    expect(anotacionesSesion[0].canvasData).toBe('{"objects":[]}')
  })
})
