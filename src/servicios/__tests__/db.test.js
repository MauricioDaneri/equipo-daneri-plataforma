import { describe, it, expect, beforeEach } from 'vitest'
import { db, migrarFechasSesiones } from '../db'
import { seedIvanVsLeveti, limpiarSeedIvanVsLeveti, arreglarEsquinas } from '../seedIvanVsLeveti'

describe('Base de Datos local Dexie - DaneriAnalystDB', () => {
  beforeEach(async () => {
    // Limpiar base de datos local mockeada antes de cada test
    await db.boxeadores.clear()
    await db.sesiones.clear()
    await db.eventos.clear()
  })

  it('debe tener definidas las tablas correctas', () => {
    expect(db.boxeadores).toBeDefined()
    expect(db.sesiones).toBeDefined()
    expect(db.eventos).toBeDefined()
    expect(db.configuracion).toBeDefined()
    expect(db.analistas).toBeDefined()
  })

  it('debe inicializar la configuración por defecto', async () => {
    // Forzar ejecución del evento ready de Dexie cerrando y abriendo
    await db.close()
    await db.open()
    const config = await db.configuracion.get(1)
    expect(config).toBeDefined()
    expect(config.analistaNombre).toBe('Mauricio Daneri')
    expect(config.ollamaUrl).toBe('http://localhost:11434')
    expect(config.hotkeys).toBeDefined()
  })

  it('debe poder insertar y recuperar un boxeador', async () => {
    const id = await db.boxeadores.add({
      nombre: 'Iván Danele',
      apodo: 'El Zurdo',
      categoriaPeso: 'Súper Pluma',
      estancia: 'Ortodoxa',
      foto: '',
      notas: 'Buen golpeador de contragolpe.',
      createdAt: Date.now()
    })

    const boxeador = await db.boxeadores.get(id)
    expect(boxeador).toBeDefined()
    expect(boxeador.nombre).toBe('Iván Danele')
    expect(boxeador.apodo).toBe('El Zurdo')
  })

  it('debe ejecutar el script de seed para Iván vs Leveti', async () => {
    const res = await seedIvanVsLeveti()
    expect(res.ok).toBe(true)
    expect(res.ivanId).toBeDefined()
    expect(res.levetiId).toBeDefined()
    expect(res.sesionId).toBeDefined()

    // Verificar boxeadores insertados
    const ivan = await db.boxeadores.get(res.ivanId)
    const leveti = await db.boxeadores.get(res.levetiId)
    expect(ivan.nombre).toBe('Iván Danele')
    expect(leveti.nombre).toBe('Leveti')

    // Verificar sesión insertada
    const sesion = await db.sesiones.get(res.sesionId)
    expect(sesion).toBeDefined()
    expect(sesion.rounds).toBe(4)

    // Verificar eventos asociados
    const totalEventos = await db.eventos.where('sesionId').equals(res.sesionId).count()
    expect(totalEventos).toBe(res.totalEventos)
  })

  it('debe poder corregir esquinas si están invertidas', async () => {
    // Forzar semilla inicial
    const seed = await seedIvanVsLeveti()
    
    // Invertir esquinas en la sesión a propósito
    await db.sesiones.update(seed.sesionId, {
      boxeadorRojoId: seed.levetiId, // Invertido
      boxeadorAzulId: seed.ivanId
    })

    // Correr script de reparación
    const resReparacion = await arreglarEsquinas()
    expect(resReparacion.ok).toBe(true)

    // Verificar que Iván sea Rincón Rojo y Leveti Rincón Azul
    const sesionCorregida = await db.sesiones.get(seed.sesionId)
    expect(sesionCorregida.boxeadorRojoId).toBe(seed.ivanId)
    expect(sesionCorregida.boxeadorAzulId).toBe(seed.levetiId)
  })

  it('debe poder limpiar los datos del seed correctamente', async () => {
    await seedIvanVsLeveti()
    
    // Limpiar seed
    const resLimpieza = await limpiarSeedIvanVsLeveti()
    expect(resLimpieza.ok).toBe(true)

    const totalBoxeadores = await db.boxeadores.count()
    const totalSesiones = await db.sesiones.count()
    const totalEventos = await db.eventos.count()

    expect(totalBoxeadores).toBe(0)
    expect(totalSesiones).toBe(0)
    expect(totalEventos).toBe(0)
  })

  it('debe migrar fechas con formato DD/MM/YYYY a YYYY-MM-DD en el ready hook', async () => {
    const id = await db.sesiones.add({
      fecha: '20/05/2026',
      boxeadorRojoId: 1,
      boxeadorAzulId: 2,
      rounds: 12,
      videoPath: 'E:\\Videos\\pelea.mp4',
      esBorrador: false,
      createdAt: Date.now()
    })

    await migrarFechasSesiones(db)

    const sesion = await db.sesiones.get(id)
    expect(sesion.fecha).toBe('2026-05-20')
  })
})
