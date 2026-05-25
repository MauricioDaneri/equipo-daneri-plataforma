import { useState, useMemo } from 'react'
import { FileText, Search, Calendar, Award, Eye, Trash2, ArrowRight } from 'lucide-react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../servicios/db'
import { useModal } from '../context/ModalContext'
import { useNavigate } from 'react-router-dom'

export default function Informes() {
  const navigate = useNavigate()
  const { mostrarConfirmacion } = useModal()
  const [busqueda, setBusqueda] = useState('')
  const [filtroTipo, setFiltroTipo] = useState('todo') // 'todo' | 'Sparring' | 'Guanteo' | 'Combate'

  const sessionsDb = useLiveQuery(() => db.sesiones.orderBy('fecha').reverse().toArray())
  const boxeadoresDb = useLiveQuery(() => db.boxeadores.toArray())
  const eventosDb = useLiveQuery(() => db.eventos.toArray())

  if (sessionsDb === undefined || boxeadoresDb === undefined || eventosDb === undefined) {
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
        Cargando Informes...
      </div>
    );
  }

  // Mapeo rápido de boxeadores para resolver nombres
  const boxeadoresMap = useMemo(() => {
    const map = {}
    boxeadoresDb.forEach(b => {
      map[b.id] = b
    })
    return map
  }, [boxeadoresDb])

  // Conteo de eventos por sesión
  const eventosPorSesion = useMemo(() => {
    const counts = {}
    eventosDb.forEach(e => {
      counts[e.sesionId] = (counts[e.sesionId] || 0) + 1
    })
    return counts
  }, [eventosDb])

  // Filtrado y procesamiento
  const sesionesFiltradas = useMemo(() => {
    return sessionsDb.filter(s => {
      const bRojo = boxeadoresMap[s.boxeadorRojoId]?.nombre || 'Rincón Rojo'
      const bAzul = boxeadoresMap[s.boxeadorAzulId]?.nombre || 'Rincón Azul'
      const matchSearch = `${bRojo} ${bAzul}`.toLowerCase().includes(busqueda.toLowerCase())
      
      const tipoPelea = s.tipo || 'Sparring' // Por defecto
      const matchTipo = filtroTipo === 'todo' || tipoPelea.toLowerCase() === filtroTipo.toLowerCase()

      return matchSearch && matchTipo
    })
  }, [sessionsDb, boxeadoresMap, busqueda, filtroTipo])

  const eliminarSesion = async (id, e) => {
    e.stopPropagation()
    const confirmado = await mostrarConfirmacion({ titulo: "Eliminar Informe", mensaje: "¿Estás seguro de eliminar este informe y todo su registro de eventos?\nEsta acción no se puede deshacer.", textoConfirmar: "Eliminar", tipo: "peligro" });
    if (confirmado) {
      try {
        await db.transaction('rw', [db.sesiones, db.eventos, db.anotaciones], async () => {
          await db.sesiones.delete(id)
          await db.eventos.where('sesionId').equals(id).delete()
          await db.anotaciones.where('sesionId').equals(id).delete()
        })
      } catch (err) {
        console.error("Error al eliminar sesión:", err)
      }
    }
  }

  return (
    <div style={estilos.pagina}>
      <header style={estilos.header}>
        <div>
          <h1 style={estilos.tituloSeccion}>DOSSIERS E INFORMES TÁCTICOS</h1>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--color-texto-suave)' }}>
            Generación automática de documentación técnica basada en eventos reales e IndexedDB.
          </p>
        </div>
      </header>

      {/* Barra de Filtros */}
      <div style={estilos.filterBar}>
        <div style={estilos.searchContainer}>
          <Search size={16} color="var(--color-texto-suave)" style={{ marginLeft: 14 }} />
          <input 
            type="text" 
            placeholder="Buscar por boxeador..." 
            style={estilos.searchInput}
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>
        <select 
          value={filtroTipo} 
          onChange={e => setFiltroTipo(e.target.value)}
          style={estilos.selectInput}
        >
          <option value="todo">Todos los tipos</option>
          <option value="sparring">Sparring</option>
          <option value="guanteo">Guanteo</option>
          <option value="combate">Combate</option>
        </select>
      </div>

      {/* Listado de Sesiones / Informes */}
      {sesionesFiltradas.length === 0 ? (
        <div style={estilos.emptyState}>
          <FileText size={48} color="var(--color-texto-muted)" style={{ marginBottom: 16 }} />
          <h3 style={{ fontSize: 16, color: 'var(--color-texto)', marginBottom: 8 }}>Sin Informes Disponibles</h3>
          <p style={{ fontSize: 13, color: 'var(--color-texto-suave)', maxWidth: 400, margin: '0 auto 24px auto', lineHeight: 1.5 }}>
            No encontramos sesiones de análisis guardadas. Grabá y etiquetá eventos en el Editor Táctico para generar dossiers dinámicos.
          </p>
          <button 
            className="boton-primario" 
            onClick={() => navigate('/sesiones')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
          >
            Ir a Sesiones <ArrowRight size={16} />
          </button>
        </div>
      ) : (
        <div style={estilos.grid}>
          {sesionesFiltradas.map(s => {
            const bRojo = boxeadoresMap[s.boxeadorRojoId]
            const bAzul = boxeadoresMap[s.boxeadorAzulId]
            const totalEventos = eventosPorSesion[s.id] || 0
            
            return (
              <div 
                key={s.id} 
                className="tarjeta"
                style={estilos.tarjeta}
                onClick={() => navigate(`/informe/${s.id}`)}
              >
                {/* Botón de borrar flotante */}
                <button
                  onClick={(e) => eliminarSesion(s.id, e)}
                  style={estilos.btnEliminar}
                  title="Eliminar sesión de análisis"
                >
                  <Trash2 size={14} />
                </button>

                <div style={estilos.boxerContainer}>
                  <div style={estilos.boxerRow}>
                    <div style={estilos.esquinaDot('var(--color-rojo-suave)')} />
                    <span>{bRojo?.nombre || 'Rincón Rojo'}</span>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--color-texto-muted)', paddingLeft: 16, fontWeight: 700 }}>VS</div>
                  <div style={estilos.boxerRow}>
                    <div style={estilos.esquinaDot('var(--color-azul-suave)')} />
                    <span>{bAzul?.nombre || 'Rincón Azul'}</span>
                  </div>
                </div>

                <div style={estilos.metaContainer}>
                  <div style={estilos.metaItem}>
                    <span>Fecha</span>
                    <strong style={{ color: 'var(--color-texto)' }}>{s.fecha}</strong>
                  </div>
                  <div style={estilos.metaItem}>
                    <span>Rounds Analizados</span>
                    <strong style={{ color: 'var(--color-texto)' }}>{s.rounds || 0}</strong>
                  </div>
                  <div style={estilos.metaItem}>
                    <span>Acciones Registradas</span>
                    <strong style={{ color: 'var(--color-dorado)' }}>{totalEventos}</strong>
                  </div>
                  <div style={estilos.metaItem}>
                    <span>Tipo</span>
                    <strong style={{ color: 'var(--color-texto-suave)', textTransform: 'uppercase', fontSize: 10 }}>{s.tipo || 'Sparring'}</strong>
                  </div>
                </div>

                <button 
                  style={estilos.btnVer}
                  onClick={(e) => {
                    e.stopPropagation()
                    navigate(`/informe/${s.id}`)
                  }}
                >
                  <Eye size={14} /> Inspeccionar Dossier
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

const estilos = {
  pagina: {
    padding: '32px 40px',
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    overflowY: 'auto',
    gap: 24,
  },
  header: {
    marginBottom: 8,
  },
  tituloSeccion: {
    fontSize: 20,
    fontWeight: 700,
    color: 'var(--color-texto)',
    letterSpacing: '-0.02em',
    margin: '0 0 4px 0',
  },
  filterBar: {
    display: 'flex',
    gap: 16,
    alignItems: 'center',
    background: 'var(--color-superficie)',
    padding: '12px 16px',
    borderRadius: 12,
    border: '1px solid var(--color-borde)',
  },
  searchContainer: {
    display: 'flex',
    alignItems: 'center',
    background: 'var(--color-superficie-2)',
    borderRadius: 8,
    border: '1px solid var(--color-borde)',
    flex: 1,
  },
  searchInput: {
    flex: 1,
    background: 'transparent',
    border: 'none',
    color: 'var(--color-texto)',
    padding: '10px 14px',
    outline: 'none',
    fontSize: 13,
  },
  selectInput: {
    background: 'var(--color-superficie-2)',
    border: '1px solid var(--color-borde)',
    color: 'var(--color-texto)',
    borderRadius: 8,
    padding: '10px 14px',
    outline: 'none',
    fontSize: 13,
    cursor: 'pointer',
    minWidth: 160,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: 24,
    paddingBottom: 40,
  },
  tarjeta: {
    display: 'flex',
    flexDirection: 'column',
    padding: 24,
    background: 'linear-gradient(135deg, var(--color-superficie), rgba(30,30,30,0.5))',
    borderRadius: 12,
    border: '1px solid var(--color-borde)',
    borderLeft: '4px solid var(--color-dorado)',
    transition: 'all 0.2s ease',
    cursor: 'pointer',
    position: 'relative',
    gap: 14,
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
  },
  boxerContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  boxerRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    fontSize: 15,
    fontWeight: 700,
    color: 'var(--color-texto)',
  },
  esquinaDot: (color) => ({
    width: 10,
    height: 10,
    borderRadius: '50%',
    background: color,
  }),
  metaContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    borderTop: '1px solid var(--color-borde)',
    paddingTop: 12,
  },
  metaItem: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: 12,
    color: 'var(--color-texto-suave)',
  },
  btnVer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: '10px',
    borderRadius: 8,
    background: 'var(--color-dorado-alfa)',
    border: 'none',
    color: 'var(--color-dorado-suave)',
    fontSize: 12,
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'background 0.2s',
    marginTop: 6,
    width: '100%',
  },
  btnEliminar: {
    position: 'absolute',
    top: 14,
    right: 14,
    background: 'rgba(255, 255, 255, 0.03)',
    border: 'none',
    color: 'var(--color-texto-muted)',
    borderRadius: 6,
    padding: 6,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s',
    zIndex: 10,
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    padding: '80px 24px',
    background: 'var(--color-superficie)',
    borderRadius: 12,
    border: '1px dashed var(--color-borde)',
    margin: '20px 0',
  }
}
