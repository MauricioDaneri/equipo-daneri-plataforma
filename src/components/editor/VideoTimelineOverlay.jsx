/**
 * VideoTimelineOverlay.jsx
 * ========================
 * Barra de eventos sobre el video con zoom automático e inteligente.
 *
 * Props:
 *  - eventos:      [{ id, tipo, timestamp, esquina, tiempoVideo, ... }]
 *  - duracion:     duración total del video en segundos
 *  - tiempoActual: posición actual del video en segundos
 *  - onSeek:       (seg) => void — al hacer click en una marca
 *  - onCompare:    ({ a, b }) => void — al comparar dos eventos
 *
 * Funcionalidades:
 *  - Marcas coloreadas por tipo (sistema de IDs de eventTypes.js)
 *  - Tooltip rico al hover (tipo, ID, timestamp, round, esquina)
 *  - Zoom manual con slider y rueda del ratón
 *  - Auto-zoom cuando hay alta densidad de eventos
 *  - Modo comparación: clic en 2 marcas → abre panel lateral
 *  - Marcas del rincón codificadas por forma (• rojo / • azul)
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
      </div>
      {evento.notaVoz && (
        <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--color-borde)', fontSize: 11, color: 'var(--color-texto-suave)', fontStyle: 'italic' }}>
          🎙️ "{evento.notaVoz}"
        </div>
      )}
      <div style={{ marginTop: 6, fontSize: 10, color: 'var(--color-texto-muted)' }}>Clic: Bucle (10s) · Doble clic: Editar · Arrastrar: Mover</div>
    </div>
  )
}

// ─── Componente Principal ──────────────────────────────────────────────────────
export default function VideoTimelineOverlay({ eventos = [], duracion = 0, tiempoActual = 0, onSeek, onSeekLoop, onCompare, onEditEvento, onMoveEvento }) {
  const barraRef       = useRef(null)
  const [zoom,          setZoom]         = useState(MIN_ZOOM)
  const [scrollOffset,  setScrollOffset] = useState(0) // 0-1, posición del "viewport" dentro del zoom
  const [tooltip,       setTooltip]      = useState({ visible: false, evento: null, x: 0, y: 0 })
  const [comparando,    setComparando]   = useState([])      // hasta 2 eventos seleccionados
  const [autoZoomed,    setAutoZoomed]   = useState(false)
  const isDragging     = useRef(false)
  const clickTimeoutRef = useRef(null)

  // Limpiar timeouts al desmontar
  useEffect(() => {
    return () => {
      if (clickTimeoutRef.current) clearTimeout(clickTimeoutRef.current)
    }
  }, [])
  const dragStartX     = useRef(0)

  // ─── Auto-zoom inteligente ──────────────────────────────────────────────────
  useEffect(() => {
    if (duracion === 0 || eventos.length === 0) return

    // Detectar densidad de eventos alrededor del tiempo actual
    const ventana = 2 // segundos
    const cercanos = eventos.filter(e => {
      const t = e.tiempoVideo ?? e.timestamp
      return Math.abs(t - tiempoActual) <= ventana
    })

    if (cercanos.length >= AUTO_ZOOM_UMBRAL && !autoZoomed) {
      // Auto-zoom a esa sección
      const targetZoom = Math.min(MAX_ZOOM, Math.max(4, cercanos.length * 1.5))
      setZoom(targetZoom)
      // Centrar el viewport en el tiempo actual
      const pos = tiempoActual / duracion
      setScrollOffset(Math.max(0, Math.min(1 - 1/targetZoom, pos - 0.5/targetZoom)))
      setAutoZoomed(true)
    } else if (cercanos.length < 2 && autoZoomed) {
      setAutoZoomed(false)
    }
  }, [tiempoActual, eventos, duracion, autoZoomed])

  // ─── Rueda del ratón → zoom ─────────────────────────────────────────────────
  const handleWheel = useCallback((e) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? -1 : 1
    setZoom(prev => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, prev + delta)))
  }, [])

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
    e.preventDefault()
  }
  const handleMouseMove = useCallback((e) => {
    if (!isDragging.current || !barraRef.current) return
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
      return pos >= -2 && pos <= 102
    })
  }, [eventos, posicionEvento])

  // ─── Detectar clusters (eventos muy cercanos) ────────────────────────────────
  const eventosConNivel = useMemo(() => {
    // Asignar nivel vertical (0, 1, 2...) para evitar superposición
    const sorted = [...eventosVisibles].sort((a, b) => (a.tiempoVideo ?? a.timestamp) - (b.tiempoVideo ?? b.timestamp))
    const resultado = []
    const ocupado   = [] // [{ pos, nivel }]
    
    sorted.forEach(ev => {
      const pos = posicionEvento(ev)
      // Buscar nivel libre (no hay otro evento a menos de 2% de ancho)
      let nivel = 0
      while (ocupado.some(o => o.nivel === nivel && Math.abs(o.pos - pos) < 2.5)) {
        nivel++
      }
      ocupado.push({ pos, nivel })
      resultado.push({ ...ev, _nivel: nivel, _pos: pos })
    })
    return resultado
  }, [eventosVisibles, posicionEvento])

  // ─── Altura dinámica basada en niveles ──────────────────────────────────────
  const maxNivel = useMemo(() => Math.max(0, ...eventosConNivel.map(e => e._nivel)), [eventosConNivel])
  const alturaTotal = Math.max(ALTURA_BARRA, (maxNivel + 1) * (ALTURA_MARCA + 4) + 20)

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
      // deltaX en pixeles -> fraccion del ancho -> fraccion del zoom -> segundos
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
        // Es un clic
        if (clickTimeoutRef.current) {
          // Doble clic: abre/edita etiqueta
          clearTimeout(clickTimeoutRef.current)
          clickTimeoutRef.current = null
          onEditEvento?.(ev)
        } else {
          // Clic simple: inicia bucle de 10s (5s antes, 5s después del marcador)
          clickTimeoutRef.current = setTimeout(() => {
            clickTimeoutRef.current = null
            onSeekLoop?.(tInicial, ev.id)
          }, 220)
        }
      }
    }
    
    document.addEventListener('mousemove', handleMouseMoveDrag)
    document.addEventListener('mouseup', handleMouseUpDrag)
  }

  const handleDblClickMarca = (e, evento) => {
    e.stopPropagation()
    // No sobreescribir ya que el doble clic se resuelve de forma nativa en handleMouseUpDrag
  }

  // ─── Click en la barra (seek) ────────────────────────────────────────────────
  const handleClickBarra = (e) => {
    if (!barraRef.current || isDragging.current) return
    if (!duracion || isNaN(duracion) || !isFinite(duracion)) {
      console.warn("[VideoTimelineOverlay] Cannot seek: duracion is invalid:", duracion)
      return
    }
    const rect    = barraRef.current.getBoundingClientRect()
    const fraccion = (e.clientX - rect.left) / rect.width
    // Convertir posición de pantalla a tiempo real
    const tiempoReal = (fraccion / zoom + scrollOffset) * duracion
    if (isNaN(tiempoReal) || !isFinite(tiempoReal)) {
      console.warn("[VideoTimelineOverlay] Calculated tiempoReal is invalid:", tiempoReal)
      return
    }
    onSeek?.(Math.max(0, Math.min(duracion, tiempoReal)))
  }

  // ─── Posición del playhead ───────────────────────────────────────────────────
  const posPlayhead = duracion > 0
    ? ((tiempoActual / duracion - scrollOffset) * zoom) * 100
    : 0

  return (
    <div style={{ userSelect: 'none', position: 'relative' }}>

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
          height: alturaTotal,
          background: 'var(--color-fondo)',
          overflow: 'hidden',
          cursor: zoom > 1 ? 'grab' : 'pointer',
          borderTop: '1px solid var(--color-borde)',
        }}
      >
        {/* Fondo de tiempo con marcas de segundos */}
        <TimeRuler duracion={duracion} zoom={zoom} scrollOffset={scrollOffset} />

        {/* MARCADORES DE EVENTOS */}
        {eventosConNivel.map((ev, i) => {
          const cfg = getTipoEvento(ev.tipo)
          const estaEnComparacion = comparando.includes(ev)
          const top = 18 + ev._nivel * (ALTURA_MARCA + 4)

          return (
            <div
              key={ev.id || i}
              onMouseDown={e => handleDragStartMarca(e, ev)}
              onDoubleClick={e => handleDblClickMarca(e, ev)}
              onMouseEnter={e => setTooltip({ visible: true, evento: ev, x: e.clientX, y: e.clientY })}
              onMouseMove={e => setTooltip(t => ({ ...t, x: e.clientX, y: e.clientY }))}
              onMouseLeave={() => setTooltip(t => ({...t, visible: false}))}
              style={{
                position: 'absolute',
                left: `${Math.max(0, ev._pos)}%`,
                top,
                transform: 'translateX(-50%)',
                width: 'auto',
                minWidth: 28,
                height: ALTURA_MARCA,
                borderRadius: 4,
                background: cfg.color + (estaEnComparacion ? 'ff' : '33'),
                border: `1px solid ${cfg.color}${estaEnComparacion ? 'ff' : '88'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 3,
                padding: '0 5px',
                cursor: 'pointer',
                transition: 'background 0.15s, transform 0.1s',
                boxShadow: estaEnComparacion ? `0 0 8px ${cfg.color}` : 'none',
                zIndex: estaEnComparacion ? 10 : 1,
              }}
            >
              {/* Indicador de esquina */}
              {ev.esquina && ev.esquina !== 'general' && (
                <span style={{
                  width: 6, height: 6, borderRadius: '50%',
                  background: COLORES_RINCON[ev.esquina],
                  flexShrink: 0
                }} />
              )}
              {/* ID del tipo */}
              <span style={{ fontSize: 9, fontWeight: 700, color: estaEnComparacion ? 'var(--color-texto)' : cfg.color, fontFamily: 'monospace' }}>
                {cfg.id}
              </span>
              {/* Ícono del evento */}
              <span style={{ fontSize: 10, color: estaEnComparacion ? 'var(--color-texto)' : cfg.color }}>
                {cfg.icon}
              </span>
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
        <div style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--color-texto-muted)' }}>Rueda = Zoom · Arrastrar = Desplazar · Clic = Bucle (10s) · Doble Clic = Editar · Mantener y arrastrar = Mover marca</div>
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
