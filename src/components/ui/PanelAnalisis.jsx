import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { X, Play, FileText, Wand2, Save } from 'lucide-react'
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../servicios/db'
import { verificarOllama, generarSintesis } from '../../servicios/ollama'
import { motion, AnimatePresence } from 'framer-motion'

export default function PanelAnalisis({ isOpen, onClose, sesionId }) {
  const navigate = useNavigate()
  const [ollamaActivo, setOllamaActivo] = useState(false)
  const [generando, setGenerando] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [sintesis, setSintesis] = useState('')

  // Consultas a la base de datos
  const sesion = useLiveQuery(() => db.sesiones.get(sesionId), [sesionId])
  const eventos = useLiveQuery(() => db.eventos.where({ sesionId }).toArray(), [sesionId]) || []
  const boxeadorRojo = useLiveQuery(() => sesion ? db.boxeadores.get(sesion.boxeadorRojoId) : null, [sesion])
  const boxeadorAzul = useLiveQuery(() => sesion ? db.boxeadores.get(sesion.boxeadorAzulId) : null, [sesion])

  // Inicializar estado local si la sesión ya tenía una síntesis guardada
  useEffect(() => {
    if (sesion && sesion.sintesis !== sintesis && !generando && !guardando) {
      setSintesis(sesion.sintesis || '')
    }
  }, [sesion])

  // Al abrir, chequeamos si Ollama está disponible
  useEffect(() => {
    if (isOpen) verificarOllama().then(setOllamaActivo)
  }, [isOpen])

  // Calcular métricas para el radar
  const calcularRadar = () => {
    // Por ahora simulamos un poco basados en conteos simples o dejamos estático
    const jRojo = eventos.filter(e => e.tipo === 'Jab' && e.esquina === 'roja').length
    const jAzul = eventos.filter(e => e.tipo === 'Jab' && e.esquina === 'azul').length
    
    // Simplificación para la demo
    return [
      { subject: 'Velocidad', A: 70 + jRojo, B: 70 + jAzul, fullMark: 100 },
      { subject: 'Potencia', A: 85, B: 80, fullMark: 100 },
      { subject: 'Precisión', A: 75, B: 85, fullMark: 100 },
      { subject: 'Defensa', A: 65, B: 70, fullMark: 100 },
      { subject: 'Resistencia', A: 80, B: 75, fullMark: 100 },
    ]
  }

  const handleGenerarIA = async () => {
    if (!sesion || !boxeadorRojo || !boxeadorAzul) return

    setGenerando(true)
    try {
      // Contar tipos de golpes para darle contexto a la IA
      const conteoRojo = eventos.filter(e => e.esquina === 'roja').reduce((acc, curr) => { acc[curr.tipo] = (acc[curr.tipo] || 0) + 1; return acc }, {})
      const conteoAzul = eventos.filter(e => e.esquina === 'azul').reduce((acc, curr) => { acc[curr.tipo] = (acc[curr.tipo] || 0) + 1; return acc }, {})

      const dataParaOllama = {
        boxeadorRojo: boxeadorRojo.nombre,
        boxeadorAzul: boxeadorAzul.nombre,
        rounds: sesion.rounds,
        eventos: eventos,
        golpes: { rojo: conteoRojo, azul: conteoAzul }
      }
      
      const analisis = await generarSintesis(dataParaOllama)
      setSintesis(analisis)

      // Guardado automático tras generar
      await db.sesiones.update(sesionId, { sintesis: analisis })

    } catch (err) {
      console.error(err)
      alert("Error conectando con Ollama. Asegurate de que esté corriendo en segundo plano.")
    } finally {
      setGenerando(false)
    }
  }

  const guardarCambios = async () => {
    setGuardando(true)
    try {
      await db.sesiones.update(sesionId, { sintesis })
      alert("Síntesis guardada.")
    } catch (e) {
      console.error(e)
    } finally {
      setGuardando(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && sesion && (
        <motion.div 
          style={estilos.panel}
          initial={{ x: 400, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 400, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
      <div style={estilos.header}>
        <div>
          <h3 style={estilos.titulo}>ANÁLISIS DE SESIÓN</h3>
          <p style={estilos.subtitulo}>{boxeadorRojo?.nombre || 'Rojo'} vs {boxeadorAzul?.nombre || 'Azul'}</p>
        </div>
        <button onClick={onClose} style={estilos.btnCerrar}><X size={20} /></button>
      </div>

      <div style={estilos.content}>
        {/* Info Rápida */}
        <div style={{ display: 'flex', gap: 12, fontSize: 12, color: 'var(--color-dorado)' }}>
          <div style={{ background: 'rgba(212,175,55,0.1)', padding: '4px 8px', borderRadius: 4 }}>
            {sesion.fecha}
          </div>
          <div style={{ background: 'rgba(212,175,55,0.1)', padding: '4px 8px', borderRadius: 4 }}>
            {eventos.length} Eventos Registrados
          </div>
        </div>

        {/* Radar Chart */}
        <div style={estilos.seccion}>
          <span style={estilos.label}>MÉTRICAS DE RENDIMIENTO</span>
          <div style={{ height: 220, background: 'var(--color-superficie-2)', borderRadius: 8, marginTop: 8 }}>
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={calcularRadar()}>
                <PolarGrid stroke="var(--color-borde)" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--color-texto-suave)', fontSize: 11 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                <Radar name={boxeadorRojo?.nombre} dataKey="A" stroke="var(--color-rojo)" fill="var(--color-rojo)" fillOpacity={0.4} />
                <Radar name={boxeadorAzul?.nombre} dataKey="B" stroke="var(--color-azul)" fill="var(--color-azul)" fillOpacity={0.4} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div style={estilos.seccion}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={estilos.label}>SÍNTESIS DE LA PELEA</span>
            {!ollamaActivo && <span style={estilos.avisoOllama}>IA Desconectada (Modo Manual)</span>}
          </div>
          <textarea 
            style={{...estilos.textarea, flex: 1, minHeight: 200}} 
            value={sintesis}
            onChange={(e) => setSintesis(e.target.value)}
            placeholder="Redactá el análisis aquí o presiona Generar con IA..."
          />
          <button className="boton-secundario" onClick={guardarCambios} disabled={guardando} style={{ fontSize: 12, alignSelf: 'flex-start' }}>
            <Save size={14} style={{ marginRight: 6 }}/> {guardando ? 'Guardando...' : 'Guardar Textos'}
          </button>
        </div>
      </div>

      <div style={estilos.footer}>
        <button 
          className="boton-secundario" 
          onClick={handleGenerarIA}
          disabled={!ollamaActivo || generando}
          style={{ flex: 1, display: 'flex', justifyContent: 'center', gap: 8, opacity: !ollamaActivo ? 0.5 : 1 }}
        >
          <Wand2 size={16} />
          {generando ? 'Analizando...' : 'Generar con IA'}
        </button>
        <button 
          className="boton-primario" 
          onClick={() => {
            onClose(); // Cerrar el panel
            navigate('/informes'); // Ir a la vista de informes
          }}
          style={{ flex: 1, display: 'flex', justifyContent: 'center', gap: 8 }}
        >
          <FileText size={16} />
          Exportar PDF
        </button>
      </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

const estilos = {
  panel: {
    width: 400,
    background: 'var(--color-superficie)',
    borderLeft: '1px solid var(--color-borde)',
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    boxShadow: '-10px 0 30px rgba(0,0,0,0.5)',
    zIndex: 100,
  },
  header: {
    padding: '24px',
    borderBottom: '1px solid var(--color-borde)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  titulo: { fontSize: 16, fontWeight: 700, color: 'var(--color-texto)', margin: 0, textTransform: 'uppercase' },
  subtitulo: { fontSize: 13, color: 'var(--color-texto-suave)', margin: '4px 0 0 0' },
  btnCerrar: { background: 'transparent', border: 'none', color: 'var(--color-texto-suave)', cursor: 'pointer', padding: 4 },
  content: { flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: 24 },
  seccion: { display: 'flex', flexDirection: 'column', gap: 8 },
  label: { fontSize: 11, fontWeight: 600, color: 'var(--color-texto)', textTransform: 'uppercase', letterSpacing: '0.05em' },
  textarea: { background: 'var(--color-superficie-2)', border: '1px solid var(--color-borde)', borderRadius: 8, padding: 12, color: 'var(--color-texto)', fontSize: 13, lineHeight: '1.5', resize: 'none', fontFamily: 'inherit', outline: 'none' },
  avisoOllama: { fontSize: 10, color: 'var(--color-rojo-suave)', fontWeight: 500 },
  footer: { padding: '20px 24px', borderTop: '1px solid var(--color-borde)', display: 'flex', gap: 12 }
}
