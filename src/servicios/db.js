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

// ── Datos iniciales (seed) ─────────────────────────────────────────────────
db.on('ready', async () => {
  const totalConfig = await db.configuracion.count()
  if (totalConfig === 0) {
    await db.configuracion.add({
      id: 1,
      ollamaUrl: 'http://localhost:11434',
      ollamaModelo: 'llama3.2',
      analistaNombre: 'Mauricio Daneri',
      hotkeys: {
        'RinconRojo': 'KeyQ',
        'RinconAzul': 'KeyW',
        'Jab': 'KeyJ',
        'Cross': 'KeyC',
        'Gancho': 'KeyG',
        'Uppercut': 'KeyU',
        'Esquiva': 'KeyE',
        'Bloqueo': 'KeyB',
        'Finta': 'KeyF',
        'PlayPause': 'Space',
        'Atras': 'ArrowLeft',
        'Adelante': 'ArrowRight',
        'Cursor': 'Digit1',
        'Lapiz': 'Digit2'
      }
    })
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
})

export default db
