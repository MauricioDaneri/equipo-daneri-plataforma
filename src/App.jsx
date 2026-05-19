import { useState, useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from './servicios/firebase'

import LayoutMaestro from './components/layout/LayoutMaestro'
import Inicio from './vistas/Inicio'
import Sesiones from './vistas/Sesiones'
import EditorTactico from './vistas/EditorTactico'
import Informes from './vistas/Informes'
import Presentacion from './vistas/Presentacion'
import Ajustes from './vistas/Ajustes'
import DossierBoxeador from './vistas/DossierBoxeador'
import PanelControl from './vistas/PanelControl'
import Login from './vistas/Login'
import PaginaSeed from './vistas/PaginaSeed'
import Informe from './vistas/Informe'

export default function App() {
  const [usuario, setUsuario] = useState(null)
  const [cargandoAuth, setCargandoAuth] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUsuario(user)
      setCargandoAuth(false)
    })
    return () => unsubscribe()
  }, [])

  if (cargandoAuth) {
    return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-fondo)', color: 'var(--color-dorado)', fontSize: 14, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Autenticando Oficial...</div>
  }

  if (!usuario) {
    return <Login />
  }

  return (
    <Routes>
      {/* Modo Presentación: pantalla completa sin sidebar */}
      <Route path="/presentacion/:id?" element={<Presentacion />} />
      <Route path="/panel-control/:id?" element={<PanelControl />} />

      {/* Layout principal con sidebar */}
      <Route element={<LayoutMaestro />}>
        <Route index element={<Navigate to="/inicio" replace />} />
        <Route path="/inicio"    element={<Inicio />} />
        <Route path="/sesiones"  element={<Sesiones />} />
        <Route path="/editor/:id?" element={<EditorTactico />} />
        <Route path="/informes"  element={<Informes />} />
        <Route path="/boxeador/:id" element={<DossierBoxeador />} />
        <Route path="/boxeadores" element={<Sesiones />} />
        <Route path="/ajustes"   element={<Ajustes />} />
        <Route path="/informe/:id" element={<Informe />} />
        <Route path="/seed"      element={<PaginaSeed />} />
      </Route>
    </Routes>
  )
}
