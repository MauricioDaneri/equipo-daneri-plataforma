/**
 * eventTypes.js
 * Sistema de IDs y colores oficiales para todos los tipos de evento.
 * Cada tipo tiene: id único, color hex, nombre corto para el overlay, ícono.
 * Este archivo es la fuente de verdad — importalo desde cualquier componente.
 */

export const TIPOS_EVENTO = {
  'Jab':             { id: 1,  color: '#3498DB', shortName: 'JAB', icon: '1', esquina: true  },
  'Cross':           { id: 2,  color: '#E74C3C', shortName: 'CRS', icon: '2', esquina: true  },
  'Gancho':          { id: 3,  color: '#D4AF37', shortName: 'GAN', icon: '3', esquina: true  },
  'Uppercut':        { id: 4,  color: '#2ECC71', shortName: 'UPP', icon: '4', esquina: true  },
  'Esquiva':         { id: 5,  color: '#95A5A6', shortName: 'ESQ', icon: '5', esquina: true  },
  'Bloqueo':         { id: 6,  color: '#9B59B6', shortName: 'BLQ', icon: '6', esquina: true  },
  'Finta':           { id: 7,  color: '#E67E22', shortName: 'FIN', icon: '7', esquina: true  },
  'Golpe Conectado': { id: 8,  color: '#27AE60', shortName: 'CON', icon: '✓', esquina: true  },
  'Golpe Errado':    { id: 9,  color: '#C0392B', shortName: 'ERR', icon: '✗', esquina: true  },
  'Clinch':          { id: 10, color: '#7F8C8D', shortName: 'CLI', icon: '↔', esquina: false },
  'Fatiga':          { id: 11, color: '#F39C12', shortName: 'FAT', icon: '!', esquina: false },
  'Caída':           { id: 12, color: '#E74C3C', shortName: 'KD',  icon: '▼', esquina: false },
  'Pivoteo':         { id: 13, color: '#1ABC9C', shortName: 'PIV', icon: '↺', esquina: true  },
  'Amonestación':    { id: 14, color: '#F1C40F', shortName: 'AMO', icon: '⚑', esquina: false },
  'Corte/Sangrado':  { id: 15, color: '#C0392B', shortName: 'COR', icon: '✚', esquina: false },
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
