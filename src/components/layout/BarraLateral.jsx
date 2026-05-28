import { useState, useEffect } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  Video,
  FileText,
  Settings,
  LogOut,
  FlaskConical,
  BadgeCheck,
  Crown
} from 'lucide-react'
import { db } from '../../servicios/db'
import { useLiveQuery } from 'dexie-react-hooks'
import { useAuth } from '../../context/AuthContext'
import { auth } from '../../servicios/firebase'
import { signOut } from 'firebase/auth'

export default function BarraLateral() {
  const { usuario, rol } = useAuth()
  const location = useLocation()
  const [appVersion, setAppVersion] = useState('v1.0.3')

  useEffect(() => {
    if (window.api?.getVersion) {
      window.api.getVersion().then(v => setAppVersion(`v${v}`))
    }
  }, [])

  // Recuperar el ID de la última sesión activa del editor
  const lastSessionId = localStorage.getItem('equipo_daneri_last_active_session_id')
  const editorPath = lastSessionId ? `/editor/${lastSessionId}` : '/editor'
  
  // Filtrar navegación según rol
  const NAV_ITEMS = [
    { ruta: '/inicio',   icono: LayoutDashboard, etiqueta: 'Inicio' },
    { ruta: '/boxeadores', icono: Users,         etiqueta: 'Boxeadores' },
    { ruta: '/sesiones', icono: CalendarDays,     etiqueta: 'Sesiones' },
    ...(rol !== 'boxeador' ? [{ ruta: editorPath,   icono: Video,            etiqueta: 'Editor Táctico' }] : []),
    ...(rol !== 'boxeador' ? [{ ruta: '/informes',  icono: FileText,         etiqueta: 'Informes' }] : []),
    { ruta: '/seed',     icono: FlaskConical,     etiqueta: 'Carga de Datos' }
  ]

  const isMini = location.pathname.startsWith('/editor');

  const handleLogout = async () => {
    try {
      await signOut(auth)
    } catch (error) {
      console.error("Error al cerrar sesión", error)
    }
  }

  return (
    <aside style={{
      ...estilos.sidebar,
      width: isMini ? '72px' : 'var(--sidebar-ancho)',
      minWidth: isMini ? '72px' : 'var(--sidebar-ancho)',
    }}>
      {/* Logo y Marca */}
      <div style={{
        ...estilos.logo,
        justifyContent: isMini ? 'center' : 'flex-start',
        padding: isMini ? '0 0 12px' : '0 16px 12px',
      }}>
        <img
          src="/assets/logo-small.png"
          alt="Equipo Daneri"
          style={estilos.logoImg}
          onError={(e) => { e.target.style.display = 'none' }}
        />
        {!isMini && (
          <div>
            <div style={{ ...estilos.marcaPrincipal, color: 'var(--color-dorado)', fontSize: 13, letterSpacing: '0.1em', fontWeight: 800 }}>EQUIPO</div>
            <div style={{ ...estilos.marcaPrincipal, color: '#FFFFFF', fontSize: 15, letterSpacing: '0.05em', fontWeight: 900 }}>DANERI</div>
          </div>
        )}
      </div>

      <hr style={estilos.divisor} />

      {/* Navegación */}
      <nav style={estilos.nav}>
        {NAV_ITEMS.map(({ ruta, icono: Icono, etiqueta }) => {
          const active = ruta.startsWith('/editor')
            ? location.pathname.startsWith('/editor')
            : location.pathname === ruta;
            
          return (
            <NavLink
              key={ruta}
              to={ruta}
              title={isMini ? etiqueta : undefined}
              style={{
                ...estilos.navItem,
                color: active ? 'var(--color-dorado)' : 'var(--color-texto-suave)',
                background: active ? 'var(--color-dorado-alfa)' : 'transparent',
                borderLeft: active
                  ? '3px solid var(--color-dorado)'
                  : '3px solid transparent',
                justifyContent: isMini ? 'center' : 'flex-start',
                padding: isMini ? '12px 0' : '10px 16px',
              }}
            >
              <Icono size={18} strokeWidth={active ? 2.5 : 1.5} />
              {!isMini && <span style={estilos.navEtiqueta}>{etiqueta}</span>}
            </NavLink>
          )
        })}
      </nav>

      {/* Ajustes (al fondo) */}
      <div style={estilos.fondo}>
        <hr style={estilos.divisor} />
        {rol !== 'boxeador' && (
          <div style={{ display: 'flex', flexDirection: isMini ? 'column' : 'row', justifyContent: 'space-between', alignItems: 'center', paddingRight: isMini ? 0 : 16 }}>
            <NavLink
              to="/ajustes"
              title={isMini ? "Ajustes" : undefined}
              style={({ isActive }) => ({
                ...estilos.navItem,
                color: isActive ? 'var(--color-dorado)' : 'var(--color-texto-suave)',
                flex: isMini ? 'initial' : 1,
                justifyContent: isMini ? 'center' : 'flex-start',
                width: isMini ? '100%' : 'auto',
                padding: isMini ? '12px 0' : '10px 16px',
              })}
            >
              <Settings size={18} />
              {!isMini && <span style={estilos.navEtiqueta}>Ajustes</span>}
            </NavLink>
            {!isMini && (
              <span style={{ fontSize: 10, fontFamily: 'monospace', color: 'var(--color-texto-suave)', opacity: 0.65, fontWeight: 700 }}>
                {appVersion}
              </span>
            )}
          </div>
        )}

        {/* Perfil Usuario Real (Google Auth) */}
        <div style={{
          ...estilos.analista,
          flexDirection: isMini ? 'column' : 'row',
          alignItems: 'center',
          gap: isMini ? 12 : 8,
          padding: isMini ? '12px 0 4px' : '12px 16px 4px',
          justifyContent: 'center',
        }}>
          {usuario?.photoURL ? (
            <img src={usuario.photoURL} alt="Avatar" style={estilos.analistaAvatarImg} />
          ) : (
            <div style={estilos.analistaAvatar}>{usuario?.email?.substring(0,2).toUpperCase() || 'U'}</div>
          )}
          {!isMini ? (
            <>
              <div style={{ flex: 1, overflow: 'visible', display: 'flex', flexDirection: 'column', gap: 2 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={estilos.analistaNombre} title={usuario?.displayName || usuario?.email?.split('@')[0] || 'Usuario'}>
                    {usuario?.displayName || usuario?.email?.split('@')[0] || 'Usuario'}
                  </span>
                  {rol === 'admin' && (
                    <BadgeCheck size={14} color="#D4AF37" style={{ flexShrink: 0, filter: 'drop-shadow(0 0 3px rgba(212, 175, 55, 0.8))' }} />
                  )}
                </div>
                {rol === 'admin' ? (
                  <div style={{ display: 'flex', marginTop: 1 }}>
                    <span style={{
                      fontSize: 8,
                      fontWeight: 800,
                      color: '#D4AF37',
                      background: 'rgba(212, 175, 55, 0.12)',
                      border: '1px solid rgba(212, 175, 55, 0.3)',
                      padding: '1px 5px',
                      borderRadius: 4,
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 3,
                      boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
                      textShadow: '0 0 2px rgba(212, 175, 55, 0.4)'
                    }}>
                      <Crown size={8} fill="#D4AF37" style={{ flexShrink: 0 }} /> ADMIN
                    </span>
                  </div>
                ) : (
                  <div style={estilos.analistaRol}>{rol ? rol.toUpperCase() : 'Cargando rol...'}</div>
                )}
              </div>
              <button onClick={handleLogout} style={estilos.btnLogout} title="Cerrar sesión">
                <LogOut size={16} color="var(--color-texto-suave)" />
              </button>
            </>
          ) : (
            <button onClick={handleLogout} style={{ ...estilos.btnLogout, marginTop: 4 }} title="Cerrar sesión">
              <LogOut size={16} color="var(--color-texto-suave)" />
            </button>
          )}
        </div>
      </div>
    </aside>
  )
}

const estilos = {
  sidebar: {
    height: '100%',
    background: 'var(--color-superficie)',
    borderRight: '1px solid var(--color-borde)',
    display: 'flex',
    flexDirection: 'column',
    padding: '16px 0',
    WebkitAppRegion: 'drag', // Permite arrastrar la ventana desde el sidebar
    transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1), min-width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '0 16px 12px',
  },
  logoImg: {
    width: 44,
    height: 44,
    objectFit: 'contain',
    flexShrink: 0,
    filter: 'drop-shadow(0 0 8px rgba(212, 175, 55, 0.55))',
  },
  marcaPrincipal: {
    color: 'var(--color-texto)',
    fontWeight: 700,
    fontSize: 14,
    lineHeight: 1.2,
    letterSpacing: '-0.01em',
  },
  divisor: {
    border: 'none',
    borderTop: '1px solid var(--color-borde)',
    margin: '8px 0',
  },
  nav: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
    padding: '8px 0',
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '10px 16px',
    textDecoration: 'none',
    fontSize: 13,
    fontWeight: 500,
    transition: 'color 0.2s, background 0.2s',
    WebkitAppRegion: 'no-drag',
  },
  navEtiqueta: {
    fontSize: 13,
    fontWeight: 500,
  },
  fondo: {
    display: 'flex',
    flexDirection: 'column',
    padding: '0',
    WebkitAppRegion: 'no-drag',
  },
  analista: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '12px 16px 4px',
    WebkitAppRegion: 'no-drag',
  },
  analistaAvatar: {
    width: 30,
    height: 30,
    borderRadius: '50%',
    background: 'var(--color-dorado-alfa)',
    border: '1px solid var(--color-dorado)',
    color: 'var(--color-dorado)',
    fontWeight: 700,
    fontSize: 11,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  analistaAvatarImg: {
    width: 30,
    height: 30,
    borderRadius: '50%',
    objectFit: 'cover',
    border: '1px solid var(--color-dorado)',
    flexShrink: 0,
  },
  analistaNombre: {
    color: 'var(--color-texto)',
    fontSize: 12,
    fontWeight: 600,
    whiteSpace: 'nowrap'
  },
  analistaRol: {
    color: 'var(--color-texto-suave)',
    fontSize: 10,
  },
  btnLogout: {
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '4px',
    borderRadius: '4px',
    transition: 'background 0.2s',
    WebkitAppRegion: 'no-drag',
  }
}
