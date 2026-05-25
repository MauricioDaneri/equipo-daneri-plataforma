import { useState, useMemo, useEffect } from 'react'
import { Search, Eye, Play, Plus, MonitorPlay, Calendar as CalendarIcon, List, ChevronLeft, ChevronRight, Activity, Users, Trash2, Upload, Share2 } from 'lucide-react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../servicios/db'
import PanelAnalisis from '../components/ui/PanelAnalisis'
import ModalNuevaSesion from '../components/ui/ModalNuevaSesion'
import ModalConfirmacion from '../components/ui/ModalConfirmacion'
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts'
import { useNavigate, useLocation } from 'react-router-dom'
import { useModal } from '../context/ModalContext'
import { exportarSesionAShowfile, importarShowfileEnEquipo } from '../utils/showfile'

export default function Sesiones() {
  const navigate = useNavigate()
  const location = useLocation()
  const { mostrarConfirmacion, mostrarAlerta } = useModal()
  const [vistaActiva, setVistaActiva] = useState('calendario') // 'calendario' | 'lista' | 'comparativa'
  const [panelAbierto, setPanelAbierto] = useState(false)
  const [modalNuevaSesionAbierto, setModalNuevaSesionAbierto] = useState(false)
  const [sesionSeleccionada, setSesionSeleccionada] = useState(null)
  const [sesionAEliminar, setSesionAEliminar] = useState(null)
  const [importando, setImportando] = useState(false)

  const handleExportarShowfile = async (sesionId) => {
    try {
      await exportarSesionAShowfile(sesionId)
      mostrarAlerta({
        titulo: "Showfile Exportado",
        mensaje: "El showfile .daneri se ha generado y descargado con éxito. Podés llevarlo a otra PC en un pendrive.",
        tipo: "exito"
      })
    } catch (error) {
      console.error('[Showfile Export] Error:', error)
      mostrarAlerta({
        titulo: "Error al Exportar",
        mensaje: "Hubo un problema al exportar el Showfile de la sesión.",
        tipo: "peligro"
      })
    }
  }

  const handleImportarShowfile = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    setImportando(true)
    try {
      const reader = new FileReader()
      reader.onload = async (evt) => {
        try {
          const fileContent = evt.target.result

          // Elegir video local
          let videoPath = ''
          const tieneElectron = !!window?.api?.dialogo?.abrirVideo
          if (tieneElectron) {
            await mostrarAlerta({
              titulo: "Vincular Video Local",
              mensaje: "A continuación, seleccioná el archivo de video local correspondiente para vincular el análisis importado.",
              tipo: "info"
            })
            videoPath = await window.api.dialogo.abrirVideo()
          } else {
            videoPath = prompt("Ingresá la ruta del video local para vincular con este showfile:", "C:\\videos\\combate.mp4")
          }

          if (!videoPath) {
            setImportando(false)
            return // Cancelado
          }

          const newId = await importarShowfileEnEquipo(fileContent, videoPath)
          
          await mostrarAlerta({
            titulo: "Importación Exitosa",
            mensaje: "¡El combate y todas sus marcas y dibujos vectoriales se han importado correctamente!",
            tipo: "exito"
          })
          
          // Redirigir al editor táctico para trabajar inmediatamente
          navigate(`/editor/${newId}`)
        } catch (err) {
          console.error('[Showfile Import] Error procesando archivo:', err)
          mostrarAlerta({
            titulo: "Error de Importación",
            mensaje: "No se pudo leer el archivo .daneri. Asegúrate de elegir un archivo Showfile válido.",
            tipo: "peligro"
          })
        }
      }
      reader.readAsText(file)
    } catch (err) {
      console.error('[Showfile Import] Error general:', err)
    } finally {
      setImportando(false)
      e.target.value = ''
    }
  }
  
  const [fechaCalendario, setFechaCalendario] = useState(new Date())
  const [fechaSeleccionada, setFechaSeleccionada] = useState(new Date().toISOString().split('T')[0])
  const [busqueda, setBusqueda] = useState('')

  const [boxeadorAId, setBoxeadorAId] = useState('')
  const [boxeadorBId, setBoxeadorBId] = useState('')

  useEffect(() => {
    if (location.state?.vista) {
      setVistaActiva(location.state.vista)
    }
    if (location.state?.sesionId) {
      abrirPanel(location.state.sesionId)
    }
    if (location.state) {
      navigate(location.pathname, { replace: true, state: null })
    }
  }, [location.state])

  const sesionesRaw = useLiveQuery(() => db.sesiones.toArray())
  const boxeadores = useLiveQuery(() => db.boxeadores.toArray())
  const eventosDb = useLiveQuery(() => db.eventos.toArray())

  if (sesionesRaw === undefined || boxeadores === undefined || eventosDb === undefined) {
    return (
      <div style={{
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--color-fondo)',
        color: 'var(--color-dorado)',
        fontSize: 13,
        textTransform: 'uppercase',
        letterSpacing: '0.15em'
      }}>
        Cargando Sesiones...
      </div>
    );
  }

  useEffect(() => {
    if (boxeadores.length > 0) {
      const activos = boxeadores.filter(b => !b.archivado)
      if (activos.length > 0) {
        if (!boxeadorAId) setBoxeadorAId(activos[0].id.toString())
        if (!boxeadorBId) setBoxeadorBId((activos[1] || activos[0]).id.toString())
      }
    }
  }, [boxeadores])

  // Lógica Comparativa Dual Real
  const statsComparativas = useMemo(() => {
    if (!boxeadorAId || !boxeadorBId) return null

    const calculateBoxerStats = (boxerId) => {
      const susSesiones = sesionesRaw.filter(s => s.boxeadorRojoId === boxerId || s.boxeadorAzulId === boxerId)
      const numSesiones = susSesiones.length

      let conectados = 0
      let errados = 0
      let jabs = 0
      let crosses = 0
      let ganchos = 0
      let uppercuts = 0
      let esquivas = 0
      let bloqueos = 0
      let fintas = 0
      let pivoteos = 0

      susSesiones.forEach(s => {
        const miEsquina = s.boxeadorRojoId === boxerId ? 'roja' : 'azul'
        const misEventos = eventosDb.filter(e => e.sesionId === s.id && e.esquina === miEsquina)

        misEventos.forEach(e => {
          if (e.tipo === 'Golpe Conectado') conectados++
          if (e.tipo === 'Golpe Errado') errados++
          if (e.tipo === 'Jab') jabs++
          if (e.tipo === 'Cross') crosses++
          if (e.tipo === 'Gancho') ganchos++
          if (e.tipo === 'Uppercut') uppercuts++
          if (e.tipo === 'Esquiva') esquivas++
          if (e.tipo === 'Bloqueo') bloqueos++
          if (e.tipo === 'Finta') fintas++
          if (e.tipo === 'Pivoteo') pivoteos++
        })
      })

      const totalPunches = conectados + errados
      const precision = totalPunches > 0 ? Math.round((conectados / totalPunches) * 100) : 0
      const volumeScore = numSesiones > 0 ? Math.min(100, Math.round((totalPunches / numSesiones) * 0.8)) : 0
      const defense = numSesiones > 0 ? Math.min(100, Math.round(((bloqueos + esquivas) / numSesiones) * 3)) : 0
      
      const punchTypes = [jabs, crosses, ganchos, uppercuts].filter(c => c > 0).length
      const variety = punchTypes * 25

      const movement = numSesiones > 0 ? Math.min(100, Math.round(((pivoteos + fintas) / numSesiones) * 5)) : 0

      return {
        nombre: boxeadores.find(b => b.id === boxerId)?.nombre || 'Desconocido',
        precision,
        volume: numSesiones > 0 ? Math.round(totalPunches / numSesiones) : 0,
        volumeScore,
        defense,
        variety,
        movement,
        numSesiones,
        conectados,
        totalPunches
      }
    }

    const statsA = calculateBoxerStats(Number(boxeadorAId))
    const statsB = calculateBoxerStats(Number(boxeadorBId))

    const radarData = [
      { subject: 'Precisión %', A: statsA.precision, B: statsB.precision, fullMark: 100 },
      { subject: 'Volumen', A: statsA.volumeScore, B: statsB.volumeScore, fullMark: 100 },
      { subject: 'Defensa %', A: statsA.defense, B: statsB.defense, fullMark: 100 },
      { subject: 'Variedad Táctica', A: statsA.variety, B: statsB.variety, fullMark: 100 },
      { subject: 'Movilidad', A: statsA.movement, B: statsB.movement, fullMark: 100 }
    ]

    return { statsA, statsB, radarData }
  }, [boxeadorAId, boxeadorBId, sesionesRaw, eventosDb, boxeadores])

  const sesionesDb = useMemo(() => {
    return sesionesRaw.map(s => {
      const rojo = boxeadores.find(b => b.id === s.boxeadorRojoId)
      const azul = boxeadores.find(b => b.id === s.boxeadorAzulId)
      return {
        ...s,
        boxA: rojo?.nombre || 'Desconocido',
        boxB: azul?.nombre || 'Desconocido',
        fotoRojo: rojo?.foto || null,
        fotoAzul: azul?.foto || null,
      }
    }).reverse()
  }, [sesionesRaw, boxeadores])

  // Lógica de Calendario
  const diasMes = useMemo(() => {
    const year = fechaCalendario.getFullYear()
    const month = fechaCalendario.getMonth()
    const diasEnMes = new Date(year, month + 1, 0).getDate()
    const primerDia = new Date(year, month, 1).getDay()
    const offset = primerDia === 0 ? 6 : primerDia - 1 // Lunes = 0
    
    const dias = []
    for(let i = 0; i < offset; i++) dias.push(null)
    for(let i = 1; i <= diasEnMes; i++) {
       const d = new Date(year, month, i)
       const dateStr = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
       const sesionesDia = sesionesDb.filter(s => {
          let sFecha = s.fecha || '';
          if (sFecha.includes('/')) {
            const partes = sFecha.split('/');
            if (partes.length === 3) {
              sFecha = `${partes[2]}-${partes[1].padStart(2, '0')}-${partes[0].padStart(2, '0')}`;
            }
          }
          return sFecha === dateStr;
        })
       dias.push({ fecha: d, dateStr, sesiones: sesionesDia })
    }
    return dias
  }, [fechaCalendario, sesionesDb])

  const mesNombres = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

  const prevMes = () => setFechaCalendario(new Date(fechaCalendario.getFullYear(), fechaCalendario.getMonth() - 1, 1))
  const nextMes = () => setFechaCalendario(new Date(fechaCalendario.getFullYear(), fechaCalendario.getMonth() + 1, 1))

  const sesionesDelDia = sesionesDb.filter(s => {
    let sFecha = s.fecha || '';
    if (sFecha.includes('/')) {
      const partes = sFecha.split('/');
      if (partes.length === 3) {
        sFecha = `${partes[2]}-${partes[1].padStart(2, '0')}-${partes[0].padStart(2, '0')}`;
      }
    }
    return sFecha === fechaSeleccionada && 
    (
      (s.boxA || '').toLowerCase().includes(busqueda.toLowerCase()) || 
      (s.boxB || '').toLowerCase().includes(busqueda.toLowerCase()) || 
      (s.tipo || '').toLowerCase().includes(busqueda.toLowerCase())
    )
  })
  
  const sesionesLista = sesionesDb.filter(s => 
    (s.boxA || '').toLowerCase().includes(busqueda.toLowerCase()) || 
    (s.boxB || '').toLowerCase().includes(busqueda.toLowerCase()) || 
    (s.fecha || '').includes(busqueda)
  )

  const abrirPanel = (id) => {
    setSesionSeleccionada(id)
    setPanelAbierto(true)
  }

  const eliminarSesion = async (id) => {
    setSesionAEliminar(id)
  }

  const confirmarEliminacion = async () => {
    if (!sesionAEliminar) return
    try {
      await db.sesiones.delete(sesionAEliminar)
      const eventosToDelete = await db.eventos.where('sesionId').equals(sesionAEliminar).toArray()
      if (eventosToDelete.length > 0) {
        const ids = eventosToDelete.map(e => e.id)
        await db.eventos.bulkDelete(ids)
      }
    } catch (error) {
      console.error('Error eliminando sesión:', error)
    } finally {
      setSesionAEliminar(null)
    }
  }

  return (
    <div style={estilos.layout}>
      <div style={estilos.principal}>
        <header style={estilos.header}>
          <div>
            <h1 style={estilos.tituloPagina}>GESTIÓN DE SESIONES</h1>
            <p style={{ margin: 0, fontSize: 14, color: 'var(--color-texto-suave)' }}>Calendario táctico e historial completo</p>
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <div style={estilos.busqueda}>
              <Search size={18} color="var(--color-texto-suave)" />
              <input type="text" placeholder="Búsqueda profunda..." value={busqueda} onChange={e => setBusqueda(e.target.value)} style={estilos.inputBusqueda} />
            </div>
            <label className="boton-secundario" style={{ fontSize: 13, padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', margin: 0, height: '38px', boxSizing: 'border-box' }}>
              <Upload size={16} /> Importar Showfile
              <input type="file" accept=".daneri" onChange={handleImportarShowfile} style={{ display: 'none' }} disabled={importando} />
            </label>
            <button className="boton-primario" onClick={() => setModalNuevaSesionAbierto(true)} style={{ fontSize: 13, padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 6, height: '38px', boxSizing: 'border-box' }}>
              <Plus size={16} /> Nueva Sesión
            </button>
          </div>
        </header>

        {/* Tabs */}
        <div style={estilos.tabsContainer}>
          <button style={vistaActiva === 'calendario' ? estilos.tabActivo : estilos.tabInactivo} onClick={() => setVistaActiva('calendario')}>
            <CalendarIcon size={16} /> CALENDARIO
          </button>
          <button style={vistaActiva === 'lista' ? estilos.tabActivo : estilos.tabInactivo} onClick={() => setVistaActiva('lista')}>
            <List size={16} /> LISTA HISTÓRICA
          </button>
          <button style={vistaActiva === 'comparativa' ? estilos.tabActivo : estilos.tabInactivo} onClick={() => setVistaActiva('comparativa')}>
            <Activity size={16} /> COMPARATIVA DUAL
          </button>
        </div>

        {/* VISTA CALENDARIO */}
        {vistaActiva === 'calendario' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: 24, height: 'calc(100% - 130px)' }}>
            <div className="tarjeta" style={{ display: 'flex', flexDirection: 'column', padding: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <h2 style={{ margin: 0, fontSize: 18, color: 'var(--color-dorado)' }}>{mesNombres[fechaCalendario.getMonth()]} {fechaCalendario.getFullYear()}</h2>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={prevMes} style={estilos.btnNav}><ChevronLeft size={20}/></button>
                  <button onClick={nextMes} style={estilos.btnNav}><ChevronRight size={20}/></button>
                </div>
              </div>
              
              <div style={estilos.gridCalendario}>
                {['LUN', 'MAR', 'MIE', 'JUE', 'VIE', 'SAB', 'DOM'].map(dia => (
                  <div key={dia} style={estilos.diaHeader}>{dia}</div>
                ))}
                
                {diasMes.map((dia, index) => {
                  if (!dia) return <div key={`empty-${index}`} style={estilos.celdaVacia} />
                  const isSelected = dia.dateStr === fechaSeleccionada
                  const hasSessions = dia.sesiones.length > 0
                  
                  return (
                    <div 
                      key={dia.dateStr} 
                      style={{
                        ...estilos.celdaDia, 
                        borderColor: isSelected ? 'var(--color-dorado)' : 'var(--color-borde)',
                        background: isSelected ? 'rgba(212,175,55,0.05)' : 'var(--color-superficie-2)'
                      }}
                      onClick={() => setFechaSeleccionada(dia.dateStr)}
                    >
                      <span style={{ fontSize: 14, fontWeight: isSelected ? 700 : 500, color: isSelected ? 'var(--color-dorado)' : 'var(--color-texto)' }}>{dia.fecha.getDate()}</span>
                      {hasSessions && (
                        <div style={{ display: 'flex', gap: 4, marginTop: 8, flexWrap: 'wrap' }}>
                          {dia.sesiones.map(s => (
                            <div key={s.id} style={{ width: 8, height: 8, borderRadius: '50%', background: (s.tipo || '').includes('Sparring') ? 'var(--color-rojo-suave)' : 'var(--color-azul-suave)' }} title={s.tipo || 'Sin tipo'} />
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* SIDEBAR DEL DÍA SELECCIONADO */}
            <div className="tarjeta" style={{ padding: 24, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
              <h3 style={{ margin: '0 0 24px 0', fontSize: 14, color: 'var(--color-texto-suave)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Eventos del {fechaSeleccionada.split('-').reverse().join('/')}
              </h3>
              
              {sesionesDelDia.length === 0 ? (
                <div style={{ color: 'var(--color-texto-suave)', textAlign: 'center', marginTop: 40, fontSize: 13 }}>No hay sesiones registradas en este día.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {sesionesDelDia.map(s => (
                    <div key={s.id} style={estilos.tarjetaSesionDia}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                        <span style={{ fontSize: 11, background: 'rgba(255,255,255,0.1)', padding: '4px 8px', borderRadius: 4, fontWeight: 600 }}>{s.tipo}</span>
                        <span style={{ fontSize: 11, color: 'var(--color-texto-suave)' }}>{s.rounds} Rounds</span>
                      </div>
                      
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                        <div style={{ textAlign: 'center', flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 700 }}>{s.boxA}</div>
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--color-texto-suave)', padding: '0 8px' }}>VS</div>
                        <div style={{ textAlign: 'center', flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 700 }}>{s.boxB}</div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => abrirPanel(s.id)} style={{...estilos.btnMiniAccion, flex: 1}}><Eye size={14}/> Análisis</button>
                        <button onClick={() => navigate(`/editor/${s.id}`)} style={{...estilos.btnMiniAccion, flex: 1, color: 'var(--color-dorado)'}}><Play size={14}/> Táctico</button>
                        <button onClick={() => handleExportarShowfile(s.id)} style={{...estilos.btnMiniAccion, flex: '0 0 auto', color: 'var(--color-dorado)'}} title="Exportar Showfile"><Share2 size={14}/></button>
                        <button onClick={() => eliminarSesion(s.id)} style={{...estilos.btnMiniAccion, flex: '0 0 auto', color: 'var(--color-rojo-suave)'}} title="Eliminar"><Trash2 size={14}/></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* VISTA LISTA */}
        {vistaActiva === 'lista' && (
          <div className="tarjeta" style={{ padding: 0, overflow: 'hidden' }}>
            <table style={estilos.tabla}>
              <thead>
                <tr>
                  <th style={estilos.th}>FECHA</th>
                  <th style={estilos.th}>TIPO</th>
                  <th style={estilos.th}>ENCUENTRO</th>
                  <th style={estilos.th}>SÍNTESIS</th>
                  <th style={estilos.th}>ACCIONES</th>
                </tr>
              </thead>
              <tbody>
                {sesionesLista.length === 0 && <tr><td colSpan={5} style={{textAlign: 'center', padding: 40, color: 'var(--color-texto-suave)'}}>Sin resultados.</td></tr>}
                {sesionesLista.map(s => (
                  <tr key={s.id} style={estilos.tr}>
                    <td style={estilos.td}>{s.fecha}</td>
                    <td style={estilos.td}><span style={estilos.badge}>{s.tipo}</span></td>
                    <td style={{...estilos.td, fontWeight: 600}}>{s.boxA} <span style={{color: 'var(--color-texto-suave)', margin: '0 8px', fontWeight: 400}}>vs</span> {s.boxB}</td>
                    <td style={{...estilos.td, color: 'var(--color-texto-suave)', maxWidth: 250, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>{s.sintesis || 'Sin síntesis'}</td>
                    <td style={estilos.td}>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => abrirPanel(s.id)} style={estilos.btnAccionList} title="Ver Análisis"><Eye size={16} /></button>
                        <button onClick={() => navigate(`/editor/${s.id}`)} style={{...estilos.btnAccionList, color: 'var(--color-dorado)'}} title="Editor Táctico"><Play size={16} /></button>
                        <button onClick={() => handleExportarShowfile(s.id)} style={{...estilos.btnAccionList, color: 'var(--color-dorado)'}} title="Exportar Showfile (.daneri)"><Share2 size={16} /></button>
                        <button onClick={() => eliminarSesion(s.id)} style={{...estilos.btnAccionList, color: 'var(--color-rojo-suave)'}} title="Eliminar"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* VISTA COMPARATIVA */}
        {vistaActiva === 'comparativa' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24, height: 'calc(100% - 130px)' }}>
            <div className="tarjeta" style={{ display: 'flex', flexDirection: 'column', gap: 20, padding: 24, justifyContent: 'center' }}>
              <h2 style={{ margin: 0, fontSize: 16, color: 'var(--color-dorado)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Selección de Atletas
              </h2>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 12, color: 'var(--color-texto-suave)', fontWeight: 600 }}>BOXEADOR ROJO (A)</label>
                  <select 
                    value={boxeadorAId} 
                    onChange={e => setBoxeadorAId(e.target.value)} 
                    style={{
                      background: 'var(--color-superficie-2)',
                      border: '1px solid var(--color-borde)',
                      borderLeft: '4px solid var(--color-rojo-suave)',
                      color: 'var(--color-texto)',
                      padding: 10,
                      borderRadius: 6,
                      outline: 'none',
                      fontFamily: 'inherit'
                    }}
                  >
                    {boxeadores.filter(b => !b.archivado).map(b => (
                      <option key={b.id} value={b.id}>{b.nombre}</option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 12, color: 'var(--color-texto-suave)', fontWeight: 600 }}>BOXEADOR AZUL (B)</label>
                  <select 
                    value={boxeadorBId} 
                    onChange={e => setBoxeadorBId(e.target.value)} 
                    style={{
                      background: 'var(--color-superficie-2)',
                      border: '1px solid var(--color-borde)',
                      borderLeft: '4px solid var(--color-azul-suave)',
                      color: 'var(--color-texto)',
                      padding: 10,
                      borderRadius: 6,
                      outline: 'none',
                      fontFamily: 'inherit'
                    }}
                  >
                    {boxeadores.filter(b => !b.archivado).map(b => (
                      <option key={b.id} value={b.id}>{b.nombre}</option>
                    ))}
                  </select>
                </div>
              </div>

              {statsComparativas && (
                <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ borderBottom: '1px solid var(--color-borde)', paddingBottom: 10 }}>
                    <div style={{ fontSize: 12, color: 'var(--color-texto-suave)', fontWeight: 500 }}>SESIONES COMPARADAS</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-rojo-suave)' }}>{statsComparativas.statsA.nombre}: {statsComparativas.statsA.numSesiones}</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-azul-suave)' }}>{statsComparativas.statsB.nombre}: {statsComparativas.statsB.numSesiones}</span>
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: 12, color: 'var(--color-texto-suave)', fontWeight: 500, marginBottom: 6 }}>PRECISIÓN DE GOLPEO</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 12, color: 'var(--color-rojo-suave)', fontWeight: 700, width: 35, textAlign: 'right' }}>{statsComparativas.statsA.precision}%</span>
                      <div style={{ flex: 1, height: 6, background: 'var(--color-borde)', borderRadius: 3, display: 'flex', overflow: 'hidden' }}>
                        <div style={{ width: `${statsComparativas.statsA.precision}%`, background: 'var(--color-rojo-suave)' }} />
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6 }}>
                      <span style={{ fontSize: 12, color: 'var(--color-azul-suave)', fontWeight: 700, width: 35, textAlign: 'right' }}>{statsComparativas.statsB.precision}%</span>
                      <div style={{ flex: 1, height: 6, background: 'var(--color-borde)', borderRadius: 3, display: 'flex', overflow: 'hidden' }}>
                        <div style={{ width: `${statsComparativas.statsB.precision}%`, background: 'var(--color-azul-suave)' }} />
                      </div>
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: 12, color: 'var(--color-texto-suave)', fontWeight: 500, marginBottom: 6 }}>VOLUMEN PROMEDIO DE GOLPES</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                      <span style={{ color: 'var(--color-rojo-suave)' }}>{statsComparativas.statsA.volume} golpes/pelea</span>
                      <span style={{ color: 'var(--color-azul-suave)' }}>{statsComparativas.statsB.volume} golpes/pelea</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="tarjeta" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 12 }}>
              {statsComparativas ? (
                <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <h3 style={{ fontSize: 14, color: 'var(--color-texto-suave)', marginBottom: 10, textTransform: 'uppercase' }}>Comparativa de Rendimiento</h3>
                  <div style={{ width: '100%', height: 320 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius="75%" data={statsComparativas.radarData}>
                        <PolarGrid stroke="var(--color-borde)" />
                        <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--color-texto)', fontSize: 11 }} />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                        <Radar name={statsComparativas.statsA.nombre} dataKey="A" stroke="var(--color-rojo-suave)" fill="var(--color-rojo-suave)" fillOpacity={0.25} />
                        <Radar name={statsComparativas.statsB.nombre} dataKey="B" stroke="var(--color-azul-suave)" fill="var(--color-azul-suave)" fillOpacity={0.25} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                  <div style={{ display: 'flex', gap: 24, marginTop: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 12, height: 12, borderRadius: 3, background: 'var(--color-rojo-suave)' }} />
                      <span style={{ fontSize: 12, color: 'var(--color-texto)' }}>{statsComparativas.statsA.nombre}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 12, height: 12, borderRadius: 3, background: 'var(--color-azul-suave)' }} />
                      <span style={{ fontSize: 12, color: 'var(--color-texto)' }}>{statsComparativas.statsB.nombre}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ color: 'var(--color-texto-suave)' }}>Por favor selecciona boxeadores para comparar.</div>
              )}
            </div>
          </div>
        )}
      </div>

      {panelAbierto && <PanelAnalisis isOpen={panelAbierto} onClose={() => setPanelAbierto(false)} sesionId={sesionSeleccionada} />}
      <ModalNuevaSesion 
        isOpen={modalNuevaSesionAbierto} 
        onClose={() => setModalNuevaSesionAbierto(false)} 
        onCreated={(newId) => {
          navigate(`/editor/${newId}`)
        }}
      />
      <ModalConfirmacion 
        isOpen={!!sesionAEliminar}
        titulo="Eliminar Sesión"
        mensaje="¿Estás seguro de que querés eliminar esta sesión permanentemente? Se borrarán también todos los eventos tácticos registrados."
        textoConfirmar="Eliminar"
        tipo="peligro"
        onConfirm={confirmarEliminacion}
        onCancel={() => setSesionAEliminar(null)}
      />
    </div>
  )
}

const estilos = {
  layout: { display: 'flex', height: '100%', overflow: 'hidden' },
  principal: { flex: 1, padding: '32px 40px', display: 'flex', flexDirection: 'column', overflowY: 'auto' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  tituloPagina: { fontSize: 24, fontWeight: 700, color: 'var(--color-texto)', textTransform: 'uppercase', letterSpacing: '-0.02em', margin: '0 0 4px 0' },
  busqueda: { display: 'flex', alignItems: 'center', gap: 12, background: 'var(--color-superficie-2)', border: '1px solid var(--color-borde)', borderRadius: 24, padding: '10px 16px', width: 300 },
  inputBusqueda: { background: 'transparent', border: 'none', color: 'var(--color-texto)', fontSize: 13, outline: 'none', width: '100%' },
  
  tabsContainer: { display: 'flex', gap: 32, borderBottom: '1px solid var(--color-borde)', marginBottom: 24 },
  tabActivo: { background: 'transparent', border: 'none', borderBottom: '2px solid var(--color-dorado)', color: 'var(--color-dorado)', padding: '0 0 12px 0', fontSize: 12, fontWeight: 600, cursor: 'pointer', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: 8 },
  tabInactivo: { background: 'transparent', border: 'none', borderBottom: '2px solid transparent', color: 'var(--color-texto-suave)', padding: '0 0 12px 0', fontSize: 12, fontWeight: 600, cursor: 'pointer', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: 8 },
  
  btnNav: { background: 'var(--color-superficie-2)', border: '1px solid var(--color-borde)', color: 'var(--color-texto)', borderRadius: 8, padding: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  gridCalendario: { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8, flex: 1 },
  diaHeader: { textAlign: 'center', fontSize: 11, fontWeight: 600, color: 'var(--color-texto-suave)', paddingBottom: 8 },
  celdaVacia: { background: 'transparent' },
  celdaDia: { borderRadius: 8, padding: 12, border: '1px solid var(--color-borde)', cursor: 'pointer', minHeight: 80, transition: 'all 0.2s' },
  
  tarjetaSesionDia: { background: 'var(--color-superficie-2)', borderRadius: 12, padding: 16, border: '1px solid var(--color-borde)' },
  btnMiniAccion: { background: 'rgba(255,255,255,0.05)', border: 'none', color: 'var(--color-texto)', borderRadius: 6, padding: '8px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 },
  
  tabla: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '16px 24px', fontSize: 11, fontWeight: 600, color: 'var(--color-texto-suave)', letterSpacing: '0.05em', borderBottom: '1px solid var(--color-borde)', background: 'var(--color-superficie-2)' },
  tr: { borderBottom: '1px solid var(--color-borde)', transition: 'background 0.2s' },
  td: { padding: '16px 24px', fontSize: 14, color: 'var(--color-texto)' },
  badge: { background: 'rgba(255,255,255,0.1)', padding: '4px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600 },
  btnAccionList: { background: 'var(--color-superficie-2)', border: '1px solid var(--color-borde)', borderRadius: 6, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-texto)', cursor: 'pointer' }
}
