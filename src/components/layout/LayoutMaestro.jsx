import { useState, useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import BarraLateral from './BarraLateral'
import BarraTitulo from './BarraTitulo'
import ErrorBoundary from '../ui/ErrorBoundary'
import { RefreshCw, X, Sparkles } from 'lucide-react'

/**
 * LayoutMaestro — Estructura principal 100vh de la Plataforma de Análisis.
 * Sidebar fija a la izquierda + zona de contenido a la derecha.
 * Sin scroll global (cada vista maneja su propio scroll interno si lo necesita).
 */
export default function LayoutMaestro() {
  const location = useLocation()
  const [actualizacionEstado, setActualizacionEstado] = useState('idle') // 'idle' | 'descargando' | 'lista' | 'error'
  const [progresoDescarga, setProgresoDescarga] = useState({ porcentaje: 0, velocidad: 0 })
  const [errorMensaje, setErrorMensaje] = useState('')

  useEffect(() => {
    if (window.api && window.api.actualizacion) {
      const limpiarDisponible = window.api.actualizacion.onDisponible((info) => {
        console.log('[LayoutMaestro] Actualización disponible detectada:', info?.version);
        setActualizacionEstado('descargando');
      });

      const limpiarProgreso = window.api.actualizacion.onProgreso((datos) => {
        setProgresoDescarga({
          porcentaje: Math.round(datos.porcentaje),
          velocidad: Math.round((datos.velocidad / 1024 / 1024) * 10) / 10 // Convertir a MB/s
        });
      });

      const limpiarLista = window.api.actualizacion.onLista((info) => {
        console.log('[LayoutMaestro] Actualización descargada y lista para instalar:', info?.version);
        setActualizacionEstado('lista');
      });

      const limpiarError = window.api.actualizacion.onError((msg) => {
        console.error('[LayoutMaestro] Error de auto-actualización:', msg);
        setErrorMensaje(msg);
        setActualizacionEstado('error');
        // Ocultar error automáticamente tras 12 segundos
        setTimeout(() => setActualizacionEstado('idle'), 12000);
      });

      return () => {
        if (typeof limpiarDisponible === 'function') limpiarDisponible();
        if (typeof limpiarProgreso === 'function') limpiarProgreso();
        if (typeof limpiarLista === 'function') limpiarLista();
        if (typeof limpiarError === 'function') limpiarError();
      };
    }
  }, []);

  const handleReiniciarYActualizar = () => {
    if (window.api && window.api.actualizacion) {
      window.api.actualizacion.instalar();
    }
  };

  return (
    <div style={estilos.contenedor}>
      {/* Barra de título custom (reemplaza el chrome de Windows) */}
      <BarraTitulo />

      <div style={estilos.cuerpo}>
        {/* Sidebar de navegación */}
        <BarraLateral />

        {/* Zona de contenido animada — cada vista se monta aquí */}
        <main style={estilos.contenido}>
          <ErrorBoundary>
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                style={{ width: '100%', height: '100%', overflow: 'auto' }}
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </ErrorBoundary>
        </main>
      </div>

      {/* NOTIFICACIÓN PREMIUM DE AUTO-ACTUALIZACIÓN */}
      <AnimatePresence>
        {actualizacionEstado !== 'idle' && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            style={estilos.toastActualizacion}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {actualizacionEstado === 'descargando' ? (
                  <div style={estilos.spinnerContainer}>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
                      style={{ display: 'flex' }}
                    >
                      <RefreshCw size={18} color="var(--color-dorado)" />
                    </motion.div>
                  </div>
                ) : actualizacionEstado === 'error' ? (
                  <div style={{ ...estilos.sparkleContainer, background: 'rgba(231,76,60,0.15)', boxShadow: 'none' }}>
                    <X size={18} color="var(--color-rojo-suave)" />
                  </div>
                ) : (
                  <div style={estilos.sparkleContainer}>
                    <Sparkles size={18} color="#D4AF37" fill="#D4AF37" />
                  </div>
                )}
                
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#FFFFFF', marginBottom: 2 }}>
                    {actualizacionEstado === 'descargando' 
                      ? 'Descargando versión...' 
                      : actualizacionEstado === 'error'
                        ? 'Error de Actualización'
                        : '¡Actualización lista!'}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--color-texto-suave)', lineHeight: 1.4 }}>
                    {actualizacionEstado === 'descargando'
                      ? `Descargando en segundo plano: ${progresoDescarga.porcentaje}% (${progresoDescarga.velocidad} MB/s)`
                      : actualizacionEstado === 'error'
                        ? `Error de red o permisos: ${errorMensaje}`
                        : 'La descarga ha finalizado. Reinicia la aplicación para aplicar las mejoras.'}
                  </div>
                </div>

                {actualizacionEstado === 'lista' ? (
                  <button 
                    onClick={handleReiniciarYActualizar} 
                    className="boton-primario" 
                    style={estilos.btnInstalar}
                  >
                    Reiniciar
                  </button>
                ) : (
                  <button 
                    onClick={() => setActualizacionEstado('idle')} 
                    style={estilos.btnCerrarToast}
                    title="Ocultar"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Barra de progreso visual premium */}
              {actualizacionEstado === 'descargando' && (
                <div style={{ width: '100%', height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 2, overflow: 'hidden', marginTop: 2 }}>
                  <div 
                    style={{ 
                      width: `${progresoDescarga.porcentaje}%`, 
                      height: '100%', 
                      background: 'linear-gradient(to right, #B38F2D, #D4AF37)', 
                      borderRadius: 2,
                      transition: 'width 0.3s ease' 
                    }} 
                  />
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

const estilos = {
  contenedor: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    width: '100vw',
    overflow: 'hidden',
    background: 'var(--color-fondo)',
    position: 'relative',
  },
  cuerpo: {
    display: 'flex',
    flex: 1,
    overflow: 'hidden',
  },
  contenido: {
    flex: 1,
    overflow: 'hidden',
    background: 'var(--color-fondo)',
  },
  toastActualizacion: {
    position: 'fixed',
    bottom: 24,
    right: 24,
    width: 380,
    background: 'rgba(20, 20, 20, 0.85)',
    backdropFilter: 'blur(16px)',
    border: '1px solid rgba(212, 175, 55, 0.35)',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5), 0 0 16px rgba(212, 175, 55, 0.15)',
    borderRadius: 12,
    padding: '16px 20px',
    zIndex: 9999,
  },
  spinnerContainer: {
    width: 36,
    height: 36,
    borderRadius: '50%',
    background: 'rgba(212, 175, 55, 0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  sparkleContainer: {
    width: 36,
    height: 36,
    borderRadius: '50%',
    background: 'rgba(212, 175, 55, 0.15)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    boxShadow: '0 0 8px rgba(212, 175, 55, 0.4)',
  },
  btnInstalar: {
    fontSize: 12,
    padding: '6px 12px',
    height: 'auto',
    borderRadius: 6,
    boxShadow: '0 2px 8px rgba(212, 175, 55, 0.4)',
    border: 'none',
    color: '#000000',
    background: 'var(--color-dorado)',
    cursor: 'pointer',
    fontWeight: 600,
  },
  btnCerrarToast: {
    background: 'transparent',
    border: 'none',
    color: 'var(--color-texto-suave)',
    cursor: 'pointer',
    padding: 4,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'color 0.2s',
  },
}
