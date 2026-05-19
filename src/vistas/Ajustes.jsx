import { useState, useEffect } from 'react'
import { Save, Server, User, AlertTriangle, Trash2, ShieldAlert, Keyboard, Plus, UserCheck } from 'lucide-react'
import { db } from '../servicios/db'
import { useLiveQuery } from 'dexie-react-hooks'

// Default hotkeys en caso de que falten en la DB
const defaultHotkeys = {
  RinconRojo: 'KeyQ', RinconAzul: 'KeyW',
  Jab: 'KeyJ', Cross: 'KeyC', Gancho: 'KeyG', Uppercut: 'KeyU',
  Esquiva: 'KeyE', Bloqueo: 'KeyB', Finta: 'KeyF',
  PlayPause: 'Space', Atras: 'ArrowLeft', Adelante: 'ArrowRight',
  Cursor: 'Digit1', Lapiz: 'Digit2'
}

const formatearTecla = (code) => {
  if (code.startsWith('Key')) return code.replace('Key', '')
  if (code.startsWith('Digit')) return code.replace('Digit', '')
  if (code === 'Space') return 'Espacio'
  if (code === 'ArrowLeft') return '←'
  if (code === 'ArrowRight') return '→'
  return code
}

export default function Ajustes() {
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
        alert(`La tecla [${formatearTecla(e.code)}] ya está en uso por otra acción.`)
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
    const confirmacion = window.confirm("⚠️ ADVERTENCIA DE SEGURIDAD ⚠️\n\n¿Estás absolutamente seguro de que quieres borrar TODOS los boxeadores, sesiones y análisis?\nEsta acción NO se puede deshacer.")
    if (confirmacion) {
      await db.delete()
      window.location.reload()
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
    if (window.confirm('¿Eliminar este perfil de analista?')) {
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
    <div style={estilos.atajoRow}>
      <span style={estilos.atajoLabel}>{label}</span>
      <button 
        style={capturando === clave ? estilos.btnAtajoCapturando : estilos.btnAtajo}
        onClick={() => setCapturando(clave)}
      >
        {capturando === clave ? 'Presiona una tecla...' : formatearTecla(config.hotkeys[clave] || '')}
      </button>
    </div>
  )

  return (
    <div style={estilos.pagina}>
      <header style={estilos.header}>
        <h1 style={estilos.tituloSeccion}>AJUSTES DEL SISTEMA</h1>
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
                {renderAtajo('Cross', 'Cross')}
                {renderAtajo('Gancho', 'Gancho')}
                {renderAtajo('Uppercut', 'Uppercut')}
                
                <h4 style={estilos.subtituloAtajos}>Defensiva</h4>
                {renderAtajo('Esquiva', 'Esquiva')}
                {renderAtajo('Bloqueo', 'Bloqueo')}
                {renderAtajo('Finta', 'Finta')}
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
  gridAtajos: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 },
  columnaAtajos: { display: 'flex', flexDirection: 'column', gap: 12 },
  subtituloAtajos: { fontSize: 11, color: 'var(--color-dorado)', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px dashed rgba(212,175,55,0.3)', paddingBottom: 4, margin: '8px 0 0 0' },
  atajoRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  atajoLabel: { fontSize: 13, color: 'var(--color-texto)', fontWeight: 500 },
  btnAtajo: { background: 'var(--color-superficie-2)', border: '1px solid var(--color-borde)', color: 'var(--color-texto)', padding: '6px 12px', borderRadius: 6, fontSize: 12, fontWeight: 700, fontFamily: 'monospace', cursor: 'pointer', minWidth: 60, textAlign: 'center' },
  btnAtajoCapturando: { background: 'var(--color-dorado)', border: '1px solid var(--color-dorado)', color: 'var(--color-fondo)', padding: '6px 12px', borderRadius: 6, fontSize: 12, fontWeight: 700, fontFamily: 'monospace', cursor: 'pointer', minWidth: 60, textAlign: 'center', boxShadow: '0 0 10px rgba(212,175,55,0.5)' },
}
