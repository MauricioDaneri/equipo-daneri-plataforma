import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  Video,
  FileText,
  Settings,
  LogOut,
  FlaskConical
} from 'lucide-react'
import { db } from '../../servicios/db'
import { useLiveQuery } from 'dexie-react-hooks'
import { useAuth } from '../../context/AuthContext'
import { auth } from '../../servicios/firebase'
import { signOut } from 'firebase/auth'

export default function BarraLateral() {
  const { usuario, rol } = useAuth()
  
  // Filtrar navegación según rol
  const NAV_ITEMS = [
    { ruta: '/inicio',   icono: LayoutDashboard, etiqueta: 'Inicio' },
    { ruta: '/sesiones', icono: CalendarDays,     etiqueta: 'Sesiones' },
    ...(rol !== 'boxeador' ? [{ ruta: '/editor',   icono: Video,            etiqueta: 'Editor Táctico' }] : []),
    ...(rol !== 'boxeador' ? [{ ruta: '/informes',  icono: FileText,         etiqueta: 'Informes' }] : []),
    { ruta: '/seed',     icono: FlaskConical,     etiqueta: 'Seed & Test' }
  ]

  const handleLogout = async () => {
    try {
      await signOut(auth)
    } catch (error) {
      console.error("Error al cerrar sesión", error)
    }
  }

  return (
    <aside style={estilos.sidebar}>
      {/* Logo y Marca */}
      <div style={estilos.logo}>
        <img
          src="/assets/logo-small.png"
          alt="Equipo Daneri"
          style={estilos.logoImg}
          onError={(e) => { e.target.style.display = 'none' }}
        />
        <div>
          <div style={estilos.marcaPrincipal}>Equipo</div>
          <div style={estilos.marcaPrincipal}>Daneri</div>
        </div>
      </div>

      <hr style={estilos.divisor} />

      {/* Navegación */}
      <nav style={estilos.nav}>
        {NAV_ITEMS.map(({ ruta, icono: Icono, etiqueta }) => (
          <NavLink
            key={ruta}
            to={ruta}
            style={({ isActive }) => ({
              ...estilos.navItem,
              color: isActive ? 'var(--color-dorado)' : 'var(--color-texto-suave)',
              background: isActive ? 'var(--color-dorado-alfa)' : 'transparent',
              borderLeft: isActive
                ? '3px solid var(--color-dorado)'
                : '3px solid transparent',
            })}
          >
            {({ isActive }) => (
              <>
                <Icono size={18} strokeWidth={isActive ? 2.5 : 1.5} />
                <span style={estilos.navEtiqueta}>{etiqueta}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Ajustes (al fondo) */}
      <div style={estilos.fondo}>
        <hr style={estilos.divisor} />
        {rol !== 'boxeador' && (
          <NavLink
            to="/ajustes"
            style={({ isActive }) => ({
              ...estilos.navItem,
              color: isActive ? 'var(--color-dorado)' : 'var(--color-texto-suave)',
            })}
          >
            <Settings size={18} />
            <span style={estilos.navEtiqueta}>Ajustes</span>
          </NavLink>
        )}

        {/* Perfil Usuario Real (Google Auth) */}
        <div style={estilos.analista}>
          {usuario?.photoURL ? (
            <img src={usuario.photoURL} alt="Avatar" style={estilos.analistaAvatarImg} />
          ) : (
            <div style={estilos.analistaAvatar}>{usuario?.email?.substring(0,2).toUpperCase() || 'U'}</div>
          )}
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <div style={estilos.analistaNombre}>{usuario?.displayName || usuario?.email?.split('@')[0] || 'Usuario'}</div>
            <div style={estilos.analistaRol}>{rol ? rol.toUpperCase() : 'Cargando rol...'}</div>
          </div>
          <button onClick={handleLogout} style={estilos.btnLogout} title="Cerrar sesión">
            <LogOut size={16} color="var(--color-texto-suave)" />
          </button>
        </div>
      </div>
    </aside>
  )
}

const estilos = {
  sidebar: {
    width: 'var(--sidebar-ancho)',
    minWidth: 'var(--sidebar-ancho)',
    height: '100%',
    background: 'var(--color-superficie)',
    borderRight: '1px solid var(--color-borde)',
    display: 'flex',
    flexDirection: 'column',
    padding: '16px 0',
    WebkitAppRegion: 'drag', // Permite arrastrar la ventana desde el sidebar
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
    filter: 'drop-shadow(0 0 4px rgba(212,175,55,0.3))',
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
  },
  analista: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '12px 16px 4px',
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
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
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
  }
}
