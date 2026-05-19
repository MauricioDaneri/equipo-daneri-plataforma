import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { fabric } from 'fabric'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../servicios/db'
import { 
  Play, Pause, SkipBack, SkipForward, X,
  PenTool, MousePointer2, Minus, Circle, Type, Trash2, Video, Upload, MonitorPlay
} from 'lucide-react'

const COLORES = ['#E74C3C', '#D4AF37', '#F0F0F0', '#3498DB']

export default function Presentacion() {
  const { id } = useParams()
  const navigate = useNavigate()

  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const wrapperRef = useRef(null)
  const fileInputRef = useRef(null)

  const [videoFile, setVideoFile] = useState(null)
  const [videoUrl, setVideoUrl] = useState('')
  const [videoFaltante, setVideoFaltante] = useState(false)
  
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(1) // Evitar división por cero

  const [eventos, setEventos] = useState([])
  const [boxeadores, setBoxeadores] = useState({ rojo: '', azul: '' })

  const [statsRoja, setStatsRoja] = useState({ conectados: 0, errados: 0, total: 0, efectividad: 0 })
  const [statsAzul, setStatsAzul] = useState({ conectados: 0, errados: 0, total: 0, efectividad: 0 })

  const [canvasInstance, setCanvasInstance] = useState(null)
  const [herramientaActiva, setHerramientaActiva] = useState('cursor')
  const [colorActivo, setColorActivo] = useState(COLORES[0])

  useEffect(() => {
    if (id) {
      const cargarSesion = async () => {
        const sesion = await db.sesiones.get(Number(id))
        if (sesion) {
          const bRojo = await db.boxeadores.get(sesion.boxeadorRojoId)
          const bAzul = await db.boxeadores.get(sesion.boxeadorAzulId)
          setBoxeadores({ rojo: bRojo?.nombre, azul: bAzul?.nombre })
          
          const evs = await db.eventos.where('sesionId').equals(Number(id)).toArray()
          setEventos(evs.sort((a,b) => a.timestamp - b.timestamp))
          setVideoFaltante(true)
        }
      }
      cargarSesion()
    }
  }, [id])

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setVideoFile(file)
      setVideoUrl(URL.createObjectURL(file))
      setVideoFaltante(false)
    }
  }

  const cargarModoDemo = () => {
    // Video open-source para pruebas de HUD
    setVideoUrl('http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4')
    setVideoFaltante(false)
  }

  // Fabric.js
  useEffect(() => {
    if (!canvasRef.current || !wrapperRef.current) return

    let canvas = null;
    const initCanvas = () => {
      if (!wrapperRef.current) return
      const { width, height } = wrapperRef.current.getBoundingClientRect()
      canvas = new fabric.Canvas(canvasRef.current, {
        width, height,
        isDrawingMode: false,
        selection: true,
      })
      canvas.freeDrawingBrush.color = colorActivo
      canvas.freeDrawingBrush.width = 4
      setCanvasInstance(canvas)

      window.addEventListener('resize', () => {
        if (wrapperRef.current && canvas) {
          const rect = wrapperRef.current.getBoundingClientRect()
          canvas.setWidth(rect.width)
          canvas.setHeight(rect.height)
          canvas.renderAll()
        }
      })
    }
    const timeout = setTimeout(initCanvas, 100)
    return () => {
      clearTimeout(timeout)
      try { canvas && canvas.dispose() } catch(e) {}
    }
  }, [])

  useEffect(() => {
    if (!canvasInstance) return
    canvasInstance.isDrawingMode = (herramientaActiva === 'lapiz')
    canvasInstance.freeDrawingBrush.color = colorActivo
    canvasInstance.defaultCursor = herramientaActiva === 'cursor' ? 'default' : 'crosshair'
  }, [herramientaActiva, colorActivo, canvasInstance])

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) videoRef.current.pause()
      else videoRef.current.play()
      setIsPlaying(!isPlaying)
    }
  }

  const saltar = (segundos) => {
    if (videoRef.current) {
      videoRef.current.currentTime += segundos
    }
  }

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const now = videoRef.current.currentTime
      setCurrentTime(now)
      
      // Calcular Stats en Tiempo Real
      let rC = 0, rE = 0, rT = 0
      let aC = 0, aE = 0, aT = 0
      
      for (let i = 0; i < eventos.length; i++) {
        const ev = eventos[i]
        if (ev.timestamp > now) break // asumiendo que están ordenados
        
        if (ev.esquina === 'roja') {
          rT++
          if (ev.tipo === 'Golpe Conectado') rC++
          if (ev.tipo === 'Golpe Errado') rE++
        } else if (ev.esquina === 'azul') {
          aT++
          if (ev.tipo === 'Golpe Conectado') aC++
          if (ev.tipo === 'Golpe Errado') aE++
        }
      }

      setStatsRoja({
        conectados: rC, errados: rE, total: rT, 
        efectividad: rC + rE > 0 ? Math.round((rC / (rC + rE)) * 100) : 0
      })
      
      setStatsAzul({
        conectados: aC, errados: aE, total: aT,
        efectividad: aC + aE > 0 ? Math.round((aC / (aC + aE)) * 100) : 0
      })
    }
  }

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration)
    }
  }

  const saltarAEvento = (timestamp) => {
    if (videoRef.current) {
      // Saltar 2 segundos ANTES del evento para contexto táctico
      videoRef.current.currentTime = Math.max(0, timestamp - 2)
      videoRef.current.play()
      setIsPlaying(true)
    }
  }

  const formatTime = (segundos) => {
    const m = Math.floor(segundos / 60)
    const s = Math.floor(segundos % 60)
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  return (
    <div style={estilos.pagina}>
      
      {/* Botón Salir */}
      <button onClick={() => navigate('/sesiones')} style={estilos.btnCerrar}>
        <X size={24} color="var(--color-texto)" />
      </button>

      {/* Título Transparente Flotante */}
      <div style={estilos.overlayTitulo}>
        <h1 style={{ margin: 0, fontSize: 18, fontWeight: 700, letterSpacing: '0.05em' }}>CINE ANALÍTICO</h1>
        <div style={{ fontSize: 12, color: 'var(--color-texto-suave)' }}>
          <span style={{ color: 'var(--color-rojo-suave)' }}>{boxeadores.rojo || 'Rojo'}</span> vs <span style={{ color: 'var(--color-azul-suave)' }}>{boxeadores.azul || 'Azul'}</span>
        </div>
      </div>

      {/* Widgets Estadísticos Laterales (Solo si hay video y eventos) */}
      {videoUrl && (
        <>
          <div style={estilos.widgetRojo}>
            <div style={estilos.widgetLabel}>RINCÓN ROJO</div>
            <div style={estilos.widgetEfectividad}>{statsRoja.efectividad}%<span style={estilos.widgetUnidad}> EFICACIA</span></div>
            <div style={estilos.widgetRow}><span>Total Acciones:</span> <span>{statsRoja.total}</span></div>
            <div style={estilos.widgetRow}><span>Conectados:</span> <span style={{color: 'var(--color-exito)'}}>{statsRoja.conectados}</span></div>
          </div>
          
          <div style={estilos.widgetAzul}>
            <div style={estilos.widgetLabel}>RINCÓN AZUL</div>
            <div style={estilos.widgetEfectividad}>{statsAzul.efectividad}%<span style={estilos.widgetUnidad}> EFICACIA</span></div>
            <div style={estilos.widgetRow}><span>Total Acciones:</span> <span>{statsAzul.total}</span></div>
            <div style={estilos.widgetRow}><span>Conectados:</span> <span style={{color: 'var(--color-exito)'}}>{statsAzul.conectados}</span></div>
          </div>
        </>
      )}

      {/* Herramientas de Dibujo Flotantes */}
      <div style={estilos.barraDibujo}>
        <div style={estilos.grupoHerramientas}>
          <button style={herramientaActiva === 'cursor' ? estilos.btnHerramientaActivo : estilos.btnHerramienta} onClick={() => setHerramientaActiva('cursor')}><MousePointer2 size={16} /></button>
          <button style={herramientaActiva === 'lapiz' ? estilos.btnHerramientaActivo : estilos.btnHerramienta} onClick={() => setHerramientaActiva('lapiz')}><PenTool size={16} /></button>
        </div>
        <div style={estilos.divisor}></div>
        <div style={estilos.grupoHerramientas}>
          {COLORES.map(color => (
            <button key={color} style={{...estilos.btnColor, background: color, border: colorActivo === color ? '2px solid white' : 'none'}} onClick={() => setColorActivo(color)} />
          ))}
        </div>
        <div style={estilos.divisor}></div>
        <button style={estilos.btnHerramienta} onClick={() => canvasInstance?.clear()}><Trash2 size={16} /></button>
      </div>

      {/* CONTENEDOR VIDEO + CANVAS */}
      <div style={estilos.wrapper} ref={wrapperRef}>
        {!videoUrl ? (
          <div style={estilos.videoPlaceholder}>
            <Video size={64} color="var(--color-texto-suave)" />
            <p style={{marginTop: 16, color: 'var(--color-texto)', fontSize: 18, fontWeight: 600}}>
              {videoFaltante ? "Sesión Lista. Vincula el video original para presentar:" : "Sin Video"}
            </p>
            <input type="file" accept="video/mp4,video/webm,video/ogg" onChange={handleFileChange} ref={fileInputRef} style={{ display: 'none' }} />
            <div style={{ display: 'flex', gap: 16, marginTop: 24 }}>
              <button className="boton-primario" style={{ fontSize: 16, padding: '12px 24px', display: 'flex', gap: 8 }} onClick={() => fileInputRef.current?.click()}>
                <Upload size={20} /> Cargar Video
              </button>
              <button className="boton-secundario" style={{ fontSize: 16, padding: '12px 24px', display: 'flex', gap: 8 }} onClick={cargarModoDemo}>
                <MonitorPlay size={20} /> Iniciar Modo Demo
              </button>
            </div>
          </div>
        ) : (
          <video 
            ref={videoRef}
            src={videoUrl}
            style={estilos.videoElement}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onEnded={() => setIsPlaying(false)}
            onClick={togglePlay}
          />
        )}

        <div style={{...estilos.canvasElement, display: videoUrl ? 'block' : 'none', pointerEvents: herramientaActiva === 'cursor' ? 'none' : 'auto'}}>
          <canvas ref={canvasRef} />
        </div>
      </div>

      {/* CONTROLES INFERIORES */}
      <div style={estilos.controlesContenedor}>
        {/* Timeline de Eventos */}
        <div style={estilos.timelineContainer}>
          <div style={{ ...estilos.timelineProgreso, width: `${(currentTime / duration) * 100}%` }}></div>
          
          {/* Marcadores */}
          {eventos.map(ev => {
            const left = `${(ev.timestamp / duration) * 100}%`
            const color = ev.esquina === 'roja' ? 'var(--color-rojo-suave)' : ev.esquina === 'azul' ? 'var(--color-azul-suave)' : 'var(--color-dorado)'
            return (
              <div 
                key={ev.id} 
                style={{ ...estilos.marcadorEvento, left, backgroundColor: color }}
                title={`${ev.tipo} - ${formatTime(ev.timestamp)}`}
                onClick={() => saltarAEvento(ev.timestamp)}
              />
            )
          })}
        </div>

        {/* Playback */}
        <div style={estilos.playbackControls}>
          <div style={estilos.timeDisplay}>{formatTime(currentTime)} / {formatTime(duration)}</div>
          
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <button style={estilos.btnPlayback} onClick={() => saltar(-5)}><SkipBack size={24} color="var(--color-texto)" /></button>
            <button style={estilos.btnPlayMain} onClick={togglePlay}>
              {isPlaying ? <Pause size={28} color="var(--color-fondo)" /> : <Play size={28} color="var(--color-fondo)" style={{marginLeft: 4}}/>}
            </button>
            <button style={estilos.btnPlayback} onClick={() => saltar(5)}><SkipForward size={24} color="var(--color-texto)" /></button>
          </div>
          
          <div style={{ flex: 1 }}></div>
        </div>
      </div>

    </div>
  )
}

const estilos = {
  pagina: { width: '100vw', height: '100vh', background: 'var(--color-fondo)', display: 'flex', flexDirection: 'column', position: 'relative' },
  btnCerrar: { position: 'absolute', top: 24, left: 24, zIndex: 100, background: 'rgba(255,255,255,0.1)', border: 'none', width: 48, height: 48, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'background 0.2s', backdropFilter: 'blur(4px)' },
  overlayTitulo: { position: 'absolute', top: 24, left: 96, zIndex: 100, color: 'var(--color-texto)', background: 'rgba(0,0,0,0.5)', padding: '8px 16px', borderRadius: 8, backdropFilter: 'blur(4px)' },
  barraDibujo: { position: 'absolute', top: 24, right: 24, zIndex: 100, display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(0,0,0,0.7)', padding: '8px 16px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)' },
  grupoHerramientas: { display: 'flex', gap: 4 },
  btnHerramienta: { background: 'transparent', border: 'none', color: 'var(--color-texto)', opacity: 0.5, width: 32, height: 32, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' },
  btnHerramientaActivo: { background: 'rgba(212,175,55,0.3)', border: 'none', color: 'var(--color-dorado)', width: 32, height: 32, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' },
  divisor: { width: 1, height: 24, background: 'rgba(255,255,255,0.2)' },
  btnColor: { width: 16, height: 16, borderRadius: '50%', cursor: 'pointer' },
  
  widgetRojo: { position: 'absolute', top: 120, left: 24, zIndex: 90, background: 'rgba(231,76,60,0.1)', borderLeft: '4px solid var(--color-rojo-suave)', padding: '16px', borderRadius: '0 8px 8px 0', width: 180, backdropFilter: 'blur(8px)' },
  widgetAzul: { position: 'absolute', top: 120, right: 24, zIndex: 90, background: 'rgba(52,152,219,0.1)', borderRight: '4px solid var(--color-azul-suave)', padding: '16px', borderRadius: '8px 0 0 8px', width: 180, textAlign: 'right', backdropFilter: 'blur(8px)' },
  widgetLabel: { fontSize: 10, color: 'var(--color-texto)', fontWeight: 800, letterSpacing: '1px', marginBottom: 8 },
  widgetEfectividad: { fontSize: 32, fontWeight: 800, color: 'var(--color-texto)', margin: '0 0 12px 0', lineHeight: 1, textShadow: '0 2px 10px rgba(0,0,0,0.5)' },
  widgetUnidad: { fontSize: 10, color: 'var(--color-texto-suave)', fontWeight: 600, letterSpacing: '1px', marginLeft: 4 },
  widgetRow: { display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--color-texto-suave)', marginBottom: 4 },

  wrapper: { flex: 1, position: 'relative', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  videoPlaceholder: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' },
  videoElement: { width: '100%', height: '100%', objectFit: 'contain' },
  canvasElement: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' },
  
  controlesContenedor: { background: 'linear-gradient(to top, rgba(0,0,0,0.9), transparent)', padding: '40px 40px 24px 40px', position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 100 },
  timelineContainer: { width: '100%', height: 12, background: 'rgba(255,255,255,0.1)', borderRadius: 6, position: 'relative', marginBottom: 24, cursor: 'pointer' },
  timelineProgreso: { height: '100%', background: 'rgba(255,255,255,0.3)', borderRadius: 6, transition: 'width 0.1s linear' },
  marcadorEvento: { position: 'absolute', top: -4, width: 12, height: 20, borderRadius: 2, transform: 'translateX(-50%)', cursor: 'pointer', transition: 'transform 0.2s', zIndex: 2 },
  
  playbackControls: { display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' },
  timeDisplay: { position: 'absolute', left: 0, fontFamily: 'monospace', fontSize: 16, color: 'rgba(255,255,255,0.7)', letterSpacing: '1px' },
  btnPlayback: { background: 'transparent', border: 'none', cursor: 'pointer', opacity: 0.8 },
  btnPlayMain: { background: 'var(--color-dorado)', border: 'none', width: 56, height: 56, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 0 20px rgba(212,175,55,0.4)', transition: 'transform 0.1s' },
}
