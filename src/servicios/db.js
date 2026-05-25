/**
 * db.js — Base de datos local con Dexie.js (IndexedDB)
 * Plataforma de Análisis — Equipo Daneri
 * Skill_DexieDB + Skill_GestionBoxeadores + Skill_Sesiones
 *
 * IMPORTANTE: Agregar nuevas columnas SIEMPRE incrementando la versión.
 * Nunca modificar el esquema de una versión existente.
 */

import Dexie from 'dexie'

export const db = new Dexie('DaneriAnalystDB')

db.version(1).stores({
  // ── Perfiles de Boxeadores ─────────────────────────────────────────
  boxeadores: '++id, nombre, apodo, categoriaPeso, estancia, foto, notas, createdAt',

  // ── Sesiones de Análisis ───────────────────────────────────────────
  // Cada sesión corresponde a un video + análisis completo
  sesiones: '++id, fecha, boxeadorRojoId, boxeadorAzulId, rounds, sintesis, videoPath, createdAt',

  // ── Eventos de la Línea de Tiempo ─────────────────────────────────
  // Vinculados a una sesión. tipo = botón de acción o estado físico
  // esquina: 'roja' | 'azul' | 'general'
  eventos: '++id, sesionId, timestamp, tipo, esquina, nota',

  // ── Anotaciones de Canvas (Fabric.js) ─────────────────────────────
  // canvasData = resultado de canvas.toJSON() serializado
  anotaciones: '++id, sesionId, videoTimestamp, canvasData',

  // ── Configuración de la Plataforma ────────────────────────────────
  // Un único registro con id=1 (upsert)
  configuracion: 'id, ollamaUrl, ollamaModelo, analistaNombre',
})

db.version(2).stores({
  // ── Analistas (Entrenadores) ──────────────────────────────────────
  analistas: '++id, nombre, rol, activo, createdAt',
})

db.version(3).stores({
  // ── Registro de Errores Técnicos (Antigravity Bridge) ──────────────
  logsErrores: '++id, fecha, errorMensaje, stackTrace, vista, sesionId',
})

db.version(4).stores({
  // ── Optimización de Índices de Base de Datos local ─────────────────
  // Eliminamos índices pesados (foto, notas, sintesis, canvasData)
  // que causan errores DataError por límite de tamaño de clave en IndexedDB
  boxeadores: '++id, nombre, createdAt',
  sesiones: '++id, fecha, boxeadorRojoId, boxeadorAzulId, videoPath',
  eventos: '++id, sesionId, timestamp, tipo, esquina',
  anotaciones: '++id, sesionId, videoTimestamp',
  
  // Mantenemos las tablas agregadas en versiones anteriores para evitar que Dexie las elimine
  configuracion: 'id, ollamaUrl, ollamaModelo, analistaNombre',
  analistas: '++id, nombre, rol, activo, createdAt',
  logsErrores: '++id, fecha, errorMensaje, stackTrace, vista, sesionId',
})

// ── Datos iniciales (seed) ─────────────────────────────────────────────────
db.on('ready', async () => {
  // Limpiar bandera de borrado manual si hay datos existentes
  try {
    const totalBoxeadores = await db.boxeadores.count()
    const totalSesiones = await db.sesiones.count()
    if (totalBoxeadores > 0 || totalSesiones > 0) {
      localStorage.removeItem('db_manually_cleared')
    }
  } catch (err) {
    console.error('[DB ready hook] Error comprobando volumen inicial:', err)
  }

  const defaultHotkeys = {
    'RinconRojo': 'KeyQ', 'RinconAzul': 'KeyW',
    'Jab': 'KeyJ', 'Recto': 'KeyR', 'Cross': 'KeyC', 'Gancho': 'KeyG', 'Uppercut': 'KeyU', 'Swing': 'KeyS',
    'Finta': 'KeyF', 'Esquiva': 'KeyE', 'Bloqueo': 'KeyB', 'Clinch': 'KeyK', 'Pivoteo': 'KeyP', "Marca General": 'KeyM',
    'PlayPause': 'Space', 'Atras': 'ArrowLeft', 'Adelante': 'ArrowRight',
    'Cursor': 'Digit1', 'Lapiz': 'Digit2'
  }

  const totalConfig = await db.configuracion.count()
  if (totalConfig === 0) {
    await db.configuracion.add({
      id: 1,
      ollamaUrl: 'http://localhost:11434',
      ollamaModelo: 'llama3.2',
      analistaNombre: 'Mauricio Daneri',
      hotkeys: defaultHotkeys
    })
  } else {
    // Parchear hotkeys de configuración existente si le faltan teclas nuevas
    const config = await db.configuracion.get(1)
    if (config) {
      const merged = { ...defaultHotkeys, ...(config.hotkeys || {}) }
      let hasChanges = false
      for (const k of Object.keys(defaultHotkeys)) {
        if (config.hotkeys?.[k] === undefined) {
          hasChanges = true
          break
        }
      }
      if (hasChanges) {
        await db.configuracion.update(1, { hotkeys: merged })
        console.log('[DB ready hook] Config hotkeys updated with missing default values.')
      }
    }
  }

  const totalAnalistas = await db.analistas.count()
  if (totalAnalistas === 0) {
    await db.analistas.add({
      nombre: 'Mauricio Daneri',
      rol: 'Head Coach / Analista Principal',
      activo: true,
      createdAt: Date.now()
    })
  }

  // Migrar fechas de sesiones con formato DD/MM/YYYY a YYYY-MM-DD
  try {
    await migrarFechasSesiones(db)
  } catch (err) {
    console.error('[DB ready hook] Error en migración de fechas:', err)
  }

  // Migrar la fecha de la pelea de Iván vs Leveti a una fecha constante "2026-05-20"
  try {
    const ivanPelea = await db.sesiones.where('videoPath').equals('Ivan_vs_Leveti_22min.mp4').toArray()
    for (const p of ivanPelea) {
      if (p.fecha !== '2026-05-20') {
        await db.sesiones.update(p.id, { fecha: '2026-05-20' })
        console.log(`[DB Migration] Iván vs Leveti session ${p.id} date updated to 2026-05-20`)
      }
    }
  } catch (err) {
    console.error('[DB ready hook] Error actualizando fecha de Iván vs Leveti:', err)
  }
})

// ── Función para migrar fechas de sesiones ─────────────────────────────────
export async function migrarFechasSesiones(database) {
  const sesiones = await database.sesiones.toArray()
  for (const s of sesiones) {
    if (s.fecha && s.fecha.includes('/')) {
      const partes = s.fecha.split('/')
      if (partes.length === 3) {
        const dia = partes[0].padStart(2, '0')
        const mes = partes[1].padStart(2, '0')
        const anio = partes[2]
        const nuevaFecha = `${anio}-${mes}-${dia}`
        await database.sesiones.update(s.id, { fecha: nuevaFecha })
        console.log(`[DB Migration] Sesión ${s.id} fecha migrada de ${s.fecha} a ${nuevaFecha}`)
      }
    }
  }
}

// ── Función de Respaldo Automático ─────────────────────────────────────────
export async function realizarRespaldoAutomatico() {
  if (!window.api?.backup?.guardar) {
    console.warn('[Backup] La API de respaldo no está disponible en este entorno.');
    return;
  }
  try {
    const data = {
      boxeadores: await db.boxeadores.toArray(),
      sesiones: await db.sesiones.toArray(),
      eventos: await db.eventos.toArray(),
      configuracion: await db.configuracion.toArray(),
      analistas: await db.analistas.toArray(),
      logsErrores: await db.logsErrores.toArray(),
      fechaBackup: new Date().toISOString()
    }
    const filename = `backup_automatico_daneri.json`
    const res = await window.api.backup.guardar(filename, JSON.stringify(data, null, 2))
    if (res && res.ok) {
      console.log(`[Backup] Respaldo automático guardado en: ${res.path}`)
    } else {
      console.error('[Backup] Error guardando respaldo:', res?.error)
    }
  } catch (e) {
    console.error('[Backup] Error en realizarRespaldoAutomatico:', e)
  }
}

// ── Función de auto-recuperación segura (ejecutada en React para evitar deadlocks) ─────────
export async function ejecutarAutoRecuperacion() {
  if (!window.api?.backup?.leer) {
    console.warn('[Auto-Restore] IPC api.backup.leer no disponible en este entorno.');
    return;
  }
  try {
    const totalBoxeadores = await db.boxeadores.count()
    const totalSesiones = await db.sesiones.count()
    const fueBorradoManualmente = localStorage.getItem('db_manually_cleared') === 'true'

    if (totalBoxeadores === 0 && totalSesiones === 0 && !fueBorradoManualmente) {
      console.log('[Auto-Restore] Base de datos vacía. Buscando respaldo local...');
      const res = await window.api.backup.leer()
      if (res && res.ok && res.data) {
        const data = res.data
        console.log('[Auto-Restore] Respaldo detectado. Restaurando tablas automáticamente...')
        
        await db.transaction('rw', [db.boxeadores, db.sesiones, db.eventos, db.configuracion, db.analistas], async () => {
          if (data.boxeadores && data.boxeadores.length > 0) {
            await db.boxeadores.bulkAdd(data.boxeadores)
          }
          if (data.sesiones && data.sesiones.length > 0) {
            await db.sesiones.bulkAdd(data.sesiones)
          }
          if (data.eventos && data.eventos.length > 0) {
            await db.eventos.bulkAdd(data.eventos)
          }
          if (data.configuracion && data.configuracion.length > 0) {
            await db.configuracion.clear()
            await db.configuracion.bulkAdd(data.configuracion)
          }
          if (data.analistas && data.analistas.length > 0) {
            await db.analistas.clear()
            await db.analistas.bulkAdd(data.analistas)
          }
        })
        console.log('[Auto-Restore] ¡Restauración completada con éxito!')
        
        // Recargar la página para aplicar los cambios en la UI
        setTimeout(() => {
          window.location.reload()
        }, 150)
      } else {
        console.log('[Auto-Restore] No se encontró ningún respaldo local disponible.');
      }
    }
  } catch (err) {
    console.error('[Auto-Restore] Error durante la restauración automática:', err)
  }
}

export default db
