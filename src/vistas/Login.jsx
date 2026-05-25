import { useState } from 'react'
import { auth, googleProvider } from '../servicios/firebase'
import { signInWithPopup, signInWithEmailAndPassword } from 'firebase/auth'
import { motion } from 'framer-motion'
import { Fingerprint, Mail, Lock } from 'lucide-react'

// Detectar si estamos corriendo dentro de Electron (la API del bridge existe)
const isElectron = typeof window !== 'undefined' && window?.api !== undefined

export default function Login() {
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState(null)
  // Siempre mostramos ambas opciones. Email/password visible por default.
  const [modoEmail, setModoEmail] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleGoogleLogin = async () => {
    setCargando(true)
    setError(null)
    try {
      await signInWithPopup(auth, googleProvider)
    } catch (err) {
      console.error('[Auth] Google Error:', err)
      const errorMsg = err.message || 'Error desconocido'
      const errorCode = err.code || 'sin-codigo'
      if (err.code === 'auth/popup-blocked' || err.code === 'auth/popup-closed-by-user') {
        setError('El popup de Google fue bloqueado. Usá el acceso con Correo/Contraseña.')
      } else if (err.code === 'auth/network-request-failed') {
        setError('Sin conexión a internet. Verificá tu red y reintentá.')
      } else {
        setError(`Error al autenticar con Google (${errorCode}): ${errorMsg}`)
      }
    } finally {
      setCargando(false)
    }
  }

  const handleEmailLogin = async (e) => {
    e.preventDefault()
    if (!email || !password) {
      setError('Por favor, ingresá tu correo y contraseña.')
      return
    }
    setCargando(true)
    setError(null)
    try {
      await signInWithEmailAndPassword(auth, email, password)
    } catch (err) {
      console.error('[Auth] Email Error:', err)
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setError('Credenciales inválidas. Verificá tu correo y contraseña.')
      } else if (err.code === 'auth/too-many-requests') {
        setError('Demasiados intentos. Esperá unos minutos antes de reintentar.')
      } else if (err.code === 'auth/network-request-failed') {
        setError('Sin conexión a internet. Verificá tu red y reintentá.')
      } else if (err.code === 'auth/invalid-email') {
        setError('El formato del correo es inválido.')
      } else {
        setError(`Error de autenticación: ${err.code || err.message}`)
      }
    } finally {
      setCargando(false)
    }
  }

  return (
    <div style={estilos.layout}>
      <div style={estilos.bgImage} />
      <div style={estilos.overlay} />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        style={estilos.loginContainer}
      >
        <div style={estilos.logoWrapper}>
          <img
            src="./assets/logo-small.png"
            alt="Equipo Daneri"
            style={estilos.logoIcon}
            onError={(e) => { e.target.style.display = 'none' }}
          />
          <h1 style={estilos.titulo}>EQUIPO DANERI</h1>
          <p style={estilos.subtitulo}>Plataforma Analítica Táctica</p>
        </div>

        <div style={estilos.divisor} />

        <div style={estilos.authSeccion}>
          <h2 style={estilos.authTitulo}>Bienvenido</h2>
          <p style={estilos.authDesc}>
            {modoEmail
              ? 'Ingresá tus credenciales de administrador o técnico.'
              : 'Iniciá sesión para ingresar a tu rol asignado.'}
          </p>

          {!modoEmail ? (
            <>
              <button
                id="btn-google-login"
                style={{ ...estilos.btnGoogle, opacity: cargando ? 0.7 : 1 }}
                onClick={handleGoogleLogin}
                disabled={cargando}
              >
                {cargando ? (
                  <span style={estilos.cargando}>Conectando...</span>
                ) : (
                  <>
                    <svg width="20" height="20" viewBox="0 0 24 24" style={{ marginRight: 12 }}>
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    Iniciá sesión con Google
                  </>
                )}
              </button>

              <div style={estilos.separador}>
                <div style={estilos.separadorLinea} />
                <span style={estilos.separadorTexto}>o</span>
                <div style={estilos.separadorLinea} />
              </div>

              <span
                style={estilos.linkToggle}
                onClick={() => { setModoEmail(true); setError(null); }}
              >
                Ingresar con Correo / Contraseña
              </span>

              <p style={estilos.notaRegistro}>
                ¿Primera vez? Al ingresar con Google se crea tu cuenta automáticamente.
              </p>
            </>
          ) : (
            <form onSubmit={handleEmailLogin} style={{ width: '100%' }}>
              <div style={estilos.inputGroup}>
                <Mail size={16} style={estilos.inputIcon} />
                <input
                  id="login-email"
                  type="email"
                  placeholder="Correo electrónico"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={estilos.input}
                  disabled={cargando}
                  autoComplete="email"
                />
              </div>

              <div style={estilos.inputGroup}>
                <Lock size={16} style={estilos.inputIcon} />
                <input
                  id="login-password"
                  type="password"
                  placeholder="Contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={estilos.input}
                  disabled={cargando}
                  autoComplete="current-password"
                />
              </div>

              <button
                id="login-submit"
                type="submit"
                style={{ ...estilos.btnSubmit, opacity: cargando ? 0.7 : 1 }}
                disabled={cargando}
              >
                {cargando ? 'Iniciando sesión...' : 'Iniciar Sesión'}
              </button>

              {!isElectron && (
                <div style={{ textAlign: 'center' }}>
                  <span
                    style={estilos.linkToggle}
                    onClick={() => { setModoEmail(false); setError(null); }}
                  >
                    ← Volver a Acceso con Google
                  </span>
                </div>
              )}
              {isElectron && (
                <div style={{ textAlign: 'center' }}>
                  <span
                    style={estilos.linkToggle}
                    onClick={() => { setModoEmail(false); setError(null); }}
                  >
                    ← Usar Google en su lugar
                  </span>
                </div>
              )}
            </form>
          )}

          {error && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              style={estilos.error}
            >
              ⚠ {error}
            </motion.p>
          )}
        </div>

        <div style={estilos.footer}>
          <Fingerprint size={14} color="var(--color-texto-suave)" />
          <span>Acceso Seguro</span>
          <span style={{ margin: '0 8px', color: 'var(--color-borde)' }}>|</span>
          <span>v2.0.0</span>
          {isElectron && <>
            <span style={{ margin: '0 8px', color: 'var(--color-borde)' }}>|</span>
            <span style={{ color: 'var(--color-texto-muted)', fontSize: 10 }}>Desktop</span>
          </>}
        </div>
      </motion.div>
    </div>
  )
}

const estilos = {
  layout: {
    height: '100vh',
    width: '100vw',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'var(--color-fondo)',
    position: 'relative',
    overflow: 'hidden',
  },
  bgImage: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundImage: 'url("https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?q=80&w=2070&auto=format&fit=crop")',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    filter: 'grayscale(100%)',
    opacity: 0.15,
  },
  overlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    background: 'radial-gradient(circle at center, transparent 0%, var(--color-fondo) 80%)',
  },
  loginContainer: {
    background: 'rgba(20, 20, 20, 0.85)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border: '1px solid rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: '48px 40px',
    width: 440,
    boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5), 0 0 0 1px rgba(212,175,55,0.1)',
    position: 'relative',
    zIndex: 10,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  logoWrapper: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: 32,
  },
  logoIcon: {
    width: 130,
    height: 'auto',
    marginBottom: 20,
    objectFit: 'contain',
    filter: 'drop-shadow(0 0 16px rgba(212, 175, 55, 0.5))',
  },
  titulo: {
    margin: 0,
    fontSize: 28,
    fontWeight: 800,
    letterSpacing: '0.1em',
    color: 'var(--color-texto)',
    textTransform: 'uppercase',
  },
  subtitulo: {
    margin: '8px 0 0 0',
    fontSize: 12,
    color: 'var(--color-dorado)',
    letterSpacing: '0.2em',
    textTransform: 'uppercase',
    fontWeight: 600,
  },
  divisor: {
    width: '100%',
    height: 1,
    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)',
    marginBottom: 32,
  },
  authSeccion: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  authTitulo: {
    margin: '0 0 8px 0',
    fontSize: 16,
    fontWeight: 600,
    color: 'var(--color-texto)',
    letterSpacing: '0.05em',
  },
  authDesc: {
    margin: '0 0 24px 0',
    fontSize: 13,
    color: 'var(--color-texto-suave)',
    textAlign: 'center',
    lineHeight: 1.5,
    maxWidth: '90%',
  },
  btnGoogle: {
    background: '#ffffff',
    color: '#141414',
    border: 'none',
    borderRadius: 8,
    padding: '14px 24px',
    width: '100%',
    fontSize: 15,
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
    marginBottom: 16,
  },
  cargando: {
    color: '#141414',
    fontSize: 15,
    fontWeight: 600,
  },
  error: {
    color: 'var(--color-rojo-suave)',
    fontSize: 12,
    marginTop: 16,
    textAlign: 'center',
    background: 'rgba(192, 57, 43, 0.1)',
    border: '1px solid rgba(192, 57, 43, 0.3)',
    borderRadius: 8,
    padding: '10px 16px',
    lineHeight: 1.5,
    width: '100%',
    margin: '16px 0 0 0',
  },
  footer: {
    marginTop: 40,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 11,
    color: 'var(--color-texto-suave)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  inputGroup: {
    position: 'relative',
    width: '100%',
    marginBottom: 16,
  },
  inputIcon: {
    position: 'absolute',
    left: 14,
    top: '50%',
    transform: 'translateY(-50%)',
    color: 'var(--color-texto-suave)',
    pointerEvents: 'none',
  },
  input: {
    width: '100%',
    padding: '14px 16px 14px 44px',
    borderRadius: 8,
    border: '1px solid rgba(255, 255, 255, 0.1)',
    background: 'rgba(255, 255, 255, 0.05)',
    color: '#ffffff',
    fontSize: 14,
    outline: 'none',
    transition: 'all 0.2s ease',
    boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.2)',
    boxSizing: 'border-box',
  },
  btnSubmit: {
    background: 'var(--color-dorado, #D4AF37)',
    color: '#141414',
    border: 'none',
    borderRadius: 8,
    padding: '14px 24px',
    width: '100%',
    fontSize: 15,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    boxShadow: '0 4px 6px rgba(212,175,55,0.2)',
    marginBottom: 16,
  },
  linkToggle: {
    color: 'var(--color-texto-suave)',
    fontSize: 13,
    cursor: 'pointer',
    textDecoration: 'none',
    transition: 'color 0.2s ease',
    borderBottom: '1px dashed var(--color-texto-suave)',
    paddingBottom: 2,
  },
  separador: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    width: '100%',
    margin: '8px 0',
  },
  separadorLinea: {
    flex: 1,
    height: 1,
    background: 'rgba(255,255,255,0.08)',
  },
  separadorTexto: {
    color: 'var(--color-texto-suave)',
    fontSize: 12,
    fontWeight: 500,
  },
  notaRegistro: {
    margin: '12px 0 0 0',
    fontSize: 11,
    color: 'var(--color-texto-muted, rgba(255,255,255,0.35))',
    textAlign: 'center',
    lineHeight: 1.5,
  },
}

