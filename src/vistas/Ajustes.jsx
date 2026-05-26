import { useState, useEffect } from 'react'
import { Save, Server, User, AlertTriangle, Trash2, ShieldAlert, Keyboard, Plus, UserCheck, HelpCircle, Upload, Download, Cloud, CloudLightning, RefreshCw } from 'lucide-react'
import { db } from '../servicios/db'
import { useModal } from '../context/ModalContext'
import { useLiveQuery } from 'dexie-react-hooks'
import { auth } from '../servicios/firebase'
import { sincronizarLocalHaciaNube, sincronizarNubeHaciaLocal, isSyncEnProgreso } from '../servicios/sync'

// Default hotkeys en caso de que falten en la DB
const defaultHotkeys = {
  RinconRojo: 'KeyQ', RinconAzul: 'KeyW',
  Jab: 'KeyJ', Recto: 'KeyR', Cross: 'KeyC', Gancho: 'KeyG', Uppercut: 'KeyU', Swing: 'KeyS',
  Finta: 'KeyF', Esquiva: 'KeyE', Bloqueo: 'KeyB', Clinch: 'KeyK', Pivoteo: 'KeyP', "Marca General": 'KeyM',
  PlayPause: 'Space', Atras: 'ArrowLeft', Adelante: 'ArrowRight',
  Cursor: 'Digit1', Lapiz: 'Digit2'
}

const formatearTecla = (code) => {
  if (!code) return ''
  if (code.startsWith('Key')) return code.replace('Key', '')
  if (code.startsWith('Digit')) return code.replace('Digit', '')
  if (code === 'Space') return 'Espacio'
  if (code === 'ArrowLeft') return '←'
  if (code === 'ArrowRight') return '→'
  return code
}

// Descripciones de las acciones de los atajos tácticos en el boxeo profesional
const DESCRIPCIONES_ATAJOS = {
  RinconRojo: 'Establece la asignación de los golpes y acciones subsiguientes al Rincón Rojo.',
  RinconAzul: 'Establece la asignación de los golpes y acciones subsiguientes al Rincón Azul.',
  Jab: 'Golpe directo de la mano adelantada usado para mantener distancia y puntuar.',
  Recto: 'Golpe fuerte directo lanzado con potencia desde la guardia.',
  Cross: 'Golpe cruzado directo fuerte lanzado con la mano atrasada.',
  Gancho: 'Golpe curvo lateral dirigido a la cabeza o flanco del cuerpo.',
  Uppercut: 'Golpe ascendente vertical lanzado en distancia corta.',
  Swing: 'Golpe curvo largo lanzado con la trayectoria abierta de forma descendente o lateral.',
  Finta: 'Movimiento engañoso para provocar una reacción del oponente.',
  Esquiva: 'Acción evasiva (cabeceo o cintura) para esquivar golpes sin contactar la guardia.',
  Bloqueo: 'Intercepción de golpes con los guantes, antebrazos o codos.',
  Clinch: 'Maniobra táctica defensiva para sujetar al rival en distancia corta.',
  Pivoteo: 'Desplazamiento angular sobre un pie para cambiar la línea de ataque.',
  "Marca General": 'Coloca una marca en la línea de tiempo para anotaciones generales o momentos específicos.',
  PlayPause: 'Pausa o reanuda la reproducción del video táctico.',
  Atras: 'Retrocede el video táctico 5 segundos para re-analizar la jugada.',
  Adelante: 'Avanza el video táctico 5 segundos para omitir tiempos muertos.',
  Cursor: 'Cambia a modo cursor interactivo para seleccionar marcas o timelines.',
  Lapiz: 'Activa la herramienta de lápiz para dibujar directamente sobre la pantalla de video.',
}

export default function Ajustes() {
  const { mostrarConfirmacion, mostrarAlerta } = useModal()
  const [config, setConfig] = useState({
    ollamaUrl: 'http://localhost:11434',
    ollamaModelo: 'llama3.2',
    analistaNombre: 'Mauricio Daneri',
    hotkeys: defaultHotkeys
  })
  const [guardado, setGuardado] = useState(false)
  const [capturando, setCapturando] = useState(null) // ID del atajo que estamos escuchando
  const analistasDb = useLiveQuery(() => db.analistas.toArray()) || []
  const [nuevoAnalista, setNuevoAnalista] = useState({ nombre: '', rol: '' })

  const [sincronizando, setSincronizando] = useState(false)
  const [ultimoSync, setUltimoSync] = useState(localStorage.getItem('ultimo_sync') || 'Nunca')
  const [usuarioEmail, setUsuarioEmail] = useState(auth.currentUser?.email || '')
  const [buscandoActualizacion, setBuscandoActualizacion] = useState(false)
  const [autoSync, setAutoSync] = useState(localStorage.getItem('auto_sync_enabled') === 'true')

  const handleToggleAutoSync = (e) => {
    const newVal = e.target.checked
    setAutoSync(newVal)
    localStorage.setItem('auto_sync_enabled', newVal ? 'true' : 'false')
    window.dispatchEvent(new Event('autosync:toggle'))
  }

  const handleBuscarActualizacion = async () => {
    if (!window.api?.actualizacion?.buscar) {
      mostrarAlerta({
        titulo: "Función No Disponible",
        mensaje: "La búsqueda de actualizaciones solo está disponible en la aplicación instalada de producción.",
        tipo: "info"
      })
      return
    }

    setBuscandoActualizacion(true)
    try {
      const res = await window.api.actualizacion.buscar()
      if (res && res.ok) {
        mostrarAlerta({
          titulo: "Búsqueda Iniciada",
          mensaje: "Buscando actualizaciones en el repositorio de GitHub. Si hay una nueva versión disponible, se descargará automáticamente en segundo plano.",
          tipo: "exito"
        })
      } else {
        mostrarAlerta({
          titulo: "Error al Buscar",
          mensaje: `No se pudo conectar con el servidor de actualizaciones: ${res?.error || 'Error desconocido'}`,
          tipo: "peligro"
        })
      }
    } catch (e) {
      console.error(e)
      mostrarAlerta({
        titulo: "Error",
        mensaje: "Ocurrió un error al buscar la actualización.",
        tipo: "peligro"
      })
    } finally {
      setBuscandoActualizacion(false)
    }
  }

  const handleSincronizarNube = async () => {
    const user = auth.currentUser
    if (!user) {
      mostrarAlerta({ titulo: "Usuario no autenticado", mensaje: "Debes iniciar sesión para sincronizar tus datos con la nube.", tipo: "advertencia" })
      return
    }

    setSincronizando(true)
    try {
      // Verificar que no haya un sync de fondo corriendo
      if (isSyncEnProgreso()) {
        mostrarAlerta({ titulo: "Sincronización en Progreso", mensaje: "Ya hay una sincronización automática de fondo ejecutándose. Esperá a que termine y volvé a intentar.", tipo: "advertencia" })
        setSincronizando(false)
        return
      }
      // 1. Subir cambios locales a la nube primero (resguarda el trabajo del analista para que no sea sobrescrito por datos viejos)
      const resSubida = await sincronizarLocalHaciaNube(user.uid)
      // 2. Descargar cambios de la nube a local segundo
      const resDescarga = await sincronizarNubeHaciaLocal(user.uid)

      const timestamp = new Date().toLocaleString()
      localStorage.setItem('ultimo_sync', timestamp)
      setUltimoSync(timestamp)

      mostrarAlerta({
        titulo: "Sincronización Completa",
        mensaje: `Los datos se han sincronizado con la nube de forma bidireccional:\n\n` +
                 `- Atletas en la nube: ${resDescarga.boxeadoresCount}\n` +
                 `- Sesiones en la nube: ${resDescarga.sesionesCount}\n` +
                 `- Marcas/Eventos en la nube: ${resDescarga.eventosCount}`,
        tipo: "exito"
      })
    } catch (err) {
      console.error('[Cloud Sync] Error durante la sincronización:', err)
      mostrarAlerta({
        titulo: "Error de Sincronización",
        mensaje: err.message || "No se pudo completar la sincronización con la nube. Revisa tu conexión a internet o los logs de error.",
        tipo: "peligro"
      })
    } finally {
      setSincronizando(false)
    }
  }

  useEffect(() => {
    db.configuracion.get(1).then(data => {
      if (data) {
        setConfig({ ...data, hotkeys: { ...defaultHotkeys, ...(data.hotkeys || {}) } })
      }
    })
  }, [])

  // Escucha global para capturar teclas
  useEffect(() => {
    if (!capturando) return

    const handleKeyDown = (e) => {
      e.preventDefault()
      
      // Chequear colisiones
      const valoresUsados = Object.values(config.hotkeys)
      if (valoresUsados.includes(e.code) && config.hotkeys[capturando] !== e.code) {
        mostrarAlerta({ titulo: 'Atajo Ocupado', mensaje: `La tecla [${formatearTecla(e.code)}] ya está en uso por otra acción.`, tipo: 'advertencia' })
        setCapturando(null)
        return
      }

      setConfig(prev => ({
        ...prev,
        hotkeys: { ...prev.hotkeys, [capturando]: e.code }
      }))
      setCapturando(null)
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [capturando, config.hotkeys])

  const handleChange = (e) => {
    setConfig({ ...config, [e.target.name]: e.target.value })
  }

  const handleGuardar = async () => {
    await db.configuracion.put({ id: 1, ...config })
    setGuardado(true)
    setTimeout(() => setGuardado(false), 3000)
  }

  const handleBorrarBaseDeDatos = async () => {
    const confirmacion = await mostrarConfirmacion({ titulo: "Restablecer Base de Datos", mensaje: "¿Estás absolutamente seguro de que quieres borrar TODOS los boxeadores, sesiones y análisis?\nEsta acción NO se puede deshacer.", textoConfirmar: "Sí, Borrar Todo", tipo: "peligro" })
    if (confirmacion) {
      localStorage.setItem('db_manually_cleared', 'true') // Prevenir recuperación automática al recargar
      await db.delete()
      window.location.reload()
    }
  }

  const handleExportarBackup = async () => {
    try {
      const data = {
        boxeadores: await db.boxeadores.toArray(),
        sesiones: await db.sesiones.toArray(),
        eventos: await db.eventos.toArray(),
        configuracion: await db.configuracion.toArray(),
        analistas: await db.analistas.toArray(),
        logsErrores: await db.logsErrores.toArray()
      }
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `backup_daneri_plataforma_${new Date().toISOString().split('T')[0]}.json`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error(err)
      mostrarAlerta({ titulo: "Error al Exportar", mensaje: "Hubo un problema al exportar la base de datos.", tipo: "peligro" })
    }
  }

  const handleImportarBackup = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    const confirmado = await mostrarConfirmacion({ titulo: "Importar Respaldo", mensaje: "¿Estás seguro de que quieres importar este respaldo?\nEsto reemplazará y combinará los datos actuales con los del archivo.", textoConfirmar: "Importar", tipo: "advertencia" });
    if (!confirmado) return;
    
    const reader = new FileReader()
    reader.onload = async (evt) => {
      try {
        const data = JSON.parse(evt.target.result)
        
        if (data.boxeadores) {
          for (const b of data.boxeadores) {
            await db.boxeadores.put(b)
          }
        }
        if (data.sesiones) {
          for (const s of data.sesiones) {
            await db.sesiones.put(s)
          }
        }
        if (data.eventos) {
          for (const ev of data.eventos) {
            await db.eventos.put(ev)
          }
        }
        if (data.analistas) {
          for (const a of data.analistas) {
            await db.analistas.put(a)
          }
        }
        if (data.logsErrores) {
          for (const le of data.logsErrores) {
            await db.logsErrores.put(le)
          }
        }
        if (data.configuracion && data.configuracion.length > 0) {
          await db.configuracion.put(data.configuracion[0])
        }
        
        await mostrarAlerta({ titulo: "Restauración Exitosa", mensaje: "¡Base de datos restaurada exitosamente!", tipo: "exito" })
        window.location.reload()
      } catch (err) {
        console.error(err)
        mostrarAlerta({ titulo: "Error al Importar", mensaje: "Error al procesar el archivo de respaldo. Asegúrate de elegir un archivo JSON válido.", tipo: "peligro" })
      }
    }
    reader.readAsText(file)
  }

  const totalErrores = useLiveQuery(() => db.logsErrores.count()) ?? 0

  const handleLimpiarLogs = async () => {
    const confirmado = await mostrarConfirmacion({ titulo: "Limpiar Logs", mensaje: "¿Limpiar todos los reportes de error de la base de datos?", textoConfirmar: "Limpiar", tipo: "advertencia" });
    if (confirmado) {
      await db.logsErrores.clear()
    }
  }


  const handleAgregarAnalista = async (e) => {
    e.preventDefault()
    if (!nuevoAnalista.nombre) return
    const id = await db.analistas.add({
      nombre: nuevoAnalista.nombre,
      rol: nuevoAnalista.rol || 'Analista Junior',
      activo: true,
      createdAt: Date.now()
    })
    // Auto seleccionar si es el primero
    if (analistasDb.length === 0) {
      setConfig({ ...config, analistaActivoId: id })
      await db.configuracion.put({ id: 1, ...config, analistaActivoId: id })
    }
    setNuevoAnalista({ nombre: '', rol: '' })
  }

  const handleSeleccionarAnalista = async (id) => {
    setConfig({ ...config, analistaActivoId: id })
    await db.configuracion.put({ id: 1, ...config, analistaActivoId: id })
  }

  const handleEliminarAnalista = async (id) => {
    const confirmado = await mostrarConfirmacion({ titulo: "Eliminar Analista", mensaje: "¿Seguro que deseas eliminar este perfil de analista?", textoConfirmar: "Eliminar", tipo: "peligro" });
    if (confirmado) {
      await db.analistas.delete(id)
      if (config.analistaActivoId === id) {
        const restantes = await db.analistas.toArray()
        const nuevoActivo = restantes.length > 0 ? restantes[0].id : null
        setConfig({ ...config, analistaActivoId: nuevoActivo })
        await db.configuracion.put({ id: 1, ...config, analistaActivoId: nuevoActivo })
      }
    }
  }

  const renderAtajo = (clave, label) => (
    <div style={estilos.atajoRow} key={clave}>
      <div style={estilos.atajoInfo}>
        <span style={estilos.atajoLabel}>{label}</span>
        <span style={estilos.atajoDesc}>{DESCRIPCIONES_ATAJOS[clave]}</span>
      </div>
      <button 
        style={capturando === clave ? estilos.btnAtajoCapturando : estilos.btnAtajo}
        onClick={() => setCapturando(clave)}
      >
        {capturando === clave ? 'PRESIONA...' : formatearTecla(config.hotkeys[clave] || '')}
      </button>
    </div>
  )

  return (
    <div style={estilos.pagina}>
      <header style={estilos.header}>
        <h1 style={estilos.tituloSeccion}>AJUSTES DEL SISTEMA</h1>
        <p style={{ margin: '4px 0 0 0', fontSize: 13, color: 'var(--color-texto-suave)' }}>
          Configuración global del motor de inteligencia artificial local, gestión de roster de entrenadores y mapeo de teclas físicas.
        </p>
      </header>

      <div style={estilos.grid}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* --- Conexión IA --- */}
          <div className="tarjeta" style={estilos.tarjeta}>
            <div style={estilos.headerTarjeta}>
              <Server size={20} color="var(--color-dorado)" />
              <h2 style={estilos.tituloTarjeta}>Conexión Inteligencia Artificial (Ollama)</h2>
            </div>
            
            <div style={estilos.formGroup}>
              <label style={estilos.label}>URL del Servidor Ollama</label>
              <input type="text" name="ollamaUrl" value={config.ollamaUrl} onChange={handleChange} style={estilos.input} placeholder="Ej: http://localhost:11434" />
              <span style={estilos.hint}>Endpoint donde corre el motor de IA de síntesis.</span>
            </div>

            <div style={estilos.formGroup}>
              <label style={estilos.label}>Modelo de Lenguaje (LLM)</label>
              <input type="text" name="ollamaModelo" value={config.ollamaModelo} onChange={handleChange} style={estilos.input} placeholder="Ej: llama3.2" />
              <span style={estilos.hint}>El modelo que redactará el análisis táctico. Recomendado: llama3.2</span>
            </div>
          </div>

          {/* --- Preferencias de Analista --- */}
          <div className="tarjeta" style={estilos.tarjeta}>
            <div style={estilos.headerTarjeta}>
              <User size={20} color="var(--color-dorado)" />
              <h2 style={estilos.tituloTarjeta}>Gestión de Analistas</h2>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {analistasDb.map(analista => (
                <div key={analista.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--color-superficie-2)', padding: '8px 12px', borderRadius: 8, border: config.analistaActivoId === analista.id ? '1px solid var(--color-dorado)' : '1px solid var(--color-borde)' }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: config.analistaActivoId === analista.id ? 'var(--color-dorado)' : 'var(--color-texto)' }}>{analista.nombre}</div>
                    <div style={{ fontSize: 11, color: 'var(--color-texto-suave)' }}>{analista.rol}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {config.analistaActivoId !== analista.id && (
                      <button onClick={() => handleSeleccionarAnalista(analista.id)} style={{ background: 'transparent', border: 'none', color: 'var(--color-texto-suave)', cursor: 'pointer' }} title="Usar como Analista Activo">
                        <UserCheck size={16} />
                      </button>
                    )}
                    <button onClick={() => handleEliminarAnalista(analista.id)} style={{ background: 'transparent', border: 'none', color: 'var(--color-rojo-suave)', cursor: 'pointer' }} title="Eliminar">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <form onSubmit={handleAgregarAnalista} style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <input type="text" placeholder="Nombre" value={nuevoAnalista.nombre} onChange={e => setNuevoAnalista({...nuevoAnalista, nombre: e.target.value})} style={{ ...estilos.input, flex: 1, padding: '8px 12px' }} required />
              <input type="text" placeholder="Rol" value={nuevoAnalista.rol} onChange={e => setNuevoAnalista({...nuevoAnalista, rol: e.target.value})} style={{ ...estilos.input, flex: 1, padding: '8px 12px' }} />
              <button type="submit" className="boton-secundario" style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Plus size={16} /></button>
            </form>
          </div>

          {/* --- Sincronización en la Nube --- */}
          <div className="tarjeta" style={{ ...estilos.tarjeta, border: '1px solid rgba(212, 175, 55, 0.25)' }}>
            <div style={estilos.headerTarjeta}>
              <Cloud size={20} color="var(--color-dorado)" />
              <h2 style={estilos.tituloTarjeta}>Sincronización en la Nube (Firebase)</h2>
            </div>
            <p style={{ fontSize: 13, color: 'var(--color-texto-suave)', margin: 0, lineHeight: 1.5 }}>
              Guarda tus análisis, marcas tácticas y fichas de boxeadores en tu cuenta. Los videos locales pesados no se subirán para ahorrar ancho de banda y almacenamiento.
            </p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, background: 'var(--color-superficie-2)', padding: 12, borderRadius: 8, border: '1px solid var(--color-borde)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                <span style={{ color: 'var(--color-texto-suave)' }}>Analista Conectado:</span>
                <span style={{ fontWeight: 600, color: 'var(--color-dorado)' }}>{usuarioEmail || 'Invitado offline'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                <span style={{ color: 'var(--color-texto-suave)' }}>Último Respaldo Nube:</span>
                <span style={{ fontWeight: 600, color: 'var(--color-texto)' }}>{ultimoSync}</span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', marginBottom: 8 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-texto)' }}>Sincronización Automática</span>
                <span style={{ fontSize: 11, color: 'var(--color-texto-suave)' }}>Respalda automáticamente cada 5 minutos de fondo</span>
              </div>
              <label className="switch-premium" style={estilos.switchLabel}>
                <input
                  type="checkbox"
                  checked={autoSync}
                  onChange={handleToggleAutoSync}
                  style={estilos.switchInput}
                />
                <span style={{
                  ...estilos.switchSlider,
                  backgroundColor: autoSync ? 'var(--color-dorado)' : 'rgba(255,255,255,0.08)',
                  boxShadow: autoSync ? '0 0 10px rgba(212,175,55,0.4)' : 'none'
                }}>
                  <span style={{
                    ...estilos.switchKnob,
                    transform: autoSync ? 'translateX(20px)' : 'translateX(0px)',
                    backgroundColor: autoSync ? '#000000' : 'var(--color-texto-suave)'
                  }} />
                </span>
              </label>
            </div>

            <button 
              className="boton-primario" 
              onClick={handleSincronizarNube} 
              disabled={sincronizando}
              style={{ display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'center', padding: '12px 16px', fontSize: 13, background: 'linear-gradient(to right, #B38F2D, #D4AF37)', color: 'black', border: 'none' }}
            >
              {sincronizando ? (
                <>
                  <RefreshCw size={16} className="spin" style={{ animation: 'spin 1.5s linear infinite' }} />
                  Sincronizando con la Nube...
                </>
              ) : (
                <>
                  <CloudLightning size={16} />
                  Sincronizar Ahora (PC ⇄ Nube)
                </>
              )}
            </button>
          </div>

          {/* --- Respaldo y Diagnóstico (Backup & Diagnostics) --- */}
          <div className="tarjeta" style={{ ...estilos.tarjeta, border: '1px solid var(--color-borde)' }}>
            <div style={estilos.headerTarjeta}>
              <Download size={20} color="var(--color-dorado)" />
              <h2 style={estilos.tituloTarjeta}>Copia de Seguridad y Diagnóstico</h2>
            </div>
            <p style={{ fontSize: 13, color: 'var(--color-texto-suave)', margin: 0, lineHeight: 1.5 }}>
              Exporta tu base de datos local para salvaguardar tu información antes de una actualización de software, o importa un respaldo previo.
            </p>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button className="boton-primario" onClick={handleExportarBackup} style={{ display: 'flex', gap: 6, alignItems: 'center', padding: '10px 14px', fontSize: 13 }}>
                <Download size={14} /> Exportar Respaldo (.json)
              </button>
              <label className="boton-secundario" style={{ display: 'flex', gap: 6, alignItems: 'center', padding: '10px 14px', fontSize: 13, cursor: 'pointer', margin: 0 }}>
                <Upload size={14} /> Importar Respaldo
                <input type="file" accept=".json" onChange={handleImportarBackup} style={{ display: 'none' }} />
              </label>
              <button 
                className="boton-secundario" 
                onClick={handleBuscarActualizacion} 
                disabled={buscandoActualizacion}
                style={{ display: 'flex', gap: 6, alignItems: 'center', padding: '10px 14px', fontSize: 13 }}
              >
                {buscandoActualizacion ? (
                  <>
                    <RefreshCw size={14} className="spin" style={{ animation: 'spin 1.5s linear infinite' }} />
                    Buscando...
                  </>
                ) : (
                  <>
                    <RefreshCw size={14} />
                    Buscar Actualizaciones
                  </>
                )}
              </button>
            </div>
            
            <div style={{ borderTop: '1px dashed var(--color-borde)', paddingTop: 16, marginTop: 4, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-texto)' }}>Registro de Errores Técnicos</span>
                  <div style={{ fontSize: 11, color: 'var(--color-texto-suave)', marginTop: 2 }}>
                    Reportes registrados en IndexedDB: {totalErrores}
                  </div>
                </div>
                {totalErrores > 0 && (
                  <button className="boton-secundario" onClick={handleLimpiarLogs} style={{ padding: '6px 12px', fontSize: 11, color: 'var(--color-rojo-suave)', borderColor: 'var(--color-borde)' }}>
                    Limpiar Logs
                  </button>
                )}
              </div>
              <div style={{ fontSize: 11, color: 'var(--color-texto-suave)', lineHeight: 1.4, background: 'rgba(0,0,0,0.15)', padding: '10px', borderRadius: 6, border: '1px solid var(--color-borde)' }}>
                ℹ️ Los errores también se escriben automáticamente en <code>logs_errores.json</code> en la raíz del proyecto para que Antigravity pueda corregirlos de inmediato si los reportas en el chat.
              </div>
            </div>
          </div>

          {/* --- Zona de Peligro --- */}
          <div className="tarjeta" style={{ ...estilos.tarjeta, border: '1px solid rgba(231, 76, 60, 0.3)' }}>

            <div style={estilos.headerTarjeta}>
              <ShieldAlert size={20} color="var(--color-rojo-suave)" />
              <h2 style={{ ...estilos.tituloTarjeta, color: 'var(--color-rojo-suave)' }}>Zona de Peligro</h2>
            </div>
            <p style={{ fontSize: 13, color: 'var(--color-texto-suave)', marginBottom: 20, lineHeight: 1.5 }}>
              Las acciones en esta área afectan permanentemente los datos locales del sistema. Asegúrate de haber exportado tus informes antes de proceder.
            </p>
            <button className="boton-primario" onClick={handleBorrarBaseDeDatos} style={{ backgroundColor: 'rgba(231, 76, 60, 0.1)', color: 'var(--color-rojo-suave)', border: '1px solid var(--color-rojo-suave)', alignSelf: 'flex-start', padding: '10px 16px', display: 'flex', gap: 8 }}>
              <Trash2 size={16} /> Restablecer Base de Datos
            </button>
          </div>
        </div>

        {/* --- Keybinds --- */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div className="tarjeta" style={{...estilos.tarjeta, height: '100%'}}>
            <div style={estilos.headerTarjeta}>
              <Keyboard size={20} color="var(--color-dorado)" />
              <h2 style={estilos.tituloTarjeta}>Mapeo de Teclas Tácticas</h2>
            </div>
            <p style={{ fontSize: 12, color: 'var(--color-texto-suave)', marginBottom: 16 }}>
              Haz clic en el botón de un atajo y presiona la nueva tecla para asignarla.
            </p>
            
            <div style={estilos.gridAtajos}>
              <div style={estilos.columnaAtajos}>
                <h4 style={estilos.subtituloAtajos}>Foco de Análisis</h4>
                {renderAtajo('RinconRojo', 'Rincón Rojo')}
                {renderAtajo('RinconAzul', 'Rincón Azul')}
                
                <h4 style={estilos.subtituloAtajos}>Ofensiva</h4>
                {renderAtajo('Jab', 'Jab')}
                {renderAtajo('Recto', 'Recto')}
                {renderAtajo('Cross', 'Cross')}
                {renderAtajo('Gancho', 'Gancho')}
                {renderAtajo('Uppercut', 'Uppercut')}
                {renderAtajo('Swing', 'Swing')}
                
                <h4 style={estilos.subtituloAtajos}>Defensa / Movimiento / Otros</h4>
                {renderAtajo('Finta', 'Finta')}
                {renderAtajo('Esquiva', 'Esquiva')}
                {renderAtajo('Bloqueo', 'Bloqueo')}
                {renderAtajo('Clinch', 'Clinch')}
                {renderAtajo('Pivoteo', 'Pivoteo')}
                {renderAtajo('Marca General', 'Marca General')}
              </div>

              <div style={estilos.columnaAtajos}>
                <h4 style={estilos.subtituloAtajos}>Reproducción</h4>
                {renderAtajo('PlayPause', 'Play / Pausa')}
                {renderAtajo('Atras', 'Retroceder 5s')}
                {renderAtajo('Adelante', 'Avanzar 5s')}

                <h4 style={estilos.subtituloAtajos}>Herramientas Visuales</h4>
                {renderAtajo('Cursor', 'Cursor')}
                {renderAtajo('Lapiz', 'Lápiz de Trazo')}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={estilos.barraAcciones}>
        {guardado && <span style={{ color: 'var(--color-exito)', fontSize: 13, fontWeight: 600 }}>¡Ajustes guardados correctamente!</span>}
        <button className="boton-primario" onClick={handleGuardar} style={{ display: 'flex', gap: 8, padding: '12px 32px' }}>
          <Save size={18} /> Guardar Configuración
        </button>
      </div>

    </div>
  )
}

const estilos = {
  pagina: { padding: '32px 40px', display: 'flex', flexDirection: 'column', gap: 32, height: '100%', overflowY: 'auto' },
  header: { marginBottom: -8 },
  tituloSeccion: { fontSize: 20, fontWeight: 700, color: 'var(--color-texto)', letterSpacing: '-0.02em', textTransform: 'uppercase' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 24 },
  tarjeta: { display: 'flex', flexDirection: 'column', gap: 20, padding: 24 },
  headerTarjeta: { display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid var(--color-borde)', paddingBottom: 16, marginBottom: 8 },
  tituloTarjeta: { fontSize: 16, fontWeight: 600, color: 'var(--color-texto)', margin: 0 },
  formGroup: { display: 'flex', flexDirection: 'column', gap: 8 },
  label: { fontSize: 12, fontWeight: 600, color: 'var(--color-texto)', textTransform: 'uppercase', letterSpacing: '0.05em' },
  input: { background: 'var(--color-superficie-2)', border: '1px solid var(--color-borde)', borderRadius: 8, padding: '12px 16px', color: 'var(--color-texto)', fontSize: 14, outline: 'none' },
  hint: { fontSize: 11, color: 'var(--color-texto-suave)' },
  barraAcciones: { marginTop: 'auto', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 16, paddingTop: 32, borderTop: '1px solid var(--color-borde)' },
  
  // Atajos
  gridAtajos: { display: 'flex', flexDirection: 'column', gap: 20 },
  columnaAtajos: { display: 'flex', flexDirection: 'column', gap: 12 },
  subtituloAtajos: { fontSize: 11, color: 'var(--color-dorado)', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px dashed rgba(212,175,55,0.3)', paddingBottom: 4, margin: '8px 0 0 0' },
  atajoRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'var(--color-superficie-2)', borderRadius: 8, border: '1px solid var(--color-borde)', transition: 'all 0.2s' },
  atajoInfo: { display: 'flex', flexDirection: 'column', gap: 4, flex: 1, paddingRight: 16 },
  atajoLabel: { fontSize: 13, color: 'var(--color-texto)', fontWeight: 600 },
  atajoDesc: { fontSize: 11, color: 'var(--color-texto-suave)', lineHeight: '1.4' },
  
  // Estilo premium de Keycap con relieve 3D
  btnAtajo: { 
    background: 'linear-gradient(to bottom, var(--color-keycap-bg-start), var(--color-keycap-bg-end))', 
    border: '1px solid var(--color-keycap-border)', 
    borderBottom: '3px solid var(--color-keycap-shadow)',
    color: 'var(--color-texto)', 
    padding: '8px 16px', 
    borderRadius: 6, 
    fontSize: 12, 
    fontWeight: 700, 
    fontFamily: 'monospace', 
    cursor: 'pointer', 
    minWidth: 90, 
    textAlign: 'center',
    boxShadow: '0 2px 4px rgba(0,0,0,0.4)',
    transition: 'all 0.1s ease',
  },
  btnAtajoCapturando: { 
    background: 'linear-gradient(to bottom, var(--color-dorado), var(--color-dorado-suave))', 
    border: '1px solid var(--color-dorado)', 
    borderBottom: '3px solid var(--color-keycap-shadow-active)',
    color: 'var(--color-fondo)', 
    padding: '8px 16px', 
    borderRadius: 6, 
    fontSize: 12, 
    fontWeight: 800, 
    fontFamily: 'monospace', 
    cursor: 'pointer', 
    minWidth: 90, 
    textAlign: 'center', 
    boxShadow: '0 0 12px rgba(212,175,55,0.4), 0 2px 4px rgba(0,0,0,0.4)',
    transition: 'all 0.1s ease',
  },
  switchLabel: {
    position: 'relative',
    display: 'inline-block',
    width: 44,
    height: 24,
    cursor: 'pointer'
  },
  switchInput: {
    opacity: 0,
    width: 0,
    height: 0
  },
  switchSlider: {
    position: 'absolute',
    cursor: 'pointer',
    top: 0, left: 0, right: 0, bottom: 0,
    borderRadius: 24,
    border: '1px solid rgba(255,255,255,0.1)',
    transition: 'all 0.3s ease',
    display: 'flex',
    alignItems: 'center',
    padding: '0 2px'
  },
  switchKnob: {
    height: 18,
    width: 18,
    borderRadius: '50%',
    transition: 'all 0.3s ease',
    display: 'block'
  }
}
