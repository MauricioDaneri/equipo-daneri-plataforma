/**
 * seedIvanVsLeveti.js
 * ===================
 * Seed de datos reales: Iván Danele vs. Leveti — 4 Rounds
 * Análisis dictado por el coach Mauricio Daneri en tiempo real.
 *
 * VIDEO: "Iván vs Leveti" — 22 minutos totales
 * Round 1 comienza en el minuto 4:00 del video (240s)
 * La pelea tiene 4 rounds.
 *
 * Estructura de timestamps:
 *   tiempoVideo = segundos absolutos del video
 *   round       = número de round (1-4)
 *
 * Convenciones de importación al esquema:
 *   tipo    → string que coincide con TIPOS_EVENTO de eventTypes.js
 *   esquina → 'roja' (Leveti) | 'azul' (Iván) | 'general'
 *   nota    → observación táctica del coach
 */

import { db } from './db'

// ─── Tiempos base ────────────────────────────────────────────────────────────
const R1_START = 240   // 4:00 video — inicio Round 1
// Duración aproximada de cada round: 3 minutos + descanso ~1 min
const ROUND_DUR = 180  // 3 minutos de round
const DESCANSO  = 60   // 1 minuto de descanso entre rounds

const R2_START = R1_START + ROUND_DUR + DESCANSO  // 480s = 8:00
const R3_START = R2_START + ROUND_DUR + DESCANSO  // 720s = 12:00
const R4_START = R3_START + ROUND_DUR + DESCANSO  // 960s = 16:00

// Helper: tiempo de video = inicio del round + segundos dentro del round
const t = (roundStart, roundSeg) => roundStart + roundSeg

// ─── PERFIL: Iván Danele ─────────────────────────────────────────────────────
const IVAN = {
  nombre:        'Iván Danele',
  apodo:         'El Zurdo',
  categoriaPeso: 'Súper Pluma',
  estancia:      'Ortodoxa',
  equipo:        'Equipo Daneri',
  estado:        'Activo',
  notas:         'Boxeador analizado en la sesión vs Leveti. Potente con la mano derecha. Excelente movilidad y evasión de clinch. Concentrado y efectivo en el centro del ring.',
  createdAt:     Date.now(),
}

// ─── PERFIL: Leveti (rival) ───────────────────────────────────────────────────
const LEVETI = {
  nombre:        'Leveti',
  apodo:         'Rival',
  categoriaPeso: 'Súper Pluma',
  estancia:      'Ortodoxa',
  equipo:        'Rival',
  estado:        'Activo',
  notas:         'Rival analizado en la sesión vs Iván Danele. Intenta el clinch frecuentemente. Conecta derechas esporádicas. Pelea en rincón azul.',
  createdAt:     Date.now(),
}

// ─── DATOS DE LA SESIÓN ───────────────────────────────────────────────────────
const SESION = {
  fecha:     '2026-05-20',
  rounds:    4,
  sintesis:  'Análisis de 4 rounds del combate Iván Danele vs Leveti. Round 1 claramente dominado por Iván en el centro del ring. Excelente evasión de clinch. Leveti conecta derechas esporádicas. Iván recibió 2 golpes en el round 1.',
  videoPath: 'Ivan_vs_Leveti_22min.mp4',
  resumenVoz: `Round 1:\n[0:05] Iván toma el centro del ring.\n[2:30] Iván domina, Leveti busca el centro.\n[2:30] Iván contesta con recto (Cross). Evasión muy precisa.\n[2:30-2:45] Iván esquiva muy bien los clinches de Leveti.\n[2:45] Leveti conecta derecha (rincón rojo). Iván espectacular.\n[2:57] Iván toma centro definitivamente.\nResumen: Round 1 mucho más efectivo para Iván. Dominó en el centro y fue más preciso.`,
  createdAt: Date.now(),
}

// ─── EVENTOS DEL ANÁLISIS ────────────────────────────────────────────────────
// Cada evento: { tiempoVideo, round, tipo, esquina, nota }
// Se mapean al schema de la tabla: { sesionId, timestamp, tipo, esquina, nota, tiempoVideo, round }
const EVENTOS_TEMPLATE = [

  // ═══════════════════════════════════════════════════════
  //  ROUND 1 — (4:00 - 7:00 video aprox.)
  // ═══════════════════════════════════════════════════════

  // 0:05 round / 4:05 video — Iván toma el centro del ring
  { tiempoVideo: t(R1_START, 5),   round: 1, tipo: 'Pivoteo',  esquina: 'azul',    nota: 'Iván toma el centro del ring. Rápido desde el inicio.' },

  // ~0:10 — Leveti lanza jab de respuesta
  { tiempoVideo: t(R1_START, 10),  round: 1, tipo: 'Jab',      resultado: 'Conectado', esquina: 'roja',    nota: 'Leveti contesta con jab. Iván más efectivo.' },

  // ~0:30 — Iván conecta jab
  { tiempoVideo: t(R1_START, 30),  round: 1, tipo: 'Jab',      resultado: 'Conectado', esquina: 'azul',    nota: 'Jab de Iván. Mantiene distancia.' },

  // ~0:45 — Intercambio corto
  { tiempoVideo: t(R1_START, 45),  round: 1, tipo: 'Recto',    resultado: 'Conectado', esquina: 'azul',    nota: 'Iván conecta con recto.' },

  // ~1:00 — Iván controla el ritmo
  { tiempoVideo: t(R1_START, 60),  round: 1, tipo: 'Cross',    resultado: 'Conectado', esquina: 'azul',    nota: 'Iván con cross. Domina el intercambio.' },

  // ~1:15 — Leveti intenta clinch
  { tiempoVideo: t(R1_START, 75),  round: 1, tipo: 'Clinch',   esquina: 'roja',    nota: 'Leveti busca el clinch para frenar el ritmo de Iván.' },

  // ~1:15 — Iván esquiva el clinch
  { tiempoVideo: t(R1_START, 76),  round: 1, tipo: 'Esquiva',  esquina: 'azul',    nota: 'Iván esquiva muy bien el clinch. Excelente lectura.' },

  // ~1:30 — Jab Iván
  { tiempoVideo: t(R1_START, 90),  round: 1, tipo: 'Jab',      resultado: 'Conectado', esquina: 'azul',    nota: 'Iván mantiene el jab como arma de control.' },

  // ~1:45 — Iván domina el centro
  { tiempoVideo: t(R1_START, 105), round: 1, tipo: 'Pivoteo',  esquina: 'azul',    nota: 'Iván usa el pivote para mantener el ángulo ventajoso.' },

  // ~2:00 — Leveti intenta combinación
  { tiempoVideo: t(R1_START, 120), round: 1, tipo: 'Jab',      resultado: 'Conectado', esquina: 'roja',    nota: 'Leveti busca entrar con jab.' },
  { tiempoVideo: t(R1_START, 121), round: 1, tipo: 'Bloqueo',  esquina: 'azul',    nota: 'Iván bloquea. Muy concentrado.' },

  // ~2:10 — Iván concentrado, espectacular
  { tiempoVideo: t(R1_START, 123), round: 1, tipo: 'Swing',    resultado: 'Conectado', esquina: 'azul',    nota: 'Iván espectacular con un swing. Concentrado y efectivo. ~2:03 del round.' },

  // ~2:20 — Iván se come 2 manos
  { tiempoVideo: t(R1_START, 140), round: 1, tipo: 'Recto',    resultado: 'Conectado', esquina: 'roja',    nota: 'Leveti conecta recto. Iván recibe la mano.' },
  { tiempoVideo: t(R1_START, 142), round: 1, tipo: 'Swing',    resultado: 'Conectado', esquina: 'roja',    nota: 'Segunda mano de Leveti conectada (Swing).' },

  // 2:30 round / ~6:30 video — Leveti toma el centro momentáneamente
  { tiempoVideo: t(R1_START, 150), round: 1, tipo: 'Pivoteo',  esquina: 'roja',    nota: 'Leveti busca el centro a los 2:30 del round.' },

  // 2:30 — Iván contesta con recto (Cross) + evasión muy precisa
  { tiempoVideo: t(R1_START, 151), round: 1, tipo: 'Cross',    resultado: 'Conectado', esquina: 'azul',    nota: 'Iván contesta con cross. Muy preciso. Evasión inmediata.' },
  { tiempoVideo: t(R1_START, 152), round: 1, tipo: 'Esquiva',  esquina: 'azul',    nota: 'Evasión muy precisa de Iván. Excelente footwork.' },

  // ~2:30-2:45 — Leveti lanza llaves / clinch
  { tiempoVideo: t(R1_START, 155), round: 1, tipo: 'Clinch',   esquina: 'roja',    nota: 'Leveti lanza llaves, busca el cuerpo a cuerpo.' },
  { tiempoVideo: t(R1_START, 157), round: 1, tipo: 'Esquiva',  esquina: 'azul',    nota: 'Iván esquiva el clinch de Leveti con precisión.' },
  { tiempoVideo: t(R1_START, 159), round: 1, tipo: 'Clinch',   esquina: 'roja',    nota: 'Leveti insiste con el clinch.' },
  { tiempoVideo: t(R1_START, 161), round: 1, tipo: 'Esquiva',  esquina: 'azul',    nota: 'Iván evade nuevamente. Domina la distancia.' },

  // ~2:45 — Leveti conecta derecha
  { tiempoVideo: t(R1_START, 165), round: 1, tipo: 'Cross',    resultado: 'Conectado', esquina: 'roja',    nota: 'Leveti conecta derecha con cross. Buen golpe del rincón rojo.' },
  { tiempoVideo: t(R1_START, 166), round: 1, tipo: 'Recto',    resultado: 'Conectado', esquina: 'roja',    nota: 'Derecha de Leveti conectada con recto. Iván la recibe.' },

  // 2:57 round / 4:06 video — Iván recupera y toma el centro
  { tiempoVideo: 246,              round: 1, tipo: 'Pivoteo',  esquina: 'azul',    nota: 'Iván toma el centro del ring definitivamente. Minuto 2:57 del round / 4:06 del video.' },

  // Final Round 1
  { tiempoVideo: t(R1_START, 175), round: 1, tipo: 'Jab',      resultado: 'Conectado', esquina: 'azul',    nota: 'Último jab de Iván. Cierra el round dominando.' },
  { tiempoVideo: t(R1_START, 178), round: 1, tipo: 'Cross',    resultado: 'Conectado', esquina: 'azul',    nota: 'Cross final de Iván. Round 1 claramente para Iván.' },

  // ═══════════════════════════════════════════════════════
  //  ROUND 2 — (8:00 - 11:00 video aprox.)
  //  [Datos estimados — Coach completará el análisis en vivo]
  // ═══════════════════════════════════════════════════════

  { tiempoVideo: t(R2_START, 5),   round: 2, tipo: 'Pivoteo',  esquina: 'azul',    nota: 'Iván arranca Round 2 buscando el centro.' },
  { tiempoVideo: t(R2_START, 15),  round: 2, tipo: 'Jab',      resultado: 'Conectado', esquina: 'azul',    nota: 'Jab de entrada Iván.' },
  { tiempoVideo: t(R2_START, 30),  round: 2, tipo: 'Cross',    resultado: 'Conectado', esquina: 'azul',    nota: 'Cross de Iván. Combinación.' },
  { tiempoVideo: t(R2_START, 60),  round: 2, tipo: 'Clinch',   esquina: 'roja',    nota: 'Leveti busca el clinch nuevamente.' },
  { tiempoVideo: t(R2_START, 61),  round: 2, tipo: 'Esquiva',  esquina: 'azul',    nota: 'Iván sale del clinch.' },

  // ═══════════════════════════════════════════════════════
  //  ROUNDS 3 y 4 — Pendientes de análisis en vivo
  // ═══════════════════════════════════════════════════════

  { tiempoVideo: t(R3_START, 5),   round: 3, tipo: 'Pivoteo',  esquina: 'azul',    nota: 'Round 3 — pendiente análisis detallado.' },
  { tiempoVideo: t(R4_START, 5),   round: 4, tipo: 'Pivoteo',  esquina: 'azul',    nota: 'Round 4 — pendiente análisis detallado.' },
]

// ─── FUNCIÓN PRINCIPAL DE SEED ────────────────────────────────────────────────
export async function seedIvanVsLeveti() {
  try {
    // 1. Verificar si ya existe el seed (evitar duplicados)
    const existe = await db.boxeadores.where('nombre').equals('Iván Danele').first()
    if (existe) {
      return {
        ok: false,
        mensaje: 'El seed ya fue cargado anteriormente. Los perfiles de Iván Danele ya existen.',
        ivanId: existe.id
      }
    }

    // 2. Crear perfil de Iván Danele
    const ivanId = await db.boxeadores.add(IVAN)

    // 3. Crear perfil de Leveti
    const levetiId = await db.boxeadores.add(LEVETI)

    // 4. Crear la sesión vinculando ambos boxeadores
    //    Iván = Rojo (boxeadorRojoId) | Leveti = Azul (boxeadorAzulId)
    const sesionId = await db.sesiones.add({
      ...SESION,
      boxeadorRojoId: ivanId,    // ✅ Iván = ROJO
      boxeadorAzulId: levetiId,  // ✅ Leveti = AZUL
    })

    // 5. Crear todos los eventos
    // Actualizar esquinas en los eventos para que sean coherentes
    const eventosParaDB = EVENTOS_TEMPLATE.map(ev => ({
      sesionId,
      timestamp:   ev.tiempoVideo,
      tiempoVideo: ev.tiempoVideo,
      round:       ev.round,
      tipo:        ev.tipo,
      resultado:   ev.resultado ?? undefined,
      esquina:     ev.esquina,  // 'roja'=Iván, 'azul'=Leveti
      nota:        ev.nota,
    }))

    await db.eventos.bulkAdd(eventosParaDB)

    return {
      ok: true,
      ivanId,
      levetiId,
      sesionId,
      totalEventos: eventosParaDB.length,
      mensaje: `✅ Seed cargado: Iván Danele (ID ${ivanId}) vs Leveti (ID ${levetiId}) — Sesión #${sesionId} — ${eventosParaDB.length} eventos del análisis.`
    }

  } catch (error) {
    console.error('[SeedIvanVsLeveti] Error:', error)
    return { ok: false, mensaje: `Error: ${error.message}`, error }
  }
}

// ─── FUNCIÓN DE LIMPIEZA (si necesitás reiniciar el seed) ────────────────────
export async function limpiarSeedIvanVsLeveti() {
  const ivan   = await db.boxeadores.where('nombre').equals('Iván Danele').first()
  const leveti = await db.boxeadores.where('nombre').equals('Leveti').first()

  if (!ivan && !leveti) return { ok: false, mensaje: 'No hay seed para limpiar.' }

  const sesiones = []
  if (ivan) {
    // Buscar en ambos campos (por si el seed viejo tenía las esquinas invertidas)
    const sRojo = await db.sesiones.where('boxeadorRojoId').equals(ivan.id).toArray()
    const sAzul = await db.sesiones.where('boxeadorAzulId').equals(ivan.id).toArray()
    sesiones.push(...sRojo, ...sAzul)
  }

  const sesionesUnicas = [...new Map(sesiones.map(s => [s.id, s])).values()]

  for (const s of sesionesUnicas) {
    await db.eventos.where('sesionId').equals(s.id).delete()
    await db.sesiones.delete(s.id)
  }

  if (ivan)   await db.boxeadores.delete(ivan.id)
  if (leveti) await db.boxeadores.delete(leveti.id)

  return { ok: true, mensaje: `Seed limpiado: ${sesionesUnicas.length} sesiones y perfiles eliminados.` }
}

// ─── FUNCIÓN DE ARREGLO DE ESQUINAS ──────────────────────────────────────────
// Corrige sesiones ya cargadas donde las esquinas estaban invertidas
export async function arreglarEsquinas() {
  try {
    const ivan   = await db.boxeadores.where('nombre').equals('Iván Danele').first()
    const leveti = await db.boxeadores.where('nombre').equals('Leveti').first()

    if (!ivan || !leveti) {
      return { ok: false, mensaje: 'No se encontraron los perfiles de Iván o Leveti.' }
    }

    // Buscar sesiones donde Iván está como azul (incorrecto)
    const sesionesConError = await db.sesiones
      .where('boxeadorAzulId').equals(ivan.id)
      .toArray()

    if (sesionesConError.length === 0) {
      // Verificar también si ya está correcto
      const sesionesCorrectas = await db.sesiones
        .where('boxeadorRojoId').equals(ivan.id)
        .toArray()
      if (sesionesCorrectas.length > 0) {
        return { ok: true, mensaje: `Las esquinas ya están correctas en ${sesionesCorrectas.length} sesión(es). Iván = Rojo ✅` }
      }
      return { ok: false, mensaje: 'No se encontraron sesiones de Iván Danele.' }
    }

    // Invertir las esquinas en cada sesión encontrada
    let corregidas = 0
    for (const sesion of sesionesConError) {
      await db.sesiones.update(sesion.id, {
        boxeadorRojoId: ivan.id,    // ✅ Iván = ROJO
        boxeadorAzulId: leveti.id,  // ✅ Leveti = AZUL
      })
      corregidas++
    }

    return {
      ok: true,
      mensaje: `✅ Esquinas corregidas en ${corregidas} sesión(es). Iván Danele = Rincón Rojo | Leveti = Rincón Azul.`,
      sesionesCorregidas: corregidas,
    }
  } catch (error) {
    return { ok: false, mensaje: `Error al arreglar esquinas: ${error.message}` }
  }
}

