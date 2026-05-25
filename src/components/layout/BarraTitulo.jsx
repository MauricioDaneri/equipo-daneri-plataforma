import { Minus, Square, X, Cloud, CloudOff } from 'lucide-react'
import { useState, useEffect } from 'react'

/**
 * BarraTitulo — Reemplaza el chrome nativo de Windows.
 * Los botones llaman a la API expuesta por el preload.js via Context Bridge.
 */
export default function BarraTitulo() {
  const minimizar  = () => window.api?.ventana.minimizar()
  const maximizar  = () => window.api?.ventana.maximizar()
  const cerrar     = () => window.api?.ventana.cerrar()

  const [online, setOnline] = useState(navigator.onLine)
  const [syncStatus, setSyncStatus] = useState('idle') // 'idle' | 'syncing'

  useEffect(() => {
    const handleOnline = () => setOnline(true)
    const handleOffline = () => setOnline(false)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  useEffect(() => {
    const handleSyncEvent = (e) => {
      if (e.detail && e.detail.status) {
        setSyncStatus(e.detail.status)
      }
    }
    window.addEventListener('sync:status', handleSyncEvent)
    return () => window.removeEventListener('sync:status', handleSyncEvent)
  }, [])

  return (
    <div style={estilos.barra}>
      {/* Zona arrastrable */}
      <div style={estilos.titulo}>
        <span style={estilos.textoTitulo}>Plataforma de Análisis — Equipo Daneri</span>
      </div>

      {/* Controles de ventana */}
      <div style={estilos.controles}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          paddingRight: 16,
          color: !online
            ? 'var(--color-rojo-suave)'
            : syncStatus === 'syncing'
              ? 'var(--color-dorado)'
              : 'var(--color-exito)',
          gap: 6,
          transition: 'color 0.3s ease'
        }}>
          {!online ? (
            <CloudOff size={14} />
          ) : syncStatus === 'syncing' ? (
            <div className="spin" style={{ display: 'flex' }}>
              <Cloud size={14} style={{ color: 'var(--color-dorado)', filter: 'drop-shadow(0 0 4px rgba(212,175,55,0.6))' }} />
            </div>
          ) : (
            <Cloud size={14} />
          )}
          <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.05em' }}>
            {!online
              ? 'OFFLINE MODE'
              : syncStatus === 'syncing'
                ? 'SINCRONIZANDO...'
                : 'CLOUD SYNC'}
          </span>
        </div>
        <button onClick={minimizar} style={estilos.boton} title="Minimizar">
          <Minus size={12} />
        </button>
        <button onClick={maximizar} style={estilos.boton} title="Maximizar">
          <Square size={12} />
        </button>
        <button
          onClick={cerrar}
          style={{ ...estilos.boton, ...estilos.botonCerrar }}
          title="Cerrar"
        >
          <X size={12} />
        </button>
      </div>
    </div>
  )
}

const estilos = {
  barra: {
    height: 36,
    background: 'var(--color-superficie)',
    borderBottom: '1px solid var(--color-borde)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    WebkitAppRegion: 'drag',    // Permite arrastrar la ventana
    flexShrink: 0,
  },
  titulo: {
    flex: 1,
    paddingLeft: 16,
  },
  textoTitulo: {
    fontSize: 12,
    color: 'var(--color-texto-suave)',
    fontWeight: 500,
  },
  controles: {
    display: 'flex',
    gap: 0,
    WebkitAppRegion: 'no-drag',
  },
  boton: {
    width: 46,
    height: 36,
    background: 'transparent',
    border: 'none',
    color: 'var(--color-texto-suave)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background 0.15s, color 0.15s',
    ':hover': { background: 'var(--color-borde)' },
  },
  botonCerrar: {
    ':hover': {
      background: 'var(--color-rojo)',
      color: 'var(--color-texto)',
    },
  },
}
