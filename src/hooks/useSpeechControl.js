/**
 * useSpeechControl.js — v2 PROFESSIONAL
 * ======================================
 * Sistema de narración táctica por voz para el Editor Daneri.
 *
 * Funcionalidades:
 *  1. Escucha continua mediante Web Speech API (Chrome/Edge)
 *  2. Comandos de voz → controlan la app en tiempo real
 *  3. Transcripción completa guardada con timestamp de video + round activo
 *  4. Chunking automático cada 5 minutos → genera un resumen comprimido por chunk
 *  5. Al finalizar: exporta la transcripción completa y los resúmenes como .md
 *  6. Guarda el log completo (JSON) para linkear cada nota al video
 */

import { useState, useEffect, useRef, useCallback } from 'react'

// ─── Comandos de voz → acciones de la app ─────────────────────────────────────
const COMANDOS_VOZ = {
  // Reproducción
  'play':              'PLAY',
  'reproducir':        'PLAY',
  'pause':             'PAUSE',
  'pausa':             'PAUSE',
  'parar':             'PAUSE',
  'detener':           'PAUSE',
  // Golpes
  'jab':               'Jab',
  'cross':             'Cross',
  'gancho':            'Gancho',
  'uppercut':          'Uppercut',
  // Defensas
  'esquiva':           'Esquiva',
  'bloqueo':           'Bloqueo',
  'finta':             'Finta',
  'clinch':            'Clinch',
  // Resultado
  'golpe conectado':   'Golpe Conectado',
  'conectado':         'Golpe Conectado',
  'golpe errado':      'Golpe Errado',
  'errado':            'Golpe Errado',
  'caida':             'Caída',
  'knockdown':         'Caída',
  // Rincones
  'rincon rojo':       'RINCON_ROJO',
  'rojo':              'RINCON_ROJO',
  'rincon azul':       'RINCON_AZUL',
  'azul':              'RINCON_AZUL',
}

// ─── Duración en segundos de cada chunk de resumen ────────────────────────────
const CHUNK_SEGUNDOS = 300  // 5 minutos

// ─── Función de resumen simple (sin IA) ───────────────────────────────────────
function resumirChunkSimple(entradas) {
  if (entradas.length === 0) return 'Sin actividad en este período.'
  const comandos = entradas.filter(e => e.esComando).map(e => e.accionDetectada || e.texto)
  const notas    = entradas.filter(e => !e.esComando).map(e => e.texto)
  let resumen = ''
  if (comandos.length > 0) {
    const freq = {}
    comandos.forEach(c => { freq[c] = (freq[c] || 0) + 1 })
    const sorted = Object.entries(freq).sort((a, b) => b[1] - a[1])
    resumen += `Acciones registradas: ${sorted.map(([k, v]) => `${k} (×${v})`).join(', ')}. `
  }
  if (notas.length > 0) {
    resumen += `Observaciones del analista: "${notas.slice(0, 3).join(' | ')}"${notas.length > 3 ? ` (+${notas.length - 3} más)` : ''}.`
  }
  return resumen || 'Sin observaciones destacadas.'
}

// ─── Generar documento .md y descargarlo ──────────────────────────────────────
function descargarMD(nombre, contenido) {
  const blob = new Blob([contenido], { type: 'text/markdown;charset=utf-8' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = nombre
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

function formatTime(seg) {
  const h = Math.floor(seg / 3600)
  const m = Math.floor((seg % 3600) / 60)
  const s = Math.floor(seg % 60)
  if (h > 0) return `${h}:${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`
  return `${m}:${s.toString().padStart(2,'0')}`
}

// ─── Hook Principal ────────────────────────────────────────────────────────────
export function useSpeechControl({ onComando, getCurrentTime, getCurrentRound }) {
  const [soportado,     setSoportado]     = useState(false)
  const [escuchando,    setEscuchando]    = useState(false)
  const [ultimaFrase,   setUltimaFrase]   = useState('')
  const [ultimoComando, setUltimoComando] = useState(null)
  const [totalFrases,   setTotalFrases]   = useState(0)
  const [totalChunks,   setTotalChunks]   = useState(0)

  const recognitionRef  = useRef(null)
  const activoRef       = useRef(false)

  // Log completo: cada entrada tiene { tiempo, round, texto, esComando, accionDetectada }
  const logRef          = useRef([])
  // Resúmenes de chunks: [{ chunkIndex, desde, hasta, resumen }]
  const chunksRef       = useRef([])
  // Tiempo de inicio real de la grabación
  const inicioRef       = useRef(null)

  // ─── Inicialización de SpeechRecognition ────────────────────────────────────
  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) { setSoportado(false); return }
    setSoportado(true)

    const rec = new SR()
    rec.lang           = 'es-AR'
    rec.continuous     = true
    rec.interimResults = false
    rec.maxAlternatives = 1

    rec.onresult = (event) => {
      const raw   = event.results[event.results.length - 1][0].transcript
      const texto = raw.toLowerCase().trim()
      const tiempoVideo = getCurrentTime?.() ?? 0
      const round       = getCurrentRound?.() ?? 1
      const tsReal      = Date.now()

      setUltimaFrase(texto)
      setTotalFrases(n => n + 1)

      // Detectar comando
      let accion = null
      for (const [keyword, cmd] of Object.entries(COMANDOS_VOZ)) {
        if (texto.includes(keyword)) { accion = cmd; break }
      }

      const entrada = {
        tiempoVideo,
        round,
        texto: raw.trim(), // guardamos el texto original con mayúsculas
        esComando: !!accion,
        accionDetectada: accion,
        tsReal
      }
      logRef.current.push(entrada)

      // Verificar si debemos generar un nuevo chunk (cada 5 min de grabación real)
      if (inicioRef.current) {
        const transcurridoSeg = (tsReal - inicioRef.current) / 1000
        const chunkActual = Math.floor(transcurridoSeg / CHUNK_SEGUNDOS)
        if (chunkActual >= chunksRef.current.length) {
          // Nuevo chunk: resumir lo acumulado en este período
          const desdeIdx = chunksRef.current.reduce((acc, c) => acc + c.entradas, 0)
          const entradasChunk = logRef.current.slice(desdeIdx)
          const resumen = resumirChunkSimple(entradasChunk)
          chunksRef.current.push({
            chunkIndex: chunkActual,
            desde: formatTime(chunkActual * CHUNK_SEGUNDOS),
            hasta: formatTime((chunkActual + 1) * CHUNK_SEGUNDOS),
            resumen,
            entradas: entradasChunk.length
          })
          setTotalChunks(chunksRef.current.length)
        }
      }

      if (accion) {
        setUltimoComando(accion)
        setTimeout(() => setUltimoComando(null), 1500)
        onComando?.(accion, texto)
      }
    }

    rec.onend = () => {
      if (activoRef.current) {
        try { rec.start() } catch(e) {}
      }
    }

    rec.onerror = (e) => {
      if (e.error === 'no-speech') return
      if (e.error !== 'aborted') { setEscuchando(false); activoRef.current = false }
    }

    recognitionRef.current = rec

    return () => {
      activoRef.current = false
      try { rec.stop() } catch(e) {}
    }
  }, [])

  // ─── Controles ──────────────────────────────────────────────────────────────
  const iniciarEscucha = useCallback(() => {
    if (!recognitionRef.current || activoRef.current) return
    activoRef.current  = true
    inicioRef.current  = Date.now()
    chunksRef.current  = []
    try {
      recognitionRef.current.start()
      setEscuchando(true)
    } catch(e) {}
  }, [])

  const detenerEscucha = useCallback(() => {
    activoRef.current = false
    try { recognitionRef.current?.stop() } catch(e) {}
    setEscuchando(false)
  }, [])

  const limpiarLog = useCallback(() => {
    logRef.current    = []
    chunksRef.current = []
    inicioRef.current = null
    setUltimaFrase('')
    setTotalFrases(0)
    setTotalChunks(0)
  }, [])

  // ─── Generadores de documentos ──────────────────────────────────────────────

  /**
   * Genera la transcripción completa agrupada por round → string markdown
   */
  const generarTranscripcionMD = useCallback((nombreSesion = 'Sesión') => {
    const log = logRef.current
    if (log.length === 0) return ''

    const porRound = {}
    log.forEach(e => {
      if (!porRound[e.round]) porRound[e.round] = []
      porRound[e.round].push(e)
    })

    let md = `# Transcripción de Sesión — ${nombreSesion}\n`
    md += `> Generado: ${new Date().toLocaleString('es-AR')}\n\n`
    md += `---\n\n`

    Object.entries(porRound).forEach(([r, entradas]) => {
      md += `## Round ${r}\n\n`
      entradas.forEach(e => {
        const prefix = e.esComando ? `⚡ **[COMANDO: ${e.accionDetectada}]**` : '🎙️'
        md += `- \`${formatTime(e.tiempoVideo)}\` ${prefix} ${e.texto}\n`
      })
      md += '\n'
    })

    return md
  }, [])

  /**
   * Genera el documento de resúmenes por chunks → string markdown
   */
  const generarResumenChunksMD = useCallback((nombreSesion = 'Sesión') => {
    const chunks = chunksRef.current
    if (chunks.length === 0) return ''

    let md = `# Resumen por Bloques — ${nombreSesion}\n`
    md += `> Cada bloque cubre 5 minutos de narración. Generado: ${new Date().toLocaleString('es-AR')}\n\n`
    md += `---\n\n`

    chunks.forEach((c, i) => {
      md += `## Bloque ${i + 1} (${c.desde} → ${c.hasta})\n\n`
      md += `${c.resumen}\n\n`
    })

    return md
  }, [])

  /**
   * Exporta ambos documentos .md y devuelve el resumen completo como objeto
   */
  const exportarSesion = useCallback((nombreSesion = 'Sesion') => {
    const nombreArchivo = nombreSesion.replace(/\s+/g, '_')
    const fecha = new Date().toISOString().slice(0, 10)

    // 1. Transcripción completa
    const transcripcion = generarTranscripcionMD(nombreSesion)
    if (transcripcion) {
      descargarMD(`${nombreArchivo}_${fecha}_Transcripcion.md`, transcripcion)
    }

    // 2. Resumen por chunks (con delay para no bloquear el browser)
    setTimeout(() => {
      const resumen = generarResumenChunksMD(nombreSesion)
      if (resumen) {
        descargarMD(`${nombreArchivo}_${fecha}_Resumenes.md`, resumen)
      }
    }, 800)

    return {
      logCompleto: [...logRef.current],
      chunks: [...chunksRef.current],
      transcripcionMD: transcripcion
    }
  }, [generarTranscripcionMD, generarResumenChunksMD])

  // ─── Resumen por round para el panel visual ──────────────────────────────────
  const generarResumenPorRound = useCallback(() => {
    const mapa = {}
    logRef.current.forEach(e => {
      if (!mapa[e.round]) mapa[e.round] = { entradas: [], totalComandos: 0, notas: [] }
      mapa[e.round].entradas.push(e)
      if (e.esComando) mapa[e.round].totalComandos++
      else mapa[e.round].notas.push(`[${formatTime(e.tiempoVideo)}] ${e.texto}`)
    })
    Object.keys(mapa).forEach(r => {
      mapa[r].notas = mapa[r].notas.join('\n') || 'Sin notas de voz en este round.'
    })
    return mapa
  }, [])

  const obtenerLogCompleto = useCallback(() => [...logRef.current], [])

  return {
    soportado,
    escuchando,
    ultimaFrase,
    ultimoComando,
    totalFrases,
    totalChunks,
    iniciarEscucha,
    detenerEscucha,
    limpiarLog,
    generarResumenPorRound,
    obtenerLogCompleto,
    exportarSesion,
    generarTranscripcionMD,
  }
}
