import { Outlet, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import BarraLateral from './BarraLateral'
import BarraTitulo from './BarraTitulo'
import ErrorBoundary from '../ui/ErrorBoundary'

/**
 * LayoutMaestro — Estructura principal 100vh de la Plataforma de Análisis.
 * Sidebar fija a la izquierda + zona de contenido a la derecha.
 * Sin scroll global (cada vista maneja su propio scroll interno si lo necesita).
 */
export default function LayoutMaestro() {
  const location = useLocation()

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
}
