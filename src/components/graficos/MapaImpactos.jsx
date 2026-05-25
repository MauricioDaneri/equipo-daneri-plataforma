/**
 * MapaImpactos.jsx — Silueta Humana Doble (Ataque y Defensa) Interactiva
 * Plataforma de Análisis — Equipo Daneri
 * Diseño Premium: HSL tailwind-like dark mode, glassmorphic filters, glowing halos.
 */

import { useState, useMemo } from 'react'
import { createPortal } from 'react-dom'
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

const formatTime = (segundos) => {
  if (segundos === undefined || segundos === null || isNaN(segundos)) return '0:00';
  const m = Math.floor(segundos / 60);
  const s = Math.floor(segundos % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
};

export default function MapaImpactos({
  eventos = [],
  onAddImpacto,
  onRemoveImpacto,
  onUpdateNota,
  onSelectEvento,
  onDeselectEvento,
  onUpdateImpactoCoords,
  eventoMapeoActivo = null,
  editable = false,
  esquinaFiltro = 'roja',
}) {
  const [tipoFiltro, setTipoFiltro] = useState('todos') // 'todos' | 'Jab' | 'Cross' | 'Gancho' | 'Uppercut' | 'Conectado'
  const [roundFiltro, setRoundFiltro] = useState('todos')
  const [hoveredDot, setHoveredDot] = useState(null)
  const [hoveredSilueta, setHoveredSilueta] = useState(null) // 'ataque' | 'defensa' | null
  const [dotTooltip, setDotTooltip] = useState({ visible: false, x: 0, y: 0, ev: null })
  
  // Custom Popup/Modal States
  const [impactoPendiente, setImpactoPendiente] = useState(null)
  const [impactoAEliminar, setImpactoAEliminar] = useState(null)

  const opcionesFiltradas = useMemo(() => {
    if (!impactoPendiente) return []
    if (impactoPendiente.tipoSilueta === 'ataque') {
      return [
        { label: 'Jab', val: 'Jab', color: 'var(--color-rojo-suave)', bg: 'rgba(231, 76, 60, 0.12)', border: 'rgba(231, 76, 60, 0.3)' },
        { label: 'Recto', val: 'Recto', color: 'var(--color-rojo-suave)', bg: 'rgba(231, 76, 60, 0.12)', border: 'rgba(231, 76, 60, 0.3)' },
        { label: 'Cross', val: 'Cross', color: 'var(--color-rojo-suave)', bg: 'rgba(231, 76, 60, 0.12)', border: 'rgba(231, 76, 60, 0.3)' },
        { label: 'Gancho', val: 'Gancho', color: 'var(--color-rojo-suave)', bg: 'rgba(231, 76, 60, 0.12)', border: 'rgba(231, 76, 60, 0.3)' },
        { label: 'Uppercut', val: 'Uppercut', color: 'var(--color-rojo-suave)', bg: 'rgba(231, 76, 60, 0.12)', border: 'rgba(231, 76, 60, 0.3)' },
        { label: 'Swing', val: 'Swing', color: 'var(--color-rojo-suave)', bg: 'rgba(231, 76, 60, 0.12)', border: 'rgba(231, 76, 60, 0.3)' }
      ]
    } else {
      return [
        { label: 'Finta', val: 'Finta', color: 'var(--color-azul-suave)', bg: 'rgba(52, 152, 219, 0.12)', border: 'rgba(52, 152, 219, 0.3)' },
        { label: 'Esquiva', val: 'Esquiva', color: 'var(--color-azul-suave)', bg: 'rgba(52, 152, 219, 0.12)', border: 'rgba(52, 152, 219, 0.3)' },
        { label: 'Bloqueo', val: 'Bloqueo', color: 'var(--color-azul-suave)', bg: 'rgba(52, 152, 219, 0.12)', border: 'rgba(52, 152, 219, 0.3)' },
        { label: 'Clinch', val: 'Clinch', color: 'var(--color-azul-suave)', bg: 'rgba(52, 152, 219, 0.12)', border: 'rgba(52, 152, 219, 0.3)' },
        { label: 'Pivoteo', val: 'Pivoteo', color: 'var(--color-azul-suave)', bg: 'rgba(52, 152, 219, 0.12)', border: 'rgba(52, 152, 219, 0.3)' },
        { label: 'Marca General', val: 'Marca General', color: 'var(--color-dorado)', bg: 'rgba(212, 175, 55, 0.12)', border: 'rgba(212, 175, 55, 0.3)' }
      ]
    }
  }, [impactoPendiente])

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
        if (tipoFiltro === 'conectados') {
          const esConectado = ev.tipo === 'Golpe Conectado' || (["Jab", "Recto", "Cross", "Gancho", "Uppercut", "Swing"].includes(ev.tipo) && ev.resultado !== 'Errado')
          if (!esConectado) return false
        } else {
          if (ev.tipo !== tipoFiltro) return false
        }
      }

      // Filtro de Round
      if (roundFiltro !== 'todos' && Number(ev.round) !== Number(roundFiltro)) return false

      return true
    })
  }, [eventosBoxeador, tipoFiltro, roundFiltro])

  // Manejador de clics en la silueta
  const handleSiluetaClick = (e, silueta) => {
    if (!editable) return

    const rect = e.currentTarget.getBoundingClientRect()
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 200)
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 380)
    const lugar = obtenerZona(x, y)
    
    if (eventoMapeoActivo) {
      // Mapeo guiado: asignar coords directamente y cerrar modo mapeo
      onUpdateImpactoCoords?.(eventoMapeoActivo.id, x, y, lugar, silueta)
      onDeselectEvento?.()
    } else {
      // Click directo: abrir selector inline
      setImpactoPendiente({ coordX: x, coordY: y, lugar, tipoSilueta: silueta })
    }
  }

  // Renderizador de Silueta SVG
  const renderSiluetaSVG = (silueta) => {
    const isHoveredSil = hoveredSilueta === silueta
    let strokeColor = silueta === 'ataque' ? 'var(--color-rojo-suave)' : 'var(--color-azul-suave)'
    let glowColor = silueta === 'ataque' ? 'rgba(231, 76, 60, 0.4)' : 'rgba(52, 152, 219, 0.4)'
    let isBlocked = false
    let isHighlighted = false
    let opacityVal = 1

    if (eventoMapeoActivo) {
      const siluetaObjetivo = (eventoMapeoActivo.esquina === esquinaFiltro) ? 'ataque' : 'defensa'
      if (silueta !== siluetaObjetivo) {
        isBlocked = true
        opacityVal = 0.25
      } else {
        isHighlighted = true
        strokeColor = 'var(--color-dorado)'
        glowColor = 'rgba(212, 175, 55, 0.6)'
      }
    }

    return (
      <svg
        viewBox="0 0 200 400"
        onClick={(e) => handleSiluetaClick(e, silueta)}
        onMouseEnter={() => !isBlocked && setHoveredSilueta(silueta)}
        onMouseLeave={() => !isBlocked && setHoveredSilueta(null)}
        style={{
          width: '100%',
          height: '100%',
          maxHeight: '100%',
          cursor: isBlocked ? 'not-allowed' : (editable ? 'crosshair' : 'default'),
          background: 'rgba(20, 20, 20, 0.6)',
          border: `1px solid ${isHighlighted || isHoveredSil ? strokeColor : 'var(--color-borde)'}`,
          borderRadius: 16,
          boxShadow: (isHighlighted || isHoveredSil) ? `0 0 20px ${glowColor}` : 'none',
          transition: 'all 0.3s ease',
          opacity: opacityVal,
          pointerEvents: isBlocked ? 'none' : 'auto',
        }}
      >
        <defs>
          <filter id={`glow-${silueta}`} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="10" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Silueta Humana Estilizada - Anatómica Muscular (High-Fidelity) */}
        
        {/* Hombros y Trapecios */}
        <path d="M 65 95 C 40 100, 25 115, 20 135 C 40 120, 75 110, 85 110 L 115 110 C 125 110, 160 120, 180 135 C 175 115, 160 100, 135 95 Z" fill="var(--color-superficie-2)" stroke={strokeColor} strokeWidth="1.5" />
        
        {/* Pecho / Pectorales con definición muscular */}
        <path d="M 45 135 C 45 170, 75 185, 100 185 C 125 185, 155 170, 155 135 C 125 145, 75 145, 45 135 Z" fill="var(--color-superficie)" stroke={strokeColor} strokeWidth="1.5" />
        <path d="M 100 138 L 100 185" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
        <path d="M 50 170 C 70 175, 90 175, 98 180" fill="none" stroke="rgba(0,0,0,0.3)" strokeWidth="2" />
        <path d="M 150 170 C 130 175, 110 175, 102 180" fill="none" stroke="rgba(0,0,0,0.3)" strokeWidth="2" />

        {/* Abdomen (Six Pack / Core) */}
        <path d="M 55 185 C 55 240, 65 310, 65 350 L 135 350 C 135 310, 145 240, 145 185 C 125 195, 75 195, 55 185 Z" fill="var(--color-superficie-2)" stroke={strokeColor} strokeWidth="1.5" />
        {/* Línea alba y Abs horizontales */}
        <line x1="100" y1="185" x2="100" y2="340" stroke="rgba(255,255,255,0.08)" strokeWidth="1.5" />
        <path d="M 70 220 Q 100 230 130 220 M 68 260 Q 100 270 132 260 M 67 300 Q 100 310 133 300" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1.5" />
        
        {/* Oblicuos */}
        <path d="M 55 185 C 45 230, 50 280, 65 350 L 75 350 C 65 280, 60 230, 65 185 Z" fill="rgba(0,0,0,0.2)" />
        <path d="M 145 185 C 155 230, 150 280, 135 350 L 125 350 C 135 280, 140 230, 135 185 Z" fill="rgba(0,0,0,0.2)" />

        {/* Shorts / Cinturón de Boxeo */}
        <path d="M 60 350 L 140 350 C 138 370, 135 385, 130 395 L 70 395 C 65 385, 62 370, 60 350 Z" fill="rgba(212, 175, 55, 0.15)" stroke={strokeColor} strokeWidth="1.5" />
        <path d="M 60 350 Q 100 360 140 350 L 138 375 Q 100 385 62 375 Z" fill="rgba(0,0,0,0.4)" stroke={strokeColor} strokeWidth="1.5" />
        <circle cx="100" cy="365" r="8" fill="var(--color-dorado)" opacity="0.8" />
        
        {/* Brazos Izquierdo (Deltoides, Bíceps, Antebrazo) */}
        <path d="M 20 135 C 10 160, 5 190, 15 210 C 25 230, 45 220, 55 185 C 40 185, 25 160, 45 135 Z" fill="var(--color-superficie-2)" stroke={strokeColor} strokeWidth="1.5" />
        <path d="M 15 210 C 10 240, 25 260, 45 270 L 60 240 C 45 230, 35 215, 55 185" fill="var(--color-superficie)" stroke={strokeColor} strokeWidth="1.5" />
        
        {/* Guante Izquierdo en Guardia Alta */}
        <path d="M 40 265 C 25 275, 25 305, 45 315 C 65 325, 80 300, 70 275 Z" fill="rgba(20,20,20,0.9)" stroke={strokeColor} strokeWidth="2" />
        <circle cx="55" cy="290" r="18" fill="rgba(255,255,255,0.05)" />

        {/* Brazos Derecho (Deltoides, Bíceps, Antebrazo) */}
        <path d="M 180 135 C 190 160, 195 190, 185 210 C 175 230, 155 220, 145 185 C 160 185, 175 160, 155 135 Z" fill="var(--color-superficie-2)" stroke={strokeColor} strokeWidth="1.5" />
        <path d="M 185 210 C 190 240, 175 260, 155 270 L 140 240 C 155 230, 165 215, 145 185" fill="var(--color-superficie)" stroke={strokeColor} strokeWidth="1.5" />
        
        {/* Guante Derecho en Guardia Alta */}
        <path d="M 160 265 C 175 275, 175 305, 155 315 C 135 325, 120 300, 130 275 Z" fill="rgba(20,20,20,0.9)" stroke={strokeColor} strokeWidth="2" />
        <circle cx="145" cy="290" r="18" fill="rgba(255,255,255,0.05)" />

        {/* Cuello musculoso (Esternocleidomastoideo) */}
        <path d="M 85 95 C 80 80, 85 65, 85 65 L 115 65 C 115 65, 120 80, 115 95 Z" fill="var(--color-fondo)" stroke={strokeColor} strokeWidth="1.5" />
        <line x1="93" y1="65" x2="100" y2="90" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
        <line x1="107" y1="65" x2="100" y2="90" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />

        {/* Cabeza / Rostro anatómico */}
        <path d="M 85 65 C 75 40, 80 15, 100 15 C 120 15, 125 40, 115 65 Z" fill="var(--color-fondo)" stroke={strokeColor} strokeWidth="1.5" />
        <path d="M 88 55 L 100 68 L 112 55" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1.5" />
        <path d="M 90 40 Q 100 45 110 40" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1.5" />

        {/* Líneas divisorias de sectores visuales (sutiles) */}
        <line x1="100" y1="20" x2="100" y2="398" stroke="rgba(255,255,255,0.05)" strokeDasharray="5,5" />
        <line x1="20" y1="115" x2="180" y2="115" stroke="rgba(255,255,255,0.05)" strokeDasharray="5,5" />

        {/* PUNTOS DE IMPACTO */}
        {impactosFiltrados
          .filter(ev => {
            const esAtaqueEvent = ev.tipoSilueta === 'ataque' || ["Jab", "Recto", "Cross", "Gancho", "Uppercut", "Swing", "Golpe Conectado", "Golpe Errado"].includes(ev.tipo)
            const esDefensaEvent = ev.tipoSilueta === 'defensa' || ["Finta", "Esquiva", "Bloqueo", "Clinch", "Pivoteo", "Marca General"].includes(ev.tipo)
            return silueta === 'ataque' ? esAtaqueEvent : esDefensaEvent
          })
          .map((ev) => {
            const isHovered = hoveredDot === ev.id
            const esGolpeOfensivo = ["Jab", "Recto", "Cross", "Gancho", "Uppercut", "Swing"].includes(ev.tipo)
            let dotColor = 'var(--color-dorado)' // por defecto dorado (p. ej. fintas, pivoteo, marca general)
            
            if (esGolpeOfensivo) {
              if (ev.resultado === 'Errado') {
                dotColor = 'var(--color-rojo-suave)'
              } else {
                dotColor = 'var(--color-exito)'
              }
            } else if (ev.tipo === 'Golpe Conectado' || ev.tipo === 'Bloqueo' || ev.tipo === 'Esquiva') {
              dotColor = 'var(--color-exito)'
            } else if (ev.tipo === 'Golpe Errado') {
              dotColor = 'var(--color-rojo-suave)'
            }

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
                  style={{ transition: 'all 0.2s ease', pointerEvents: 'none' }}
                />

                {/* Zona de Interacción Invisible y Amplia (Radio 24px) */}
                <circle
                  cx={ev.coordX}
                  cy={ev.coordY}
                  r={24}
                  fill="transparent"
                  style={{ cursor: 'pointer', pointerEvents: 'auto' }}
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
                    onSelectEvento?.(ev)
                  }}
                  onContextMenu={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    if (editable) {
                      setImpactoAEliminar(ev)
                      setDotTooltip(prev => ({ ...prev, visible: false }))
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, height: '100%', overflow: 'hidden' }}>
      
      {/* BANNER DE INSTRUCCIÓN DE MAPEO ACTIVO */}
      <AnimatePresence>
        {eventoMapeoActivo && (() => {
          // Determinar si este golpe fue lanzado por el boxeador "propio" (esquinaFiltro)
          const esAtaque = eventoMapeoActivo.esquina === esquinaFiltro;
          const colorEsquina = eventoMapeoActivo.esquina === 'roja'
            ? { bg: 'rgba(192,57,43,0.18)', border: 'rgba(192,57,43,0.6)', text: 'var(--color-rojo-suave)', label: 'Rincón Rojo 🔴' }
            : { bg: 'rgba(41,128,185,0.18)', border: 'rgba(41,128,185,0.6)', text: 'var(--color-azul-suave)', label: 'Rincón Azul 🔵' };
          return (
            <motion.div
              key="mapeo-banner"
              initial={{ opacity: 0, y: -12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.98 }}
              style={{
                background: `linear-gradient(135deg, ${colorEsquina.bg} 0%, rgba(10,10,14,0.92) 100%)`,
                border: `1.5px solid ${colorEsquina.border}`,
                borderRadius: 14,
                padding: '14px 18px',
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                gap: 16,
                boxShadow: `0 8px 32px rgba(0,0,0,0.4), 0 0 20px ${colorEsquina.bg}`,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, flex: 1 }}>
                {/* Indicador pulsante */}
                <motion.div
                  animate={{ scale: [1, 1.4, 1], opacity: [1, 0.6, 1] }}
                  transition={{ repeat: Infinity, duration: 1.2, ease: 'easeInOut' }}
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    background: colorEsquina.text,
                    boxShadow: `0 0 10px ${colorEsquina.text}`,
                    flexShrink: 0,
                    marginTop: 3,
                  }}
                />
                <div style={{ flex: 1 }}>
                  {/* Fila del tipo de golpe y rincón */}
                  <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--color-texto)', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span>📍 Mapeo Guiado</span>
                    <span style={{
                      color: colorEsquina.text,
                      background: colorEsquina.bg,
                      border: `1px solid ${colorEsquina.border}`,
                      padding: '2px 10px',
                      borderRadius: 6,
                      fontSize: 11,
                      fontWeight: 700,
                    }}>
                      {eventoMapeoActivo.tipo} — {colorEsquina.label}
                    </span>
                  </div>
                  {/* Instrucción clara */}
                  <div style={{ fontSize: 11, color: 'var(--color-texto-suave)', marginTop: 6, lineHeight: 1.5, background: 'rgba(255,255,255,0.03)', padding: '6px 10px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.06)' }}>
                    {esAtaque ? (
                      <span>
                        🎯 <strong style={{ color: 'var(--color-rojo-suave)' }}>Golpe DADO por {colorEsquina.label}.</strong>
                        {' '}Haz clic en la silueta de <strong style={{ color: '#fff' }}>ATAQUE ← izquierda</strong> para marcar dónde impactó en el rival.
                      </span>
                    ) : (
                      <span>
                        🛡️ <strong style={{ color: 'var(--color-azul-suave)' }}>Golpe RECIBIDO por {colorEsquina.label}.</strong>
                        {' '}Haz clic en la silueta de <strong style={{ color: '#fff' }}>DEFENSA → derecha</strong> para registrar dónde impactó tu boxeador.
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <button
                onClick={() => onDeselectEvento?.()}
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  color: 'var(--color-texto-suave)',
                  fontSize: 10,
                  fontWeight: 700,
                  padding: '6px 12px',
                  borderRadius: 6,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  textTransform: 'uppercase',
                  flexShrink: 0,
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'var(--color-texto)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'var(--color-texto-suave)'; }}
              >
                Cancelar
              </button>
            </motion.div>
          );
        })()}
      </AnimatePresence>

      {/* TIP DE USO CUANDO NO HAY MAPEO ACTIVO */}
      {editable && !eventoMapeoActivo && !impactoPendiente && (
        <div style={{
          background: 'rgba(212,175,55,0.05)',
          border: '1px dashed rgba(212,175,55,0.25)',
          borderRadius: 8,
          padding: '7px 12px',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          flexShrink: 0,
        }}>
          <span style={{ fontSize: 14, flexShrink: 0 }}>💡</span>
          <span style={{ fontSize: 10, color: 'var(--color-texto-suave)', lineHeight: 1.4 }}>
            <strong style={{ color: 'var(--color-dorado)' }}>Mapear:</strong>
            {' '}Presiona Jab/Cross… luego haz clic en la silueta. O clic directo para nuevo impacto.
          </span>
        </div>
      )}

      {/* MODAL INLINE: REGISTRAR IMPACTO DIRECTO */}
      {impactoPendiente && (
        <motion.div
          initial={{ opacity: 0, y: -8, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8 }}
          style={{
            background: 'linear-gradient(135deg, #1f1f26 0%, #131318 100%)',
            border: '2px solid rgba(212,175,55,0.6)',
            borderRadius: 12,
            padding: '14px 12px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.8), 0 0 30px rgba(212,175,55,0.15)',
            flexShrink: 0,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--color-dorado)', textTransform: 'uppercase', letterSpacing: 1 }}>
                {impactoPendiente.tipoSilueta === 'ataque' ? '🎯 Golpe Dado' : '🛡️ Golpe Recibido'} — {impactoPendiente.lugar}
              </div>
            </div>
            <button
              onClick={() => setImpactoPendiente(null)}
              style={{ background: 'none', border: 'none', color: 'var(--color-texto-suave)', cursor: 'pointer', fontSize: 16, lineHeight: 1, padding: '0 4px' }}
            >✕</button>
          </div>
          {/* Botones de tipo de golpe */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
            {opcionesFiltradas.map((opt) => (
              <button
                key={opt.val}
                onClick={() => {
                  onAddImpacto?.({
                    ...impactoPendiente,
                    tipo: opt.val,
                    esquina: esquinaFiltro,
                  })
                  setImpactoPendiente(null)
                }}
                style={{
                  background: opt.bg,
                  border: `1px solid ${opt.border}`,
                  color: opt.color,
                  borderRadius: 6,
                  padding: '7px 4px',
                  fontSize: 10,
                  fontWeight: 700,
                  cursor: 'pointer',
                  textTransform: 'uppercase',
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <button
            onClick={() => setImpactoPendiente(null)}
            style={{ marginTop: 8, width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--color-borde)', color: 'var(--color-texto-suave)', borderRadius: 6, padding: '6px', fontSize: 10, cursor: 'pointer' }}
          >
            Cancelar
          </button>
        </motion.div>
      )}
      {/* SECCIÓN DE FILTROS - una sola fila compacta */}
      <div style={{
        display: 'flex',
        gap: 8,
        alignItems: 'center',
        flexShrink: 0,
        flexWrap: 'nowrap',
        overflow: 'hidden',
      }}>
        <Filter size={12} color="var(--color-dorado)" style={{ flexShrink: 0 }} />
        {/* Filtro Golpe */}
        <select
          value={tipoFiltro}
          onChange={e => setTipoFiltro(e.target.value)}
          style={{
            background: 'var(--color-superficie)',
            border: '1px solid var(--color-borde)',
            color: 'var(--color-texto)',
            borderRadius: 6,
            padding: '4px 6px',
            fontSize: 10,
            outline: 'none',
            cursor: 'pointer',
            flex: 1,
            minWidth: 0,
          }}
        >
          <option value="todos">Todos los eventos</option>
          <option value="Jab">Jab</option>
          <option value="Recto">Recto</option>
          <option value="Cross">Cross</option>
          <option value="Gancho">Gancho</option>
          <option value="Uppercut">Uppercut</option>
          <option value="Swing">Swing</option>
          <option value="conectados">Conectados</option>
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
            padding: '4px 6px',
            fontSize: 10,
            outline: 'none',
            cursor: 'pointer',
            flex: 1,
            minWidth: 0,
          }}
        >
          <option value="todos">Todos los Rounds</option>
          {roundsDisponibles.map(r => (
            <option key={r} value={r}>Round {r}</option>
          ))}
        </select>
        {editable && (
          <span style={{ fontSize: 9, color: 'var(--color-dorado)', fontStyle: 'italic', flexShrink: 0 }}>✏️</span>
        )}
      </div>



      {/* DISPOSICIÓN DE LAS SILUETAS (LADO A LADO) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, flex: 1, minHeight: 0, overflow: 'hidden' }}>
        
        {/* ATAQUE */}
        {(() => {
          const esDestino = eventoMapeoActivo && eventoMapeoActivo.esquina === esquinaFiltro;
          const activo = eventoMapeoActivo && esDestino;
          const bloqueado = eventoMapeoActivo && !esDestino;
          return (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
              alignItems: 'center',
              position: 'relative',
              transition: 'opacity 0.3s',
              opacity: bloqueado ? 0.35 : 1,
              flex: 1,
              minHeight: 0,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: activo ? '#fff' : 'var(--color-rojo-suave)', position: 'relative' }}>
                <Target size={14} />
                <span>ATAQUE</span>
                <span style={{ fontSize: 10, opacity: 0.7, fontWeight: 500 }}>(Impactos dados)</span>
                {activo && (
                  <motion.span
                    animate={{ opacity: [1, 0.5, 1], scale: [1, 1.08, 1] }}
                    transition={{ repeat: Infinity, duration: 1, ease: 'easeInOut' }}
                    style={{
                      marginLeft: 4,
                      fontSize: 11,
                      fontWeight: 800,
                      color: 'var(--color-rojo-suave)',
                      background: 'rgba(192,57,43,0.18)',
                      border: '1px solid rgba(192,57,43,0.5)',
                      borderRadius: 6,
                      padding: '2px 8px',
                      letterSpacing: '0.04em',
                    }}
                  >
                    🎯 MARCAR AQUÍ
                  </motion.span>
                )}
                {bloqueado && (
                  <span style={{ marginLeft: 4, fontSize: 10, color: 'var(--color-texto-suave)', opacity: 0.7 }}>🔒</span>
                )}
              </div>
              <div style={{ width: '100%', flex: 1, minHeight: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', maxWidth: 220 }}>
                {renderSiluetaSVG('ataque')}
              </div>
            </div>
          );
        })()}

        {/* DEFENSA */}
        {(() => {
          const esDestino = eventoMapeoActivo && eventoMapeoActivo.esquina !== esquinaFiltro;
          const activo = eventoMapeoActivo && esDestino;
          const bloqueado = eventoMapeoActivo && !esDestino;
          return (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
              alignItems: 'center',
              position: 'relative',
              transition: 'opacity 0.3s',
              opacity: bloqueado ? 0.35 : 1,
              flex: 1,
              minHeight: 0,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: activo ? '#fff' : 'var(--color-azul-suave)' }}>
                <Shield size={14} />
                <span>DEFENSA</span>
                <span style={{ fontSize: 10, opacity: 0.7, fontWeight: 500 }}>(Golpes recibidos)</span>
                {activo && (
                  <motion.span
                    animate={{ opacity: [1, 0.5, 1], scale: [1, 1.08, 1] }}
                    transition={{ repeat: Infinity, duration: 1, ease: 'easeInOut' }}
                    style={{
                      marginLeft: 4,
                      fontSize: 11,
                      fontWeight: 800,
                      color: 'var(--color-azul-suave)',
                      background: 'rgba(41,128,185,0.18)',
                      border: '1px solid rgba(41,128,185,0.5)',
                      borderRadius: 6,
                      padding: '2px 8px',
                      letterSpacing: '0.04em',
                    }}
                  >
                    🛡️ MARCAR AQUÍ
                  </motion.span>
                )}
                {bloqueado && (
                  <span style={{ marginLeft: 4, fontSize: 10, color: 'var(--color-texto-suave)', opacity: 0.7 }}>🔒</span>
                )}
              </div>
              <div style={{ width: '100%', flex: 1, minHeight: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', maxWidth: 220 }}>
                {renderSiluetaSVG('defensa')}
              </div>
            </div>
          );
        })()}

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
            <div style={{ fontSize: 10, color: 'var(--color-texto-suave)', display: 'flex', flexDirection: 'column', gap: 2, marginBottom: 6 }}>
              <div>Zona: <strong style={{ color: 'var(--color-texto)' }}>{dotTooltip.ev.lugar}</strong></div>
              <div>Tiempo: <strong style={{ color: 'var(--color-texto)' }}>{formatTime(dotTooltip.ev.timestamp)}</strong></div>
            </div>
            <div style={{ fontSize: 9, color: 'var(--color-dorado)', borderTop: '1px dashed var(--color-borde)', paddingTop: 6, marginBottom: 6, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span>👆 Clic Izq: Ver en video</span>
              {editable && <span>🖱️ Clic Der: Eliminar impacto</span>}
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
                    setImpactoAEliminar(dotTooltip.ev)
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


      {/* MODAL EMERGENTE: CONFIRMAR ELIMINACIÓN DE IMPACTO */}

      <AnimatePresence>
        {impactoAEliminar && createPortal(
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(5, 5, 8, 0.93)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 99999999,
            }}
            onClick={() => setImpactoAEliminar(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              style={{
                background: 'linear-gradient(135deg, #1f1f24 0%, #131316 100%)',
                border: '2px solid rgba(231, 76, 60, 0.75)',
                borderRadius: 20,
                padding: '28px 24px',
                width: 'calc(100% - 32px)',
                maxWidth: 360,
                boxShadow: '0 30px 80px rgba(0, 0, 0, 0.95), 0 0 45px rgba(231, 76, 60, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ textAlign: 'center', marginBottom: 20 }}>
                {/* Icono decorativo premium */}
                <div style={{
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  background: 'rgba(231, 76, 60, 0.12)',
                  border: '1px solid rgba(231, 76, 60, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 14px auto'
                }}>
                  <Trash2 size={24} color="var(--color-rojo-suave)" />
                </div>
                <span style={{
                  fontSize: 10,
                  fontWeight: 800,
                  color: 'var(--color-rojo-suave)',
                  letterSpacing: 1.5,
                  textTransform: 'uppercase',
                }}>
                  Eliminar Impacto
                </span>
                <h3 style={{
                  margin: '6px 0 0 0',
                  fontSize: 18,
                  fontWeight: 700,
                  color: 'var(--color-texto)',
                }}>
                  ¿Remover este impacto?
                </h3>
                <p style={{
                  margin: '12px 0 0 0',
                  fontSize: 12,
                  color: 'var(--color-texto-suave)',
                  lineHeight: '1.5'
                }}>
                  Se eliminará el registro de <strong>{impactoAEliminar.tipo}</strong> en <strong>{impactoAEliminar.lugar}</strong> (Round {impactoAEliminar.round}) de la línea de tiempo.
                </p>
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  onClick={() => setImpactoAEliminar(null)}
                  style={{
                    flex: 1,
                    background: 'rgba(255, 255, 255, 0.07)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: 'var(--color-texto)',
                    padding: '12px',
                    borderRadius: 8,
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)'
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.07)'
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)'
                  }}
                >
                  CANCELAR
                </button>
                <button
                  onClick={() => {
                    onRemoveImpacto?.(impactoAEliminar.id)
                    setImpactoAEliminar(null)
                  }}
                  style={{
                    flex: 1,
                    background: 'var(--color-rojo-suave)',
                    border: 'none',
                    color: '#ffffff',
                    padding: '12px',
                    borderRadius: 8,
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    boxShadow: '0 4px 12px rgba(231,76,60,0.3)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#e74c3c'
                    e.currentTarget.style.boxShadow = '0 6px 16px rgba(231,76,60,0.5)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'var(--color-rojo-suave)'
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(231,76,60,0.3)'
                  }}
                >
                  ELIMINAR
                </button>
              </div>
            </motion.div>
          </div>,
          document.body
        )}
      </AnimatePresence>

    </div>
  )
}


