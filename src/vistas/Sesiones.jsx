import { useState, useMemo } from 'react'
import { Search, Eye, Play, Plus, MonitorPlay, Calendar as CalendarIcon, List, ChevronLeft, ChevronRight, Activity } from 'lucide-react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../servicios/db'
import PanelAnalisis from '../components/ui/PanelAnalisis'
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts'
import { useNavigate } from 'react-router-dom'

export default function Sesiones() {
  const navigate = useNavigate()
  const [vistaActiva, setVistaActiva] = useState('calendario') // 'calendario' | 'lista' | 'comparativa'
  const [panelAbierto, setPanelAbierto] = useState(false)
  const [sesionSeleccionada, setSesionSeleccionada] = useState(null)
  
  const [fechaCalendario, setFechaCalendario] = useState(new Date())
  const [fechaSeleccionada, setFechaSeleccionada] = useState(new Date().toISOString().split('T')[0])
  const [busqueda, setBusqueda] = useState('')

  const sesionesRaw = useLiveQuery(() => db.sesiones.toArray()) || []
  const boxeadores = useLiveQuery(() => db.boxeadores.toArray()) || []

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
       const sesionesDia = sesionesDb.filter(s => s.fecha === dateStr)
       dias.push({ fecha: d, dateStr, sesiones: sesionesDia })
    }
    return dias
  }, [fechaCalendario, sesionesDb])

  const mesNombres = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

  const prevMes = () => setFechaCalendario(new Date(fechaCalendario.getFullYear(), fechaCalendario.getMonth() - 1, 1))
  const nextMes = () => setFechaCalendario(new Date(fechaCalendario.getFullYear(), fechaCalendario.getMonth() + 1, 1))

  const sesionesDelDia = sesionesDb.filter(s => s.fecha === fechaSeleccionada && (s.boxA.toLowerCase().includes(busqueda.toLowerCase()) || s.boxB.toLowerCase().includes(busqueda.toLowerCase()) || s.tipo.toLowerCase().includes(busqueda.toLowerCase())))
  const sesionesLista = sesionesDb.filter(s => s.boxA.toLowerCase().includes(busqueda.toLowerCase()) || s.boxB.toLowerCase().includes(busqueda.toLowerCase()) || s.fecha.includes(busqueda))

  const abrirPanel = (id) => {
    setSesionSeleccionada(id)
    setPanelAbierto(true)
  }

  return (
    <div style={estilos.layout}>
      <div style={estilos.principal}>
        <header style={estilos.header}>
          <div>
            <h1 style={estilos.tituloPagina}>GESTIÓN DE SESIONES</h1>
            <p style={{ margin: 0, fontSize: 14, color: 'var(--color-texto-suave)' }}>Calendario táctico e historial completo</p>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={estilos.busqueda}>
              <Search size={18} color="var(--color-texto-suave)" />
              <input type="text" placeholder="Búsqueda profunda..." value={busqueda} onChange={e => setBusqueda(e.target.value)} style={estilos.inputBusqueda} />
            </div>
            <button className="boton-primario" style={{ fontSize: 13, padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 6 }}>
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
                            <div key={s.id} style={{ width: 8, height: 8, borderRadius: '50%', background: s.tipo.includes('Sparring') ? 'var(--color-rojo-suave)' : 'var(--color-azul-suave)' }} title={s.tipo} />
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
          <div className="tarjeta" style={{ height: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-texto-suave)' }}>
            <div style={{ textAlign: 'center' }}>
              <RadarChart width={400} height={400} cx="50%" cy="50%" outerRadius="70%" data={[
                { subject: 'Velocidad', A: 80, B: 60, fullMark: 100 },
                { subject: 'Potencia', A: 90, B: 85, fullMark: 100 },
                { subject: 'Precisión', A: 70, B: 90, fullMark: 100 },
                { subject: 'Defensa', A: 60, B: 75, fullMark: 100 },
                { subject: 'Resistencia', A: 85, B: 70, fullMark: 100 }
              ]}>
                <PolarGrid stroke="var(--color-borde)" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--color-texto)', fontSize: 13 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                <Radar name="Boxeador A" dataKey="A" stroke="var(--color-rojo)" fill="var(--color-rojo)" fillOpacity={0.4} />
                <Radar name="Boxeador B" dataKey="B" stroke="var(--color-azul)" fill="var(--color-azul)" fillOpacity={0.4} />
              </RadarChart>
              <p style={{ marginTop: 20 }}>Comparativa Simulada: Funcionalidad en desarrollo para comparar cualquier par de boxeadores del roster.</p>
            </div>
          </div>
        )}
      </div>

      {panelAbierto && <PanelAnalisis isOpen={panelAbierto} onClose={() => setPanelAbierto(false)} sesionId={sesionSeleccionada} />}
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
