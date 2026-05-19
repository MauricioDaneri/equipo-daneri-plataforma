import { useState, useMemo } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, AreaChart, Area
} from 'recharts'
import { Users, CalendarDays, Target, Settings, Plus, Edit2, Trash2, Search, PlayCircle, FileText, ArrowRight, Activity, TrendingUp } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../servicios/db'
import ModalBoxeador from '../components/ui/ModalBoxeador'

export default function Inicio() {
  const navigate = useNavigate()
  const [modalAbierto, setModalAbierto] = useState(false)
  const [boxeadorAEditar, setBoxeadorAEditar] = useState(null)
  const [busqueda, setBusqueda] = useState('')
  const [filtroTiempo, setFiltroTiempo] = useState('todo') // 'todo' | 'mes' | 'semana'
  
  const boxeadoresDb = useLiveQuery(() => db.boxeadores.toArray()) || []
  const sesionesDb = useLiveQuery(() => db.sesiones.orderBy('fecha').reverse().toArray()) || []
  const eventosDb = useLiveQuery(() => db.eventos.toArray()) || []
  
  // Total dinámico
  const totalBoxeadores = boxeadoresDb.length
  const totalSesiones = sesionesDb.length

  // --- Procesamiento de Datos Reales ---
  const { ranking, boxeadoresFiltrados, promedioEficaciaGym, actividadReciente, volumenGolpes, alertasIA, totalFiltradas } = useMemo(() => {
    let gymConectados = 0
    let gymErrados = 0
    let golpesGlobales = { 'Jab': 0, 'Cross': 0, 'Gancho': 0, 'Uppercut': 0 }

    // Aplicar filtro de tiempo a las sesiones globales
    const hoy = new Date()
    const sesionesFiltradas = sesionesDb.filter(s => {
      if (filtroTiempo === 'todo') return true
      const fechaS = new Date(s.fecha)
      const diffDias = (hoy - fechaS) / (1000 * 60 * 60 * 24)
      if (filtroTiempo === 'semana') return diffDias <= 7
      if (filtroTiempo === 'mes') return diffDias <= 30
      return true
    })

    const stats = boxeadoresDb.filter(b => !b.archivado).map(boxeador => {
      let conectados = 0
      let errados = 0
      const golpes = { 'Jab': 0, 'Cross': 0, 'Gancho': 0, 'Uppercut': 0 }

      const misSesiones = sesionesFiltradas.filter(s => s.boxeadorRojoId === boxeador.id || s.boxeadorAzulId === boxeador.id)
      
      misSesiones.forEach(s => {
        const miEsquina = s.boxeadorRojoId === boxeador.id ? 'roja' : 'azul'
        const misEventos = eventosDb.filter(e => e.sesionId === s.id && e.esquina === miEsquina)
        
        misEventos.forEach(e => {
          if (e.tipo === 'Golpe Conectado') conectados++
          if (e.tipo === 'Golpe Errado') errados++
          if (golpes[e.tipo] !== undefined) {
            golpes[e.tipo]++
            golpesGlobales[e.tipo]++
          }
        })
      })

      gymConectados += conectados
      gymErrados += errados

      const total = conectados + errados
      const eficacia = total > 0 ? Math.round((conectados / total) * 100) : 0

      return {
        ...boxeador,
        eficacia,
        distribucion: [
          { name: 'JAB', val: golpes['Jab'] },
          { name: 'CROSS', val: golpes['Cross'] },
          { name: 'HOOK', val: golpes['Gancho'] },
          { name: 'UPPER', val: golpes['Uppercut'] }
        ]
      }
    })

    const gymTotal = gymConectados + gymErrados
    const prom = gymTotal > 0 ? Math.round((gymConectados / gymTotal) * 100) : 0

    const topRanking = [...stats].sort((a, b) => b.eficacia - a.eficacia).slice(0, 3)
    
    // Filtrar por búsqueda
    const filtrados = stats.filter(b => b.nombre.toLowerCase().includes(busqueda.toLowerCase()))
    
    // Preparar actividad reciente (últimas 4 sesiones)
    const recientes = sesionesDb.slice(0, 4).map(s => {
      const rojo = boxeadoresDb.find(b => b.id === s.boxeadorRojoId)
      const azul = boxeadoresDb.find(b => b.id === s.boxeadorAzulId)
      return {
        ...s,
        nombreRojo: rojo ? rojo.nombre : 'Desconocido',
        nombreAzul: azul ? azul.nombre : 'Desconocido'
      }
    })
    
    // Calcular tiempo sin entrenar por boxeador (alertas de inactividad)
    const hoy2 = new Date()
    const alertas = []
    
    // Insight 1: Estado de eficacia del gym
    if (prom > 60) alertas.push({ tipo: 'exito', icono: '🔥', texto: `Eficacia de élite: El gimnasio mantiene un ${prom}% de efectividad ofensiva global.` })
    else if (prom > 0 && prom < 40) alertas.push({ tipo: 'alerta', icono: '⚠️', texto: `Eficacia global en ${prom}%. Se recomienda trabajo intensivo de precisión en esta semana.` })
    else if (prom >= 40) alertas.push({ tipo: 'info', icono: '📊', texto: `Eficacia global: ${prom}%. El equipo mantiene un nivel consistente.` })
    
    // Insight 2: Líder del ranking
    if (topRanking.length > 0) {
      alertas.push({ tipo: 'exito', icono: '⭐', texto: `${topRanking[0].nombre} lidera el ranking con ${topRanking[0].eficacia}% de efectividad histórica.` })
    }
    
    // Insight 3: Atleta inactivo (más de 10 días sin sesión)
    const hoyMs = hoy2.getTime()
    const atletas = [...stats]
    atletas.forEach(b => {
      const susSesiones = sesionesDb.filter(s => s.boxeadorRojoId === b.id || s.boxeadorAzulId === b.id)
      if (susSesiones.length > 0) {
        const ultima = susSesiones.reduce((mas, s) => {
          const d = new Date(s.fecha).getTime()
          return d > mas ? d : mas
        }, 0)
        const diasSin = Math.floor((hoyMs - ultima) / (1000 * 60 * 60 * 24))
        if (diasSin >= 10) {
          alertas.push({ tipo: 'alerta', icono: '🔴', texto: `${b.nombre} lleva ${diasSin} días sin entrenar. Verificar estado del atleta.` })
        }
      }
    })

    // Insight 4: Golpe más errado del gimnasio
    const tipoGolpes = ['Jab', 'Cross', 'Gancho', 'Uppercut']
    const totalPorTipo = tipoGolpes.map(g => ({ name: g, val: golpesGlobales[g] }))
    const masErrado = totalPorTipo.reduce((max, g) => g.val > max.val ? g : max, { name: '', val: 0 })
    if (masErrado.val > 0) {
      alertas.push({ tipo: 'info', icono: '🥊', texto: `El ${masErrado.name} es el golpe con mayor volumen del gym este período (${masErrado.val} golpes).` })
    }

    // Volumen global para el gráfico de área
    const volumenArray = [
      { name: 'JAB', val: golpesGlobales['Jab'] },
      { name: 'CROSS', val: golpesGlobales['Cross'] },
      { name: 'HOOK', val: golpesGlobales['Gancho'] },
      { name: 'UPPER', val: golpesGlobales['Uppercut'] }
    ]

    return { ranking: topRanking, boxeadoresFiltrados: filtrados, promedioEficaciaGym: prom, actividadReciente: recientes, volumenGolpes: volumenArray, alertasIA: alertas, totalFiltradas: sesionesFiltradas.length }
  }, [boxeadoresDb, sesionesDb, eventosDb, busqueda, filtroTiempo])

  // Acciones CRUD
  const abrirModal = (boxeador = null) => {
    setBoxeadorAEditar(boxeador)
    setModalAbierto(true)
  }

  const archivarBoxeador = async (id, nombre) => {
    if (window.confirm(`¿Estás seguro de archivar a ${nombre}? No aparecerá en las listas, pero sus sesiones no se borrarán.`)) {
      await db.boxeadores.update(id, { archivado: true })
    }
  }

  const coloresRanking = ['var(--color-dorado)', '#FFFFFF', 'var(--color-texto-suave)']

  return (
    <div style={estilos.pagina}>
      {/* HEADER & GLOBAL SEARCH */}
      <header style={estilos.header}>
        <div>
          <h1 style={estilos.tituloSeccion}>PANEL DE CONTROL</h1>
          <p style={estilos.subtituloHeader}>Resumen táctico y accesos rápidos del gimnasio</p>
        </div>
        
        <div style={{ display: 'flex', gap: 16 }}>
          <div style={estilos.searchContainer}>
            <Search size={18} color="var(--color-texto-suave)" style={{marginLeft: 16}} />
            <input 
              type="text" 
              placeholder="Buscar boxeadores..." 
              style={estilos.searchInput}
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>
          <select 
            value={filtroTiempo}
            onChange={e => setFiltroTiempo(e.target.value)}
            style={{...estilos.searchInput, background: 'var(--color-superficie-2)', borderRadius: 24, border: '1px solid var(--color-borde)', width: 'auto'}}
          >
            <option value="todo">Todo el Tiempo</option>
            <option value="mes">Últimos 30 Días</option>
            <option value="semana">Últimos 7 Días</option>
          </select>
        </div>
      </header>

      {/* EINSTEIN PANEL — Insights Inteligentes */}
      {alertasIA && alertasIA.length > 0 && (
        <section>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <span style={{ fontSize: 18 }}>🧠</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-dorado)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Einstein — Insights del Período</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 }}>
            {alertasIA.map((alerta, i) => (
              <div key={i} style={{
                background: alerta.tipo === 'alerta'
                  ? 'linear-gradient(90deg, rgba(231,76,60,0.1) 0%, rgba(231,76,60,0.03) 100%)'
                  : alerta.tipo === 'exito'
                  ? 'linear-gradient(90deg, rgba(46,204,113,0.1) 0%, rgba(46,204,113,0.03) 100%)'
                  : 'linear-gradient(90deg, rgba(212,175,55,0.1) 0%, rgba(212,175,55,0.03) 100%)',
                borderLeft: `3px solid ${alerta.tipo === 'alerta' ? 'var(--color-rojo-suave)' : alerta.tipo === 'exito' ? 'var(--color-exito)' : 'var(--color-dorado)'}`,
                borderRadius: '4px 8px 8px 4px',
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: 10
              }}>
                <span style={{ fontSize: 18, flexShrink: 0, marginTop: 1 }}>{alerta.icono}</span>
                <span style={{ fontSize: 13, color: 'var(--color-texto)', lineHeight: '1.5' }}>{alerta.texto}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* QUICK ACTIONS & KPIs */}
      <section style={estilos.gridTop}>
        <div style={estilos.quickActionsContainer}>
          <button onClick={() => abrirModal(null)} style={{...estilos.quickActionBtn, background: 'rgba(212,175,55,0.1)', borderColor: 'var(--color-dorado-alfa)'}}>
            <Plus size={24} color="var(--color-dorado)" />
            <span style={{color: 'var(--color-dorado)', fontWeight: 600}}>Nuevo Boxeador</span>
          </button>
          <button onClick={() => navigate('/sesiones')} style={estilos.quickActionBtn}>
            <PlayCircle size={24} color="var(--color-texto)" />
            <span>Iniciar Sesión</span>
          </button>
          <button onClick={() => navigate('/informes')} style={estilos.quickActionBtn}>
            <FileText size={24} color="var(--color-texto)" />
            <span>Crear Informe</span>
          </button>
        </div>

        <div style={estilos.gridKpis}>
          <TarjetaKpi titulo="BOXEADORES" valor={totalBoxeadores.toString()} icono={Users} />
          <TarjetaKpi titulo="SESIONES (PERIODO)" valor={totalFiltradas.toString()} icono={CalendarDays} />
          <TarjetaKpi titulo="EFICACIA GLOBAL" valor={`${promedioEficaciaGym}%`} icono={Target} highlight />
        </div>
      </section>

      {/* MIDDLE SECTION: ACTIVITY & GLOBAL STATS */}
      <section style={estilos.gridMiddle}>
        <div style={estilos.panelActividad}>
          <div style={estilos.panelHeader}>
            <h2 style={estilos.subtitulo}>ACTIVIDAD RECIENTE</h2>
            <button style={estilos.linkBtn} onClick={() => navigate('/sesiones')}>Ver Calendario <ArrowRight size={14}/></button>
          </div>
          <div className="tarjeta" style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: 16, height: 280, overflowY: 'auto' }}>
            {actividadReciente.length === 0 ? (
              <div style={{ color: 'var(--color-texto-suave)', textAlign: 'center', marginTop: 40, fontSize: 13 }}>No hay sesiones recientes registradas.</div>
            ) : (
              actividadReciente.map(sesion => (
                <div key={sesion.id} style={estilos.itemActividad} onClick={() => navigate('/sesiones')}>
                  <div style={estilos.actividadIcono}>
                    <Activity size={16} color="var(--color-dorado)" />
                  </div>
                  <div style={{flex: 1}}>
                    <div style={estilos.actividadTitulo}>{sesion.nombreRojo} vs {sesion.nombreAzul}</div>
                    <div style={estilos.actividadFecha}>{new Date(sesion.fecha).toLocaleDateString()} - {sesion.tipo}</div>
                  </div>
                  <ArrowRight size={16} color="var(--color-texto-suave)" />
                </div>
              ))
            )}
          </div>
        </div>

        <div style={estilos.panelGraficoGlobal}>
          <div style={estilos.panelHeader}>
            <h2 style={estilos.subtitulo}>VOLUMEN GLOBAL DE GOLPES</h2>
          </div>
          <div className="tarjeta" style={{ height: 280, padding: '20px 20px 10px 0', display: 'flex', flexDirection: 'column' }}>
            <span style={{ paddingLeft: 20, fontSize: 11, color: 'var(--color-texto-suave)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 16 }}>
              Distribución histórica del gimnasio
            </span>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={volumenGolpes} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-dorado)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="var(--color-dorado)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-borde)" vertical={false} />
                <XAxis dataKey="name" stroke="var(--color-texto-suave)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--color-texto-suave)" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ backgroundColor: 'var(--color-superficie)', borderColor: 'var(--color-borde)', borderRadius: 8 }} />
                <Area type="monotone" dataKey="val" stroke="var(--color-dorado)" fillOpacity={1} fill="url(#colorVal)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div style={estilos.panelRanking}>
          <div style={estilos.panelHeader}>
            <h2 style={estilos.subtitulo}>TOP EFICACIA</h2>
          </div>
          <div className="tarjeta" style={{ height: 280, display: 'flex', flexDirection: 'column', gap: 20, padding: 24 }}>
            {ranking.length === 0 ? (
              <div style={{ color: 'var(--color-texto-suave)', textAlign: 'center', marginTop: 40, fontSize: 13 }}>Suficientes datos no disponibles.</div>
            ) : (
              ranking.map((b, i) => (
                <div key={b.id} style={estilos.itemRanking}>
                  <div style={estilos.rankingHeader}>
                    <span style={estilos.rankingNombre}><span style={{ color: coloresRanking[i] || '#ccc' }}>{i + 1}.</span> {b.nombre}</span>
                    <span style={estilos.rankingValor}>({b.eficacia}%)</span>
                  </div>
                  <div style={estilos.barraFondo}>
                    <div style={{ ...estilos.barraProgreso, width: `${b.eficacia}%`, background: coloresRanking[i] || '#ccc' }} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* BOXER PROFILES */}
      <section style={{ paddingBottom: 40 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ ...estilos.subtitulo, marginBottom: 0 }}>ROSTER ACTIVO</h2>
        </div>
        <div style={estilos.gridPerfiles}>
          {boxeadoresFiltrados.length === 0 ? (
             <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px 0', color: 'var(--color-texto-suave)' }}>
               No se encontraron boxeadores.
             </div>
          ) : (
            boxeadoresFiltrados.map(p => (
              <div key={p.id} className="tarjeta" style={{...estilos.tarjetaPerfil, position: 'relative'}}>
                <div style={estilos.accionesCard}>
                  <button onClick={(e) => { e.stopPropagation(); abrirModal(p); }} style={estilos.btnMiniAccion} title="Editar"><Edit2 size={14}/></button>
                  <button onClick={(e) => { e.stopPropagation(); archivarBoxeador(p.id, p.nombre); }} style={{...estilos.btnMiniAccion, color: 'var(--color-rojo-suave)'}} title="Archivar/Eliminar"><Trash2 size={14}/></button>
                </div>
                
                <div style={{...estilos.perfilHeader, cursor: 'pointer', flexDirection: 'column', textAlign: 'center', gap: 16}} onClick={() => navigate(`/boxeador/${p.id}`)}>
                  <div style={estilos.perfilAvatarGrand}>
                    {p.foto ? (
                      <img src={p.foto} alt={p.nombre} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <Users size={32} color="var(--color-dorado-suave)" />
                    )}
                  </div>
                  <div>
                    <div style={estilos.perfilNombre}>{p.nombre}</div>
                    <div style={estilos.perfilPeso}>{p.categoriaPeso} {p.estancia && `· ${p.estancia}`}</div>
                  </div>
                </div>
                
                <div style={{ marginTop: 16, cursor: 'pointer' }} onClick={() => navigate(`/boxeador/${p.id}`)}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontSize: 11, color: 'var(--color-texto-suave)', fontWeight: 600, letterSpacing: '0.05em' }}>MÉTRICA CLAVE</span>
                    <span style={{ fontSize: 12, color: 'var(--color-dorado)', fontWeight: 700 }}>{p.eficacia}% Efectividad</span>
                  </div>
                  <div style={{ height: 80 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={p.distribucion} margin={{ top: 0, right: 0, left: 0, bottom: 0 }} barSize={20}>
                        <XAxis dataKey="name" stroke="var(--color-texto-suave)" fontSize={10} tickLine={false} axisLine={false} />
                        <Tooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} contentStyle={{ backgroundColor: 'var(--color-superficie)', borderColor: 'var(--color-borde)', fontSize: 12 }} />
                        <Bar dataKey="val" radius={[4, 4, 0, 0]}>
                          {p.distribucion.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={index === 0 ? 'var(--color-dorado)' : 'var(--color-texto-suave)'} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      <ModalBoxeador isOpen={modalAbierto} onClose={() => setModalAbierto(false)} boxeador={boxeadorAEditar} />
    </div>
  )
}

function TarjetaKpi({ titulo, valor, icono: Icono, highlight }) {
  return (
    <div className="tarjeta-kpi" style={highlight ? { background: 'linear-gradient(145deg, rgba(212,175,55,0.1), var(--color-superficie))', borderColor: 'var(--color-dorado-alfa)' } : {}}>
      <div style={estilos.kpiHeader}>
        <span style={{...estilos.kpiTitulo, color: highlight ? 'var(--color-dorado)' : 'var(--color-texto-suave)'}}>{titulo}</span>
        <Icono size={18} color={highlight ? 'var(--color-dorado)' : 'var(--color-texto-suave)'} />
      </div>
      <div className="kpi-valor" style={{color: highlight ? 'var(--color-dorado)' : 'var(--color-texto)'}}>{valor}</div>
    </div>
  )
}

const estilos = {
  pagina: { padding: '32px 40px', display: 'flex', flexDirection: 'column', gap: 32, height: '100%', overflowY: 'auto' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  tituloSeccion: { fontSize: 24, fontWeight: 700, color: 'var(--color-texto)', letterSpacing: '-0.02em', textTransform: 'uppercase', margin: '0 0 4px 0' },
  subtituloHeader: { margin: 0, fontSize: 14, color: 'var(--color-texto-suave)' },
  searchContainer: { display: 'flex', alignItems: 'center', background: 'var(--color-superficie-2)', borderRadius: 24, width: 350, border: '1px solid var(--color-borde)' },
  searchInput: { flex: 1, background: 'transparent', border: 'none', color: 'var(--color-texto)', padding: '12px 16px', outline: 'none', fontSize: 14 },
  
  subtitulo: { fontSize: 13, fontWeight: 600, color: 'var(--color-texto)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' },
  panelHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  linkBtn: { background: 'none', border: 'none', color: 'var(--color-dorado)', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 },
  
  gridTop: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 },
  quickActionsContainer: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 },
  quickActionBtn: { background: 'var(--color-superficie)', border: '1px solid var(--color-borde)', borderRadius: 12, padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, cursor: 'pointer', transition: 'all 0.2s', color: 'var(--color-texto)', fontSize: 13, fontWeight: 500 },
  
  gridKpis: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 },
  kpiHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  kpiTitulo: { fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' },
  
  gridMiddle: { display: 'grid', gridTemplateColumns: '1fr 2fr 1fr', gap: 24 },
  panelActividad: { display: 'flex', flexDirection: 'column' },
  itemActividad: { display: 'flex', alignItems: 'center', gap: 12, padding: '12px', background: 'var(--color-superficie-2)', borderRadius: 8, cursor: 'pointer', border: '1px solid transparent', transition: 'border 0.2s' },
  actividadIcono: { background: 'rgba(212,175,55,0.1)', padding: 8, borderRadius: '50%' },
  actividadTitulo: { fontSize: 13, fontWeight: 600, color: 'var(--color-texto)', marginBottom: 2 },
  actividadFecha: { fontSize: 11, color: 'var(--color-texto-suave)' },
  
  panelGraficoGlobal: { display: 'flex', flexDirection: 'column' },
  panelRanking: { display: 'flex', flexDirection: 'column' },
  itemRanking: { display: 'flex', flexDirection: 'column', gap: 8 },
  rankingHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  rankingNombre: { fontSize: 14, fontWeight: 600, color: 'var(--color-texto)' },
  rankingValor: { fontSize: 14, color: 'var(--color-texto-suave)' },
  barraFondo: { height: 6, background: 'var(--color-superficie-2)', borderRadius: 3, overflow: 'hidden' },
  barraProgreso: { height: '100%', borderRadius: 3 },
  
  gridPerfiles: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 24 },
  tarjetaPerfil: { display: 'flex', flexDirection: 'column', background: 'linear-gradient(145deg, var(--color-superficie), var(--color-fondo))', padding: '32px 24px 24px 24px' },
  accionesCard: { position: 'absolute', top: 16, right: 16, display: 'flex', gap: 8, zIndex: 10 },
  btnMiniAccion: { background: 'rgba(255,255,255,0.05)', border: 'none', color: 'var(--color-texto-suave)', borderRadius: 6, padding: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' },
  perfilHeader: { display: 'flex', alignItems: 'center', gap: 12 },
  perfilAvatarGrand: { width: 80, height: 80, borderRadius: '50%', background: 'rgba(212,175,55,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid var(--color-dorado-alfa)', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' },
  perfilNombre: { fontSize: 18, fontWeight: 700, color: 'var(--color-texto)', letterSpacing: '-0.01em', marginBottom: 4 },
  perfilPeso: { fontSize: 12, color: 'var(--color-texto-suave)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.05em' },
}
