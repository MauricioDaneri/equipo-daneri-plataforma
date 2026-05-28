/**
 * VideoTimelineOverlay.jsx
 * ========================
 * Barra de eventos sobre el video con zoom automático e inteligente.
 */

import { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import { getTipoEvento, COLORES_RINCON, TIPOS_EVENTO } from '../../servicios/eventTypes'

// ─── Constantes ────────────────────────────────────────────────────────────────
const ALTURA_BARRA      = 56   // px de altura total de la barra
const ALTURA_MARCA      = 20   // px de cada marcador
const MIN_ZOOM          = 1    // sin zoom
const MAX_ZOOM          = 20   // zoom máximo
const AUTO_ZOOM_UMBRAL  = 5    // eventos en 2 segundos → auto-zoom

function formatTime(seg) {
  const m = Math.floor(seg / 60)
  const s = Math.floor(seg % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

// ─── Tooltip ──────────────────────────────────────────────────────────────────
function EventTooltip({ evento, x, y, visible }) {
  if (!visible || !evento) return null
  const cfg   = getTipoEvento(evento.tipo)
  const rincon = evento.esquina === 'roja' ? 'Rojo' : evento.esquina === 'azul' ? 'Azul' : 'General'
  return (
    <div style={{
      position: 'fixed',
      left: Math.min(x + 12, window.innerWidth - 260),
      top: Math.max(y - 90, 4),
      width: 240,
      background: 'var(--color-superficie)',
      border: `1px solid ${cfg.color}`,
      borderRadius: 10,
      padding: '12px 14px',
      pointerEvents: 'none',
      zIndex: 9999,
      boxShadow: `0 4px 24px rgba(0,0,0,0.6), 0 0 0 1px ${cfg.color}30`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <span style={{
          width: 28, height: 28, borderRadius: 6,
          background: cfg.color + '22', border: `1px solid ${cfg.color}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 13, fontWeight: 700, color: cfg.color
        }}>{cfg.icon}</span>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-texto)' }}>{evento.tipo}</div>
          <div style={{ fontSize: 10, color: 'var(--color-texto-suave)', fontWeight: 600 }}>ID #{cfg.id} — {cfg.shortName}</div>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 12px', fontSize: 11 }}>
        <div style={{ color: 'var(--color-texto-muted)' }}>Tiempo</div>
        <div style={{ color: 'var(--color-texto)', fontFamily: 'monospace' }}>{formatTime(evento.tiempoVideo ?? evento.timestamp)}</div>
        <div style={{ color: 'var(--color-texto-muted)' }}>Round</div>
        <div style={{ color: 'var(--color-texto)' }}>{evento.round ?? '—'}</div>
        <div style={{ color: 'var(--color-texto-muted)' }}>Rincón</div>
        <div style={{ color: evento.esquina === 'roja' ? 'var(--color-rojo-suave)' : evento.esquina === 'azul' ? 'var(--color-azul-suave)' : 'var(--color-texto-suave)' }}>{rincon}</div>
        {evento.duracion > 0 && (
          <>
            <div style={{ color: 'var(--color-texto-muted)' }}>Duración</div>
            <div style={{ color: 'var(--color-texto)', fontFamily: 'monospace' }}>{evento.duracion.toFixed(2)}s</div>
          </>
        )}
      </div>
      {evento.nota && (
        <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--color-borde)', fontSize: 11, color: 'var(--color-texto-suave)', fontStyle: 'italic' }}>
          🏷️ "{evento.nota}"
        </div>
      )}
      <div style={{ marginTop: 6, fontSize: 10, color: 'var(--color-texto-muted)' }}>Clic: Seleccionar · Doble clic: Editar · Clic Der: Menú Contextual</div>
    </div>
  )
}

// Mapeos de tracks multilinea para el modo expandido
const LANES_INFO = [
  { index: 0, label: "JAB" },
  { index: 1, label: "RECTO / CROSS" },
  { index: 2, label: "GANCHO / UPPER / SWING" },
  { index: 3, label: "ESQUIVA / BLOQUEO / PIVOTE" },
  { index: 4, label: "CLINCH / FINTA" },
  { index: 5, label: "GENERAL" },
];

const MAPEO_TRACKS = {
  'Jab': 0,
  'Recto': 1,
  'Cross': 1,
  'Gancho': 2,
  'Uppercut': 2,
  'Swing': 2,
  'Esquiva': 3,
  'Bloqueo': 3,
  'Pivoteo': 3,
  'Clinch': 4,
  'Finta': 4,
  'Marca General': 5,
};

const getTrackIndex = (tipo) => {
  return MAPEO_TRACKS[tipo] ?? 5;
};

// ─── Componente Principal ──────────────────────────────────────────────────────
export default function VideoTimelineOverlay({ 
  eventos = [], 
  duracion = 0, 
  tiempoActual = 0, 
  onSeek, 
  onSeekLoop, 
  onCompare, 
  onEditEvento, 
  onMoveEvento, 
  onUpdateEvento,
  onSelectEvento,
  onRemoveEvento,
  expanded = false, 
  eventoSeleccionadoId,
  style = {},
  roundStarts = {},
  totalRounds = 12,
  filtroAislamiento = null,
  modoVisualizacion = null,
}) {
  const barraRef       = useRef(null)
  const [zoom,          setZoom]         = useState(MIN_ZOOM)
  const [scrollOffset,  setScrollOffset] = useState(0) // 0-1, posición del "viewport" dentro del zoom
  const [tooltip,       setTooltip]      = useState({ visible: false, evento: null, x: 0, y: 0 })
  const [comparando,    setComparando]   = useState([])      // hasta 2 eventos seleccionados
  const [autoZoomed,    setAutoZoomed]   = useState(false)
  const [hoveredMarkerId, setHoveredMarkerId] = useState(null)
  const [modoVisLocal,  setModoVisLocal] = useState('apilado')
  const [contextMenu,   setContextMenu]  = useState({ visible: false, ev: null, x: 0, y: 0 })
  const isDragging     = useRef(false)
  const hasDragged     = useRef(false)
  const clickTimeoutRef = useRef(null)

  // Usar el prop si se pasa, de lo contrario usar el estado local
  const modoVis = modoVisualizacion || modoVisLocal;
  const setModoVis = (val) => setModoVisLocal(val);

  // Limpiar timeouts al desmontar
  useEffect(() => {
    return () => {
      if (clickTimeoutRef.current) clearTimeout(clickTimeoutRef.current)
    }
  }, [])
  const dragStartX     = useRef(0)

  // Centrar y zoom a 8x al seleccionar un evento
  useEffect(() => {
    if (eventoSeleccionadoId && duracion > 0) {
      const selected = eventos.find(e => e.id === eventoSeleccionadoId)
      if (selected) {
        const t = selected.tiempoVideo ?? selected.timestamp
        const pos = t / duracion
        const targetZoom = 8
        setZoom(targetZoom)
        setScrollOffset(Math.max(0, Math.min(1 - 1/targetZoom, pos - 0.5/targetZoom)))
      }
    }
  }, [eventoSeleccionadoId, eventos, duracion])

  // ─── Auto-zoom inteligente ──────────────────────────────────────────────────
  useEffect(() => {
    if (duracion === 0 || eventos.length === 0) return

    // Si hay un evento seleccionado, no anular el zoom manual/selection
    if (eventoSeleccionadoId) return

    const ventana = 2 // segundos
    const cercanos = eventos.filter(e => {
      const t = e.tiempoVideo ?? e.timestamp
      return Math.abs(t - tiempoActual) <= ventana
    })

    if (cercanos.length >= AUTO_ZOOM_UMBRAL && !autoZoomed) {
      const targetZoom = Math.min(MAX_ZOOM, Math.max(4, cercanos.length * 1.5))
      setZoom(targetZoom)
      const pos = tiempoActual / duracion
      setScrollOffset(Math.max(0, Math.min(1 - 1/targetZoom, pos - 0.5/targetZoom)))
      setAutoZoomed(true)
    } else if (cercanos.length < 2 && autoZoomed) {
      setAutoZoomed(false)
    }
  }, [tiempoActual, eventos, duracion, autoZoomed, eventoSeleccionadoId])

  // ─── Rueda del ratón → zoom centrado en la posición física del mouse ─────────
  const handleWheel = useCallback((e) => {
    e.preventDefault()
    if (duracion === 0 || !barraRef.current) return
    const step = e.deltaY > 0 ? -1 : 1
    
    const rect = barraRef.current.getBoundingClientRect()
    const xMouse = e.clientX - rect.left
    const fraccionMouse = Math.max(0, Math.min(1, xMouse / rect.width))

    setZoom(prev => {
      const nextZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, prev + step))
      if (nextZoom === prev) return prev
      
      const tMouse = fraccionMouse / prev + scrollOffset
      const nextScrollOffset = Math.max(0, Math.min(1 - 1 / nextZoom, tMouse - fraccionMouse / nextZoom))
      setScrollOffset(nextScrollOffset)
      
      return nextZoom
    })
  }, [duracion, scrollOffset])

  useEffect(() => {
    const el = barraRef.current
    if (!el) return
    el.addEventListener('wheel', handleWheel, { passive: false })
    return () => el.removeEventListener('wheel', handleWheel)
  }, [handleWheel])

  // ─── Arrastre del scroll en la barra ────────────────────────────────────────
  const handleMouseDown = (e) => {
    if (zoom <= 1) return
    isDragging.current = true
    dragStartX.current = e.clientX
    hasDragged.current = false
    e.preventDefault()
  }
  const handleMouseMove = useCallback((e) => {
    if (!isDragging.current || !barraRef.current) return
    const deltaX = Math.abs(e.clientX - dragStartX.current)
    if (deltaX > 2) {
      hasDragged.current = true
    }
    const ancho  = barraRef.current.getBoundingClientRect().width
    const delta  = (e.clientX - dragStartX.current) / ancho / zoom
    dragStartX.current = e.clientX
    setScrollOffset(prev => Math.max(0, Math.min(1 - 1/zoom, prev - delta)))
  }, [zoom])
  const handleMouseUp = () => { isDragging.current = false }

  // ─── Calcular posición de un evento en la barra (0-100%) ────────────────────
  const posicionEvento = useCallback((evento) => {
    if (duracion === 0) return 0
    const t = (evento.tiempoVideo ?? evento.timestamp) / duracion
    // Transformar con zoom y scroll
    return ((t - scrollOffset) * zoom) * 100
  }, [duracion, zoom, scrollOffset])

  // ─── Filtrar eventos visibles (dentro del viewport) ─────────────────────────
  const eventosVisibles = useMemo(() => {
    return eventos.filter(e => {
      const pos = posicionEvento(e)
      // Permitir un rango más amplio para barras de duración
      const len = e.duracion ? ((e.duracion / duracion) * zoom * 100) : 0
      return pos >= -2 - len && pos <= 102
    })
  }, [eventos, posicionEvento, duracion, zoom])

  // ─── Detectar clusters (eventos muy cercanos) ────────────────────────────────
  const isExpandedView = expanded || modoVis === 'canales';
  const isPuntosView = modoVis === 'puntos';

  // ─── Detectar clusters (eventos muy cercanos) con algoritmo de colisión dinámico ────
  const eventosConNivel = useMemo(() => {
    const sorted = [...eventosVisibles].sort((a, b) => (a.tiempoVideo ?? a.timestamp) - (b.tiempoVideo ?? b.timestamp))
    
    if (isExpandedView) {
      // En modo canales, calcular subniveles dentro de cada canal para evitar solapamientos
      const tracksOcupados = {} // { trackIndex: [{ start, end, subNivel }] }
      return sorted.map(ev => {
        const trackIndex = getTrackIndex(ev.tipo)
        if (!tracksOcupados[trackIndex]) {
          tracksOcupados[trackIndex] = []
        }
        let subNivel = 0
        const pos = posicionEvento(ev)
        const hasDur = ev.duracion > 0
        const durPct = hasDur ? ((ev.duracion / duracion) * zoom * 100) : 0
        
        // Estimar extensión total en el viewport escalado por el zoom
        const labelWidthPct = isPuntosView ? 1.5 : Math.max(1.5, 10.5 / zoom)
        const start = pos
        const end = pos + durPct + labelWidthPct
        
        while (tracksOcupados[trackIndex].some(o => o.subNivel === subNivel && !(end < o.start || start > o.end))) {
          subNivel++
        }
        
        tracksOcupados[trackIndex].push({ start, end, subNivel })
        return { ...ev, _subNivel: subNivel % 3, _pos: pos }
      })
    } else {
      // En modo compacto, calcular nivel general con algoritmo de colisión dinámico de intervalos
      const generalOcupado = [] // [{ start, end, nivel }]
      return sorted.map(ev => {
        const pos = posicionEvento(ev)
        const hasDur = ev.duracion > 0
        const durPct = hasDur ? ((ev.duracion / duracion) * zoom * 100) : 0
        
        // Estimar ancho real de la etiqueta en porcentaje del contenedor (escala inversamente al zoom)
        const baseWidth = isPuntosView ? 1.5 : 10.5
        const labelWidthPct = hasDur 
          ? durPct + Math.max(1.5, baseWidth / zoom)
          : Math.max(1.5, baseWidth / zoom)
        
        // Intervalos de ocupación horizontal (centrado si no tiene duración, desde el inicio si la tiene)
        const start = hasDur ? pos : pos - labelWidthPct / 2
        const end = hasDur ? pos + labelWidthPct : pos + labelWidthPct / 2
        
        let nivel = 0
        while (generalOcupado.some(o => o.nivel === nivel && !(end < o.start || start > o.end))) {
          nivel++
        }
        generalOcupado.push({ start, end, nivel })
        return { ...ev, _nivel: nivel, _pos: pos }
      })
    }
  }, [eventosVisibles, posicionEvento, duracion, zoom, isExpandedView, isPuntosView])

  const currentAlturaMarca = isExpandedView ? 24 : ALTURA_MARCA
  const ALTURA_LANE = 54
  const currentAlturaBarra = isExpandedView ? 240 : ALTURA_BARRA
  const gapVertical = isExpandedView ? 6 : 4
  const paddingVertical = isExpandedView ? 28 : 18

  const getSubNivelOffset = (subNivel) => {
    if (!subNivel) return 0
    const factor = Math.ceil(subNivel / 2)
    const signo = subNivel % 2 === 1 ? -1 : 1
    return signo * factor * 9 // Escalonamiento de 9px
  }

  // ─── Altura dinámica basada en niveles / lanes ──────────────────────────────────────
  const maxNivel = useMemo(() => Math.max(0, ...eventosConNivel.map(e => e._nivel || 0)), [eventosConNivel])
  const alturaTotal = isExpandedView 
    ? (6 * ALTURA_LANE + paddingVertical + 10) 
    : Math.max(currentAlturaBarra, (maxNivel + 1) * (currentAlturaMarca + gapVertical) + paddingVertical)

  // ─── Arrastre y edición de marcas (Draggable Timeline Markers) ────────────────
  const handleDragStartMarca = (e, ev) => {
    if (e.button !== 0) return // Solo click izquierdo
    e.stopPropagation()
    e.preventDefault()
    
    const id = ev.id
    const tInicial = ev.tiempoVideo ?? ev.timestamp
    const xInicial = e.clientX
    let xActual = e.clientX
    const anchoBarra = barraRef.current ? barraRef.current.getBoundingClientRect().width : 800
    
    const handleMouseMoveDrag = (moveEvent) => {
      xActual = moveEvent.clientX
      const deltaX = moveEvent.clientX - xInicial
      const deltaFraccion = deltaX / anchoBarra
      const deltaSegundos = (deltaFraccion / zoom) * duracion
      const nuevoTiempo = Math.max(0, Math.min(duracion, tInicial + deltaSegundos))
      
      onSeek?.(nuevoTiempo, true)
      onMoveEvento?.(id, nuevoTiempo)
    }
    
    const handleMouseUpDrag = () => {
      document.removeEventListener('mousemove', handleMouseMoveDrag)
      document.removeEventListener('mouseup', handleMouseUpDrag)
      
      const deltaTotal = Math.abs(xActual - xInicial)
      if (deltaTotal < 4) {
        // Clic o doble clic
        const clickTime = Date.now()
        const timeDiff = clickTime - (barraRef.current._lastClickTime || 0)
        
        if (timeDiff < 260) {
          // DOBLE CLIC: abrir modal de edición
          if (barraRef.current._clickTimeout) {
            clearTimeout(barraRef.current._clickTimeout)
            barraRef.current._clickTimeout = null
          }
          onEditEvento?.(ev)
        } else {
          // CLIC SIMPLE: seleccionar y mover a frame (esperando brevemente por doble clic)
          barraRef.current._clickTimeout = setTimeout(() => {
            onSeek?.(tInicial)
            onSelectEvento?.(ev.id)
            barraRef.current._clickTimeout = null
          }, 200)
        }
        barraRef.current._lastClickTime = clickTime
      }
    }
    
    document.addEventListener('mousemove', handleMouseMoveDrag)
    document.addEventListener('mouseup', handleMouseUpDrag)
  }

  // ─── Click Derecho -> Menú Contextual ─────────────────────────────────────────
  const handleContextMenuMarca = (e, ev) => {
    e.preventDefault()
    e.stopPropagation()
    setContextMenu({
      visible: true,
      ev,
      x: e.clientX,
      y: e.clientY
    })
  }

  // ─── Redimensionamiento de Duración (Resize Event Duration) ───────────────────
  const handleMouseDownResize = (e, ev) => {
    e.stopPropagation()
    e.preventDefault()
    
    const id = ev.id
    const duracionInicial = ev.duracion ?? 0
    const xInicial = e.clientX
    const anchoBarra = barraRef.current ? barraRef.current.getBoundingClientRect().width : 800
    
    const handleMouseMoveResize = (moveEvent) => {
      const deltaX = moveEvent.clientX - xInicial
      const deltaFraccion = deltaX / anchoBarra
      const deltaSegundos = (deltaFraccion / zoom) * duracion
      const nuevaDuracion = Math.max(0, duracionInicial + deltaSegundos)
      
      onUpdateEvento?.(id, { duracion: nuevaDuracion })
    }
    
    const handleMouseUpResize = () => {
      document.removeEventListener('mousemove', handleMouseMoveResize)
      document.removeEventListener('mouseup', handleMouseUpResize)
    }
    
    document.addEventListener('mousemove', handleMouseMoveResize)
    document.addEventListener('mouseup', handleMouseUpResize)
  }

  // ─── Click en la barra (seek) ────────────────────────────────────────────────
  const handleClickBarra = (e) => {
    if (hasDragged.current) {
      hasDragged.current = false
      return
    }
    if (!barraRef.current || isDragging.current) return
    if (!duracion || isNaN(duracion) || !isFinite(duracion)) {
      return
    }
    const rect    = barraRef.current.getBoundingClientRect()
    const fraccion = (e.clientX - rect.left) / rect.width
    const tiempoReal = (fraccion / zoom + scrollOffset) * duracion
    if (isNaN(tiempoReal) || !isFinite(tiempoReal)) {
      return
    }
    onSeek?.(Math.max(0, Math.min(duracion, tiempoReal)))
  }

  // ─── Posición del playhead ───────────────────────────────────────────────────
  const posPlayhead = duracion > 0
    ? ((tiempoActual / duracion - scrollOffset) * zoom) * 100
    : 0

  return (
    <div style={{ userSelect: 'none', position: 'relative', display: 'flex', flexDirection: 'column', ...style }}>

      {/* CONTROLES DE ZOOM */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 8px', background: 'var(--color-fondo)', borderTop: '1px solid var(--color-borde)' }}>
        <span style={{ fontSize: 10, color: 'var(--color-texto-muted)', fontWeight: 700, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
          Zoom
        </span>
        <button
          onClick={() => setZoom(z => Math.max(MIN_ZOOM, z - 1))}
          style={{ width: 22, height: 22, borderRadius: 4, background: 'var(--color-superficie)', border: '1px solid var(--color-borde)', color: 'var(--color-texto-suave)', cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >−</button>
        <input
          type="range"
          min={MIN_ZOOM} max={MAX_ZOOM} step={0.5}
          value={zoom}
          onChange={e => setZoom(Number(e.target.value))}
          style={{ flex: 1, accentColor: 'var(--color-dorado)', cursor: 'pointer' }}
        />
        <button
          onClick={() => setZoom(z => Math.min(MAX_ZOOM, z + 1))}
          style={{ width: 22, height: 22, borderRadius: 4, background: 'var(--color-superficie)', border: '1px solid var(--color-borde)', color: 'var(--color-texto-suave)', cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >+</button>
        <span style={{ fontSize: 10, color: zoom > 1 ? 'var(--color-dorado)' : 'var(--color-texto-muted)', fontFamily: 'monospace', minWidth: 36 }}>
          {zoom.toFixed(1)}x
        </span>
        <button
          onClick={() => { setZoom(MIN_ZOOM); setScrollOffset(0) }}
          style={{ fontSize: 10, color: 'var(--color-texto-muted)', background: 'transparent', border: 'none', cursor: 'pointer', textDecoration: 'underline', padding: 0 }}
        >Restablecer</button>

        {/* Triple Selector Visual */}
        <div style={{ display: 'flex', background: 'var(--color-superficie-2)', borderRadius: 14, padding: 2, border: '1px solid var(--color-borde)', marginLeft: 12, gap: 2 }}>
          {['apilado', 'canales', 'puntos'].map((mode) => (
            <button
              key={mode}
              onClick={() => setModoVis(mode)}
              style={{
                padding: '3px 10px',
                fontSize: 9,
                fontWeight: 750,
                borderRadius: 12,
                border: 'none',
                cursor: 'pointer',
                background: modoVis === mode ? 'var(--color-dorado-alfa)' : 'transparent',
                color: modoVis === mode ? 'var(--color-dorado)' : 'var(--color-texto-suave)',
                textTransform: 'uppercase',
                transition: 'all 0.2s',
              }}
            >
              {mode}
            </button>
          ))}
        </div>

        {autoZoomed && (
          <span style={{ fontSize: 10, color: 'var(--color-dorado)', background: 'var(--color-dorado-alfa)', padding: '2px 8px', borderRadius: 8, border: '1px solid rgba(212,175,55,0.3)' }}>
            ⚡ Auto-zoom
          </span>
        )}
      </div>

      {/* BARRA DE TIMELINE */}
      <div
        ref={barraRef}
        onClick={handleClickBarra}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => { handleMouseUp(); setTooltip(t => ({...t, visible: false})) }}
        style={{
          position: 'relative',
          height: isExpandedView ? 'auto' : 120,
          flex: isExpandedView ? 1 : 'none',
          minHeight: isExpandedView ? alturaTotal : 120,
          background: 'var(--color-fondo)',
          overflowY: isExpandedView ? 'hidden' : 'auto',
          overflowX: 'hidden',
          cursor: zoom > 1 ? 'grab' : 'pointer',
          borderTop: '1px solid var(--color-borde)',
        }}
      >
        {/* Fondo de tiempo con marcas de segundos */}
        <TimeRuler duracion={duracion} zoom={zoom} scrollOffset={scrollOffset} />

        {/* Canales verticales en el fondo si está expandido */}
        {isExpandedView && (
          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0, display: 'flex', flexDirection: 'column', paddingTop: paddingVertical }}>
            {LANES_INFO.map((lane) => (
              <div
                key={lane.index}
                style={{
                  height: ALTURA_LANE,
                  borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  paddingLeft: 8,
                }}
              >
                <span style={{
                  fontSize: 10,
                  fontWeight: 800,
                  letterSpacing: '0.05em',
                  color: 'rgba(255, 255, 255, 0.08)',
                  pointerEvents: 'none',
                }}>
                  {lane.label}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Marcadores verticales de inicio de asaltos (Rounds) */}
        {duracion > 0 && Array.from({ length: totalRounds }, (_, i) => i + 1).map(r => {
          const startTime = roundStarts[r];
          if (startTime === undefined || startTime === null || startTime > duracion) return null;
          const pct = ((startTime / duracion - scrollOffset) * zoom) * 100;
          if (pct < 0 || pct > 100) return null;
          return (
            <div
              key={`round-line-${r}`}
              style={{
                position: 'absolute',
                left: `${pct}%`,
                top: 0,
                bottom: 0,
                width: 2,
                borderLeft: '2px dashed rgba(212, 175, 55, 0.25)',
                zIndex: 2,
                pointerEvents: 'none',
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'center',
                paddingTop: 4
              }}
            >
              <span style={{
                fontSize: 8,
                fontWeight: 800,
                color: 'var(--color-dorado)',
                background: 'rgba(20,20,25,0.85)',
                border: '1px solid rgba(212,175,55,0.4)',
                borderRadius: 4,
                padding: '2px 5px',
                whiteSpace: 'nowrap',
                transform: 'translateY(16px)'
               }}>
                R{r}
              </span>
            </div>
          );
        })}

        {/* MARCADORES DE EVENTOS */}
        {eventosConNivel.map((ev, i) => {
          const cfg = getTipoEvento(ev.tipo)
          const estaEnComparacion = comparando.includes(ev)
          const esSeleccionado = ev.id === eventoSeleccionadoId
          const isCompactDot = isPuntosView || (zoom < 4.0 && !esSeleccionado && hoveredMarkerId !== ev.id)
          const esAtenuado = filtroAislamiento && ev.tipo !== filtroAislamiento

          // Calcular posicion vertical segun el modo expandido (lanes fijas) o compact
          const top = isExpandedView
            ? paddingVertical + getTrackIndex(ev.tipo) * ALTURA_LANE + (ALTURA_LANE - currentAlturaMarca) / 2 + getSubNivelOffset(ev._subNivel)
            : paddingVertical + (ev._nivel || 0) * (currentAlturaMarca + gapVertical)

          const hasDur = ev.duracion > 0
          const posStart = posicionEvento(ev)

          let topAdjusted = top
          let currentHeight = currentAlturaMarca

          if (isCompactDot) {
            if (hasDur) {
              currentHeight = 6
              topAdjusted = top + (currentAlturaMarca - 6) / 2
            } else {
              currentHeight = 10
              topAdjusted = top + (currentAlturaMarca - 10) / 2
            }
          }

          let markerStyle = {
            position: 'absolute',
            top: topAdjusted,
            height: currentHeight,
            borderRadius: isCompactDot ? (hasDur ? 3 : '50%') : 6,
            background: isCompactDot
              ? (hasDur ? cfg.color : (COLORES_RINCON[ev.esquina] || cfg.color))
              : (esSeleccionado 
                  ? 'var(--color-dorado-alfa)' 
                  : 'rgba(18, 18, 22, 0.95)'), // Naipes OPACOS para legibilidad
            border: esSeleccionado
              ? `2px solid var(--color-dorado)`
              : isCompactDot
                ? `1px solid rgba(255,255,255,0.75)`
                : `1px solid ${cfg.color}${estaEnComparacion ? 'ff' : '88'}`, // Accent border
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: isCompactDot ? 0 : 4,
            padding: isCompactDot ? 0 : '0 8px',
            cursor: esAtenuado ? 'not-allowed' : 'pointer',
            transition: 'all 0.15s ease',
            opacity: esAtenuado ? 0.12 : 1,
            filter: esAtenuado ? 'grayscale(80%) blur(0.5px)' : 'none',
            pointerEvents: esAtenuado ? 'none' : 'auto',
            boxShadow: esSeleccionado 
              ? `0 0 12px var(--color-dorado)` 
              : isCompactDot
                ? `0 0 6px ${cfg.color}`
                : estaEnComparacion 
                  ? `0 0 8px ${cfg.color}` 
                  : 'none',
            zIndex: esSeleccionado ? 15 : estaEnComparacion ? 10 : (hoveredMarkerId === ev.id ? 8 : 1),
            overflow: 'hidden',
          }

          if (hasDur) {
            const widthPercent = ((ev.duracion) / duracion * zoom) * 100
            markerStyle = {
              ...markerStyle,
              left: `${posStart}%`,
              width: `${widthPercent}%`,
              minWidth: isCompactDot ? 12 : 32,
              transform: 'none',
              justifyContent: isCompactDot ? 'center' : 'flex-start',
            }
          } else {
            markerStyle = {
              ...markerStyle,
              left: `${posStart}%`,
              width: isCompactDot ? 10 : 'auto',
              transform: 'translateX(-50%)',
            }
          }

          return (
            <div
              key={ev.id || i}
              onMouseDown={e => handleDragStartMarca(e, ev)}
              onContextMenu={e => handleContextMenuMarca(e, ev)}
              onMouseEnter={e => {
                setHoveredMarkerId(ev.id);
                setTooltip({ visible: true, evento: ev, x: e.clientX, y: e.clientY });
              }}
              onMouseMove={e => setTooltip(t => ({ ...t, x: e.clientX, y: e.clientY }))}
              onMouseLeave={() => {
                setHoveredMarkerId(null);
                setTooltip(t => ({ ...t, visible: false }));
              }}
              style={markerStyle}
            >
              {!isCompactDot ? (
                <>
                  {/* Indicador de esquina */}
                  {ev.esquina && ev.esquina !== 'general' && (
                    <span style={{
                      width: 6, height: 6, borderRadius: '50%',
                      background: COLORES_RINCON[ev.esquina],
                      flexShrink: 0
                    }} />
                  )}
                  {/* Correlativo nombre / ID + nota si existe */}
                  <span style={{ 
                    fontSize: expanded ? 10 : 9, 
                    fontWeight: 750, 
                    color: esSeleccionado || estaEnComparacion ? 'var(--color-texto)' : 'var(--color-texto)', 
                    fontFamily: 'monospace',
                    whiteSpace: 'nowrap'
                  }}>
                    {cfg.shortName} {ev._numero ?? ''}{ev.nota ? ` - ${ev.nota}` : ''}
                  </span>
                  {/* Ícono del evento */}
                  <span style={{ fontSize: 10, color: esSeleccionado || estaEnComparacion ? 'var(--color-texto)' : cfg.color }}>
                    {cfg.icon}
                  </span>

                  {/* Muestra la duración si cabe */}
                  {hasDur && ev.duracion > 0.5 && (
                    <span style={{ 
                      marginLeft: 'auto', 
                      fontSize: 8, 
                      opacity: 0.7, 
                      color: 'var(--color-texto-muted)', 
                      paddingRight: 6, 
                      fontFamily: 'monospace' 
                    }}>
                      {ev.duracion.toFixed(1)}s
                    </span>
                  )}

                  {/* Handle de redimensionamiento de duración a la derecha */}
                  {hasDur && (
                    <div
                      onMouseDown={(e) => handleMouseDownResize(e, ev)}
                      style={{
                        position: 'absolute',
                        right: 0,
                        top: 0,
                        bottom: 0,
                        width: 8,
                        cursor: 'ew-resize',
                        borderRadius: '0 5px 5px 0',
                        background: 'rgba(255, 255, 255, 0.08)',
                        borderLeft: '1px solid rgba(255, 255, 255, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'background 0.2s',
                        zIndex: 20,
                      }}
                      onMouseEnter={(e) => { e.stopPropagation(); e.target.style.background = 'rgba(255, 255, 255, 0.2)' }}
                      onMouseLeave={(e) => { e.stopPropagation(); e.target.style.background = 'rgba(255, 255, 255, 0.08)' }}
                      title="Arrastrar para ajustar duración"
                    />
                  )}
                </>
              ) : null}
            </div>
          )
        })}

        {/* PLAYHEAD */}
        {posPlayhead >= 0 && posPlayhead <= 100 && (
          <div style={{
            position: 'absolute',
            left: `${posPlayhead}%`,
            top: 0, bottom: 0,
            width: 2,
            background: 'var(--color-rojo-suave)',
            pointerEvents: 'none',
            zIndex: 20,
            boxShadow: '0 0 6px rgba(231,76,60,0.5)'
          }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--color-rojo-suave)', marginLeft: -3, marginTop: 8 }} />
          </div>
        )}
      </div>

      {/* PANEL DE COMPARACIÓN */}
      {comparando.length === 2 && (
        <PanelComparacion
          a={comparando[0]}
          b={comparando[1]}
          onCerrar={() => setComparando([])}
          onSeek={onSeek}
        />
      )}

      {/* TOOLTIP */}
      <EventTooltip {...tooltip} />

      {/* MENU CONTEXTUAL FLOTANTE (CLIC DERECHO) */}
      {contextMenu.visible && (
        <TimelineContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          evento={contextMenu.ev}
          onClose={() => setContextMenu({ visible: false, ev: null })}
          onStartLoop={onSeekLoop}
          onEdit={onEditEvento}
          onDelete={onRemoveEvento}
          onUpdateNota={(id, nota) => onUpdateEvento?.(id, { nota })}
        />
      )}

      {/* LEYENDA */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 12px', padding: '6px 8px', background: 'var(--color-fondo)', borderTop: '1px solid var(--color-superficie)' }}>
        {Object.entries(TIPOS_EVENTO).map(([nombre, cfg]) => (
          <div key={nombre} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ fontSize: 9, fontWeight: 700, color: cfg.color, fontFamily: 'monospace', background: cfg.color + '22', padding: '1px 4px', borderRadius: 3 }}>
              {cfg.id}
            </span>
            <span style={{ fontSize: 10, color: 'var(--color-texto-suave)' }}>{cfg.shortName}</span>
          </div>
        ))}
        <div style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--color-texto-muted)' }}>Rueda = Zoom centrado en Mouse · Clic = Seleccionar · Doble Clic = Editar · Clic Der = Opciones</div>
      </div>
    </div>
  )
}

// ─── Regla de tiempo ──────────────────────────────────────────────────────────
function TimeRuler({ duracion, zoom, scrollOffset }) {
  if (duracion === 0) return null
  const marcas = []
  const paso   = calcularPasoRuler(duracion, zoom)

  for (let t = 0; t <= duracion; t += paso) {
    const pos = ((t / duracion - scrollOffset) * zoom) * 100
    if (pos < -1 || pos > 101) continue
    marcas.push(
      <div key={t} style={{
        position: 'absolute',
        left: `${pos}%`,
        top: 0, bottom: 0,
        borderLeft: '1px solid var(--color-borde)',
        display: 'flex',
        alignItems: 'flex-start',
        paddingTop: 2,
        pointerEvents: 'none',
      }}>
        <span style={{ fontSize: 9, color: 'var(--color-texto-muted)', fontFamily: 'monospace', marginLeft: 2, whiteSpace: 'nowrap' }}>
          {formatTime(t)}
        </span>
      </div>
    )
  }
  return <>{marcas}</>
}

function calcularPasoRuler(duracion, zoom) {
  const segVisibles = duracion / zoom
  if (segVisibles > 3600) return 600
  if (segVisibles > 1200) return 300
  if (segVisibles > 600)  return 120
  if (segVisibles > 300)  return 60
  if (segVisibles > 120)  return 30
  if (segVisibles > 60)   return 15
  if (segVisibles > 20)   return 5
  return 1
}

// ─── Panel de Comparación ─────────────────────────────────────────────────────
function PanelComparacion({ a, b, onCerrar, onSeek }) {
  const cfgA = getTipoEvento(a.tipo)
  const cfgB = getTipoEvento(b.tipo)
  const tA = a.tiempoVideo ?? a.timestamp
  const tB = b.tiempoVideo ?? b.timestamp
  const diffSeg = Math.abs(tA - tB).toFixed(1)

  return (
    <div style={{
      background: 'var(--color-superficie)',
      border: '1px solid var(--color-borde)',
      borderRadius: 8,
      padding: '12px 16px',
      margin: '4px 0',
      display: 'grid',
      gridTemplateColumns: '1fr auto 1fr',
      gap: 12,
      alignItems: 'center'
    }}>
      <EventoCard cfg={cfgA} evento={a} onSeek={onSeek} />
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
        <span style={{ fontSize: 18, color: 'var(--color-borde)' }}>⟷</span>
        <span style={{ fontSize: 11, color: 'var(--color-dorado)', fontWeight: 700 }}>Δ {diffSeg}s</span>
        <button onClick={onCerrar} style={{ fontSize: 10, color: 'var(--color-texto-suave)', background: 'transparent', border: 'none', cursor: 'pointer' }}>Cerrar</button>
      </div>
      <EventoCard cfg={cfgB} evento={b} onSeek={onSeek} />
    </div>
  )
}

function EventoCard({ cfg, evento, onSeek }) {
  const t = evento.tiempoVideo ?? evento.timestamp
  return (
    <div
      onClick={() => onSeek?.(t)}
      style={{ background: cfg.color + '11', border: `1px solid ${cfg.color}44`, borderRadius: 6, padding: '8px 10px', cursor: 'pointer' }}
    >
      <div style={{ fontSize: 13, fontWeight: 700, color: cfg.color }}>{cfg.icon} {evento.tipo}</div>
      <div style={{ fontSize: 11, color: 'var(--color-texto-suave)', marginTop: 4 }}>
        <div>⏱ {formatTime(t)}</div>
        <div>Round {evento.round ?? '—'}</div>
        <div style={{ color: evento.esquina === 'roja' ? 'var(--color-rojo-suave)' : evento.esquina === 'azul' ? 'var(--color-azul-suave)' : 'var(--color-texto-suave)' }}>
          {evento.esquina === 'roja' ? '🔴 Rojo' : evento.esquina === 'azul' ? '🔵 Azul' : 'General'}
        </div>
      </div>
    </div>
  )
}

// ─── Menú Contextual del Timeline ─────────────────────────────────────────────
function TimelineContextMenu({ x, y, evento, onClose, onStartLoop, onEdit, onDelete, onUpdateNota }) {
  const [notaTemp, setNotaTemp] = useState(evento.nota || '')
  const cfg = getTipoEvento(evento.tipo)
  
  useEffect(() => {
    const clickOutside = () => onClose()
    window.addEventListener('click', clickOutside)
    return () => window.removeEventListener('click', clickOutside)
  }, [onClose])

  return (
    <div
      onClick={(e) => e.stopPropagation()} // Previene cierre accidental al hacer clic en el input
      style={{
        position: 'fixed',
        left: Math.min(x, window.innerWidth - 210),
        top: Math.min(y, window.innerHeight - 260),
        width: 190,
        background: 'rgba(18, 18, 22, 0.95)',
        backdropFilter: 'blur(16px)',
        border: `1.5px solid ${cfg.color}`,
        borderRadius: 12,
        padding: '8px',
        zIndex: 100000,
        boxShadow: `0 10px 40px rgba(0,0,0,0.6), 0 0 15px ${cfg.color}25`,
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
      }}
    >
      <div style={{ padding: '6px 8px', fontSize: 10, fontWeight: 800, color: cfg.color, textTransform: 'uppercase', letterSpacing: 0.5, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        🎯 {evento.tipo} #{evento._numero || ''}
      </div>
      
      <button
        onClick={() => {
          onStartLoop?.(evento.tiempoVideo ?? evento.timestamp, evento.id)
          onClose()
        }}
        style={estilosMenu.item}
        onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,0.06)'}
        onMouseLeave={(e) => e.target.style.background = 'transparent'}
      >
        🔁 Iniciar Bucle (4s)
      </button>

      <button
        onClick={() => {
          onEdit?.(evento)
          onClose()
        }}
        style={estilosMenu.item}
        onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,0.06)'}
        onMouseLeave={(e) => e.target.style.background = 'transparent'}
      >
        ✏️ Editar Precisión
      </button>

      <div style={{ padding: '4px 8px', display: 'flex', flexDirection: 'column', gap: 4, marginTop: 4, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <span style={{ fontSize: 9, color: 'var(--color-texto-muted)', fontWeight: 800, letterSpacing: 0.5 }}>🏷️ NOTA / ETIQUETA INLINE</span>
        <input
          type="text"
          placeholder="Ej: Rápido, Fuerte..."
          value={notaTemp}
          onChange={(e) => {
            setNotaTemp(e.target.value)
            onUpdateNota?.(evento.id, e.target.value)
          }}
          onClick={(e) => e.stopPropagation()}
          style={{
            background: 'var(--color-superficie-2)',
            border: '1px solid var(--color-borde)',
            color: 'var(--color-texto)',
            fontSize: 11,
            padding: '4px 8px',
            borderRadius: 6,
            width: '100%',
            outline: 'none',
          }}
        />
      </div>

      <button
        onClick={() => {
          onDelete?.(evento.id)
          onClose()
        }}
        style={{ ...estilosMenu.item, color: 'var(--color-rojo-suave)' }}
        onMouseEnter={(e) => e.target.style.background = 'rgba(231,76,60,0.15)'}
        onMouseLeave={(e) => e.target.style.background = 'transparent'}
      >
        ❌ Eliminar Evento
      </button>
    </div>
  )
}

const estilosMenu = {
  item: {
    background: 'transparent',
    border: 'none',
    color: 'var(--color-texto-suave)',
    textAlign: 'left',
    padding: '8px 10px',
    fontSize: 11,
    fontWeight: 600,
    borderRadius: 6,
    cursor: 'pointer',
    width: '100%',
    transition: 'all 0.2s',
  }
}
