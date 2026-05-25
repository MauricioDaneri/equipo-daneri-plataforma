/**
 * eventTypes.js
 * Sistema de IDs y colores oficiales para todos los tipos de evento.
 * Cada tipo tiene: id único, color hex, nombre corto para el overlay, ícono.
 * Este archivo es la fuente de verdad — importalo desde cualquier componente.
 */

export const TIPOS_EVENTO = {
  'Jab':           { id: 1,  color: '#3498DB', shortName: 'JAB', icon: '1', esquina: true  },
  'Recto':         { id: 2,  color: '#E74C3C', shortName: 'REC', icon: '2', esquina: true  },
  'Cross':         { id: 3,  color: '#E67E22', shortName: 'CRO', icon: '3', esquina: true  },
  'Gancho':        { id: 4,  color: '#D4AF37', shortName: 'GAN', icon: '4', esquina: true  },
  'Uppercut':      { id: 5,  color: '#2ECC71', shortName: 'UPP', icon: '5', esquina: true  },
  'Swing':         { id: 6,  color: '#9B59B6', shortName: 'SWI', icon: '6', esquina: true  },
  'Finta':         { id: 7,  color: '#1ABC9C', shortName: 'FIN', icon: '7', esquina: true  },
  'Esquiva':       { id: 8,  color: '#95A5A6', shortName: 'ESQ', icon: '8', esquina: true  },
  'Bloqueo':       { id: 9,  color: '#9B59B6', shortName: 'BLO', icon: '9', esquina: true  },
  'Clinch':        { id: 10, color: '#7F8C8D', shortName: 'CLI', icon: 'K', esquina: false },
  'Pivoteo':       { id: 11, color: '#1ABC9C', shortName: 'PIV', icon: 'P', esquina: true  },
  'Marca General': { id: 12, color: '#E74C3C', shortName: 'MAR', icon: 'M', esquina: false },
}

// Colores de rincón para el overlay
export const COLORES_RINCON = {
  roja:    '#E74C3C',
  azul:    '#3498DB',
  general: '#95A5A6',
}

// Obtener config de un tipo (con fallback)
export function getTipoEvento(nombre) {
  return TIPOS_EVENTO[nombre] ?? { id: 0, color: '#555', shortName: '?', icon: '?', esquina: false }
}

// Generar leyenda de tipos para el panel de ayuda
export function getLeyenda() {
  return Object.entries(TIPOS_EVENTO).map(([nombre, cfg]) => ({ nombre, ...cfg }))
}
