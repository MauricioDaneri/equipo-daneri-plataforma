import { useState, useRef, useMemo, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ChevronLeft, Download, Award, Edit3, Eye, Calendar, Sparkles } from 'lucide-react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../servicios/db'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  PieChart, Pie, Cell
} from 'recharts'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

const COLORES = { roja: '#E74C3C', azul: '#3498DB', dorado: '#D4AF37' }

export default function Informe() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [generando, setGenerando] = useState(false)
  const [notasDT, setNotasDT] = useState('')
  const [activeTab, setActiveTab] = useState('data') // 'data' | 'written'
  const [esquinaHeatmap, setEsquinaHeatmap] = useState('roja') // 'roja' | 'azul'
  const [appVersion, setAppVersion] = useState('v2.0')

  useEffect(() => {
    if (window.api?.getVersion) {
      window.api.getVersion().then(v => {
        if (v) setAppVersion(`v${v}`)
      }).catch(err => console.error(err))
    }
  }, [])

  const sesion      = useLiveQuery(() => db.sesiones.get(Number(id)), [id])
  const eventosRaw  = useLiveQuery(() => db.eventos.where('sesionId').equals(Number(id)).toArray(), [id])
  const boxeadorR   = useLiveQuery(() => sesion ? db.boxeadores.get(sesion.boxeadorRojoId) : null, [sesion])
  const boxeadorA   = useLiveQuery(() => sesion ? db.boxeadores.get(sesion.boxeadorAzulId) : null, [sesion])

  // Cargar y persistir notas
  useEffect(() => {
    if (sesion) {
      if (sesion.sintesis) {
        setNotasDT(sesion.sintesis)
      } else {
        const plantillaDefault = `### 1. RESUMEN TÁCTICO GENERAL
El boxeador demostró una excelente lectura de los tiempos y del ring. Su desempeño estratégico fue muy consistente, logrando establecer de forma impecable el control del centro del cuadrilátero durante la mayor parte del combate.

### 2. ARSENAL OFENSIVO Y EFICACIA
- Uso sumamente constante y preciso del Jab de izquierda para mantener la distancia y frenar las entradas del oponente.
- Cruzado de derecha (Cross) de gran potencia y precisión conectado durante las transiciones de contraataque.
- Alto porcentaje de efectividad en combinaciones de tres golpes (Jab-Cross-Gancho) logrados en la media distancia.

### 3. COMPORTAMIENTO DEFENSIVO
- Sólida cobertura y guardias altas para bloquear las arremetidas a la cabeza del rival.
- Excelentes esquivas y desplazamientos laterales coordinados para salir de las cuerdas bajo presión.
- Pequeños descuidos defensivos observados al bajar ligeramente la mano izquierda tras lanzar combinaciones largas.

### 4. PREPARACIÓN FÍSICA Y RITMO
- Resistencia cardiovascular óptima mostrada de forma constante hasta el cuarto asalto.
- Disminución transitoria del volumen de golpeo en los rounds centrales, seguido de un excelente cierre en los rounds finales.

### 5. PLAN DE AJUSTE PARA EL PRÓXIMO COMBATE
- Trabajar intensamente en ejercicios de sombra con énfasis en mantener la mano pasiva en guardia al golpear.
- Incrementar sesiones de acondicionamiento físico de alta intensidad e intervalos explosivos (HIIT) para optimizar la recuperación entre asaltos.`
        setNotasDT(plantillaDefault)
        db.sesiones.update(Number(id), { sintesis: plantillaDefault })
      }
    }
  }, [sesion, id])

  const guardarNotas = (texto) => {
    setNotasDT(texto)
    db.sesiones.update(Number(id), { sintesis: texto })
  }

  /* ── Estadísticas calculadas desde eventos reales ─────────────────── */
  const stats = useMemo(() => {
    if (!eventosRaw || !eventosRaw.length) return null

    const porEsquina = (esq) => eventosRaw.filter(e => e.esquina === esq)
    const roja = porEsquina('roja')
    const azul = porEsquina('azul')

    const contar = (lista, tipo) => {
      return lista.filter(e => e.tipo === tipo).length
    }
    const tipos = ['Jab', 'Recto', 'Cross', 'Gancho', 'Uppercut', 'Swing']

    const kpi = (lista) => {
      const tieneLegados = lista.some(e => e.tipo === 'Golpe Conectado' || e.tipo === 'Golpe Errado');
      let conectados = 0;
      let errados = 0;
      if (tieneLegados) {
        conectados = contar(lista, 'Golpe Conectado');
        errados = contar(lista, 'Golpe Errado');
      } else {
        const golpesOfensivos = lista.filter(e => ['Jab', 'Recto', 'Cross', 'Gancho', 'Uppercut', 'Swing'].includes(e.tipo));
        conectados = golpesOfensivos.filter(e => e.resultado !== 'Errado').length;
        errados = golpesOfensivos.filter(e => e.resultado === 'Errado').length;
      }
      const total = conectados + errados
      return {
        conectados, errados, total,
        eficacia: total > 0 ? Math.round((conectados / total) * 100) : 0,
        clinch:   contar(lista, 'Clinch'),
        esquivas: contar(lista, 'Esquiva'),
        bloqueos: contar(lista, 'Bloqueo'),
        fintas:   contar(lista, 'Finta'),
      }
    }

    const kpiR = kpi(roja)
    const kpiA = kpi(azul)

    const distGolpes = tipos.map(t => ({
      name: t.toUpperCase(),
      Rojo: contar(roja, t),
      Azul: contar(azul, t),
    }))

    const maxRound = Math.max(...eventosRaw.map(e => e.round || 1), 1)
    const porRound = Array.from({ length: maxRound }, (_, i) => {
      const r = i + 1
      const evR = eventosRaw.filter(e => (e.round || 1) === r)
      return {
        name: `R${r}`,
        Rojo: evR.filter(e => e.esquina === 'roja').length,
        Azul: evR.filter(e => e.esquina === 'azul').length,
      }
    })

    const radarData = [
      { subject: 'Golpes',   Rojo: kpiR.total,    Azul: kpiA.total },
      { subject: 'Precisión',Rojo: kpiR.eficacia,  Azul: kpiA.eficacia },
      { subject: 'Defensa',  Rojo: kpiR.bloqueos + kpiR.esquivas, Azul: kpiA.bloqueos + kpiA.esquivas },
      { subject: 'Fintas',   Rojo: kpiR.fintas,   Azul: kpiA.fintas },
      { subject: 'Clinch',   Rojo: kpiR.clinch,   Azul: kpiA.clinch },
    ]

    const pieData = [
      { name: boxeadorR?.nombre || 'Rojo', value: roja.length },
      { name: boxeadorA?.nombre || 'Azul', value: azul.length },
    ]

    const criticos = eventosRaw.filter(e =>
      ['Caída','Amonestación','Corte/Sangrado'].includes(e.tipo)
    ).sort((a,b) => a.timestamp - b.timestamp)

    const fmt = s => { 
      const m=Math.floor(s/60); 
      const sec=Math.floor(s%60); 
      return `${m}:${sec.toString().padStart(2,'0')}` 
    }

    return { kpiR, kpiA, distGolpes, porRound, radarData, pieData, criticos, fmt, maxRound }
  }, [eventosRaw, boxeadorR, boxeadorA])

  /* ── Exportar PDF Premium Dual-Page A4 ──────────────────────────────── */
  const exportarPDF = async () => {
    setGenerando(true)
    try {
      const page1 = document.getElementById('pdf-pagina-1')
      const page2 = document.getElementById('pdf-pagina-2')
      
      // Mostrar temporalmente el contenedor offscreen para la captura
      const parent = page1.parentElement
      parent.style.position = 'relative'
      parent.style.top = '0'
      parent.style.left = '0'
      
      const options = {
        scale: 2,
        useCORS: true,
        backgroundColor: '#0b0b0f',
        logging: false
      }

      const canvas1 = await html2canvas(page1, options)
      const img1 = canvas1.toDataURL('image/png')
      
      const canvas2 = await html2canvas(page2, options)
      const img2 = canvas2.toDataURL('image/png')
      
      // Volver a ocultar
      parent.style.position = 'absolute'
      parent.style.top = '-9999px'
      parent.style.left = '-9999px'
      
      const pdf = new jsPDF('p', 'mm', 'a4')
      pdf.addImage(img1, 'PNG', 0, 0, 210, 297)
      pdf.addPage()
      pdf.addImage(img2, 'PNG', 0, 0, 210, 297)
      
      const nombreArchivo = `Informe_Daneri_${sesion?.nombre || 'Combate'}_${sesion?.fecha || 'Hoy'}`.replace(/\s+/g, '_')
      pdf.save(`${nombreArchivo}.pdf`)
    } catch(e) { 
      console.error("Error al exportar PDF:", e) 
    } finally { 
      setGenerando(false) 
    }
  }

  // Parseador de Markdown local super rápido
  const parsearMarkdown = (texto, enPDF = false) => {
    if (!texto) return null
    return texto.split('\n').map((linea, index) => {
      if (linea.startsWith('### ')) {
        const titulo = linea.replace('### ', '')
        return (
          <h3 
            key={index} 
            style={{ 
              color: 'var(--color-dorado)', 
              fontSize: enPDF ? '12px' : '15px', 
              fontWeight: 700, 
              marginTop: enPDF ? '10px' : '22px', 
              marginBottom: enPDF ? '6px' : '10px', 
              borderBottom: '1px solid rgba(212,175,55,0.15)', 
              paddingBottom: '6px',
              letterSpacing: '0.02em',
              textTransform: 'uppercase'
            }}
          >
            {titulo}
          </h3>
        )
      }
      if (linea.startsWith('- ')) {
        return (
          <li 
            key={index} 
            style={{ 
              color: 'var(--color-texto-suave)', 
              fontSize: enPDF ? '11px' : '13.5px', 
              lineHeight: enPDF ? '1.5' : '1.8', 
              marginLeft: '16px', 
              marginBottom: enPDF ? '3px' : '6px',
              listStyleType: 'square'
            }}
          >
            {linea.replace('- ', '')}
          </li>
        )
      }
      if (linea.trim() === '') return <div key={index} style={{ height: enPDF ? '5px' : '10px' }} />
      return (
        <p 
          key={index} 
          style={{ 
            color: 'var(--color-texto-suave)', 
            fontSize: enPDF ? '11px' : '13.5px', 
            lineHeight: enPDF ? '1.5' : '1.8', 
            margin: enPDF ? '3px 0' : '6px 0', 
            textAlign: 'justify' 
          }}
        >
          {linea}
        </p>
      )
    })
  }

  if (sesion === undefined || eventosRaw === undefined || boxeadorR === undefined || boxeadorA === undefined) {
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
        Cargando Dossier Técnico...
      </div>
    );
  }

  const nombreR = boxeadorR?.nombre || 'Rincón Rojo'
  const nombreA = boxeadorA?.nombre || 'Rincón Azul'
  const nombreAnalizado = esquinaHeatmap === 'roja' ? nombreR : nombreA

  return (
    <div style={{ height:'100%', display:'flex', flexDirection:'column', background:'var(--color-fondo)', overflow:'hidden' }}>
      
      {/* ── TOOLBAR SUPERIOR ─────────────────────────────────────── */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'14px 40px', background:'var(--color-superficie)', borderBottom:'1px solid var(--color-borde)', flexShrink:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:16 }}>
          <button onClick={() => navigate(-1)} style={{ background:'transparent', border:'none', color:'var(--color-texto-suave)', cursor:'pointer', display:'flex', alignItems:'center', gap:6, fontSize:13 }}>
            <ChevronLeft size={18}/> Volver
          </button>
          <div style={{ width: 1, height: 20, background: 'var(--color-borde)' }} />
          <h1 style={{ margin:0, fontSize:17, color:'var(--color-texto)', fontWeight:750, display:'flex', alignItems:'center', gap:8 }}>
            INFORME TÉCNICO <span style={{ color:'var(--color-dorado)', fontSize:14 }}>{nombreR} vs {nombreA}</span>
          </h1>
        </div>
        
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          {/* Selector de pestañas */}
          <div style={{ display:'flex', background:'rgba(255,255,255,0.03)', border:'1px solid var(--color-borde)', borderRadius:8, padding:3 }}>
            <button 
              onClick={() => setActiveTab('data')} 
              style={{ 
                display:'flex', alignItems:'center', gap:6, padding:'6px 14px', border:'none', borderRadius:6, fontSize:12, fontWeight:600, cursor:'pointer',
                background: activeTab === 'data' ? 'var(--color-dorado-alfa)' : 'transparent',
                color: activeTab === 'data' ? 'var(--color-dorado)' : 'var(--color-texto-suave)',
                transition: 'all 0.2s'
              }}
            >
              <Sparkles size={13} /> Métricas y Datos
            </button>
            <button 
              onClick={() => setActiveTab('written')} 
              style={{ 
                display:'flex', alignItems:'center', gap:6, padding:'6px 14px', border:'none', borderRadius:6, fontSize:12, fontWeight:600, cursor:'pointer',
                background: activeTab === 'written' ? 'var(--color-dorado-alfa)' : 'transparent',
                color: activeTab === 'written' ? 'var(--color-dorado)' : 'var(--color-texto-suave)',
                transition: 'all 0.2s'
              }}
            >
              <Edit3 size={13} /> Análisis Técnico
            </button>
          </div>

          <button onClick={exportarPDF} disabled={generando} className="boton-primario" style={{ display:'flex', gap:8, alignItems:'center', padding:'8px 20px', borderRadius:8, fontSize:12 }}>
            <Download size={14}/> {generando ? 'Generando PDF…' : 'Exportar PDF'}
          </button>
        </div>
      </div>

      {/* ── CONTENIDO SCROLLABLE ─────────────────────────────────── */}
      <div style={{ flex:1, overflowY:'auto', padding:'32px 24px 64px 24px', display:'flex', justifyContent:'center' }}>
        <div style={{ width:'100%', maxWidth:1020, display:'flex', flexDirection:'column', gap:28 }}>

          {/* Encabezado Principal de Lujo con Logo oficial */}
          <div style={{ 
            background:'linear-gradient(135deg, rgba(212,175,55,0.08) 0%, rgba(20,20,20,0.85) 100%)', 
            border:'1px solid rgba(212,175,55,0.25)', 
            borderRadius:16, 
            padding:'24px 32px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
          }}>
            <div style={{ display:'flex', alignItems:'center', gap:20 }}>
              <img 
                src="/assets/logo-small.png" 
                alt="Equipo Daneri" 
                style={{ 
                  width:60, 
                  height:60, 
                  objectFit:'contain',
                  filter: 'drop-shadow(0 0 8px rgba(212,175,55,0.5))' 
                }} 
              />
              <div>
                <div style={{ fontSize:10, color:'var(--color-dorado)', fontWeight:800, letterSpacing:4, textTransform:'uppercase' }}>Equipo Daneri · Tactical Analytics</div>
                <div style={{ fontSize:24, fontWeight:900, color:'var(--color-texto)', marginTop:4 }}>{nombreR} <span style={{color:'var(--color-texto-suave)', fontWeight:400}}>vs</span> {nombreA}</div>
                <div style={{ fontSize:12, color:'var(--color-texto-suave)', marginTop:4 }}>
                  Fecha: <span style={{color:'var(--color-texto)', fontWeight:600}}>{sesion.fecha}</span> · Rounds: <span style={{color:'var(--color-texto)', fontWeight:600}}>{stats?.maxRound || 0}</span> · Eventos: <span style={{color:'var(--color-texto)', fontWeight:600}}>{eventosRaw.length}</span>
                </div>
              </div>
            </div>
            
            <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontSize: 10, color: 'var(--color-texto-suave)', textTransform: 'uppercase', letterSpacing: 1.5 }}>ESTADO DE INFORME</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-exito)', background: 'rgba(39,174,96,0.12)', border: '1px solid rgba(39,174,96,0.3)', padding: '4px 10px', borderRadius: 4, display: 'inline-block' }}>
                ✓ LISTO PARA IMPRESIÓN
              </span>
            </div>
          </div>

          {!stats ? (
            <div style={{ textAlign:'center', padding:60, color:'var(--color-texto-muted)', background: 'var(--color-superficie)', borderRadius: 14, border: '1px solid var(--color-borde)' }}>Sin eventos registrados en esta sesión.</div>
          ) : (
            <>
              {/* TAB 1: DATOS Y MÉTRICAS */}
              {activeTab === 'data' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                  
                  {/* KPIs COMPARATIVOS */}
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
                    {[
                      { label: nombreR, kpi: stats.kpiR, color: COLORES.roja },
                      { label: nombreA, kpi: stats.kpiA, color: COLORES.azul },
                    ].map(({ label, kpi, color }) => (
                      <div key={label} style={{ background:'var(--color-superficie)', border:`1px solid ${color}26`, borderRadius:14, padding:24, boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}>
                        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:18 }}>
                          <div style={{ width:12, height:12, borderRadius:'50%', background:color, boxShadow: `0 0 8px ${color}` }} />
                          <span style={{ color, fontWeight:800, fontSize:13, textTransform:'uppercase', letterSpacing:2 }}>{label}</span>
                        </div>
                        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12 }}>
                          {[
                            { t:'Conectados', v:kpi.conectados, c:'var(--color-exito)' },
                            { t:'Errados',    v:kpi.errados,    c:'var(--color-rojo-suave)' },
                            { t:'Eficacia',   v:`${kpi.eficacia}%`, c:'var(--color-dorado)' },
                            { t:'Esquivas',   v:kpi.esquivas,   c:'var(--color-texto-suave)' },
                            { t:'Bloqueos',   v:kpi.bloqueos,   c:'var(--color-texto-suave)' },
                            { t:'Fintas',     v:kpi.fintas,     c:'var(--color-texto-suave)' },
                          ].map(({t,v,c}) => (
                            <div key={t} style={{ background:'rgba(255,255,255,0.02)', border: '1px solid var(--color-borde)', borderRadius:8, padding:'10px 12px', textAlign:'center' }}>
                              <div style={{ fontSize:22, fontWeight:900, color:c }}>{v}</div>
                              <div style={{ fontSize:9, color:'var(--color-texto-suave)', textTransform:'uppercase', letterSpacing:1, marginTop:4 }}>{t}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* SECCIÓN HEATMAP */}
                  <div style={{ background: 'var(--color-superficie)', border: '1px solid var(--color-borde)', borderRadius: 14, padding: 24 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 4, height: 16, background: 'var(--color-dorado)', borderRadius: 2 }} />
                        <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--color-texto)' }}>DISTRIBUCIÓN ANATÓMICA DE IMPACTOS</h2>
                      </div>
                      
                      {/* Selector de esquina para el heatmap en pantalla */}
                      <div style={{ display: 'flex', background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: 2, border: '1px solid var(--color-borde)' }}>
                        <button 
                          onClick={() => setEsquinaHeatmap('roja')}
                          style={{
                            padding: '4px 12px', border: 'none', borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'pointer',
                            background: esquinaHeatmap === 'roja' ? COLORES.roja : 'transparent',
                            color: esquinaHeatmap === 'roja' ? '#fff' : 'var(--color-texto-suave)',
                            transition: 'all 0.2s'
                          }}
                        >
                          {nombreR} (Rojo)
                        </button>
                        <button 
                          onClick={() => setEsquinaHeatmap('azul')}
                          style={{
                            padding: '4px 12px', border: 'none', borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'pointer',
                            background: esquinaHeatmap === 'azul' ? COLORES.azul : 'transparent',
                            color: esquinaHeatmap === 'azul' ? '#fff' : 'var(--color-texto-suave)',
                            transition: 'all 0.2s'
                          }}
                        >
                          {nombreA} (Azul)
                        </button>
                      </div>
                    </div>
                    
                    <HeatmapEstatico eventos={eventosRaw} esquina={esquinaHeatmap} boxeadorNombre={nombreAnalizado} />
                  </div>

                  {/* GRÁFICOS GRIDS */}
                  <div style={{ display:'grid', gridTemplateColumns:'1.3fr 1fr', gap:20 }}>
                    {/* Distribución de golpes */}
                    <div style={{ background:'var(--color-superficie)', border:'1px solid var(--color-borde)', borderRadius:14, padding:24 }}>
                      <div style={{ fontSize:12, fontWeight:700, color:'var(--color-dorado)', textTransform:'uppercase', letterSpacing:2, marginBottom:18 }}>Distribución de Golpes</div>
                      <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={stats.distGolpes} barSize={18}>
                          <XAxis dataKey="name" stroke="var(--color-texto-suave)" fontSize={12} tickLine={false}/>
                          <YAxis stroke="var(--color-texto-suave)" fontSize={11} tickLine={false} axisLine={false}/>
                          <Tooltip contentStyle={{ background:'var(--color-superficie-2)', border:'1px solid var(--color-borde)', borderRadius:8, color: '#fff' }}/>
                          <Legend wrapperStyle={{ fontSize:12 }}/>
                          <Bar dataKey="Rojo" fill={COLORES.roja} radius={[4,4,0,0]}/>
                          <Bar dataKey="Azul" fill={COLORES.azul} radius={[4,4,0,0]}/>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Participación total */}
                    <div style={{ background:'var(--color-superficie)', border:'1px solid var(--color-borde)', borderRadius:14, padding:24, display:'flex', flexDirection:'column', alignItems:'center', justifyContent: 'center' }}>
                      <div style={{ fontSize:12, fontWeight:700, color:'var(--color-dorado)', textTransform:'uppercase', letterSpacing:2, marginBottom:18, width: '100%' }}>Participación Total</div>
                      <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <PieChart width={200} height={200}>
                          <Pie data={stats.pieData} cx="50%" cy="50%" outerRadius={70} dataKey="value" label={({name,percent}) => `${name.substring(0,6)} ${(percent*100).toFixed(0)}%`} labelLine={false} style={{ fontSize: 10, fontWeight: 600 }}>
                            <Cell fill={COLORES.roja}/>
                            <Cell fill={COLORES.azul}/>
                          </Pie>
                          <Tooltip contentStyle={{ background:'var(--color-superficie-2)', border:'1px solid var(--color-borde)', borderRadius:8 }}/>
                        </PieChart>
                      </div>
                    </div>
                  </div>

                  <div style={{ display:'grid', gridTemplateColumns:'1.3fr 1fr', gap:20 }}>
                    {/* Actividad por Round */}
                    <div style={{ background:'var(--color-superficie)', border:'1px solid var(--color-borde)', borderRadius:14, padding:24 }}>
                      <div style={{ fontSize:12, fontWeight:700, color:'var(--color-dorado)', textTransform:'uppercase', letterSpacing:2, marginBottom:18 }}>Actividad por Round</div>
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={stats.porRound} barSize={14}>
                          <XAxis dataKey="name" stroke="var(--color-texto-suave)" fontSize={11} tickLine={false}/>
                          <YAxis stroke="var(--color-texto-suave)" fontSize={11} tickLine={false} axisLine={false}/>
                          <Tooltip contentStyle={{ background:'var(--color-superficie-2)', border:'1px solid var(--color-borde)', borderRadius:8 }}/>
                          <Legend wrapperStyle={{ fontSize:12 }}/>
                          <Bar dataKey="Rojo" fill={COLORES.roja} radius={[3,3,0,0]}/>
                          <Bar dataKey="Azul" fill={COLORES.azul} radius={[3,3,0,0]}/>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Radar Perfil comparativo */}
                    <div style={{ background:'var(--color-superficie)', border:'1px solid var(--color-borde)', borderRadius:14, padding:24, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <div style={{ fontSize:12, fontWeight:700, color:'var(--color-dorado)', textTransform:'uppercase', letterSpacing:2, marginBottom:8, width: '100%' }}>Perfil Comparativo</div>
                      <RadarChart width={220} height={190} data={stats.radarData} cx="50%" cy="50%" outerRadius={60}>
                        <PolarGrid stroke="var(--color-borde)"/>
                        <PolarAngleAxis dataKey="subject" tick={{ fill:'var(--color-texto-suave)', fontSize:10 }}/>
                        <PolarRadiusAxis tick={false} axisLine={false}/>
                        <Radar name={nombreR} dataKey="Rojo" stroke={COLORES.roja} fill={COLORES.roja} fillOpacity={0.25}/>
                        <Radar name={nombreA} dataKey="Azul" stroke={COLORES.azul} fill={COLORES.azul} fillOpacity={0.25}/>
                        <Legend wrapperStyle={{ fontSize:10 }}/>
                      </RadarChart>
                    </div>
                  </div>

                  {/* EVENTOS CRÍTICOS */}
                  {stats.criticos.length > 0 && (
                    <div style={{ background:'var(--color-superficie)', border:'1px solid var(--color-borde)', borderRadius:14, padding:24 }}>
                      <div style={{ fontSize:12, fontWeight:700, color:'var(--color-dorado)', textTransform:'uppercase', letterSpacing:2, marginBottom:16 }}>Eventos Críticos Registrados ({stats.criticos.length})</div>
                      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(230px,1fr))', gap:10 }}>
                        {stats.criticos.map((ev,i) => (
                          <div key={i} style={{ display:'flex', gap:12, alignItems:'center', background:'rgba(231,76,60,0.06)', border:'1px solid rgba(231,76,60,0.18)', borderRadius:8, padding:'10px 14px' }}>
                            <div style={{ fontFamily:'monospace', fontSize:12, color:'var(--color-dorado)', flexShrink:0, fontWeight:700 }}>R{ev.round||1} · {stats.fmt(ev.timestamp)}</div>
                            <div style={{ fontSize:12, color:'var(--color-texto)', fontWeight: 500 }}>{ev.tipo}</div>
                            <div style={{ fontSize:9, color: ev.esquina==='roja'?COLORES.roja:COLORES.azul, marginLeft:'auto', fontWeight:800, textTransform:'uppercase', letterSpacing: 0.5 }}>{ev.esquina}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                </div>
              )}

              {/* TAB 2: ANÁLISIS ESCRITO (SÍNTESIS DT) */}
              {activeTab === 'written' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 24, alignItems: 'stretch' }}>
                  
                  {/* Vista Previa Elegante (Tarjetas parsed con excelente interlineado) */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--color-dorado)' }}>
                      <Eye size={16} />
                      <span style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1.5 }}>VISUALIZACIÓN DE INFORME FORMAL</span>
                    </div>

                    <div style={{ 
                      background: 'rgba(255, 255, 255, 0.02)', 
                      border: '1px solid var(--color-dorado-alfa)', 
                      borderRadius: 14, 
                      padding: '24px 30px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 16,
                      boxShadow: '0 4px 24px rgba(0,0,0,0.15)'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px dashed var(--color-borde)', paddingBottom: 12 }}>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--color-dorado)' }}>INFORME TÁCTICO Y SCOUTING</div>
                          <div style={{ fontSize: 11, color: 'var(--color-texto-suave)' }}>Analista Principal: Mauricio Daneri</div>
                        </div>
                        <Award size={36} color="rgba(212,175,55,0.3)" />
                      </div>
                      
                      {/* Cuerpo parsed */}
                      <div style={{ color: 'var(--color-texto-suave)', lineHeight: 1.8 }}>
                        {parsearMarkdown(notasDT)}
                      </div>

                      {/* Firma */}
                      <div style={{ borderTop: '1px solid var(--color-borde)', marginTop: 30, paddingTop: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--color-texto)' }}>MAURICIO DANERI</div>
                          <div style={{ fontSize: 10, color: 'var(--color-texto-suave)', textTransform: 'uppercase', letterSpacing: 1 }}>Analista · Equipo Daneri</div>
                        </div>
                        <span style={{ fontFamily: 'monospace', fontSize: 10, color: 'var(--color-texto-muted)' }}>ID: #00{sesion.id}</span>
                      </div>
                    </div>
                  </div>

                  {/* Panel del Editor en tiempo real */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--color-dorado)' }}>
                      <Edit3 size={16} />
                      <span style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1.5 }}>EDITOR DE NOTAS (PERSISTENCIA AUT.)</span>
                    </div>

                    <div style={{ background: 'var(--color-superficie)', border: '1px solid var(--color-borde)', borderRadius: 14, padding: 24, display: 'flex', flexDirection: 'column', gap: 14, height: '100%' }}>
                      <div style={{ fontSize: 12, color: 'var(--color-texto-suave)', lineHeight: 1.5 }}>
                        Podés editar las observaciones tácticas usando Markdown simple. Los cambios se guardan de forma instantánea en la base de datos local al salir del editor (perder el foco).
                      </div>
                      <textarea
                        value={notasDT}
                        onChange={e => setNotasDT(e.target.value)}
                        onBlur={e => guardarNotas(e.target.value)}
                        placeholder="Escribí las observaciones, ajustes tácticos y recomendaciones..."
                        style={{ 
                          width:'100%', 
                          flex: 1,
                          minHeight: 480, 
                          background:'var(--color-superficie-2)', 
                          border:'1px solid var(--color-borde)', 
                          borderRadius:8, 
                          color:'var(--color-texto)', 
                          padding:'16px', 
                          fontSize:13, 
                          lineHeight:1.75, 
                          resize:'none', 
                          outline:'none', 
                          fontFamily:'monospace', 
                          boxSizing:'border-box',
                          borderLeft: '3px solid var(--color-dorado)'
                        }}
                      />
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--color-texto-muted)' }}>
                        <span>Soportado: ### Título, - Viñeta</span>
                        <span>Autoguardado: Activo</span>
                      </div>
                    </div>
                  </div>

                </div>
              )}

              {/* FIRMA DE SECCIÓN */}
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', borderTop:'1px solid var(--color-borde)', paddingTop:24, marginTop: 12, flexShrink: 0 }}>
                <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                  <Award size={28} color="var(--color-dorado)"/>
                  <div>
                    <div style={{ color:'var(--color-texto)', fontSize:13, fontWeight:800 }}>MAURICIO DANERI</div>
                    <div style={{ color:'var(--color-texto-suave)', fontSize:10, textTransform: 'uppercase', letterSpacing: 0.5 }}>Analista · Equipo Daneri</div>
                  </div>
                </div>
                <div style={{ textAlign:'right', fontSize:10, color:'var(--color-texto-muted)' }}>
                  <div>Generado por Plataforma Daneri {appVersion}</div>
                  <div>© 2026 Equipo Daneri Analytics</div>
                </div>
              </div>
            </>
          )}

        </div>
      </div>

      {/* ── CONTENEDOR OCULTO PARA IMPRESIÓN A4 DUAL-PAGE ──────────────── */}
      <div style={{ position: 'absolute', top: -9999, left: -9999, width: '800px', display: 'flex', flexDirection: 'column' }}>
        
        {/* PÁGINA 1: DATOS PUROS */}
        <div id="pdf-pagina-1" style={estilosPDF.pagina}>
          
          {/* Header */}
          <div style={estilosPDF.header}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <img 
                src="/assets/logo-small.png" 
                alt="Logo" 
                style={{ 
                  width: 50, 
                  height: 50, 
                  objectFit: 'contain',
                  filter: 'drop-shadow(0 0 6px rgba(212,175,55,0.4))'
                }} 
              />
              <div>
                <h1 style={{ margin: 0, fontSize: 18, color: '#F0F0F0', fontWeight: 800, letterSpacing: '0.05em' }}>EQUIPO DANERI</h1>
                <p style={{ margin: 0, fontSize: 10, color: '#D4AF37', fontWeight: 700, letterSpacing: '0.2em' }}>INFORME TÁCTICO Y SCOUTING</p>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: 9, color: '#9A9A9A', textTransform: 'uppercase', letterSpacing: 1 }}>SESIÓN OFICIAL</span>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#F0F0F0', marginTop: 2 }}>{sesion.fecha}</div>
            </div>
          </div>

          {/* Ficha Boxeadores */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)', border: '1px solid #2A2A2A', borderRadius: 8, padding: '12px 20px', marginBottom: 20 }}>
            <div>
              <span style={{ fontSize: 9, color: '#9A9A9A', textTransform: 'uppercase' }}>Combate de Análisis</span>
              <div style={{ fontSize: 16, fontWeight: 900, color: '#F0F0F0' }}>{nombreR} vs {nombreA}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: 9, color: '#9A9A9A', textTransform: 'uppercase' }}>Rounds Analizados</span>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#D4AF37' }}>{stats?.maxRound || 0} Rounds</div>
            </div>
          </div>

          {/* KPIs Grids */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
            {[
              { label: nombreR, kpi: stats?.kpiR, color: COLORES.roja },
              { label: nombreA, kpi: stats?.kpiA, color: COLORES.azul },
            ].map(({ label, kpi, color }, idx) => (
              <div key={idx} style={{ border: `1px solid ${color}40`, background: 'rgba(0,0,0,0.2)', borderRadius: 8, padding: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />
                  <span style={{ fontSize: 11, fontWeight: 800, color, textTransform: 'uppercase', letterSpacing: 1.5 }}>{label}</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                  {[
                    { t: 'Conectados', v: kpi?.conectados || 0, c: '#27AE60' },
                    { t: 'Errados', v: kpi?.errados || 0, c: '#E74C3C' },
                    { t: 'Eficacia', v: `${kpi?.eficacia || 0}%`, c: '#D4AF37' },
                  ].map(({ t, v, c }) => (
                    <div key={t} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid #2A2A2A', borderRadius: 6, padding: '6px 4px', textAlign: 'center' }}>
                      <div style={{ fontSize: 15, fontWeight: 900, color: c }}>{v}</div>
                      <div style={{ fontSize: 8, color: '#9A9A9A', textTransform: 'uppercase', marginTop: 2 }}>{t}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* 4 Recharts Charts (Explicit dimensions to avoid off-screen collapse) */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
            {/* Chart 1 */}
            <div style={{ background: '#1E1E1E', border: '1px solid #2A2A2A', borderRadius: 8, padding: '12px 16px' }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: '#D4AF37', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>Distribución de Golpes</div>
              {stats && (
                <BarChart width={320} height={140} data={stats.distGolpes} barSize={10} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
                  <XAxis dataKey="name" stroke="#9A9A9A" fontSize={9} tickLine={false} />
                  <YAxis stroke="#9A9A9A" fontSize={8} tickLine={false} axisLine={false} />
                  <Bar dataKey="Rojo" fill={COLORES.roja} radius={[2,2,0,0]}/>
                  <Bar dataKey="Azul" fill={COLORES.azul} radius={[2,2,0,0]}/>
                </BarChart>
              )}
            </div>
            
            {/* Chart 2 */}
            <div style={{ background: '#1E1E1E', border: '1px solid #2A2A2A', borderRadius: 8, padding: '12px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: '#D4AF37', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 5, width: '100%' }}>Participación Total</div>
              {stats && (
                <PieChart width={140} height={140}>
                  <Pie data={stats.pieData} cx="50%" cy="50%" outerRadius={46} dataKey="value" label={({name,percent}) => `${name.substring(0,5)} ${(percent*100).toFixed(0)}%`} labelLine={false} style={{ fontSize: 7, fontWeight: 600 }}>
                    <Cell fill={COLORES.roja}/>
                    <Cell fill={COLORES.azul}/>
                  </Pie>
                </PieChart>
              )}
            </div>

            {/* Chart 3 */}
            <div style={{ background: '#1E1E1E', border: '1px solid #2A2A2A', borderRadius: 8, padding: '12px 16px' }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: '#D4AF37', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>Actividad por Round</div>
              {stats && (
                <BarChart width={320} height={140} data={stats.porRound} barSize={8} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
                  <XAxis dataKey="name" stroke="#9A9A9A" fontSize={8} tickLine={false} />
                  <YAxis stroke="#9A9A9A" fontSize={8} tickLine={false} axisLine={false} />
                  <Bar dataKey="Rojo" fill={COLORES.roja} radius={[2,2,0,0]}/>
                  <Bar dataKey="Azul" fill={COLORES.azul} radius={[2,2,0,0]}/>
                </BarChart>
              )}
            </div>

            {/* Chart 4 */}
            <div style={{ background: '#1E1E1E', border: '1px solid #2A2A2A', borderRadius: 8, padding: '12px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: '#D4AF37', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 5, width: '100%' }}>Perfil Comparativo</div>
              {stats && (
                <RadarChart width={160} height={140} data={stats.radarData} cx="50%" cy="50%" outerRadius={42}>
                  <PolarGrid stroke="#2A2A2A" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#9A9A9A', fontSize: 7 }} />
                  <PolarRadiusAxis tick={false} axisLine={false} />
                  <Radar name={nombreR} dataKey="Rojo" stroke={COLORES.roja} fill={COLORES.roja} fillOpacity={0.2}/>
                  <Radar name={nombreA} dataKey="Azul" stroke={COLORES.azul} fill={COLORES.azul} fillOpacity={0.2}/>
                </RadarChart>
              )}
            </div>
          </div>

          {/* Double Human Heatmap Silhouette */}
          <div style={{ background: 'rgba(0,0,0,0.15)', border: '1px solid #2A2A2A', borderRadius: 8, padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 10, fontWeight: 800, color: '#D4AF37', textTransform: 'uppercase', letterSpacing: 1.5 }}>MAPA DE CALOR DE IMPACTOS ({nombreAnalizado})</span>
              <div style={{ display: 'flex', gap: 10, fontSize: 8 }}>
                <span style={{ color: '#27AE60' }}>● Conectado/Bloqueo</span>
                <span style={{ color: '#E74C3C' }}>● Errado</span>
                <span style={{ color: '#D4AF37' }}>● Otros</span>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 30 }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <span style={{ fontSize: 8, fontWeight: 600, color: '#E74C3C', textTransform: 'uppercase' }}>Ataque (Impactos Dados)</span>
                {stats && <SVGStaticSilhouette eventos={eventosRaw} esquina={esquinaHeatmap} silueta="ataque" />}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <span style={{ fontSize: 8, fontWeight: 600, color: '#3498DB', textTransform: 'uppercase' }}>Defensa (Impactos Recibidos)</span>
                {stats && <SVGStaticSilhouette eventos={eventosRaw} esquina={esquinaHeatmap} silueta="defensa" />}
              </div>
            </div>
          </div>

          {/* Footer Pág 1 */}
          <div style={estilosPDF.footer}>
            <span>Plataforma Analítica Equipo Daneri — Datos Puros</span>
            <span>Página 1 de 2</span>
          </div>

        </div>

        {/* PÁGINA 2: ANÁLISIS ESCRITO */}
        <div id="pdf-pagina-2" style={estilosPDF.pagina}>
          
          {/* Header */}
          <div style={estilosPDF.header}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <img 
                src="/assets/logo-small.png" 
                alt="Logo" 
                style={{ 
                  width: 50, 
                  height: 50, 
                  objectFit: 'contain',
                  filter: 'drop-shadow(0 0 6px rgba(212,175,55,0.4))'
                }} 
              />
              <div>
                <h1 style={{ margin: 0, fontSize: 18, color: '#F0F0F0', fontWeight: 800, letterSpacing: '0.05em' }}>EQUIPO DANERI</h1>
                <p style={{ margin: 0, fontSize: 10, color: '#D4AF37', fontWeight: 700, letterSpacing: '0.2em' }}>INFORME TÁCTICO Y SCOUTING</p>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: 9, color: '#9A9A9A', textTransform: 'uppercase', letterSpacing: 1 }}>ANÁLISIS COGNITIVO</span>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#F0F0F0', marginTop: 2 }}>{sesion.fecha}</div>
            </div>
          </div>

          {/* Ficha Boxeadores */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)', border: '1px solid #2A2A2A', borderRadius: 8, padding: '12px 20px', marginBottom: 20 }}>
            <div>
              <span style={{ fontSize: 9, color: '#9A9A9A', textTransform: 'uppercase' }}>Atleta Scout</span>
              <div style={{ fontSize: 15, fontWeight: 900, color: '#F0F0F0' }}>{nombreR} vs {nombreA}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: 9, color: '#9A9A9A', textTransform: 'uppercase' }}>Analista Principal</span>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#D4AF37' }}>MAURICIO DANERI</div>
            </div>
          </div>

          {/* Coaching Narrative Cards (Parsed Markdown) */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ 
              background: 'rgba(255, 255, 255, 0.02)', 
              border: '1px solid rgba(212,175,55,0.2)', 
              borderRadius: 8, 
              padding: '20px 24px', 
              fontSize: '12px',
              lineHeight: '1.75', 
              color: '#F0F0F0'
            }}>
              {parsearMarkdown(notasDT, true)}
            </div>
          </div>

          {/* Signature and Brand block */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #2A2A2A', paddingTop: 20, marginTop: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Award size={24} color="#D4AF37"/>
              <div>
                <div style={{ color: '#F0F0F0', fontSize: 11, fontWeight: 800 }}>MAURICIO DANERI</div>
                <div style={{ color: '#9A9A9A', fontSize: 8, textTransform: 'uppercase' }}>Analista · Equipo Daneri</div>
              </div>
            </div>
            <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
              <div style={{ width: 120, height: 1, background: '#D4AF37', marginBottom: 4 }} />
              <div style={{ fontSize: 9, color: '#9A9A9A', fontWeight: 600 }}>FIRMA AUTORIZADA DT</div>
              <div style={{ fontSize: 7, color: '#555' }}>© 2026 Equipo Daneri Analytics</div>
            </div>
          </div>

          {/* Footer Pág 2 */}
          <div style={estilosPDF.footer}>
            <span>Plataforma Analítica Equipo Daneri — Conclusiones Tácticas</span>
            <span>Página 2 de 2</span>
          </div>

        </div>

      </div>

    </div>
  )
}

/* ── COMPONENTE HELPER HEATMAP ESTÁTICO ────────────────────────────────── */
function HeatmapEstatico({ eventos, esquina, boxeadorNombre }) {
  const filtrados = eventos.filter(ev => 
    ev.esquina === esquina && ev.coordX !== undefined && ev.coordY !== undefined
  )

  const renderSilueta = (silueta) => {
    let strokeColor = silueta === 'ataque' ? 'rgba(231, 76, 60, 0.65)' : 'rgba(52, 152, 219, 0.65)'
    let glowColor = silueta === 'ataque' ? 'rgba(231, 76, 60, 0.3)' : 'rgba(52, 152, 219, 0.3)'
    let glowId = `glow-${silueta}-${esquina}-screen`
    
    return (
      <svg
        viewBox="0 0 200 380"
        style={{
          width: '100%',
          height: 330,
          background: 'rgba(20, 20, 20, 0.75)',
          border: '1px solid var(--color-borde)',
          borderRadius: 12,
          padding: 8,
          boxSizing: 'border-box',
          boxShadow: `0 4px 20px ${glowColor}`
        }}
      >
        <defs>
          <filter id={glowId} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>
        
        {/* hombros y trapecios */}
        <path d="M 65 95 C 40 100, 25 115, 20 135 C 40 120, 75 110, 85 110 L 115 110 C 125 110, 160 120, 180 135 C 175 115, 160 100, 135 95 Z" fill="#252525" stroke={strokeColor} strokeWidth="1.5" />
        {/* pecho pectorales */}
        <path d="M 45 135 C 45 170, 75 185, 100 185 C 125 185, 155 170, 155 135 C 125 145, 75 145, 45 135 Z" fill="#1E1E1E" stroke={strokeColor} strokeWidth="1.5" />
        <path d="M 100 138 L 100 185" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
        <path d="M 50 170 C 70 175, 90 175, 98 180" fill="none" stroke="rgba(0,0,0,0.3)" strokeWidth="2" />
        <path d="M 150 170 C 130 175, 110 175, 102 180" fill="none" stroke="rgba(0,0,0,0.3)" strokeWidth="2" />
        {/* abdomen abs */}
        <path d="M 55 185 C 55 240, 65 310, 65 350 L 135 350 C 135 310, 145 240, 145 185 C 125 195, 75 195, 55 185 Z" fill="#252525" stroke={strokeColor} strokeWidth="1.5" />
        <line x1="100" y1="185" x2="100" y2="340" stroke="rgba(255,255,255,0.08)" strokeWidth="1.5" />
        <path d="M 70 220 Q 100 230 130 220 M 68 260 Q 100 270 132 260 M 67 300 Q 100 310 133 300" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1.5" />
        {/* oblicuos */}
        <path d="M 55 185 C 45 230, 50 280, 65 350 L 75 350 C 65 280, 60 230, 65 185 Z" fill="rgba(0,0,0,0.2)" />
        <path d="M 145 185 C 155 230, 150 280, 135 350 L 125 350 C 135 280, 140 230, 135 185 Z" fill="rgba(0,0,0,0.2)" />
        {/* shorts cinturón */}
        <path d="M 60 350 L 140 350 C 138 370, 135 385, 130 395 L 70 395 C 65 385, 62 370, 60 350 Z" fill="rgba(212, 175, 55, 0.12)" stroke={strokeColor} strokeWidth="1.5" />
        <path d="M 60 350 Q 100 360 140 350 L 138 375 Q 100 385 62 375 Z" fill="rgba(0,0,0,0.4)" stroke={strokeColor} strokeWidth="1.5" />
        <circle cx="100" cy="365" r="8" fill="#D4AF37" opacity="0.8" />
        {/* brazo izquierdo */}
        <path d="M 20 135 C 10 160, 5 190, 15 210 C 25 230, 45 220, 55 185 C 40 185, 25 160, 45 135 Z" fill="#252525" stroke={strokeColor} strokeWidth="1.5" />
        <path d="M 15 210 C 10 240, 25 260, 45 270 L 60 240 C 45 230, 35 215, 55 185" fill="#1E1E1E" stroke={strokeColor} strokeWidth="1.5" />
        <path d="M 40 265 C 25 275, 25 305, 45 315 C 65 325, 80 300, 70 275 Z" fill="rgba(20,20,20,0.9)" stroke={strokeColor} strokeWidth="2" />
        <circle cx="55" cy="290" r="18" fill="rgba(255,255,255,0.05)" />
        {/* brazo derecho */}
        <path d="M 180 135 C 190 160, 195 190, 185 210 C 175 230, 155 220, 145 185 C 160 185, 175 160, 155 135 Z" fill="#252525" stroke={strokeColor} strokeWidth="1.5" />
        <path d="M 185 210 C 190 240, 175 260, 155 270 L 140 240 C 155 230, 165 215, 145 185" fill="#1E1E1E" stroke={strokeColor} strokeWidth="1.5" />
        <path d="M 160 265 C 175 275, 175 305, 155 315 C 135 325, 120 300, 130 275 Z" fill="rgba(20,20,20,0.9)" stroke={strokeColor} strokeWidth="2" />
        <circle cx="145" cy="290" r="18" fill="rgba(255,255,255,0.05)" />
        {/* cuello */}
        <path d="M 85 95 C 80 80, 85 65, 85 65 L 115 65 C 115 65, 120 80, 115 95 Z" fill="#141414" stroke={strokeColor} strokeWidth="1.5" />
        {/* cabeza */}
        <path d="M 85 65 C 75 40, 80 15, 100 15 C 120 15, 125 40, 115 65 Z" fill="#141414" stroke={strokeColor} strokeWidth="1.5" />
        
        <line x1="100" y1="20" x2="100" y2="378" stroke="rgba(255,255,255,0.05)" strokeDasharray="5,5" />
        <line x1="20" y1="115" x2="180" y2="115" stroke="rgba(255,255,255,0.05)" strokeDasharray="5,5" />

        {/* Puntos de impacto mapeados */}
        {filtrados
          .filter(ev => {
            const esAtaqueEvent = ev.tipoSilueta === 'ataque' || ['Jab', 'Cross', 'Gancho', 'Uppercut', 'Golpe Conectado'].includes(ev.tipo)
            const esDefensaEvent = ev.tipoSilueta === 'defensa' || ['Bloqueo', 'Esquiva', 'Clinch'].includes(ev.tipo)
            return silueta === 'ataque' ? esAtaqueEvent : esDefensaEvent
          })
          .map((ev, i) => {
            const dotColor = ev.tipo === 'Golpe Conectado' || ev.tipo === 'Bloqueo'
              ? '#27AE60' 
              : ev.tipo === 'Golpe Errado' 
                ? '#E74C3C' 
                : '#D4AF37'

            return (
              <g key={i}>
                <circle cx={ev.coordX} cy={ev.coordY} r={12} fill={dotColor} opacity={0.25} />
                <circle cx={ev.coordX} cy={ev.coordY} r={5.5} fill={dotColor} stroke="#ffffff" strokeWidth={1} />
              </g>
            )
          })}
      </svg>
    )
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-rojo-suave)', textTransform: 'uppercase', letterSpacing: 1 }}>🥊 Silueta de Ataque (Impactos Propios)</span>
        {renderSilueta('ataque')}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-azul-suave)', textTransform: 'uppercase', letterSpacing: 1 }}>🛡️ Silueta de Defensa (Impactos Recibidos)</span>
        {renderSilueta('defensa')}
      </div>
    </div>
  )
}

/* ── COMPONENTE SILUETA ESTÁTICA PARA EL PDF ────────────────────────────── */
function SVGStaticSilhouette({ eventos, esquina, silueta }) {
  const filtrados = eventos.filter(ev => 
    ev.esquina === esquina && ev.coordX !== undefined && ev.coordY !== undefined
  )
  
  const strokeColor = silueta === 'ataque' ? 'rgba(231, 76, 60, 0.65)' : 'rgba(52, 152, 219, 0.65)'
  
  return (
    <svg
      viewBox="0 0 200 380"
      style={{
        width: 140,
        height: 250,
        background: 'rgba(20, 20, 20, 0.85)',
        border: '1px solid #2A2A2A',
        borderRadius: 8,
        padding: 5,
        boxSizing: 'border-box'
      }}
    >
      <path d="M 65 95 C 40 100, 25 115, 20 135 C 40 120, 75 110, 85 110 L 115 110 C 125 110, 160 120, 180 135 C 175 115, 160 100, 135 95 Z" fill="#252525" stroke={strokeColor} strokeWidth="1.5" />
      <path d="M 45 135 C 45 170, 75 185, 100 185 C 125 185, 155 170, 155 135 C 125 145, 75 145, 45 135 Z" fill="#1E1E1E" stroke={strokeColor} strokeWidth="1.5" />
      <path d="M 100 138 L 100 185" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
      <path d="M 55 185 C 55 240, 65 310, 65 350 L 135 350 C 135 310, 145 240, 145 185 C 125 195, 75 195, 55 185 Z" fill="#252525" stroke={strokeColor} strokeWidth="1.5" />
      <line x1="100" y1="185" x2="100" y2="340" stroke="rgba(255,255,255,0.08)" strokeWidth="1.5" />
      <path d="M 60 350 L 140 350 C 138 370, 135 385, 130 395 L 70 395 C 65 385, 62 370, 60 350 Z" fill="rgba(212, 175, 55, 0.12)" stroke={strokeColor} strokeWidth="1.5" />
      
      <path d="M 20 135 C 10 160, 5 190, 15 210 C 25 230, 45 220, 55 185 C 40 185, 25 160, 45 135 Z" fill="#252525" stroke={strokeColor} strokeWidth="1.5" />
      <path d="M 15 210 C 10 240, 25 260, 45 270 L 60 240 C 45 230, 35 215, 55 185" fill="#1E1E1E" stroke={strokeColor} strokeWidth="1.5" />
      <path d="M 40 265 C 25 275, 25 305, 45 315 C 65 325, 80 300, 70 275 Z" fill="rgba(20,20,20,0.9)" stroke={strokeColor} strokeWidth="2" />
      <circle cx="55" cy="290" r="18" fill="rgba(255,255,255,0.05)" />
      
      <path d="M 180 135 C 190 160, 195 190, 185 210 C 175 230, 155 220, 145 185 C 160 185, 175 160, 155 135 Z" fill="#252525" stroke={strokeColor} strokeWidth="1.5" />
      <path d="M 185 210 C 190 240, 175 260, 155 270 L 140 240 C 155 230, 165 215, 145 185" fill="#1E1E1E" stroke={strokeColor} strokeWidth="1.5" />
      <path d="M 160 265 C 175 275, 175 305, 155 315 C 135 325, 120 300, 130 275 Z" fill="rgba(20,20,20,0.9)" stroke={strokeColor} strokeWidth="2" />
      <circle cx="145" cy="290" r="18" fill="rgba(255,255,255,0.05)" />
      
      <path d="M 85 95 C 80 80, 85 65, 85 65 L 115 65 C 115 65, 120 80, 115 95 Z" fill="#141414" stroke={strokeColor} strokeWidth="1.5" />
      <path d="M 85 65 C 75 40, 80 15, 100 15 C 120 15, 125 40, 115 65 Z" fill="#141414" stroke={strokeColor} strokeWidth="1.5" />

      {filtrados
        .filter(ev => {
          const esAtaqueEvent = ev.tipoSilueta === 'ataque' || ['Jab', 'Cross', 'Gancho', 'Uppercut', 'Golpe Conectado'].includes(ev.tipo)
          const esDefensaEvent = ev.tipoSilueta === 'defensa' || ['Bloqueo', 'Esquiva', 'Clinch'].includes(ev.tipo)
          return silueta === 'ataque' ? esAtaqueEvent : esDefensaEvent
        })
        .map((ev, i) => {
          const dotColor = ev.tipo === 'Golpe Conectado' || ev.tipo === 'Bloqueo'
            ? '#27AE60' 
            : ev.tipo === 'Golpe Errado' 
              ? '#E74C3C' 
              : '#D4AF37'
          return (
            <g key={i}>
              <circle cx={ev.coordX} cy={ev.coordY} r={10} fill={dotColor} opacity={0.25} />
              <circle cx={ev.coordX} cy={ev.coordY} r={4.5} fill={dotColor} stroke="#ffffff" strokeWidth={0.8} />
            </g>
          )
        })}
    </svg>
  )
}

/* ── ESTILOS DEL CONTENEDOR PDF A4 EN PANTALLA ─────────────────────────── */
const estilosPDF = {
  pagina: {
    width: '800px',
    height: '1130px',
    padding: '36px 48px 64px 48px',
    background: '#0b0b0f',
    color: '#F0F0F0',
    fontFamily: 'Inter, sans-serif',
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    overflow: 'hidden'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '2px solid #D4AF37',
    paddingBottom: '14px',
    marginBottom: '16px'
  },
  footer: {
    position: 'absolute',
    bottom: '24px',
    left: '48px',
    right: '48px',
    display: 'flex',
    justifyContent: 'space-between',
    borderTop: '1px solid #2A2A2A',
    paddingTop: '12px',
    fontSize: '9px',
    color: '#555',
    fontWeight: 600
  }
}
