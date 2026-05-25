import React from 'react'
import { db } from '../../servicios/db'
import { AlertTriangle, RefreshCw, Download, Code } from 'lucide-react'

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null, logId: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  async componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo })
    const errorMsg = error?.toString() || 'Error desconocido'
    const stack = errorInfo?.componentStack || error?.stack || ''
    
    const errorLog = {
      fecha: Date.now(),
      errorMensaje: errorMsg,
      stackTrace: stack,
      vista: window.location.pathname,
      sesionId: window.location.pathname.includes('/editor/') 
        ? Number(window.location.pathname.split('/editor/')[1]) 
        : null
    }

    try {
      // 1. Guardar en IndexedDB
      const id = await db.logsErrores.add(errorLog)
      this.setState({ logId: id })

      // 2. Guardar en el log local de Electron para el puente con Antigravity
      if (window.api?.errores?.guardarLog) {
        await window.api.errores.guardarLog({ id, ...errorLog })
      }
    } catch (e) {
      console.error('Error al registrar logs en ErrorBoundary:', e)
    }
  }

  handleDescargarReporte = () => {
    const report = {
      app: "Plataforma de Análisis - Equipo Daneri",
      timestamp: new Date().toISOString(),
      url: window.location.href,
      error: this.state.error?.message || this.state.error?.toString(),
      componentStack: this.state.errorInfo?.componentStack,
      stack: this.state.error?.stack,
      logId: this.state.logId
    }

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `error_daneri_report_${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  handleReiniciar = () => {
    window.location.href = '/'
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={estilos.container}>
          <div style={estilos.card}>
            <div style={estilos.header}>
              <div style={estilos.badge}>
                <AlertTriangle size={24} color="var(--color-rojo-suave)" />
              </div>
              <h1 style={estilos.titulo}>Se ha detectado una anomalía</h1>
              <p style={estilos.subtitulo}>
                La aplicación encontró un problema de ejecución inesperado. El incidente ha sido registrado para que Antigravity aplique un parche a la brevedad.
              </p>
            </div>

            <div style={estilos.errorBox}>
              <div style={estilos.errorHeader}>
                <Code size={14} color="var(--color-rojo-suave)" />
                <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-rojo-suave)' }}>
                  Detalle técnico del error
                </span>
              </div>
              <div style={estilos.errorMessage}>
                {this.state.error && this.state.error.toString()}
              </div>
              {this.state.errorInfo && (
                <pre style={estilos.stack}>
                  {this.state.errorInfo.componentStack.split('\n').slice(0, 5).join('\n')}
                </pre>
              )}
            </div>

            <div style={estilos.acciones}>
              <button onClick={this.handleDescargarReporte} style={estilos.btnSecundario}>
                <Download size={16} /> Descargar Reporte
              </button>
              <button onClick={this.handleReiniciar} style={estilos.btnPrimario}>
                <RefreshCw size={16} /> Volver al Inicio
              </button>
            </div>
            
            <div style={estilos.footer}>
              Si estás trabajando con <strong>Antigravity</strong>, indícale en el chat que revise el archivo <code>logs_errores.json</code> en la raíz del proyecto para solucionar esto de inmediato.
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export { ErrorBoundary }

const estilos = {
  container: {
    width: '100vw',
    height: '100vh',
    background: 'radial-gradient(circle at center, #1b1b1b 0%, #101010 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    color: '#ffffff',
    fontFamily: 'system-ui, -apple-system, sans-serif'
  },
  card: {
    background: 'linear-gradient(135deg, rgba(30,30,30,0.85), rgba(20,20,20,0.95))',
    border: '1px solid rgba(231,76,60,0.3)',
    borderRadius: '16px',
    padding: '32px',
    maxWidth: '580px',
    width: '100%',
    boxShadow: '0 20px 40px rgba(0,0,0,0.6), 0 0 40px rgba(231,76,60,0.1)',
    backdropFilter: 'blur(12px)',
    display: 'flex',
    flexDirection: 'column',
    gap: '24px'
  },
  header: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    gap: '12px'
  },
  badge: {
    width: '56px',
    height: '56px',
    borderRadius: '50%',
    background: 'rgba(231,76,60,0.1)',
    border: '1px solid rgba(231,76,60,0.3)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '8px'
  },
  titulo: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#ffffff',
    margin: 0
  },
  subtitulo: {
    fontSize: '13px',
    color: 'var(--color-texto-suave)',
    lineHeight: '1.5',
    margin: 0
  },
  errorBox: {
    background: 'rgba(0,0,0,0.3)',
    border: '1px solid var(--color-borde)',
    borderRadius: '8px',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  errorHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px'
  },
  errorMessage: {
    fontFamily: 'monospace',
    fontSize: '12px',
    color: 'var(--color-rojo-suave)',
    wordBreak: 'break-all',
    fontWeight: '600'
  },
  stack: {
    margin: '4px 0 0 0',
    fontFamily: 'monospace',
    fontSize: '11px',
    color: 'var(--color-texto-suave)',
    overflowX: 'auto',
    lineHeight: '1.4',
    background: 'rgba(255,255,255,0.02)',
    padding: '8px',
    borderRadius: '4px'
  },
  acciones: {
    display: 'flex',
    gap: '12px',
    marginTop: '8px'
  },
  btnPrimario: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '12px',
    borderRadius: '8px',
    background: 'linear-gradient(135deg, var(--color-dorado), var(--color-dorado-suave))',
    border: 'none',
    color: '#000000',
    fontSize: '13px',
    fontWeight: '700',
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(212,175,55,0.2)'
  },
  btnSecundario: {
    flex: 1.2,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '12px',
    borderRadius: '8px',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid var(--color-borde)',
    color: '#ffffff',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background 0.2s'
  },
  footer: {
    fontSize: '11px',
    color: 'var(--color-texto-suave)',
    textAlign: 'center',
    lineHeight: '1.4',
    borderTop: '1px solid var(--color-borde)',
    paddingTop: '16px'
  }
}
