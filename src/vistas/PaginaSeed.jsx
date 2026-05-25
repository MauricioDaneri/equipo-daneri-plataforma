/**
 * PaginaSeed.jsx — Centro de Control de Datos y Simulaciones AI
 * =============================================================
 * Panel de administración técnica para inicializar, depurar, enlazar videos
 * y generar snapshots de entrenamiento AI.
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useModal } from '../context/ModalContext'
import { motion } from 'framer-motion'
import {
  Database, Play, Trash2, CheckCircle,
  User, Clock, Zap, ChevronRight, AlertTriangle,
  RefreshCw, Video, FolderOpen, Lightbulb, ShieldCheck
} from 'lucide-react'
import { seedIvanVsLeveti, limpiarSeedIvanVsLeveti, arreglarEsquinas } from '../servicios/seedIvanVsLeveti'
import { seedPeleaTyC } from '../servicios/seedNuevaPelea'
import { inyectarInteligenciaDanele } from '../servicios/seedInyectarInteligencia'
import { generarSnapshotSesion } from '../servicios/generarSnapshot'
import { db } from '../servicios/db'
import { useLiveQuery } from 'dexie-react-hooks'

const COLORES_SEED = {
  ok: 'var(--color-exito)',
  error: 'var(--color-rojo-suave)',
  warn: 'var(--color-dorado-suave)',
  blue: 'var(--color-azul-suave)',
  gold: 'var(--color-dorado)',
  purple: 'var(--color-dorado-suave)',
  dark: 'var(--color-borde)',
  gray: 'var(--color-texto-suave)',
  bgDark: 'rgba(0, 0, 0, 0.3)',
  codeBg: 'var(--color-superficie-2)',
}

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

export default function PaginaSeed() {
  const { mostrarConfirmacion, mostrarAlerta } = useModal()
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

  const ejecutarSeed = async () => {
    setCargando(true)
    setLog([])
    setResultado(null)
    try {
      addLog('Iniciando carga de datos de test...', 'info')
      addLog('Creando perfil: Iván Danele (Rincón ROJO)...', 'info')
      await new Promise(r => setTimeout(r, 200))
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
        setResultado({ ok: false, mensaje: res.mensaje, yaExiste: true })
      }
    } catch (e) {
      addLog(`❌ Error inesperado: ${e.message}`, 'error')
      setResultado({ ok: false, mensaje: e.message })
    } finally {
      setCargando(false)
    }
  }

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

  const ejecutarLimpiar = async () => {
    const confirmado = await mostrarConfirmacion({ titulo: "Limpiar Seed", mensaje: "¿Eliminar el seed de Iván Danele vs Leveti? Se borrarán los perfiles, la sesión y todos los eventos.", textoConfirmar: "Limpiar", tipo: "peligro" });
    if (!confirmado) return;
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
       addLog('→ Puedes abrirla ahora desde el Panel de Sesiones.', 'info')
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

  const verificarDB = async () => {
    setLog([])
    addLog('=== Verificación de base de datos ===', 'info')

    const ivan   = await db.boxeadores.where('nombre').equals('Iván Danele').first()
    const leveti = await db.boxeadores.where('nombre').equals('Leveti').first()
    addLog(`Boxeador Iván Danele: ${ivan ? `✅ ID ${ivan.id}` : '❌ No encontrado'}`, ivan ? 'ok' : 'error')
    addLog(`Boxeador Leveti:      ${leveti ? `✅ ID ${leveti.id}` : '❌ No encontrado'}`, leveti ? 'ok' : 'error')

    if (ivan && leveti) {
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

  const testCargarVideo = async () => {
    setVideoOk(null)
    if (!window.api?.video?.cargarDesdeRuta) {
      setVideoOk({ ok: false, msg: 'API de video no disponible (solo funciona en Electron, no en web)' })
      return
    }
    addLog(`Verificando ruta: ${rutaVideo}`, 'info')
    const res = await window.api.video.cargarDesdeRuta(rutaVideo)
    if (res.ok) {
      addLog(`✅ Video encontrado: ${res.nombre} (${(res.tamano / 1024 / 1024).toFixed(1)} MB)`, 'ok')
      addLog(`URL generada: ${res.url}`, 'info')
      setVideoOk({ ok: true, url: res.url, nombre: res.nombre, tamano: res.tamano })

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

  const abrirEditorConVideo = async () => {
    const ivan = await db.boxeadores.where('nombre').equals('Iván Danele').first()
    if (!ivan) { mostrarAlerta({ titulo: "Faltan Datos", mensaje: "Primero carga los datos del seed.", tipo: "advertencia" }); return }
    const sesion = await db.sesiones.where('boxeadorRojoId').equals(ivan.id).first()
    if (!sesion) { mostrarAlerta({ titulo: "Error", mensaje: "Sesión no encontrada.", tipo: "peligro" }); return }
    navigate(`/editor/${sesion.id}`)
  }

  const colorLog = (tipo) => {
    if (tipo === 'ok')    return COLORES_SEED.ok
    if (tipo === 'error') return COLORES_SEED.error
    if (tipo === 'warn')  return COLORES_SEED.warn
    return 'var(--color-texto-suave)'
  }

  return (
    <div style={estilos.container}>
      {/* Header */}
      <div style={estilos.header}>
        <div style={estilos.badge}>
          <Database size={22} color="var(--color-dorado)" />
        </div>
        <div>
          <h1 style={estilos.tituloPage}>Carga de Datos &amp; Test (Seed)</h1>
          <p style={estilos.subtituloPage}>
            Inicializa, verifica, limpia y enlaza archivos de sparring locales para probar el flujo de la aplicación.
          </p>
        </div>
      </div>

      {/* Contadores Estadísticos */}
      <div style={estilos.gridStats}>
        {[
          { label: 'Boxeadores Registrados', value: stats.boxeadores, icon: <User size={18} />, color: COLORES_SEED.blue },
          { label: 'Sesiones de Combate', value: stats.sesiones, icon: <Clock size={18} />, color: COLORES_SEED.gold },
          { label: 'Eventos y Golpes', value: stats.eventos, icon: <Zap size={18} />, color: COLORES_SEED.ok },
        ].map(s => (
          <div key={s.label} style={estilos.tarjetaStat}>
            <div style={{ ...estilos.iconStat, color: s.color }}>{s.icon}</div>
            <div>
              <div style={{ ...estilos.valorStat, color: s.color }}>{s.value}</div>
              <div style={estilos.labelStat}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Grid de Paneles de Control */}
      <div style={estilos.gridPanels}>
        {/* Panel 1: Sparring de Prueba */}
        <div style={estilos.tarjeta}>
          <div style={estilos.tarjetaHeader}>
            <Database size={18} color="var(--color-dorado)" />
            <h3 style={estilos.tarjetaTitulo}>Datos Demo: Iván Danele vs Leveti</h3>
          </div>
          <p style={estilos.tarjetaDesc}>
            Inicializa un combate completo de 4 rounds con Iván Danele (Rincón Rojo) y Leveti (Rincón Azul), con 33 eventos tácticos del primer round cargados.
          </p>
          <div style={estilos.miniResumen}>
            <div style={{ ...estilos.miniItem, borderLeftColor: COLORES_SEED.error }}>
              <span style={{ fontWeight: 700, color: COLORES_SEED.error }}>🔴 Rincón Rojo:</span> Iván Danele (Equipo Daneri)
            </div>
            <div style={{ ...estilos.miniItem, borderLeftColor: COLORES_SEED.blue }}>
              <span style={{ fontWeight: 700, color: COLORES_SEED.blue }}>🔵 Rincón Azul:</span> Leveti (Rival)
            </div>
          </div>
          <div style={estilos.tarjetaAcciones}>
            <button onClick={ejecutarSeed} disabled={cargando} className="boton-primario" style={{ fontSize: 12, padding: '10px 14px' }}>
              <Play size={14} /> Cargar Datos Demo
            </button>
            <button onClick={ejecutarArreglarEsquinas} disabled={cargando} className="boton-secundario" style={{ fontSize: 12, padding: '10px 14px', color: COLORES_SEED.error }}>
              <RefreshCw size={14} /> Arreglar Esquinas
            </button>
            <button onClick={ejecutarLimpiar} disabled={cargando} className="boton-secundario" style={{ fontSize: 12, padding: '10px 14px', color: 'var(--color-texto-suave)' }}>
              <Trash2 size={14} /> Limpiar Seed
            </button>
          </div>
        </div>

        {/* Panel 2: Enlace de Video Local */}
        <div style={estilos.tarjeta}>
          <div style={estilos.tarjetaHeader}>
            <Video size={18} color="var(--color-azul-suave)" />
            <h3 style={estilos.tarjetaTitulo}>Enlazar Archivo de Video Local</h3>
          </div>
          <p style={estilos.tarjetaDesc}>
            Vincula el video local del disco a la sesión de testeo. Esto permite reproducirlo en el editor usando el protocolo seguro de Electron.
          </p>
          <div style={estilos.inputContainer}>
            <input
              value={rutaVideo}
              onChange={e => setRutaVideo(e.target.value)}
              placeholder="Ej: C:\videos\pelea_ivan.mp4"
              style={estilos.inputRuta}
            />
            <button onClick={testCargarVideo} style={estilos.btnVerificar}>
              <FolderOpen size={14} /> Verificar y Enlazar
            </button>
          </div>
          {videoOk !== null && (
            <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
              style={{ ...estilos.alertaVideo, backgroundColor: videoOk.ok ? 'rgba(46,204,113,0.06)' : 'rgba(231,76,60,0.06)', borderColor: videoOk.ok ? 'rgba(46,204,113,0.2)' : 'rgba(231,76,60,0.2)' }}>
              <div style={{ color: videoOk.ok ? COLORES_SEED.ok : COLORES_SEED.error, fontWeight: 700, fontSize: 12 }}>
                {videoOk.ok ? '✅ Video enlazado exitosamente' : `❌ Error: ${videoOk.msg}`}
              </div>
              {videoOk.ok && (
                <div style={{ fontSize: 11, color: 'var(--color-texto-suave)', marginTop: 2 }}>
                  {videoOk.nombre} — {(videoOk.tamano / 1024 / 1024).toFixed(1)} MB
                </div>
              )}
            </motion.div>
          )}
        </div>

        {/* Panel 3: Inyección TyC Sports y Simulación IA */}
        <div style={estilos.tarjeta}>
          <div style={estilos.tarjetaHeader}>
            <Lightbulb size={18} color="var(--color-exito)" />
            <h3 style={estilos.tarjetaTitulo}>Inteligencia Artificial y Transmisión de TV</h3>
          </div>
          <p style={estilos.tarjetaDesc}>
            Inyecta el análisis inteligente del combate desde TyC Sports, simulando los bloques de transcripción de voz de los comentaristas y reportes avanzados.
          </p>
          <div style={estilos.tarjetaAcciones}>
            <button onClick={ejecutarSeedTyC} disabled={cargando} className="boton-primario" style={{ fontSize: 12, padding: '10px 14px', background: 'rgba(212,175,55,0.1)', border: '1px solid var(--color-dorado)', color: 'var(--color-dorado)' }}>
              <Video size={14} /> Cargar Pelea TyC Sports
            </button>
            <button onClick={ejecutarInyectarInteligencia} disabled={cargando} className="boton-secundario" style={{ fontSize: 12, padding: '10px 14px', color: COLORES_SEED.blue }}>
              <Lightbulb size={14} /> Inyectar Reporte IA
            </button>
          </div>
        </div>

        {/* Panel 4: Dataset y Diagnóstico de Base de Datos */}
        <div style={estilos.tarjeta}>
          <div style={estilos.tarjetaHeader}>
            <ShieldCheck size={18} color="var(--color-dorado)" />
            <h3 style={estilos.tarjetaTitulo}>Dataset de Entrenamiento y Diagnóstico</h3>
          </div>
          <p style={estilos.tarjetaDesc}>
            Compila el estado actual de IndexedDB en un archivo de Snapshot estructurado (JSON) que sirve para entrenar o calibrar los modelos del Asistente AI.
          </p>
          <div style={estilos.tarjetaAcciones}>
            <button onClick={ejecutarGenerarSnapshot} disabled={cargando} className="boton-primario" style={{ fontSize: 12, padding: '10px 14px' }}>
              <Zap size={14} /> Generar Dataset AI
            </button>
            <button onClick={verificarDB} disabled={cargando} className="boton-secundario" style={{ fontSize: 12, padding: '10px 14px' }}>
              <CheckCircle size={14} /> Verificar DB
            </button>
          </div>
        </div>
      </div>

      {/* Log de Ejecución en Tiempo Real */}
      {log.length > 0 && (
        <div style={estilos.logContainer}>
          <div style={estilos.logHeader}>Log de Ejecución en Tiempo Real</div>
          <div style={estilos.logBox}>
            {log.map((l, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }} style={{ color: colorLog(l.tipo), padding: '2px 0' }}>
                [{new Date(l.ts).toLocaleTimeString('es-AR')}] {l.msg}
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Checklist de Verificación de Integridad */}
      <div style={estilos.checklistTarjeta}>
        <h3 style={estilos.checklistTitulo}>🔍 Checklist de Integridad de la Aplicación</h3>
        <p style={{ fontSize: 12, color: 'var(--color-texto-suave)', margin: '0 0 16px' }}>
          Valores clave para asegurar que todos los módulos e interfaces de análisis funcionan de forma correcta.
        </p>
        <div style={estilos.checklistGrid}>
          {[
            { check: 'Iván Danele configurado como Rincón ROJO y Leveti como Rincón AZUL', nav: '/sesiones' },
            { check: 'La sesión creada se lista de forma correcta en el Historial de Sesiones', nav: '/sesiones' },
            { check: 'El Editor Táctico carga el timeline con los 33 eventos iniciales del Round 1', nav: null },
            { check: 'La barra de reproducción del video muestra los marcadores tácticos de colores', nav: null },
            { check: 'El tooltip de evento muestra correctamente el round, esquina, golpe y notas', nav: null },
            { check: 'Los controles de zoom y filtrado funcionan dinámicamente en el editor', nav: null },
            { check: 'El video se reproduce a través de la ruta local usando el protocolo seguro daneri-file://', nav: null },
            { check: 'El transcriptor de comentarios de voz muestra los bloques de voz en el editor', nav: null },
            { check: 'La vista de Inicio recopila y grafica las métricas de volumen y efectividad', nav: '/inicio' },
          ].map((item, i) => (
            <div key={i} style={estilos.checkItem}>
              <div style={estilos.checkCirculo}>
                <CheckCircle size={12} color="var(--color-texto-suave)" />
              </div>
              <span style={estilos.checkTexto}>{item.check}</span>
              {item.nav && (
                <button onClick={() => navigate(item.nav)} style={estilos.checkLink}>
                  Ir a vista →
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Botones de Navegación Rápida */}
      <div style={estilos.footerAcceso}>
        <button onClick={abrirEditorConVideo} className="boton-primario" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, padding: '12px 24px' }}>
          <Play size={16} /> Abrir Editor Táctico <ChevronRight size={14} />
        </button>
        <button onClick={() => navigate('/sesiones')} className="boton-secundario" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, padding: '12px 24px' }}>
          <Clock size={16} /> Ir a Historial de Sesiones <ChevronRight size={14} />
        </button>
      </div>
    </div>
  )
}

const estilos = {
  container: {
    padding: '32px 40px',
    display: 'flex',
    flexDirection: 'column',
    gap: 24,
    maxWidth: 1040,
    overflowY: 'auto',
    height: '100%',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    color: '#ffffff'
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    borderBottom: '1px solid var(--color-borde)',
    paddingBottom: 20
  },
  badge: {
    width: '48px',
    height: '48px',
    borderRadius: '12px',
    background: 'rgba(212, 175, 55, 0.1)',
    border: '1px solid rgba(212, 175, 55, 0.3)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  tituloPage: {
    fontSize: 20,
    fontWeight: 700,
    margin: 0,
    color: 'var(--color-texto)'
  },
  subtituloPage: {
    fontSize: 13,
    color: 'var(--color-texto-suave)',
    margin: '4px 0 0 0',
    lineHeight: 1.4
  },
  gridStats: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 16
  },
  tarjetaStat: {
    background: 'var(--color-superficie)',
    border: '1px solid var(--color-borde)',
    borderRadius: 12,
    padding: '16px 20px',
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
  },
  iconStat: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  valorStat: {
    fontSize: 22,
    fontWeight: 700,
    lineHeight: 1
  },
  labelStat: {
    fontSize: 11,
    color: 'var(--color-texto-suave)',
    marginTop: 4,
    fontWeight: 500
  },
  gridPanels: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 20
  },
  tarjeta: {
    background: 'linear-gradient(135deg, var(--color-superficie), rgba(28,28,28,0.95))',
    border: '1px solid var(--color-borde)',
    borderRadius: 16,
    padding: 24,
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
    boxShadow: '0 8px 24px rgba(0,0,0,0.2)'
  },
  tarjetaHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    borderBottom: '1px solid var(--color-borde)',
    paddingBottom: 12
  },
  tarjetaTitulo: {
    fontSize: 15,
    fontWeight: 700,
    margin: 0,
    color: 'var(--color-texto)'
  },
  tarjetaDesc: {
    fontSize: 12,
    color: 'var(--color-texto-suave)',
    lineHeight: 1.5,
    margin: 0
  },
  miniResumen: {
    background: 'var(--color-superficie-2)',
    borderRadius: 8,
    padding: 10,
    display: 'flex',
    flexDirection: 'column',
    gap: 6
  },
  miniItem: {
    fontSize: 11,
    color: 'var(--color-texto-suave)',
    borderLeft: '3px solid transparent',
    paddingLeft: 8
  },
  tarjetaAcciones: {
    display: 'flex',
    gap: 10,
    flexWrap: 'wrap',
    marginTop: 'auto',
    paddingTop: 8
  },
  inputContainer: {
    display: 'flex',
    gap: 8,
    marginTop: 'auto'
  },
  inputRuta: {
    flex: 1,
    background: 'var(--color-superficie-2)',
    border: '1px solid var(--color-borde)',
    borderRadius: 8,
    padding: '10px 12px',
    color: 'var(--color-texto)',
    fontSize: 12,
    fontFamily: 'monospace',
    outline: 'none'
  },
  btnVerificar: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '10px 14px',
    background: 'rgba(52,152,219,0.1)',
    border: '1px solid rgba(52,152,219,0.4)',
    borderRadius: 8,
    color: 'var(--color-azul-suave)',
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer'
  },
  alertaVideo: {
    border: '1px solid',
    borderRadius: 8,
    padding: 12
  },
  logContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8
  },
  logHeader: {
    fontSize: 13,
    fontWeight: 700,
    color: 'var(--color-texto)'
  },
  logBox: {
    background: 'rgba(0,0,0,0.4)',
    borderRadius: 10,
    padding: 16,
    fontFamily: 'monospace',
    fontSize: 11,
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    maxHeight: 160,
    overflowY: 'auto',
    border: '1px solid var(--color-borde)',
    lineHeight: 1.4
  },
  checklistTarjeta: {
    background: 'var(--color-superficie)',
    border: '1px solid var(--color-borde)',
    borderRadius: 16,
    padding: 24,
    boxShadow: '0 4px 16px rgba(0,0,0,0.1)'
  },
  checklistTitulo: {
    fontSize: 15,
    fontWeight: 700,
    color: 'var(--color-texto)',
    margin: 0
  },
  checklistGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 12,
    marginTop: 8
  },
  checkItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '8px 0',
    borderBottom: '1px solid var(--color-borde)'
  },
  checkCirculo: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0
  },
  checkTexto: {
    flex: 1,
    fontSize: 12,
    color: 'var(--color-texto-suave)',
    lineHeight: 1.3
  },
  checkLink: {
    fontSize: 11,
    color: 'var(--color-dorado)',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    textDecoration: 'underline',
    padding: 0
  },
  footerAcceso: {
    display: 'flex',
    gap: 12,
    borderTop: '1px solid var(--color-borde)',
    paddingTop: 24,
    marginTop: 8
  }
}
