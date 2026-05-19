import React from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary atrapó un error:", error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', padding: 40, textAlign: 'center' }}>
          <div style={{ background: 'rgba(231, 76, 60, 0.1)', padding: 24, borderRadius: '50%', marginBottom: 24 }}>
            <AlertTriangle size={48} color="var(--color-rojo-suave)" />
          </div>
          <h2 style={{ fontSize: 24, color: 'var(--color-texto)', marginBottom: 12 }}>El componente colapsó</h2>
          <p style={{ color: 'var(--color-texto-suave)', maxWidth: 500, marginBottom: 24, lineHeight: 1.5 }}>
            Se produjo un error inesperado al intentar renderizar esta sección. 
            El <strong>Escudo de Seguridad</strong> ha bloqueado el fallo para evitar que toda la aplicación se detenga.
          </p>
          <div style={{ background: 'var(--color-superficie-2)', border: '1px solid var(--color-borde)', padding: 16, borderRadius: 8, fontSize: 12, color: 'var(--color-rojo-suave)', fontFamily: 'monospace', maxWidth: 600, overflowX: 'auto', marginBottom: 24, textAlign: 'left' }}>
            {this.state.error && this.state.error.toString()}
          </div>
          <button 
            onClick={() => window.location.reload()} 
            style={{ background: 'var(--color-dorado)', color: 'var(--color-fondo)', border: 'none', padding: '12px 24px', borderRadius: 8, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
          >
            <RefreshCw size={16} /> Recargar Aplicación
          </button>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
