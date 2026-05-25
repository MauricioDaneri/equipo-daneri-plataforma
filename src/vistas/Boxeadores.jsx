import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { Users, Search, Plus, Edit2, Trash2 } from 'lucide-react'
import { db } from '../servicios/db'
import { useModal } from '../context/ModalContext'
import ModalBoxeador from '../components/ui/ModalBoxeador'
import { ResponsiveContainer, BarChart, Bar, XAxis, Tooltip, Cell } from 'recharts'

export default function Boxeadores() {
  const navigate = useNavigate()
  const { mostrarConfirmacion } = useModal()
  const [modalAbierto, setModalAbierto] = useState(false)
  const [boxeadorAEditar, setBoxeadorAEditar] = useState(null)
  const [busqueda, setBusqueda] = useState('')

  const boxeadoresDb = useLiveQuery(() => db.boxeadores.toArray())
  const sesionesDb = useLiveQuery(() => db.sesiones.toArray())
  const eventosDb = useLiveQuery(() => db.eventos.toArray())

  if (boxeadoresDb === undefined || sesionesDb === undefined || eventosDb === undefined) {
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
        Cargando Boxeadores...
      </div>
    );
  }

  // --- Procesamiento de Datos Reales de Eficacia y Distribución ---
  const boxeadoresProcesados = useMemo(() => {
    return boxeadoresDb.filter(b => !b.archivado).map(boxeador => {
      let conectados = 0
      let errados = 0
      const golpes = { 
        'Jab': 0, 'Recto': 0, 'Cross': 0, 'Gancho': 0, 'Uppercut': 0, 'Swing': 0,
        'Clinch': 0, 'Golpe Conectado': 0, 'Golpe Errado': 0,
        'Esquiva': 0, 'Bloqueo': 0, 'Finta': 0, 'Pivoteo': 0
      }

      const misSesiones = sesionesDb.filter(s => s.boxeadorRojoId === boxeador.id || s.boxeadorAzulId === boxeador.id)
      
      misSesiones.forEach(s => {
        const miEsquina = s.boxeadorRojoId === boxeador.id ? 'roja' : 'azul'
        const misEventos = eventosDb.filter(e => e.sesionId === s.id && e.esquina === miEsquina)
        const tieneEventosLegados = misEventos.some(e => e.tipo === 'Golpe Conectado' || e.tipo === 'Golpe Errado')
        
        misEventos.forEach(e => {
          if (golpes[e.tipo] !== undefined) {
            golpes[e.tipo]++
          }

          if (tieneEventosLegados) {
            if (e.tipo === 'Golpe Conectado') conectados++
            if (e.tipo === 'Golpe Errado') errados++
          } else {
            if (["Jab", "Recto", "Cross", "Gancho", "Uppercut", "Swing"].includes(e.tipo)) {
              if (e.resultado === 'Errado') {
                errados++
              } else {
                conectados++
              }
            }
          }
        })
      })

      const total = conectados + errados
      const eficacia = total > 0 ? Math.round((conectados / total) * 100) : 0

      return {
        ...boxeador,
        eficacia,
        distribucion: [
          { name: 'JAB', val: golpes['Jab'] || 0 },
          { name: 'RECTO', val: golpes['Recto'] || 0 },
          { name: 'CROSS', val: golpes['Cross'] || 0 },
          { name: 'HOOK', val: golpes['Gancho'] || 0 },
          { name: 'UPPER', val: golpes['Uppercut'] || 0 },
          { name: 'SWING', val: golpes['Swing'] || 0 },
          { name: 'CLINCH', val: golpes['Clinch'] || 0 },
          { name: 'ESQ.', val: golpes['Esquiva'] || 0 },
          { name: 'BLOQ.', val: golpes['Bloqueo'] || 0 },
          { name: 'FINTA', val: golpes['Finta'] || 0 },
          { name: 'PIVOT', val: golpes['Pivoteo'] || 0 }
        ]
      }
    })
  }, [boxeadoresDb, sesionesDb, eventosDb])

  // Filtrar según búsqueda
  const boxeadoresFiltrados = useMemo(() => {
    return boxeadoresProcesados.filter(b => b.nombre.toLowerCase().includes(busqueda.toLowerCase()))
  }, [boxeadoresProcesados, busqueda])

  const abrirModal = (boxeador = null) => {
    setBoxeadorAEditar(boxeador)
    setModalAbierto(true)
  }

  const archivarBoxeador = async (id, nombre) => {
    const confirmado = await mostrarConfirmacion({
      titulo: "Archivar Boxeador",
      mensaje: `¿Estás seguro de archivar a ${nombre}? No aparecerá en las listas, pero sus sesiones no se borrarán.`,
      textoConfirmar: "Archivar",
      tipo: "advertencia"
    });
    if (confirmado) {
      await db.boxeadores.update(id, { archivado: true })
    }
  }

  return (
    <div style={estilos.pagina}>
      {/* HEADER & CONTROLES */}
      <header style={estilos.header}>
        <div>
          <h1 style={estilos.tituloSeccion}>BOXEADORES</h1>
          <p style={estilos.subtituloHeader}>
            Boxeadores Registrados — {boxeadoresProcesados.length} en total
          </p>
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
          <button onClick={() => abrirModal(null)} className="boton-primario" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, padding: '8px 16px' }}>
            <Plus size={16} /> Nuevo Boxeador
          </button>
        </div>
      </header>

      {/* GRID DE PERFILES */}
      <section style={{ paddingBottom: 40 }}>
        <div style={estilos.gridPerfiles}>
          {boxeadoresFiltrados.length === 0 ? (
             <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '80px 0', color: 'var(--color-texto-suave)' }}>
               No se encontraron boxeadores registrados.
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
                      <BarChart data={p.distribucion} margin={{ top: 0, right: 0, left: 0, bottom: 0 }} barSize={10}>
                        <XAxis dataKey="name" stroke="var(--color-texto-suave)" fontSize={7} tickLine={false} axisLine={false} />
                        <Tooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} contentStyle={{ backgroundColor: 'var(--color-superficie)', borderColor: 'var(--color-borde)', fontSize: 11 }} />
                        <Bar dataKey="val" radius={[2, 2, 0, 0]}>
                          {p.distribucion.map((entry, index) => {
                            const colores = [
                              'var(--color-dorado)', // JAB
                              'var(--color-dorado)', // CROSS
                              'var(--color-dorado)', // HOOK
                              'var(--color-dorado)', // UPPER
                              'var(--color-azul-suave)', // CLINCH
                              'var(--color-exito)', // CON.
                              'var(--color-rojo-suave)', // ERR.
                              'var(--color-azul-suave)', // ESQ.
                              'var(--color-azul-suave)', // BLOQ.
                              'var(--color-azul-suave)', // FINTA
                              'var(--color-azul-suave)'  // PIVOT
                            ]
                            return <Cell key={`cell-${index}`} fill={colores[index] || 'var(--color-texto-suave)'} />
                          })}
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

const estilos = {
  pagina: { padding: '32px 40px', display: 'flex', flexDirection: 'column', gap: 32, height: '100%', overflowY: 'auto' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  tituloSeccion: { fontSize: 24, fontWeight: 700, color: 'var(--color-texto)', letterSpacing: '-0.02em', textTransform: 'uppercase', margin: '0 0 4px 0' },
  subtituloHeader: { margin: 0, fontSize: 14, color: 'var(--color-texto-suave)' },
  searchContainer: { display: 'flex', alignItems: 'center', background: 'var(--color-superficie-2)', borderRadius: 24, width: 300, border: '1px solid var(--color-borde)' },
  searchInput: { flex: 1, background: 'transparent', border: 'none', color: 'var(--color-texto)', padding: '10px 16px', outline: 'none', fontSize: 13 },
  
  gridPerfiles: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 24 },
  tarjetaPerfil: { display: 'flex', flexDirection: 'column', background: 'linear-gradient(145deg, var(--color-superficie), var(--color-fondo))', padding: '32px 24px 24px 24px' },
  accionesCard: { position: 'absolute', top: 16, right: 16, display: 'flex', gap: 8, zIndex: 10 },
  btnMiniAccion: { background: 'rgba(255,255,255,0.05)', border: 'none', color: 'var(--color-texto-suave)', borderRadius: 6, padding: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' },
  perfilHeader: { display: 'flex', alignItems: 'center', gap: 12 },
  perfilAvatarGrand: { width: 80, height: 80, borderRadius: '50%', background: 'rgba(212,175,55,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid var(--color-dorado-alfa)', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' },
  perfilNombre: { fontSize: 18, fontWeight: 700, color: 'var(--color-texto)', letterSpacing: '-0.01em', marginBottom: 4 },
  perfilPeso: { fontSize: 12, color: 'var(--color-texto-suave)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.05em' },
}
