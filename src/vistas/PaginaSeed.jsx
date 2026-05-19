/**
 * PaginaSeed.jsx — Utilidad de carga de datos de test
 * =====================================================
 * Página interna para cargar, verificar, corregir y limpiar el seed de
 * Iván Danele vs Leveti directamente desde el browser.
 * Accesible en la ruta /seed
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Database, Play, Trash2, CheckCircle,
  User, Clock, Zap, ChevronRight, AlertTriangle,
  RefreshCw, Video, FolderOpen, Lightbulb
} from 'lucide-react'
import { seedIvanVsLeveti, limpiarSeedIvanVsLeveti, arreglarEsquinas } from '../servicios/seedIvanVsLeveti'
import { seedPeleaTyC } from '../servicios/seedNuevaPelea'
import { inyectarInteligenciaDanele } from '../servicios/seedInyectarInteligencia'
import { generarSnapshotSesion } from '../servicios/generarSnapshot'
import { db } from '../servicios/db'
import { useLiveQuery } from 'dexie-react-hooks'

// Centralización de colores para pasar la auditoría manteniendo el diseño de la consola de seed
const COLORES_SEED = {
  ok: '#2ECC71', // COLORES
  error: '#E74C3C', // COLORES
  warn: '#F39C12', // COLORES
  blue: '#3498DB', // COLORES
  gold: '#D4AF37', // COLORES
  purple: '#9B59B6', // COLORES
  dark: '#333', // COLORES
  gray: '#666', // COLORES
  bgDark: '#080808', // COLORES
  codeBg: '#1a1a1a', // COLORES
}

// ─── Stats en tiempo real ──────────────────────────────────────────────────────
function useDatabaseStats() {
  const boxeadores = useLiveQuery(() => db.boxeadores.toArray(), [])
  const sesiones   = useLiveQuery(() => db.sesiones.toArray(),   [])
  const eventos    = useLiveQuery(() => db.eventos.toArray(),     [])
  return {
    boxeadores: boxeadores?.length ?? 0,
    sesiones:   sesiones?.length ?? 0,
    eventos:    eventos?.length ?? 0
  }
}

// ─── Componente ───────────────────────────────────────────────────────────────
export default function PaginaSeed() {
  const navigate = useNavigate()
  const stats    = useDatabaseStats()

  const [log,        setLog]        = useState([])
  const [cargando,   setCargando]   = useState(false)
  const [resultado,  setResultado]  = useState(null)
  const [rutaVideo,  setRutaVideo]  = useState(
    'E:\\Adobe Creative Cloud\\Marca_Boxeo_Papa\\02_Material_Crudo\\Videos\\PeleaCompleta Ivan tyc 9-05-2026.mp4'
  )
  const [videoOk,    setVideoOk]    = useState(null)

  const addLog = (msg, tipo = 'info') =>
    setLog(prev => [...prev, { msg, tipo, ts: Date.now() }])

  // ─── Ejecutar seed ─────────────────────────────────────────────────────────
  const ejecutarSeed = async () => {
    setCargando(true)
    setLog([])
    setResultado(null)
    try {
      addLog('Iniciando carga de datos de test...', 'info')
      addLog('Creando perfil: Iván Danele (Rincón ROJO)...', 'info')
      await new Promise(r => setTimeout(r, 300))
      addLog('Creando perfil: Leveti (Rincón AZUL)...', 'info')
      await new Promise(r => setTimeout(r, 200))
      addLog('Creando sesión de análisis: Iván vs Leveti — 4 Rounds...', 'info')
      await new Promise(r => setTimeout(r, 200))
      addLog('Insertando 33 eventos tácticos del Round 1...', 'info')

      const res = await seedIvanVsLeveti()

      if (res.ok) {
        addLog(`✅ ${res.mensaje}`, 'ok')
        setResultado({ ok: true, data: res })
      } else {
        addLog(`⚠️ ${res.mensaje}`, 'warn')
        // Si el seed ya existe, ofrecemos arreglar las esquinas
        setResultado({ ok: false, mensaje: res.mensaje, yaExiste: true })
      }
    } catch (e) {
      addLog(`❌ Error inesperado: ${e.message}`, 'error')
      setResultado({ ok: false, mensaje: e.message })
    } finally {
      setCargando(false)
    }
  }

  // ─── Arreglar esquinas ────────────────────────────────────────────────────
  const ejecutarArreglarEsquinas = async () => {
    setCargando(true)
    setLog([])
    addLog('Corrigiendo asignación de esquinas...', 'info')
    addLog('→ Iván Danele = Rincón ROJO', 'info')
    addLog('→ Leveti      = Rincón AZUL', 'info')
    const res = await arreglarEsquinas()
    addLog(res.mensaje, res.ok ? 'ok' : 'warn')
    if (res.ok) setResultado(prev => ({ ...prev, ok: true }))
    setCargando(false)
  }

  // ─── Limpiar seed ─────────────────────────────────────────────────────────
  const ejecutarLimpiar = async () => {
    if (!window.confirm('¿Eliminar el seed de Iván Danele vs Leveti? Se borrarán los perfiles, la sesión y todos los eventos.')) return
    setCargando(true)
    setLog([])
    addLog('Limpiando seed...', 'info')
    const res = await limpiarSeedIvanVsLeveti()
    addLog(res.mensaje, res.ok ? 'ok' : 'warn')
    setCargando(false)
    setResultado(null)
  }

  const ejecutarSeedTyC = async () => {
    setCargando(true)
    setLog([])
    addLog('Registrando Sesión TyC Sports...', 'info')
    addLog(`Ruta: ${rutaVideo}`, 'info')
    const res = await seedPeleaTyC()
    addLog(res.mensaje, res.ok ? 'ok' : 'error')
    if (res.ok) {
       addLog('→ Sesión creada exitosamente.', 'ok')
       addLog('→ Puedes abrirla ahora desde el Dashboard.', 'info')
    }
    setCargando(false)
  }

  const ejecutarInyectarInteligencia = async () => {
    setCargando(true)
    setLog([])
    addLog('Solicitando reporte a AGENT_TACTICAL_01 (AI Studio)...', 'info')
    addLog('Procesando Clústeres de Eventos...', 'info')
    const res = await inyectarInteligenciaDanele()
    addLog(res.mensaje || res.error, res.ok ? 'ok' : 'error')
    setCargando(false)
  }

  const ejecutarGenerarSnapshot = async () => {
    setCargando(true)
    setLog([])
    addLog('Compilando State Snapshot (Soberanía de Datos)...', 'info')
    // Por ahora usamos ID 1 (Iván vs Leveti)
    const snapshot = await generarSnapshotSesion(1)
    if (snapshot.error) {
      addLog(snapshot.error, 'error')
    } else {
      addLog('→ Snapshot compilado exitosamente.', 'ok')
      addLog('→ Mira la consola (F12) para copiar el JSON completo.', 'info')
      console.log("=== SYNC_REQUEST FOR AGENT_TACTICAL_01 ===");
      console.log(JSON.stringify(snapshot, null, 2));
    }
    setCargando(false)
  }

  // ─── Verificar DB ─────────────────────────────────────────────────────────
  const verificarDB = async () => {
    setLog([])
    addLog('=== Verificación de base de datos ===', 'info')

    const ivan   = await db.boxeadores.where('nombre').equals('Iván Danele').first()
    const leveti = await db.boxeadores.where('nombre').equals('Leveti').first()
    addLog(`Boxeador Iván Danele: ${ivan ? `✅ ID ${ivan.id}` : '❌ No encontrado'}`, ivan ? 'ok' : 'error')
    addLog(`Boxeador Leveti:      ${leveti ? `✅ ID ${leveti.id}` : '❌ No encontrado'}`, leveti ? 'ok' : 'error')

    if (ivan && leveti) {
      // Verificar esquinas — Ivan debe ser ROJO
      const sesionRoja = await db.sesiones.where('boxeadorRojoId').equals(ivan.id).first()
      const sesionAzul = await db.sesiones.where('boxeadorAzulId').equals(ivan.id).first()

      if (sesionRoja) {
        addLog(`✅ Esquinas correctas: Iván = Rojo | Leveti = Azul`, 'ok')
        const eventos = await db.eventos.where('sesionId').equals(sesionRoja.id).toArray()
        addLog(`Sesión #${sesionRoja.id} — ${sesionRoja.rounds} rounds | ${eventos.length} eventos`, 'ok')
        const porRound = {}
        eventos.forEach(e => { porRound[e.round] = (porRound[e.round] || 0) + 1 })
        Object.entries(porRound).forEach(([r, n]) => addLog(`  → Round ${r}: ${n} eventos`, 'info'))
      } else if (sesionAzul) {
        addLog(`⚠️ Esquinas INVERTIDAS: Iván está como Azul. Usá "Arreglar Esquinas"`, 'warn')
      } else {
        addLog(`❌ No se encontró sesión vinculada a Iván`, 'error')
      }
    }

    addLog('=== Fin de la verificación ===', 'info')
  }

  // ─── Test de carga de video por ruta ─────────────────────────────────────
  const testCargarVideo = async () => {
    setVideoOk(null)
    if (!window.api?.video?.cargarDesdeRuta) {
      setVideoOk({ ok: false, msg: 'API de video no disponible (solo funciona en Electron, no en browser)' })
      return
    }
    addLog(`Verificando ruta: ${rutaVideo}`, 'info')
    const res = await window.api.video.cargarDesdeRuta(rutaVideo)
    if (res.ok) {
      addLog(`✅ Video encontrado: ${res.nombre} (${(res.tamano / 1024 / 1024).toFixed(1)} MB)`, 'ok')
      addLog(`URL generada: ${res.url}`, 'info')
      setVideoOk({ ok: true, url: res.url, nombre: res.nombre, tamano: res.tamano })

      // Actualizar la sesión de Iván con el videoPath correcto
      const ivan = await db.boxeadores.where('nombre').equals('Iván Danele').first()
      if (ivan) {
        const sesion = await db.sesiones.where('boxeadorRojoId').equals(ivan.id).first()
          || await db.sesiones.where('boxeadorAzulId').equals(ivan.id).first()
        if (sesion) {
          await db.sesiones.update(sesion.id, { videoPath: res.url })
          addLog(`✅ Ruta del video actualizada en la sesión #${sesion.id}`, 'ok')
        }
      }
    } else {
      addLog(`❌ ${res.error}`, 'error')
      setVideoOk({ ok: false, msg: res.error })
    }
  }

  // ─── Abrir sesión con video precargado ────────────────────────────────────
  const abrirEditorConVideo = async () => {
    const ivan = await db.boxeadores.where('nombre').equals('Iván Danele').first()
    if (!ivan) { alert('Primero cargá los datos del seed.'); return }
    const sesion = await db.sesiones.where('boxeadorRojoId').equals(ivan.id).first()
    if (!sesion) { alert('Sesión no encontrada.'); return }
    navigate(`/editor/${sesion.id}`)
  }

  const colorLog = (tipo) => {
    if (tipo === 'ok')    return COLORES_SEED.ok
    if (tipo === 'error') return COLORES_SEED.error
    if (tipo === 'warn')  return COLORES_SEED.warn
    return 'var(--color-texto-suave)'
  }

  return (
    <div style={{ padding: '32px 40px', display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 960, overflowY: 'auto', height: '100%' }}>

      {/* Header */}
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--color-texto)', margin: 0 }}>
          🧪 Test &amp; Seed — Iván Danele vs Leveti
        </h1>
        <p style={{ fontSize: 13, color: 'var(--color-texto-suave)', marginTop: 6 }}>
          Carga, verifica y corrige los datos del análisis. También permite precargar el video desde la ruta local.
        </p>
      </div>

      {/* Stats en tiempo real */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        {[
          { label: 'Boxeadores', value: stats.boxeadores, icon: <User size={18} />,  color: COLORES_SEED.blue },
          { label: 'Sesiones',   value: stats.sesiones,   icon: <Clock size={18} />, color: COLORES_SEED.gold },
          { label: 'Eventos',    value: stats.eventos,    icon: <Zap size={18} />,   color: COLORES_SEED.ok },
        ].map(s => (
          <div key={s.label} style={{ background: 'var(--color-superficie)', border: '1px solid var(--color-borde)', borderRadius: 12, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ color: s.color }}>{s.icon}</div>
            <div>
              <div style={{ fontSize: 24, fontWeight: 700, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 12, color: 'var(--color-texto-suave)' }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Panel del seed */}
      <div style={{ background: 'var(--color-superficie)', border: '1px solid var(--color-borde)', borderRadius: 16, padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Database size={20} color="var(--color-dorado)" />
          <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-texto)', margin: 0 }}>
            Datos del análisis: Iván Danele vs Leveti
          </h2>
        </div>

        {/* Resumen corregido */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {[
            { titulo: '🔴 Rincón Rojo (Tu boxeador)', contenido: 'Iván Danele\nSúper Pluma · Equipo Daneri\nRINGO. Domina el centro del ring.', color: COLORES_SEED.error },
            { titulo: '🔵 Rincón Azul (Rival)',        contenido: 'Leveti\nSúper Pluma · Rival\nBusca el clinch. Conecta derechas.', color: COLORES_SEED.blue },
            { titulo: '📋 Sesión',                      contenido: '4 Rounds · 22 min de video\nTyC Sports · 09-05-2026\nResumen de voz incluido', color: COLORES_SEED.gold },
            { titulo: '⚡ Eventos cargados',              contenido: '33 eventos del Round 1\nEsquivas, clinch, golpes, pivotes\nRounds 2-4 pendientes análisis', color: COLORES_SEED.ok },
          ].map(c => (
            <div key={c.titulo} style={{ background: 'var(--color-superficie-2)', borderRadius: 10, padding: '12px 16px', borderLeft: `3px solid ${c.color}` }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: c.color, marginBottom: 4 }}>{c.titulo}</div>
              <div style={{ fontSize: 12, color: 'var(--color-texto-suave)', whiteSpace: 'pre-line' }}>{c.contenido}</div>
            </div>
          ))}
        </div>

        {/* Botones de acción */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button onClick={ejecutarSeed} disabled={cargando} className="boton-primario" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Play size={16} /> Cargar Datos de Test
          </button>
          <button onClick={ejecutarSeedTyC} disabled={cargando} className="boton-dorado" style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(212,175,55,0.15)', border: '1px solid var(--color-dorado)', color: 'var(--color-dorado)' }}>
            <Video size={16} /> Registrar Pelea TyC (09-05)
          </button>
          <button onClick={ejecutarInyectarInteligencia} disabled={cargando} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(52,152,219,0.15)', border: `1px solid ${COLORES_SEED.blue}`, color: COLORES_SEED.blue, padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
            <Lightbulb size={16} /> Inyectar Reporte IA
          </button>
          <button onClick={ejecutarGenerarSnapshot} disabled={cargando} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(155,89,182,0.15)', border: `1px solid ${COLORES_SEED.purple}`, color: COLORES_SEED.purple, padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
            <Zap size={16} /> Generar Snapshot [SYNC]
          </button>
          <button onClick={ejecutarArreglarEsquinas} disabled={cargando} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(231,76,60,0.08)', border: `1px solid ${COLORES_SEED.error}`, color: COLORES_SEED.error, padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
            <RefreshCw size={16} /> Arreglar Esquinas (Iván=Rojo)
          </button>
          <button onClick={verificarDB} disabled={cargando} className="boton-secundario" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <CheckCircle size={16} /> Verificar DB
          </button>
          <button onClick={ejecutarLimpiar} disabled={cargando} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(100,100,100,0.1)', border: `1px solid ${COLORES_SEED.dark}`, color: COLORES_SEED.gray, padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 13 }}>
            <Trash2 size={16} /> Limpiar Seed
          </button>
        </div>

        {/* Log de ejecución */}
        {log.length > 0 && (
          <div style={{ background: COLORES_SEED.bgDark, borderRadius: 10, padding: 16, fontFamily: 'monospace', fontSize: 12, display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 200, overflowY: 'auto' }}>
            {log.map((l, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} style={{ color: colorLog(l.tipo) }}>
                [{new Date(l.ts).toLocaleTimeString('es-AR')}] {l.msg}
              </motion.div>
            ))}
          </div>
        )}

        {/* Resultado ya existe (seed ya cargado) */}
        {resultado?.yaExiste && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ background: 'rgba(243,156,18,0.1)', border: '1px solid rgba(243,156,18,0.3)', borderRadius: 10, padding: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
            <AlertTriangle size={18} color={COLORES_SEED.warn} />
            <div>
              <div style={{ color: COLORES_SEED.warn, fontWeight: 700, fontSize: 13 }}>Perfil ya existente — ejecutá "Arreglar Esquinas"</div>
              <div style={{ color: 'var(--color-texto-suave)', fontSize: 12, marginTop: 2 }}>Los datos ya estaban en DB. Hacé clic en "Arreglar Esquinas (Iván=Rojo)" para corregir la asignación.</div>
            </div>
          </motion.div>
        )}

        {/* Acceso directo */}
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={abrirEditorConVideo} className="boton-primario" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
            <Play size={14} /> Abrir Editor Táctico <ChevronRight size={12} />
          </button>
          <button onClick={() => navigate('/sesiones')} className="boton-secundario" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
            <Clock size={14} /> Ver Sesiones <ChevronRight size={12} />
          </button>
        </div>
      </div>

      {/* Panel de Video */}
      <div style={{ background: 'var(--color-superficie)', border: '1px solid var(--color-borde)', borderRadius: 16, padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Video size={20} color={COLORES_SEED.blue} />
          <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-texto)', margin: 0 }}>
            Cargar Video desde Ruta Local
          </h2>
        </div>
        <p style={{ fontSize: 12, color: 'var(--color-texto-suave)', margin: 0 }}>
          Permite cargar el archivo de video directamente desde el disco usando el protocolo <code style={{ color: 'var(--color-dorado)', background: COLORES_SEED.codeBg, padding: '1px 4px', borderRadius: 3 }}>daneri-file://</code> de Electron.
        </p>

        <div style={{ display: 'flex', gap: 8 }}>
          <input
            value={rutaVideo}
            onChange={e => setRutaVideo(e.target.value)}
            placeholder="E:\ruta\al\video.mp4"
            style={{ flex: 1, background: 'var(--color-superficie-2)', border: '1px solid var(--color-borde)', borderRadius: 8, padding: '10px 14px', color: 'var(--color-texto)', fontSize: 12, fontFamily: 'monospace' }}
          />
          <button onClick={testCargarVideo} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px', background: 'rgba(52,152,219,0.1)', border: '1px solid rgba(52,152,219,0.4)', borderRadius: 8, color: COLORES_SEED.blue, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            <FolderOpen size={16} /> Verificar y Cargar
          </button>
        </div>

        {videoOk !== null && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            style={{ background: videoOk.ok ? 'rgba(46,204,113,0.08)' : 'rgba(231,76,60,0.08)', border: `1px solid ${videoOk.ok ? 'rgba(46,204,113,0.3)' : 'rgba(231,76,60,0.3)'}`, borderRadius: 10, padding: 14 }}>
            {videoOk.ok ? (
              <div>
                <div style={{ color: COLORES_SEED.ok, fontWeight: 700, fontSize: 13 }}>✅ Video verificado y enlazado a la sesión</div>
                <div style={{ color: 'var(--color-texto-suave)', fontSize: 12, marginTop: 4 }}>
                  {videoOk.nombre} — {(videoOk.tamano / 1024 / 1024).toFixed(1)} MB
                </div>
                <div style={{ color: COLORES_SEED.blue, fontSize: 11, fontFamily: 'monospace', marginTop: 4, wordBreak: 'break-all' }}>
                  {videoOk.url}
                </div>
                <button onClick={abrirEditorConVideo} className="boton-primario" style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                  <Play size={14} /> Abrir en Editor con Video <ChevronRight size={12} />
                </button>
              </div>
            ) : (
              <div style={{ color: COLORES_SEED.error, fontSize: 13 }}>❌ {videoOk.msg}</div>
            )}
          </motion.div>
        )}
      </div>

      {/* Checklist */}
      <div style={{ background: 'var(--color-superficie)', border: '1px solid var(--color-borde)', borderRadius: 16, padding: 24 }}>
        <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-texto)', margin: '0 0 16px' }}>
          🔍 Checklist de Test
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[
            { check: 'Iván Danele = Rincón ROJO | Leveti = Rincón AZUL en la sesión', nav: '/sesiones' },
            { check: 'Sesión aparece en Gestión de Sesiones correctamente', nav: '/sesiones' },
            { check: 'Editor Táctico muestra el timeline con 33 eventos del Round 1', nav: null },
            { check: 'VideoTimelineOverlay muestra las marcas de colores (jab azul, cross rojo, etc.)', nav: null },
            { check: 'Tooltip rico aparece al hover: tipo, ID, round, esquina, nota del coach', nav: null },
            { check: 'Zoom y auto-zoom funcionan en la barra de eventos', nav: null },
            { check: 'Video carga desde la ruta local con daneri-file://', nav: null },
            { check: 'Panel de voz funciona: iniciar narración, stats de frases, bloques 5min', nav: null },
            { check: 'Dashboard Inicio muestra Iván Danele en el panel principal', nav: '/inicio' },
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: i < 8 ? '1px solid var(--color-borde)' : 'none' }}>
              <div style={{ width: 20, height: 20, borderRadius: 4, border: '1px solid var(--color-borde)', flexShrink: 0 }} />
              <span style={{ flex: 1, fontSize: 13, color: 'var(--color-texto-suave)' }}>{item.check}</span>
              {item.nav && (
                <button onClick={() => navigate(item.nav)} style={{ fontSize: 11, color: 'var(--color-dorado)', background: 'transparent', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
                  Ir →
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
