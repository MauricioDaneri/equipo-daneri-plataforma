import { useState, useEffect } from 'react'
import { db } from '../../servicios/db'
import { X, Video, FolderOpen, Tag, FileText, Hash, Clock } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function ModalNuevaSesion({ isOpen, onClose, onCreated }) {
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0])
  const [nombreSesion, setNombreSesion] = useState('')
  const [boxeadorRojoNombre, setBoxeadorRojoNombre] = useState('')
  const [boxeadorAzulNombre, setBoxeadorAzulNombre] = useState('')
  const [rounds, setRounds] = useState(12)
  const [tipo, setTipo] = useState('Combate')
  const [videoPath, setVideoPath] = useState('')
  const [videoNombre, setVideoNombre] = useState('')
  const [lugar, setLugar] = useState('')
  const [notas, setNotas] = useState('')
  const [boxeadores, setBoxeadores] = useState([])
  const [cargandoVideo, setCargandoVideo] = useState(false)
  const [errores, setErrores] = useState({})

  const tieneElectron = !!window?.api?.dialogo?.abrirVideo

  useEffect(() => {
    if (isOpen) {
      // Cargar boxeadores activos
      db.boxeadores.toArray().then(list => {
        const activos = list.filter(b => !b.archivado)
        setBoxeadores(activos)
        if (activos.length > 0) {
          const rojo = activos[0]
          const azul = activos[1] || activos[0]
          setBoxeadorRojoNombre(rojo.nombre)
          setBoxeadorAzulNombre(azul.nombre)
          // Auto-generar nombre de sesión sugerido
          setNombreSesion(`${rojo.nombre} vs ${azul.nombre}`)
        }
      })
    }
  }, [isOpen])

  // Actualizar nombre sugerido cuando cambian los boxeadores
  useEffect(() => {
    if (boxeadorRojoNombre && boxeadorAzulNombre) {
      setNombreSesion(`${boxeadorRojoNombre} vs ${boxeadorAzulNombre}`)
    }
  }, [boxeadorRojoNombre, boxeadorAzulNombre])

  if (!isOpen) return null

  const seleccionarVideo = async () => {
    if (!tieneElectron) return
    setCargandoVideo(true)
    try {
      const ruta = await window.api.dialogo.abrirVideo()
      if (ruta) {
        // Intentar cargar y verificar la ruta
        const resultado = await window.api.video.cargarDesdeRuta(ruta)
        if (resultado.ok) {
          setVideoPath(ruta)
          setVideoNombre(resultado.nombre)
        } else {
          setVideoPath(ruta) // guardar la ruta de todas formas
          setVideoNombre(ruta.split(/[/\\]/).pop())
        }
      }
    } catch (err) {
      console.error('Error abriendo selector de video:', err)
    } finally {
      setCargandoVideo(false)
    }
  }

  const obtenerOCrearBoxeador = async (nombre, esquina) => {
    const nombreLimpio = nombre.trim()
    if (!nombreLimpio) return null

    const existente = boxeadores.find(b => b.nombre.toLowerCase() === nombreLimpio.toLowerCase())
    if (existente) return existente.id

    const nuevoId = await db.boxeadores.add({
      nombre: nombreLimpio,
      apodo: '',
      categoriaPeso: 'Mediano',
      estancia: 'Ortodoxo',
      foto: '',
      notas: `Creado automáticamente al registrar sesión en la esquina ${esquina}.`,
      createdAt: Date.now()
    })

    const list = await db.boxeadores.toArray()
    setBoxeadores(list.filter(b => !b.archivado))
    return nuevoId
  }

  const validar = () => {
    const errs = {}
    if (!boxeadorRojoNombre.trim()) errs.rojo = 'Requerido'
    if (!boxeadorAzulNombre.trim()) errs.azul = 'Requerido'
    setErrores(errs)
    return Object.keys(errs).length === 0
  }

  const guardar = async (e) => {
    e.preventDefault()
    if (!validar()) return

    try {
      const idRojo = await obtenerOCrearBoxeador(boxeadorRojoNombre, 'Roja')
      const idAzul = await obtenerOCrearBoxeador(boxeadorAzulNombre, 'Azul')

      const data = {
        nombre: nombreSesion.trim() || `${boxeadorRojoNombre} vs ${boxeadorAzulNombre}`,
        fecha,
        boxeadorRojoId: idRojo,
        boxeadorAzulId: idAzul,
        rounds: Number(rounds),
        tipo,
        lugar: lugar.trim(),
        notas: notas.trim(),
        videoPath: videoPath || '',
        videoNombre: videoNombre || '',
        sintesis: '',
        esBorrador: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }

      const newId = await db.sesiones.add(data)
      if (onCreated) {
        onCreated(newId)
      }
      // Reset form
      setNombreSesion('')
      setVideoPath('')
      setVideoNombre('')
      setLugar('')
      setNotas('')
      setErrores({})
      onClose()
    } catch (err) {
      console.error('Error al crear sesión:', err)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          style={estilos.overlay}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            style={estilos.modal}
            initial={{ scale: 0.94, opacity: 0, y: 24 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.94, opacity: 0, y: 24 }}
            transition={{ type: 'spring', damping: 28, stiffness: 380 }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div style={estilos.header}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: 'rgba(212,175,55,0.15)',
                  border: '1px solid rgba(212,175,55,0.45)',
                  boxShadow: '0 0 8px rgba(212,175,55,0.35)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  overflow: 'hidden',
                }}>
                  <img src="/assets/logo-small.png" alt="Logo" style={{ width: '70%', height: '70%', objectFit: 'contain' }} />
                </div>
                <div>
                  <h2 style={estilos.titulo}>Nueva Sesión de Análisis</h2>
                  <span style={{ fontSize: 11, color: 'var(--color-texto-muted)' }}>
                    Configurá la sesión antes de comenzar el análisis
                  </span>
                </div>
              </div>
              <button onClick={onClose} style={estilos.btnCerrar}><X size={18} /></button>
            </div>

            <form onSubmit={guardar} style={estilos.form}>

              {/* Nombre de la sesión */}
              <div style={estilos.campo}>
                <label style={estilos.label}>
                  <Tag size={10} style={{ display: 'inline', marginRight: 4 }} />
                  Nombre de la Sesión
                </label>
                <input
                  type="text"
                  value={nombreSesion}
                  onChange={e => setNombreSesion(e.target.value)}
                  style={estilos.input}
                  placeholder="Ej: Iván Daniele vs Marcelo Leveti — Pelea de revancha"
                />
              </div>

              {/* Boxeadores */}
              <div style={estilos.grid}>
                <div style={{ ...estilos.campo, flex: 1 }}>
                  <label style={{ ...estilos.label, color: 'var(--color-rojo-suave)' }}>Esquina Roja *</label>
                  <input
                    list="datalist-boxeadores-rojo"
                    value={boxeadorRojoNombre}
                    onChange={e => setBoxeadorRojoNombre(e.target.value)}
                    style={{
                      ...estilos.input,
                      borderLeft: '3px solid var(--color-rojo-suave)',
                      borderColor: errores.rojo ? 'var(--color-rojo-suave)' : 'var(--color-borde)',
                    }}
                    placeholder="Nombre del boxeador"
                    required
                  />
                  {errores.rojo && <span style={{ fontSize: 10, color: 'var(--color-rojo-suave)' }}>{errores.rojo}</span>}
                  <datalist id="datalist-boxeadores-rojo">
                    {boxeadores.map(b => <option key={b.id} value={b.nombre} />)}
                  </datalist>
                </div>
                <div style={{ ...estilos.campo, flex: 1 }}>
                  <label style={{ ...estilos.label, color: 'var(--color-azul-suave)' }}>Esquina Azul *</label>
                  <input
                    list="datalist-boxeadores-azul"
                    value={boxeadorAzulNombre}
                    onChange={e => setBoxeadorAzulNombre(e.target.value)}
                    style={{
                      ...estilos.input,
                      borderLeft: '3px solid var(--color-azul-suave)',
                      borderColor: errores.azul ? 'var(--color-azul-suave)' : 'var(--color-borde)',
                    }}
                    placeholder="Nombre del boxeador"
                    required
                  />
                  {errores.azul && <span style={{ fontSize: 10, color: 'var(--color-azul-suave)' }}>{errores.azul}</span>}
                  <datalist id="datalist-boxeadores-azul">
                    {boxeadores.map(b => <option key={b.id} value={b.nombre} />)}
                  </datalist>
                </div>
              </div>

              {/* Tipo / Rounds / Fecha */}
              <div style={estilos.grid}>
                <div style={{ ...estilos.campo, flex: 1.5 }}>
                  <label style={estilos.label}>Tipo de Combate</label>
                  <select value={tipo} onChange={e => setTipo(e.target.value)} style={estilos.select}>
                    <option value="Combate" style={{ background: '#1a1a1f', color: '#e0e0e0' }}>Combate Oficial</option>
                    <option value="Sparring" style={{ background: '#1a1a1f', color: '#e0e0e0' }}>Sparring</option>
                    <option value="Guanteo" style={{ background: '#1a1a1f', color: '#e0e0e0' }}>Guanteo</option>
                    <option value="Entrenamiento" style={{ background: '#1a1a1f', color: '#e0e0e0' }}>Entrenamiento Técnico</option>
                    <option value="Exhibicion" style={{ background: '#1a1a1f', color: '#e0e0e0' }}>Exhibición</option>
                    <option value="Campeonato" style={{ background: '#1a1a1f', color: '#e0e0e0' }}>Campeonato</option>
                  </select>
                </div>
                <div style={{ ...estilos.campo, flex: 0.8 }}>
                  <label style={estilos.label}>
                    <Hash size={10} style={{ display: 'inline', marginRight: 4 }} />
                    Rounds
                  </label>
                  <select value={rounds} onChange={e => setRounds(e.target.value)} style={estilos.select}>
                    {[1,2,3,4,5,6,8,10,12,15].map(r => (
                      <option key={r} value={r} style={{ background: '#1a1a1f', color: '#e0e0e0' }}>{r} {r === 1 ? 'Round' : 'Rounds'}</option>
                    ))}
                  </select>
                </div>
                <div style={{ ...estilos.campo, flex: 1 }}>
                  <label style={estilos.label}>
                    <Clock size={10} style={{ display: 'inline', marginRight: 4 }} />
                    Fecha
                  </label>
                  <input
                    type="date"
                    required
                    value={fecha}
                    onChange={e => setFecha(e.target.value)}
                    style={estilos.input}
                  />
                </div>
              </div>

              {/* Lugar */}
              <div style={estilos.campo}>
                <label style={estilos.label}>Lugar / Venue (opcional)</label>
                <input
                  type="text"
                  value={lugar}
                  onChange={e => setLugar(e.target.value)}
                  style={estilos.input}
                  placeholder="Ej: Luna Park, Buenos Aires"
                />
              </div>

              {/* Video */}
              <div style={estilos.campo}>
                <label style={estilos.label}>
                  <Video size={10} style={{ display: 'inline', marginRight: 4 }} />
                  Archivo de Video (opcional)
                </label>

                {/* Botón para seleccionar desde el explorador (solo Electron) */}
                {tieneElectron ? (
                  <div style={{ display: 'flex', gap: 10, alignItems: 'stretch' }}>
                    <button
                      type="button"
                      onClick={seleccionarVideo}
                      disabled={cargandoVideo}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '10px 16px',
                        background: videoPath
                          ? 'rgba(212,175,55,0.12)'
                          : 'rgba(255,255,255,0.06)',
                        border: videoPath
                          ? '1px solid rgba(212,175,55,0.5)'
                          : '1px solid var(--color-borde)',
                        borderRadius: 8,
                        color: videoPath ? 'var(--color-dorado)' : 'var(--color-texto-suave)',
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: cargandoVideo ? 'wait' : 'pointer',
                        fontFamily: 'inherit',
                        whiteSpace: 'nowrap',
                        flexShrink: 0,
                        transition: 'all 0.2s',
                      }}
                    >
                      <FolderOpen size={15} />
                      {cargandoVideo ? 'Cargando...' : videoNombre ? '✓ Video Seleccionado' : 'Explorar Archivos'}
                    </button>
                    <div style={{
                      flex: 1,
                      background: 'var(--color-superficie-2)',
                      border: '1px solid var(--color-borde)',
                      borderRadius: 8,
                      padding: '10px 12px',
                      fontSize: 11,
                      color: videoNombre ? 'var(--color-texto)' : 'var(--color-texto-muted)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      overflow: 'hidden',
                    }}>
                      {videoNombre ? (
                        <>
                          <Video size={13} color="var(--color-dorado)" />
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {videoNombre}
                          </span>
                        </>
                      ) : (
                        <span>Ningún archivo seleccionado</span>
                      )}
                    </div>
                  </div>
                ) : (
                  /* Fallback: input de texto para web/dev */
                  <div style={{ position: 'relative' }}>
                    <Video size={14} color="var(--color-texto-suave)" style={{ position: 'absolute', left: 12, top: 13 }} />
                    <input
                      type="text"
                      value={videoPath}
                      onChange={e => setVideoPath(e.target.value)}
                      style={{ ...estilos.input, paddingLeft: 36 }}
                      placeholder="Ej: C:/videos/pelea_ivan.mp4"
                    />
                  </div>
                )}

                <span style={{ fontSize: 11, color: 'var(--color-texto-muted)', lineHeight: 1.5 }}>
                  {videoPath
                    ? '✓ El video quedará vinculado a esta sesión. Podrás cargarlo al abrir el Editor Táctico.'
                    : 'Podés seleccionarlo ahora o cargarlo más tarde directamente en el Editor.'}
                </span>
              </div>

              {/* Notas */}
              <div style={estilos.campo}>
                <label style={estilos.label}>
                  <FileText size={10} style={{ display: 'inline', marginRight: 4 }} />
                  Notas de Pre-análisis (opcional)
                </label>
                <textarea
                  value={notas}
                  onChange={e => setNotas(e.target.value)}
                  rows={2}
                  style={{ ...estilos.input, resize: 'vertical', lineHeight: 1.5 }}
                  placeholder="Contexto, objetivos, aspectos a observar..."
                />
              </div>

              {/* Footer */}
              <div style={estilos.footer}>
                <button type="button" onClick={onClose} className="boton-secundario">
                  Cancelar
                </button>
                <button type="submit" className="boton-primario" style={{ gap: 8, display: 'flex', alignItems: 'center' }}>
                  Crear y Analizar
                  <span style={{ fontSize: 16 }}>→</span>
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

const estilos = {
  overlay: {
    position: 'fixed',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.82)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100000,
    padding: 16,
  },
  modal: {
    background: 'linear-gradient(135deg, #1a1a1f 0%, #111115 100%)',
    border: '1px solid rgba(212, 175, 55, 0.25)',
    borderRadius: 18,
    width: '100%',
    maxWidth: 600,
    maxHeight: '90vh',
    overflowY: 'auto',
    boxShadow: '0 40px 80px rgba(0,0,0,0.8), 0 0 60px rgba(212,175,55,0.06), inset 0 1px 0 rgba(255,255,255,0.06)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px 24px',
    borderBottom: '1px solid rgba(255,255,255,0.07)',
    position: 'sticky',
    top: 0,
    background: 'linear-gradient(135deg, #1a1a1f 0%, #111115 100%)',
    zIndex: 1,
    borderRadius: '18px 18px 0 0',
  },
  titulo: {
    fontSize: 17,
    fontWeight: 700,
    color: 'var(--color-texto)',
    margin: 0,
    letterSpacing: '-0.01em',
  },
  btnCerrar: {
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.1)',
    color: 'var(--color-texto-suave)',
    cursor: 'pointer',
    padding: 8,
    borderRadius: 8,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s',
  },
  form: {
    padding: '20px 24px 24px',
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  grid: {
    display: 'flex',
    gap: 12,
  },
  campo: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  label: {
    fontSize: 10,
    color: 'var(--color-texto-suave)',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
  },
  input: {
    width: '100%',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.1)',
    color: 'var(--color-texto)',
    padding: '11px 14px',
    borderRadius: 8,
    outline: 'none',
    fontSize: 13,
    fontFamily: 'inherit',
    transition: 'border-color 0.2s',
    boxSizing: 'border-box',
  },
  select: {
    width: '100%',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.1)',
    color: 'var(--color-texto)',
    padding: '11px 14px',
    borderRadius: 8,
    outline: 'none',
    fontSize: 13,
    fontFamily: 'inherit',
    transition: 'border-color 0.2s',
    cursor: 'pointer',
  },
  footer: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 10,
    paddingTop: 4,
    borderTop: '1px solid rgba(255,255,255,0.07)',
    marginTop: 4,
  }
}
