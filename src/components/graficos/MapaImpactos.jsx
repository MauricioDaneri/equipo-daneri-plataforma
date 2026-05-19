/**
 * MapaImpactos.jsx — Silueta Humana Doble (Ataque y Defensa) Interactiva
 * Plataforma de Análisis — Equipo Daneri
 * Diseño Premium: HSL tailwind-like dark mode, glassmorphic filters, glowing halos.
 */

import { useState, useMemo } from 'react'
import { Target, Shield, Trash2, Filter } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

// Definición de Zonas Anatómicas por Coordenadas SVG (Silueta de 200x380)
const ZONAS = [
  { id: 'cabeza_izq', nombre: 'Cabeza Izquierda', xMin: 0, xMax: 90, yMin: 0, yMax: 110 },
  { id: 'cabeza_der', nombre: 'Cabeza Derecha', xMin: 110, xMax: 200, yMin: 0, yMax: 110 },
  { id: 'cabeza_ctr', nombre: 'Cabeza Centro', xMin: 90, xMax: 110, yMin: 0, yMax: 110 },
  { id: 'cuerpo_izq', nombre: 'Cuerpo Izquierdo (Hígado)', xMin: 0, xMax: 85, yMin: 110, yMax: 280 },
  { id: 'cuerpo_der', nombre: 'Cuerpo Derecho (Bazo)', xMin: 115, xMax: 200, yMin: 110, yMax: 280 },
  { id: 'cuerpo_ctr', nombre: 'Cuerpo Centro', xMin: 85, xMax: 115, yMin: 110, yMax: 280 },
]

function obtenerZona(x, y) {
  const zona = ZONAS.find(z => x >= z.xMin && x <= z.xMax && y >= z.yMin && y <= z.yMax)
  return zona ? zona.nombre : 'Cuerpo General'
}

export default function MapaImpactos({
  eventos = [],
  onAddImpacto,
  onRemoveImpacto,
  onUpdateNota,
  editable = false,
  esquinaFiltro = 'roja',
}) {
  const [tipoFiltro, setTipoFiltro] = useState('todos') // 'todos' | 'Jab' | 'Cross' | 'Gancho' | 'Uppercut' | 'Conectado'
  const [roundFiltro, setRoundFiltro] = useState('todos')
  const [hoveredDot, setHoveredDot] = useState(null)
  const [hoveredSilueta, setHoveredSilueta] = useState(null) // 'ataque' | 'defensa' | null
  const [dotTooltip, setDotTooltip] = useState({ visible: false, x: 0, y: 0, ev: null })
  
  // Filtrar eventos por esquina
  const eventosBoxeador = useMemo(() => {
    return eventos.filter(e => e.esquina === esquinaFiltro)
  }, [eventos, esquinaFiltro])

  // Obtener rounds únicos para filtrar
  const roundsDisponibles = useMemo(() => {
    const rSet = new Set(eventosBoxeador.map(e => e.round).filter(Boolean))
    return Array.from(rSet).sort((a, b) => a - b)
  }, [eventosBoxeador])

  // Filtrar eventos tácticos que tengan coordenadas
  const impactosFiltrados = useMemo(() => {
    return eventosBoxeador.filter(ev => {
      // Si tiene coordenada explícita en BD
      const tieneCoord = ev.coordX !== undefined && ev.coordY !== undefined
      if (!tieneCoord) return false

      // Filtro de Tipo de Golpe
      if (tipoFiltro !== 'todos') {
        if (tipoFiltro === 'conectados' && ev.tipo !== 'Golpe Conectado') return false
        if (tipoFiltro !== 'conectados' && ev.tipo !== tipoFiltro) return false
      }

      // Filtro de Round
      if (roundFiltro !== 'todos' && Number(ev.round) !== Number(roundFiltro)) return false

      return true
    })
  }, [eventosBoxeador, tipoFiltro, roundFiltro])

  // Manejador de clics en la silueta para añadir impactos
  const handleSiluetaClick = (e, silueta) => {
    if (!editable) return

    const rect = e.currentTarget.getBoundingClientRect()
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 200)
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 380)

    const lugar = obtenerZona(x, y)
    
    // Proponer tipo de golpe por defecto según la silueta
    const tipoDefecto = silueta === 'ataque' ? 'Golpe Conectado' : 'Bloqueo'

    onAddImpacto?.({
      coordX: x,
      coordY: y,
      lugar,
      tipoSilueta: silueta,
      tipo: tipoDefecto
    })
  }

  // Renderizador de Silueta SVG
  const renderSiluetaSVG = (silueta) => {
    const isHoveredSil = hoveredSilueta === silueta
    const strokeColor = silueta === 'ataque' ? 'var(--color-rojo-suave)' : 'var(--color-azul-suave)'
    const glowColor = silueta === 'ataque' ? 'rgba(231, 76, 60, 0.4)' : 'rgba(52, 152, 219, 0.4)'

    return (
      <svg
        viewBox="0 0 200 380"
        onClick={(e) => handleSiluetaClick(e, silueta)}
        onMouseEnter={() => setHoveredSilueta(silueta)}
        onMouseLeave={() => setHoveredSilueta(null)}
        style={{
          width: '100%',
          height: '100%',
          cursor: editable ? 'crosshair' : 'default',
          background: 'rgba(20, 20, 20, 0.6)',
          border: `1px solid ${isHoveredSil ? strokeColor : 'var(--color-borde)'}`,
          borderRadius: 16,
          boxShadow: isHoveredSil ? `0 0 20px ${glowColor}` : 'none',
          transition: 'all 0.3s ease',
        }}
      >
        <defs>
          <filter id={`glow-${silueta}`} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="10" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Silueta Humana Estilizada */}
        {/* Cabeza */}
        <circle cx="100" cy="55" r="28" fill="var(--color-fondo)" stroke={strokeColor} strokeWidth="1.5" />
        
        {/* Hombros */}
        <path d="M 50 110 L 150 110 L 165 140 L 35 140 Z" fill="var(--color-superficie)" stroke={strokeColor} strokeWidth="1.5" />

        {/* Tronco */}
        <path d="M 48 140 L 152 140 L 140 280 L 60 280 Z" fill="var(--color-superficie-2)" stroke={strokeColor} strokeWidth="1.5" />

        {/* Guardia Izquierda (Esbozo de brazo) */}
        <path d="M 35 140 L 20 220 L 40 240 L 48 190" fill="none" stroke={strokeColor} strokeWidth="1" strokeDasharray="3,3" />
        {/* Guardia Derecha */}
        <path d="M 165 140 L 180 220 L 160 240 L 152 190" fill="none" stroke={strokeColor} strokeWidth="1" strokeDasharray="3,3" />

        {/* Cuello */}
        <rect x="92" y="83" width="16" height="15" fill="var(--color-fondo)" stroke={strokeColor} strokeWidth="1" />

        {/* Líneas divisorias de sectores visuales (sutiles) */}
        <line x1="100" y1="20" x2="100" y2="280" stroke="rgba(255,255,255,0.05)" strokeDasharray="5,5" />
        <line x1="30" y1="110" x2="170" y2="110" stroke="rgba(255,255,255,0.05)" strokeDasharray="5,5" />

        {/* PUNTOS DE IMPACTO */}
        {impactosFiltrados
          .filter(ev => {
            const esAtaqueEvent = ev.tipoSilueta === 'ataque' || ['Jab', 'Cross', 'Gancho', 'Uppercut', 'Golpe Conectado'].includes(ev.tipo)
            const esDefensaEvent = ev.tipoSilueta === 'defensa' || ['Bloqueo', 'Esquiva', 'Clinch'].includes(ev.tipo)
            return silueta === 'ataque' ? esAtaqueEvent : esDefensaEvent
          })
          .map((ev) => {
            const isHovered = hoveredDot === ev.id
            const dotColor = ev.tipo === 'Golpe Conectado' || ev.tipo === 'Bloqueo'
              ? 'var(--color-exito)' 
              : ev.tipo === 'Golpe Errado' 
                ? 'var(--color-rojo-suave)' 
                : 'var(--color-dorado)'

            return (
              <g key={ev.id}>
                {/* Glow Radial del Punto */}
                <circle
                  cx={ev.coordX}
                  cy={ev.coordY}
                  r={isHovered ? 24 : 14}
                  fill={dotColor}
                  opacity={isHovered ? 0.35 : 0.15}
                  style={{ transition: 'all 0.2s ease', pointerEvents: 'none' }}
                />
                
                {/* Punto Principal */}
                <circle
                  cx={ev.coordX}
                  cy={ev.coordY}
                  r={isHovered ? 8 : 6}
                  fill={dotColor}
                  stroke="var(--color-texto)"
                  strokeWidth={isHovered ? 1.5 : 1}
                  style={{ transition: 'all 0.2s ease', cursor: 'pointer' }}
                  onMouseEnter={(e) => {
                    setHoveredDot(ev.id)
                    setDotTooltip({
                      visible: true,
                      x: e.clientX,
                      y: e.clientY,
                      ev
                    })
                  }}
                  onMouseMove={(e) => {
                    setDotTooltip(prev => ({
                      ...prev,
                      x: e.clientX,
                      y: e.clientY
                    }))
                  }}
                  onMouseLeave={() => {
                    setHoveredDot(null)
                    setDotTooltip(prev => ({ ...prev, visible: false }))
                  }}
                  onClick={(e) => {
                    e.stopPropagation()
                    if (editable) {
                      const confirm = window.confirm(`¿Remover este impacto en ${ev.lugar}?`)
                      if (confirm) onRemoveImpacto?.(ev.id)
                    }
                  }}
                />
              </g>
            )
          })}
      </svg>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, height: '100%' }}>
      
      {/* SECCIÓN DE FILTROS */}
      <div style={{
        display: 'flex',
        gap: 12,
        background: 'var(--color-superficie-2)',
        padding: 12,
        borderRadius: 12,
        border: '1px solid var(--color-borde)',
        alignItems: 'center',
        flexWrap: 'wrap',
        zIndex: 10
      }}>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <Filter size={14} color="var(--color-dorado)" />
          <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-texto-suave)' }}>Filtros</span>
        </div>

        {/* Filtro Golpe */}
        <select
          value={tipoFiltro}
          onChange={e => setTipoFiltro(e.target.value)}
          style={{
            background: 'var(--color-superficie)',
            border: '1px solid var(--color-borde)',
            color: 'var(--color-texto)',
            borderRadius: 6,
            padding: '4px 8px',
            fontSize: 11,
            outline: 'none',
            cursor: 'pointer'
          }}
        >
          <option value="todos">Todos los golpes</option>
          <option value="Jab">Jabs</option>
          <option value="Cross">Crosses</option>
          <option value="Gancho">Ganchos</option>
          <option value="Uppercut">Uppercuts</option>
          <option value="conectados">Sólo Conectados</option>
        </select>

        {/* Filtro Round */}
        <select
          value={roundFiltro}
          onChange={e => setRoundFiltro(e.target.value)}
          style={{
            background: 'var(--color-superficie)',
            border: '1px solid var(--color-borde)',
            color: 'var(--color-texto)',
            borderRadius: 6,
            padding: '4px 8px',
            fontSize: 11,
            outline: 'none',
            cursor: 'pointer'
          }}
        >
          <option value="todos">Todos los Rounds</option>
          {roundsDisponibles.map(r => (
            <option key={r} value={r}>Round {r}</option>
          ))}
        </select>
        
        {editable && (
          <span style={{ fontSize: 10, color: 'var(--color-dorado)', marginLeft: 'auto', fontStyle: 'italic' }}>
            ✏️ Haz clic en la silueta para registrar impacto
          </span>
        )}
      </div>

      {/* DISPOSICIÓN DE LAS SILUETAS (LADO A LADO) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, flex: 1, minHeight: 340 }}>
        
        {/* ATAQUE */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: 'var(--color-rojo-suave)' }}>
            <Target size={14} /> ATAQUE (Impactos dados)
          </div>
          <div style={{ width: '100%', height: '100%', maxWidth: 220 }}>
            {renderSiluetaSVG('ataque')}
          </div>
        </div>

        {/* DEFENSA */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: 'var(--color-azul-suave)' }}>
            <Shield size={14} /> DEFENSA (Defensas/Golpes recibidos)
          </div>
          <div style={{ width: '100%', height: '100%', maxWidth: 220 }}>
            {renderSiluetaSVG('defensa')}
          </div>
        </div>

      </div>

      {/* TOOLTIP DE HOVER DE PUNTOS */}
      <AnimatePresence>
        {dotTooltip.visible && dotTooltip.ev && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            style={{
              position: 'fixed',
              left: dotTooltip.x + 12,
              top: dotTooltip.y - 100,
              background: 'var(--color-superficie)',
              backdropFilter: 'blur(8px)',
              border: `1px solid var(--color-dorado)`,
              borderRadius: 10,
              padding: '10px 14px',
              zIndex: 99999,
              boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
              pointerEvents: 'auto',
              minWidth: 180,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-texto)' }}>{dotTooltip.ev.tipo}</span>
              <span style={{ fontSize: 9, background: 'var(--color-dorado-alfa)', color: 'var(--color-dorado)', padding: '2px 6px', borderRadius: 4, fontWeight: 600 }}>RND {dotTooltip.ev.round}</span>
            </div>
            <div style={{ fontSize: 10, color: 'var(--color-texto-suave)', marginBottom: 6 }}>
              Zona: <strong style={{ color: 'var(--color-texto)' }}>{dotTooltip.ev.lugar}</strong>
            </div>
            {editable ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
                <input
                  type="text"
                  placeholder="Añadir nota táctica..."
                  value={dotTooltip.ev.nota || ''}
                  onChange={(e) => onUpdateNota?.(dotTooltip.ev.id, e.target.value)}
                  style={{
                    background: 'var(--color-fondo)',
                    border: '1px solid var(--color-borde)',
                    borderRadius: 4,
                    color: 'var(--color-texto)',
                    fontSize: 10,
                    padding: '4px 6px',
                    width: '100%',
                    outline: 'none'
                  }}
                />
                <button
                  onClick={() => {
                    onRemoveImpacto?.(dotTooltip.ev.id)
                    setDotTooltip(prev => ({ ...prev, visible: false }))
                  }}
                  style={{
                    background: 'rgba(231,76,60,0.15)',
                    border: 'none',
                    borderRadius: 4,
                    color: 'var(--color-rojo-suave)',
                    fontSize: 9,
                    padding: '4px 8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 4,
                    cursor: 'pointer'
                  }}
                >
                  <Trash2 size={10} /> Eliminar Punto
                </button>
              </div>
            ) : (
              dotTooltip.ev.nota && (
                <div style={{ fontSize: 10, color: 'var(--color-dorado)', fontStyle: 'italic', marginTop: 4, borderTop: '1px solid var(--color-borde)', paddingTop: 4 }}>
                  "{dotTooltip.ev.nota}"
                </div>
              )
            )}
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  )
}
