import { useState, useRef, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { db } from '../servicios/db'
import { useLiveQuery } from 'dexie-react-hooks'
import { ArrowLeft, Target, Shield, Zap, FileText, Edit2 } from 'lucide-react'
import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, LineChart, Line, ReferenceLine } from 'recharts'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import ModalBoxeador from '../components/ui/ModalBoxeador'
import DossierTemplate from '../components/pdf/DossierTemplate'
import { verificarOllama, generarSintesisDossier } from '../servicios/ollama'

export default function DossierBoxeador() {
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
    
    let conectados = 0
    let errados = 0
    let bloqueos = 0
    let esquivas = 0
    let fintas = 0
    const golpes = { 'Jab': 0, 'Cross': 0, 'Gancho': 0, 'Uppercut': 0 }

    misSesiones.forEach(s => {
      const miEsquina = s.boxeadorRojoId === boxeador.id ? 'roja' : 'azul'
      const misEventos = eventosDb.filter(e => e.sesionId === s.id && e.esquina === miEsquina)
      
      misEventos.forEach(e => {
        if (e.tipo === 'Golpe Conectado') conectados++
        if (e.tipo === 'Golpe Errado') errados++
        if (e.tipo === 'Bloqueo') bloqueos++
        if (e.tipo === 'Esquiva') esquivas++
        if (e.tipo === 'Finta') fintas++
        if (golpes[e.tipo] !== undefined) golpes[e.tipo]++
      })
    })

    const total = conectados + errados
    const eficacia = total > 0 ? Math.round((conectados / total) * 100) : 0
    
    // Semáforo de Fatiga (Sesiones últimos 7 días)
    const hoy = new Date()
    const sesionesUltimos7Dias = misSesiones.filter(s => {
      const fechaS = new Date(s.fecha)
      return (hoy - fechaS) / (1000 * 60 * 60 * 24) <= 7
    }).length
    let estadoFatiga = { label: 'INACTIVO', color: 'var(--color-texto-muted)' }
    if (sesionesUltimos7Dias > 3) estadoFatiga = { label: 'SOBRECARGA', color: 'var(--color-rojo-suave)' }
    else if (sesionesUltimos7Dias > 0) estadoFatiga = { label: 'ÓPTIMO', color: 'var(--color-exito)' }

    // Calcular métricas relativas para el Radar
    const radarMax = Math.max(conectados, bloqueos, esquivas, fintas, 1) // Para evitar división por 0
    const radarData = [
      { subject: 'Ofensiva', A: Math.round((conectados/radarMax)*100), fullMark: 100 },
      { subject: 'Defensa (B)', A: Math.round((bloqueos/radarMax)*100), fullMark: 100 },
      { subject: 'Movilidad (E)', A: Math.round((esquivas/radarMax)*100), fullMark: 100 },
      { subject: 'Táctica (F)', A: Math.round((fintas/radarMax)*100), fullMark: 100 },
      { subject: 'Eficacia', A: eficacia, fullMark: 100 },
    ]

    return {
      totalSesiones: misSesiones.length,
      eficacia,
      conectados,
      bloqueos,
      esquivas,
      estadoFatiga,
      sesionesUltimos7Dias,
      distribucion: [
        { name: 'JAB', val: golpes['Jab'] },
        { name: 'CROSS', val: golpes['Cross'] },
        { name: 'HOOK', val: golpes['Gancho'] },
        { name: 'UPPER', val: golpes['Uppercut'] }
      ],
      radarData,
      progresion: misSesiones
        .slice()
        .sort((a, b) => new Date(a.fecha) - new Date(b.fecha))
        .map(s => {
          const miEsquina = s.boxeadorRojoId === boxeador.id ? 'roja' : 'azul'
          const ev = eventosDb.filter(e => e.sesionId === s.id && e.esquina === miEsquina)
          const con = ev.filter(e => e.tipo === 'Golpe Conectado').length
          const err = ev.filter(e => e.tipo === 'Golpe Errado').length
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
    if (!ollamaDisponible) return alert("Ollama no está disponible.")
    setGenerandoIA(true)
    try {
      const response = await generarSintesisDossier({ nombre: boxeador.nombre, stats })
      setAnalisis(response)
      await guardarDatosTextuales(response)
    } catch(e) {
      alert("Error al contactar con Ollama.")
    } finally {
      setGenerandoIA(false)
    }
  }

  const exportarPDF = async () => {
    setExportando(true)
    
    try {
      // Damos tiempo por si recharts necesita animar
      await new Promise(resolve => setTimeout(resolve, 500))

      const element = document.getElementById('pdf-dossier') || templateRef.current
      if (!element) throw new Error("Template no encontrado")

      const canvas = await html2canvas(element, { scale: 2, useCORS: true })
      const imgData = canvas.toDataURL('image/jpeg', 0.9)
      const pdf = new jsPDF('p', 'mm', 'a4')
      
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width
      
      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight)
      pdf.save(`Dossier_${boxeador.nombre.replace(/\s+/g, '_')}.pdf`)
    } catch (error) {
      console.error(error)
      alert('Error al generar el PDF')
    } finally {
      setExportando(false)
    }
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
            <h1 style={estilos.tituloSeccion}>DOSSIER DE INTELIGENCIA</h1>
            <p style={estilos.subtituloHeader}>{boxeador.nombre} — {boxeador.categoriaPeso}</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button className="boton-secundario" onClick={() => setModalAbierto(true)} style={{ display: 'flex', gap: 8, padding: '10px 20px' }}>
            <Edit2 size={18} /> Editar Perfil
          </button>
          <button className="boton-primario" onClick={exportarPDF} disabled={exportando} style={{ display: 'flex', gap: 8, padding: '10px 20px' }}>
            <FileText size={18} /> {exportando ? 'Generando...' : 'Exportar Dossier PDF'}
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
              <div>
                <div style={estilos.labelAtributo}>Estado Físico</div>
                <div style={{...estilos.valorAtributo, color: stats.estadoFatiga.color, display: 'flex', alignItems: 'center', gap: 6, fontWeight: 'bold'}}>
                   <div style={{width: 8, height: 8, borderRadius: '50%', background: stats.estadoFatiga.color}}/>
                   {stats.estadoFatiga.label} <span style={{fontSize: 11, color: 'var(--color-texto-suave)', fontWeight: 'normal'}}>({stats.sesionesUltimos7Dias} sec. 7D)</span>
                </div>
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
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, height: 350 }}>
            <div className="tarjeta" style={{ padding: 24, display: 'flex', flexDirection: 'column' }}>
              <h3 style={estilos.tituloGrafico}>HUELLA TÁCTICA</h3>
              <div style={{ flex: 1 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="70%" data={stats.radarData}>
                    <PolarGrid stroke="var(--color-borde)" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--color-texto-suave)', fontSize: 11 }} />
                    <Radar name="Métricas" dataKey="A" stroke="var(--color-dorado)" fill="var(--color-dorado)" fillOpacity={0.3} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="tarjeta" style={{ padding: 24, display: 'flex', flexDirection: 'column' }}>
              <h3 style={estilos.tituloGrafico}>ARSENAL OFENSIVO HISTÓRICO</h3>
              <div style={{ flex: 1, marginTop: 16 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.distribucion}>
                    <XAxis dataKey="name" stroke="var(--color-texto-suave)" fontSize={11} tickLine={false} axisLine={false} />
                    <Tooltip cursor={{ fill: 'var(--color-superficie-2)' }} contentStyle={{ backgroundColor: 'var(--color-superficie)', borderColor: 'var(--color-borde)' }} />
                    <Bar dataKey="val" radius={[4, 4, 0, 0]}>
                      {stats.distribucion.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={index === 0 ? 'var(--color-dorado)' : 'var(--color-texto-muted)'} />
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
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: 'var(--color-texto)', textTransform: 'uppercase', flex: 1 }}>Síntesis de Inteligencia Artificial / Análisis</h3>
                {ollamaDisponible && (
                  <button onClick={handleGenerarIA} disabled={generandoIA} className="boton-primario" style={{ fontSize: 11, padding: '4px 12px' }}>
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
