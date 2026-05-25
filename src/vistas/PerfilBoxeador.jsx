import { useState, useRef, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { db } from '../servicios/db'
import { useLiveQuery } from 'dexie-react-hooks'
import { ArrowLeft, Target, Shield, Zap, FileText, Edit2 } from 'lucide-react'
import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, LineChart, Line, ReferenceLine } from 'recharts'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import ModalBoxeador from '../components/ui/ModalBoxeador'
import { useModal } from '../context/ModalContext'
import DossierTemplate from '../components/pdf/DossierTemplate'
import { verificarOllama, generarSintesisDossier } from '../servicios/ollama'

export default function PerfilBoxeador() {
  const { mostrarAlerta } = useModal()
  const { id } = useParams()
  const navigate = useNavigate()

  const [analisis, setAnalisis] = useState('')
  const [metas, setMetas] = useState('')
  const [exportando, setExportando] = useState(false)
  const [modalAbierto, setModalAbierto] = useState(false)
  const [ollamaDisponible, setOllamaDisponible] = useState(false)
  const [generandoIA, setGenerandoIA] = useState(false)
  const templateRef = useRef(null)

  const boxeador = useLiveQuery(() => id ? db.boxeadores.get(Number(id)) : null, [id])
  const sesionesDb = useLiveQuery(() => db.sesiones.toArray()) || []
  const eventosDb = useLiveQuery(() => db.eventos.toArray()) || []

  // Sincronizar el estado de análisis y metas cuando cargue el boxeador
  useEffect(() => {
    if (boxeador) {
      setAnalisis(boxeador.analisis || '')
      setMetas(boxeador.metas || '')
    }
  }, [boxeador?.analisis, boxeador?.metas])

  useEffect(() => {
    verificarOllama().then(setOllamaDisponible)
  }, [])

  const stats = useLiveQuery(() => {
    if (!boxeador || !sesionesDb || !eventosDb) return null

    const misSesiones = sesionesDb.filter(s => s.boxeadorRojoId === boxeador.id || s.boxeadorAzulId === boxeador.id)
    
    // Primero, recopilar todos los eventos de las sesiones de este boxeador para esta esquina
    const todosMisEventos = []
    misSesiones.forEach(s => {
      const miEsquina = s.boxeadorRojoId === boxeador.id ? 'roja' : 'azul'
      const misEventos = eventosDb.filter(e => e.sesionId === s.id && e.esquina === miEsquina)
      todosMisEventos.push(...misEventos)
    })

    const tieneEventosLegados = todosMisEventos.some(e => e.tipo === 'Golpe Conectado' || e.tipo === 'Golpe Errado')

    let conectados = 0
    let errados = 0
    let bloqueos = 0
    let esquivas = 0
    let fintas = 0
    let pivoteos = 0
    let clinches = 0
    let marcaGenerals = 0

    const golpes = { 
      'Jab': 0, 'Recto': 0, 'Cross': 0, 'Gancho': 0, 'Uppercut': 0, 'Swing': 0,
      'Clinch': 0, 'Esquiva': 0, 'Bloqueo': 0, 'Finta': 0, 'Pivoteo': 0, 'Marca General': 0
    }

    todosMisEventos.forEach(e => {
      // Incrementar conteo en el mapa 'golpes' si es un tipo oficial
      if (golpes[e.tipo] !== undefined) {
        golpes[e.tipo]++
      }

      // Conteo de maniobras específicas para variables auxiliares
      if (e.tipo === 'Bloqueo') bloqueos++
      if (e.tipo === 'Esquiva') esquivas++
      if (e.tipo === 'Finta') fintas++
      if (e.tipo === 'Pivoteo') pivoteos++
      if (e.tipo === 'Clinch') clinches++
      if (e.tipo === 'Marca General') marcaGenerals++

      if (tieneEventosLegados) {
        if (e.tipo === 'Golpe Conectado') conectados++
        if (e.tipo === 'Golpe Errado') errados++
      } else {
        // En el nuevo formato, contamos los golpes ofensivos reales y evaluamos su resultado
        if (["Jab", "Recto", "Cross", "Gancho", "Uppercut", "Swing"].includes(e.tipo)) {
          if (e.resultado === 'Errado') {
            errados++
          } else {
            // Por defecto, si no tiene resultado o es Conectado, cuenta como conectado
            conectados++
          }
        }
      }
    })

    const total = conectados + errados
    const eficacia = total > 0 ? Math.round((conectados / total) * 100) : 0
    
    return {
      totalSesiones: misSesiones.length,
      eficacia,
      conectados,
      bloqueos,
      esquivas,
      distribucion: [
        { name: 'JAB', val: golpes['Jab'] || 0, color: '#3498DB' },
        { name: 'RECTO', val: golpes['Recto'] || 0, color: '#E74C3C' },
        { name: 'CROSS', val: golpes['Cross'] || 0, color: '#9B59B6' },
        { name: 'GANCHO', val: golpes['Gancho'] || 0, color: '#2ECC71' },
        { name: 'UPPER', val: golpes['Uppercut'] || 0, color: '#F1C40F' },
        { name: 'SWING', val: golpes['Swing'] || 0, color: '#E67E22' },
        { name: 'CLINCH', val: golpes['Clinch'] || 0, color: '#16A085' },
        { name: 'ESQUIVA', val: golpes['Esquiva'] || 0, color: '#34495E' },
        { name: 'BLOQUEO', val: golpes['Bloqueo'] || 0, color: '#BDC3C7' },
        { name: 'FINTA', val: golpes['Finta'] || 0, color: '#27AE60' },
        { name: 'PIVOTE', val: golpes['Pivoteo'] || 0, color: '#2980B9' }
      ],
      progresion: misSesiones
        .slice()
        .sort((a, b) => new Date(a.fecha) - new Date(b.fecha))
        .map(s => {
          const miEsquina = s.boxeadorRojoId === boxeador.id ? 'roja' : 'azul'
          const ev = eventosDb.filter(e => e.sesionId === s.id && e.esquina === miEsquina)
          const tieneLegadosSesion = ev.some(e => e.tipo === 'Golpe Conectado' || e.tipo === 'Golpe Errado')
          let con = 0
          let err = 0
          if (tieneLegadosSesion) {
            con = ev.filter(e => e.tipo === 'Golpe Conectado').length
            err = ev.filter(e => e.tipo === 'Golpe Errado').length
          } else {
            const golpesOfensivos = ev.filter(e => ["Jab", "Recto", "Cross", "Gancho", "Uppercut", "Swing"].includes(e.tipo))
            con = golpesOfensivos.filter(e => e.resultado !== 'Errado').length
            err = golpesOfensivos.filter(e => e.resultado === 'Errado').length
          }
          const tot = con + err
          return {
            fecha: new Date(s.fecha).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' }),
            eficacia: tot > 0 ? Math.round((con / tot) * 100) : 0
          }
        })
    }
  }, [boxeador, sesionesDb, eventosDb])

  const guardarDatosTextuales = async (overrideAnalisis = undefined) => {
    if (boxeador) {
      await db.boxeadores.update(boxeador.id, { 
        analisis: overrideAnalisis !== undefined ? overrideAnalisis : analisis, 
        metas 
      })
    }
  }

  const handleGenerarIA = async () => {
    if (!ollamaDisponible) return mostrarAlerta({ titulo: "Servicio no disponible", mensaje: "Ollama no está disponible o no está respondiendo en localhost:11434.", tipo: "peligro" })
    setGenerandoIA(true)
    try {
      const response = await generarSintesisDossier({ nombre: boxeador.nombre, stats })
      setAnalisis(response)
      await guardarDatosTextuales(response)
    } catch(e) {
      mostrarAlerta({ titulo: "Error de IA", mensaje: "Error al contactar con el Asistente IA (Ollama).", tipo: "peligro" })
    } finally {
      setGenerandoIA(false)
    }
  }

  const exportarPDF = async () => {
    // Usamos el diálogo de impresión nativo del navegador con soporte @media print
    window.print()
  }

  if (!boxeador || !stats) {
    return <div style={{...estilos.pagina, justifyContent: 'center', alignItems: 'center'}}>Cargando Dossier...</div>
  }

  return (
    <div style={estilos.pagina}>
      <header style={estilos.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button onClick={() => navigate(-1)} style={estilos.btnVolver}>
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 style={estilos.tituloSeccion}>PERFIL DEL BOXEADOR</h1>
            <p style={estilos.subtituloHeader}>{boxeador.nombre} — {boxeador.categoriaPeso}</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12 }} className="no-print">
          <button className="boton-secundario" onClick={() => setModalAbierto(true)} style={{ display: 'flex', gap: 8, padding: '10px 20px' }}>
            <Edit2 size={18} /> Editar Perfil
          </button>
          <button className="boton-primario" onClick={exportarPDF} style={{ display: 'flex', gap: 8, padding: '10px 20px' }}>
            <FileText size={18} /> Imprimir / Exportar PDF
          </button>
        </div>
      </header>

      <div style={estilos.gridPrincipal}>
        {/* SIDEBAR PERFIL */}
        <div style={estilos.sidebar}>
          <div className="tarjeta" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={estilos.fotoHeader}>
              {boxeador.foto ? (
                <img src={boxeador.foto} alt={boxeador.nombre} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ padding: 40, background: 'var(--color-superficie-2)', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  SIN FOTO
                </div>
              )}
            </div>
            <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <div style={estilos.labelAtributo}>Estancia</div>
                <div style={estilos.valorAtributo}>{boxeador.estancia}</div>
              </div>
              <div>
                <div style={estilos.labelAtributo}>Apodo</div>
                <div style={estilos.valorAtributo}>{boxeador.apodo || 'N/A'}</div>
              </div>
              <div style={{ paddingTop: 16, borderTop: '1px solid var(--color-borde)' }}>
                <div style={estilos.labelAtributo}>Notas Médicas / Tácticas</div>
                <p style={{ fontSize: 13, color: 'var(--color-texto-suave)', lineHeight: 1.5, margin: '8px 0 0 0' }}>
                  {boxeador.notas || 'Sin notas registradas.'}
                </p>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="tarjeta" style={{ padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Target size={24} color="var(--color-dorado)" style={{ marginBottom: 8 }} />
              <span style={{ fontSize: 24, fontWeight: 700 }}>{stats.eficacia}%</span>
              <span style={{ fontSize: 11, color: 'var(--color-texto-suave)', textTransform: 'uppercase' }}>Eficacia</span>
            </div>
            <div className="tarjeta" style={{ padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Shield size={24} color="var(--color-azul-suave)" style={{ marginBottom: 8 }} />
              <span style={{ fontSize: 24, fontWeight: 700 }}>{stats.bloqueos + stats.esquivas}</span>
              <span style={{ fontSize: 11, color: 'var(--color-texto-suave)', textTransform: 'uppercase' }}>Defensas</span>
            </div>
          </div>
        </div>

        {/* CONTENIDO PRINCIPAL */}
        <div style={estilos.contenido}>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div className="tarjeta" style={{ padding: 24, display: 'flex', flexDirection: 'column', height: 350 }}>
              <h3 style={estilos.tituloGrafico}>ARSENAL OFENSIVO HISTÓRICO</h3>
              <div style={{ flex: 1, marginTop: 16 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.distribucion}>
                    <XAxis dataKey="name" stroke="var(--color-texto-suave)" fontSize={9} tickLine={false} axisLine={false} />
                    <Tooltip cursor={{ fill: 'var(--color-superficie-2)' }} contentStyle={{ backgroundColor: 'var(--color-superficie)', borderColor: 'var(--color-borde)' }} />
                    <Bar dataKey="val" radius={[4, 4, 0, 0]}>
                      {stats.distribucion.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color || 'var(--color-dorado)'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* PROGRESIÓN HISTÓRICA */}
            {stats.progresion && stats.progresion.length > 1 && (
              <div className="tarjeta" style={{ padding: 24, display: 'flex', flexDirection: 'column', marginTop: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                  <h3 style={estilos.tituloGrafico}>📈 PROGRESIÓN HISTÓRICA DE EFICACIA</h3>
                  <span style={{ fontSize: 11, color: 'var(--color-texto-suave)' }}>{stats.progresion.length} sesiones analizadas</span>
                </div>
                <div style={{ height: 180 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={stats.progresion} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--color-borde)" vertical={false} />
                      <XAxis dataKey="fecha" stroke="var(--color-texto-suave)" fontSize={11} tickLine={false} axisLine={false} />
                      <YAxis domain={[0, 100]} stroke="var(--color-texto-suave)" fontSize={11} tickLine={false} axisLine={false} unit="%" />
                      <Tooltip
                        contentStyle={{ backgroundColor: 'var(--color-superficie)', borderColor: 'var(--color-borde)', borderRadius: 8 }}
                        formatter={(value) => [`${value}%`, 'Eficacia']}
                      />
                      <ReferenceLine y={50} stroke="rgba(255,255,255,0.1)" strokeDasharray="4 4" />
                      <Line
                        type="monotone"
                        dataKey="eficacia"
                        stroke="var(--color-dorado)"
                        strokeWidth={2}
                        dot={{ fill: 'var(--color-dorado)', r: 4, strokeWidth: 0 }}
                        activeDot={{ r: 6, fill: 'var(--color-dorado)', stroke: 'var(--color-texto)', strokeWidth: 2 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginTop: 24, flex: 1 }}>
            <div className="tarjeta" style={{ padding: 24, display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <Zap size={20} color="var(--color-dorado)" />
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: 'var(--color-texto)', textTransform: 'uppercase', flex: 1 }}>Evaluación Táctica del Analista / Síntesis IA</h3>
                {ollamaDisponible && (
                  <button onClick={handleGenerarIA} disabled={generandoIA} className="boton-primario no-print" style={{ fontSize: 11, padding: '4px 12px' }}>
                    {generandoIA ? 'Analizando...' : 'Generar con IA (Einstein)'}
                  </button>
                )}
              </div>
              <textarea 
                value={analisis}
                onChange={e => setAnalisis(e.target.value)}
                onBlur={() => guardarDatosTextuales()}
                placeholder="Escribe aquí tu análisis técnico-táctico o pega la síntesis de IA..."
                style={{ ...estilos.textareaEditable, flex: 1 }}
              />
            </div>
            
            <div className="tarjeta" style={{ padding: 24, display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <Target size={20} color="var(--color-azul-suave)" />
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: 'var(--color-texto)', textTransform: 'uppercase' }}>Gestor de Metas</h3>
              </div>
              <textarea 
                value={metas}
                onChange={e => setMetas(e.target.value)}
                onBlur={() => guardarDatosTextuales()}
                placeholder="Escribe aquí las metas a corto y largo plazo del boxeador (e.g. 1. Aumentar % Jab, 2. Mejorar defensa en las cuerdas)..."
                style={{ ...estilos.textareaEditable, flex: 1 }}
              />
            </div>
          </div>

        </div>
      </div>
      <ModalBoxeador isOpen={modalAbierto} onClose={() => setModalAbierto(false)} boxeador={boxeador} />
      
      {/* COMPONENTE OCULTO PARA EL PDF DE SCOUTING */}
      <div style={{ position: 'absolute', top: -9999, left: -9999, width: 800 }}>
        <DossierTemplate ref={templateRef} boxeador={boxeador} stats={stats} analisis={analisis} metas={metas} />
      </div>
    </div>
  )
}

const estilos = {
  pagina: { padding: '32px 40px', display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 },
  btnVolver: { background: 'var(--color-superficie-2)', border: '1px solid var(--color-borde)', color: 'var(--color-texto)', width: 40, height: 40, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' },
  tituloSeccion: { fontSize: 24, fontWeight: 700, color: 'var(--color-texto)', letterSpacing: '-0.02em', margin: '0 0 4px 0', textTransform: 'uppercase' },
  subtituloHeader: { margin: 0, fontSize: 14, color: 'var(--color-dorado)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' },
  gridPrincipal: { display: 'flex', gap: 32, flex: 1 },
  sidebar: { width: 300, display: 'flex', flexDirection: 'column', gap: 16, flexShrink: 0 },
  fotoHeader: { width: '100%', height: 250, borderBottom: '1px solid var(--color-borde)' },
  labelAtributo: { fontSize: 11, color: 'var(--color-texto-suave)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.05em', marginBottom: 4 },
  valorAtributo: { fontSize: 16, color: 'var(--color-texto)', fontWeight: 600 },
  contenido: { flex: 1, display: 'flex', flexDirection: 'column' },
  tituloGrafico: { margin: 0, fontSize: 13, color: 'var(--color-texto)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' },
  textareaEditable: { background: 'var(--color-superficie-2)', border: '1px solid var(--color-borde)', color: 'var(--color-texto)', padding: '16px', borderRadius: 8, outline: 'none', fontFamily: 'inherit', resize: 'vertical', minHeight: 150, fontSize: 14, lineHeight: 1.6 }
}
