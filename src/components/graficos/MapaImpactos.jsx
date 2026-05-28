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
        
        {/* Rejilla Técnica de Fondo (Technical grid of digital circles and crosshairs) */}
        <circle cx="100" cy="180" r="150" fill="none" stroke="rgba(255,255,255,0.02)" strokeWidth="1" />
        <circle cx="100" cy="180" r="90" fill="none" stroke="rgba(255,255,255,0.025)" strokeWidth="1" strokeDasharray="3,3" />
        <line x1="100" y1="20" x2="100" y2="380" stroke="rgba(255,255,255,0.03)" strokeWidth="1" strokeDasharray="5,5" />
        <line x1="20" y1="180" x2="180" y2="180" stroke="rgba(255,255,255,0.03)" strokeWidth="1" strokeDasharray="5,5" />

        {/* Silueta Humana Estilizada - Anatómica Muscular (High-Fidelity) */}
        
        {/* Cuello musculoso (Esternocleidomastoideo) */}
        <path d="M 86 85 C 80 75, 84 62, 84 62 L 116 62 C 116 62, 120 75, 114 85 Z" fill="var(--color-fondo)" stroke={strokeColor} strokeWidth="1.5" />
        <line x1="94" y1="62" x2="98" y2="80" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
        <line x1="106" y1="62" x2="102" y2="80" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />

        {/* Cabeza / Rostro anatómico */}
        <path d="M 84 62 C 73 38, 78 12, 100 12 C 122 12, 127 38, 116 62 Z" fill="var(--color-fondo)" stroke={strokeColor} strokeWidth="1.5" />
        <path d="M 87 52 L 100 64 L 113 52" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1.5" />
        <path d="M 90 36 Q 100 42 110 36" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1.5" />

        {/* Hombros y Trapecios */}
        <path d="M 64 85 C 42 90, 26 102, 22 120 C 38 108, 74 100, 84 100 L 116 100 C 126 100, 162 108, 178 120 C 174 102, 158 90, 136 85 Z" fill="var(--color-superficie-2)" stroke={strokeColor} strokeWidth="1.5" />
        
        {/* Pecho / Pectorales con definición muscular atlética */}
        <path d="M 44 120 C 44 155, 74 170, 100 170 C 126 170, 156 155, 156 120 C 126 130, 74 130, 44 120 Z" fill="var(--color-superficie)" stroke={strokeColor} strokeWidth="1.5" />
        <path d="M 100 123 L 100 170" stroke="rgba(255,255,255,0.1)" strokeWidth="1.2" />
        <path d="M 48 152 C 68 158, 88 158, 96 162 M 152 152 C 132 158, 112 158, 104 162" fill="none" stroke="rgba(0,0,0,0.45)" strokeWidth="2.5" />

        {/* Abdomen (Six Pack / Core) */}
        <path d="M 54 170 C 54 225, 64 290, 64 330 L 136 330 C 136 290, 146 225, 146 170 C 126 180, 74 180, 54 170 Z" fill="var(--color-superficie-2)" stroke={strokeColor} strokeWidth="1.5" />
        {/* Línea alba y Abs horizontales */}
        <line x1="100" y1="170" x2="100" y2="320" stroke="rgba(255,255,255,0.08)" strokeWidth="1.5" />
        <path d="M 68 202 Q 100 210 132 202 M 66 238 Q 100 246 134 238 M 65 275 Q 100 283 135 275" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1.5" />
        
        {/* Oblicuos */}
        <path d="M 54 170 C 44 215, 49 265, 64 330 L 74 330 C 64 265, 59 215, 64 170 Z" fill="rgba(0,0,0,0.25)" />
        <path d="M 146 170 C 156 215, 151 265, 136 330 L 126 330 C 136 265, 141 215, 136 170 Z" fill="rgba(0,0,0,0.25)" />

        {/* Shorts / Cinturón de Campeón de Boxeo */}
        <path d="M 58 330 L 142 330 C 140 350, 137 368, 132 382 L 68 382 C 63 368, 60 350, 58 330 Z" fill="rgba(212, 175, 55, 0.08)" stroke={strokeColor} strokeWidth="1.5" />
        
        {/* Faja del Cinturón */}
        <path d="M 58 330 Q 100 340 142 330 L 139 356 Q 100 366 61 356 Z" fill="rgba(20, 20, 20, 0.95)" stroke={strokeColor} strokeWidth="1.5" />
        
        {/* Hebilla Dorada del Cinturón */}
        <path d="M 90 334 L 110 334 Q 116 348 110 362 L 90 362 Q 84 348 90 334 Z" fill="var(--color-dorado)" opacity="0.95" stroke="rgba(0,0,0,0.2)" strokeWidth="1" />
        <polygon points="100,342 102,347 107,347 103,350 105,355 100,352 95,355 97,350 93,347 98,347" fill="#fff" />
        
        {/* Brazos Izquierdos (Deltoides en guardia alta) */}
        <path d="M 22 120 C 10 140, 6 168, 14 185 C 22 202, 38 190, 48 160 C 36 160, 24 140, 38 120 Z" fill="var(--color-superficie-2)" stroke={strokeColor} strokeWidth="1.5" />
        {/* Antebrazo Izquierdo subiendo en Guardia Alta */}
        <path d="M 14 185 C 10 205, 24 212, 38 198 L 64 100 L 52 94 Z" fill="var(--color-superficie)" stroke={strokeColor} strokeWidth="1.5" />
        {/* Guante de Boxeo Izquierdo (Mano Alta junto a la cara y oreja) */}
        <path d="M 44 96 C 34 84, 38 64, 52 56 C 66 48, 76 66, 68 86 Z" fill="rgba(20,20,20,0.95)" stroke={strokeColor} strokeWidth="2" />
        <circle cx="53" cy="74" r="10" fill="rgba(255,255,255,0.06)" />

        {/* Brazos Derechos (Deltoides en guardia alta) */}
        <path d="M 178 120 C 190 140, 194 168, 186 185 C 178 202, 162 190, 152 160 C 164 160, 176 140, 162 120 Z" fill="var(--color-superficie-2)" stroke={strokeColor} strokeWidth="1.5" />
        {/* Antebrazo Derecho subiendo en Guardia Alta */}
        <path d="M 186 185 C 190 205, 176 212, 162 198 L 136 100 L 148 94 Z" fill="var(--color-superficie)" stroke={strokeColor} strokeWidth="1.5" />
        {/* Guante de Boxeo Derecho (Mano Alta junto a la cara y oreja) */}
        <path d="M 156 96 C 166 84, 162 64, 148 56 C 134 48, 124 66, 132 86 Z" fill="rgba(20,20,20,0.95)" stroke={strokeColor} strokeWidth="2" />
        <circle cx="147" cy="74" r="10" fill="rgba(255,255,255,0.06)" />

        {/* Líneas divisorias de sectores visuales (sutiles) */}
        <line x1="100" y1="20" x2="100" y2="380" stroke="rgba(255,255,255,0.04)" strokeDasharray="3,3" />
        <line x1="20" y1="120" x2="180" y2="120" stroke="rgba(255,255,255,0.04)" strokeDasharray="3,3" />

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

                {/* Zona de Interacción de Hover Invisible y Amplia (Radio 24px) */}
                <circle
                  cx={ev.coordX}
                  cy={ev.coordY}
                  r={24}
                  fill="transparent"
                  style={{ cursor: 'default', pointerEvents: eventoMapeoActivo ? 'none' : 'auto' }}
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
                />

                {/* Zona de Interacción de Clic Precisa y Concéntrica (Radio 10px) */}
                <circle
                  cx={ev.coordX}
                  cy={ev.coordY}
                  r={10}
                  fill="transparent"
                  style={{ cursor: 'pointer', pointerEvents: eventoMapeoActivo ? 'none' : 'auto' }}
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


