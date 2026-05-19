import { useState, useRef, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ChevronLeft, Download, Award } from 'lucide-react'
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
  const reportRef = useRef(null)
  const [generando, setGenerando] = useState(false)
  const [notasDT, setNotasDT] = useState('')

  const sesion      = useLiveQuery(() => db.sesiones.get(Number(id)), [id])
  const eventosRaw  = useLiveQuery(() => db.eventos.where('sesionId').equals(Number(id)).toArray(), [id]) || []
  const boxeadorR   = useLiveQuery(() => sesion ? db.boxeadores.get(sesion.boxeadorRojoId) : null, [sesion])
  const boxeadorA   = useLiveQuery(() => sesion ? db.boxeadores.get(sesion.boxeadorAzulId) : null, [sesion])

  /* ── Estadísticas calculadas desde eventos reales ─────────────────── */
  const stats = useMemo(() => {
    if (!eventosRaw.length) return null

    const porEsquina = (esq) => eventosRaw.filter(e => e.esquina === esq)
    const roja = porEsquina('roja')
    const azul = porEsquina('azul')

    const contar = (lista, tipo) => lista.filter(e => e.tipo === tipo).length
    const tipos = ['Jab','Cross','Gancho','Uppercut']

    // KPIs por esquina
    const kpi = (lista) => {
      const conectados = contar(lista, 'Golpe Conectado')
      const errados    = contar(lista, 'Golpe Errado')
      const total      = conectados + errados
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

    // Distribución de golpes para BarChart
    const distGolpes = tipos.map(t => ({
      name: t,
      Rojo: contar(roja, t),
      Azul: contar(azul, t),
    }))

    // Por round
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

    // Radar: ofensiva / defensiva / presencia
    const radarData = [
      { subject: 'Golpes',   Rojo: kpiR.total,    Azul: kpiA.total },
      { subject: 'Precisión',Rojo: kpiR.eficacia,  Azul: kpiA.eficacia },
      { subject: 'Defensa',  Rojo: kpiR.bloqueos + kpiR.esquivas, Azul: kpiA.bloqueos + kpiA.esquivas },
      { subject: 'Fintas',   Rojo: kpiR.fintas,   Azul: kpiA.fintas },
      { subject: 'Clinch',   Rojo: kpiR.clinch,   Azul: kpiA.clinch },
    ]

    // Pie: total acciones rojo vs azul
    const pieData = [
      { name: boxeadorR?.nombre || 'Rojo', value: roja.length },
      { name: boxeadorA?.nombre || 'Azul', value: azul.length },
    ]

    // Eventos críticos (estados físicos)
    const criticos = eventosRaw.filter(e =>
      ['Fatiga','Guardia Baja','Caída','Amonestación','Corte/Sangrado'].includes(e.tipo)
    ).sort((a,b) => a.timestamp - b.timestamp)

    const fmt = s => { const m=Math.floor(s/60); const sec=Math.floor(s%60); return `${m}:${sec.toString().padStart(2,'0')}` }

    return { kpiR, kpiA, distGolpes, porRound, radarData, pieData, criticos, fmt, maxRound }
  }, [eventosRaw, boxeadorR, boxeadorA])

  /* ── Exportar PDF ─────────────────────────────────────────────────── */
  const exportarPDF = async () => {
    if (!reportRef.current) return
    setGenerando(true)
    try {
      const canvas = await html2canvas(reportRef.current, { scale: 2, useCORS: true, backgroundColor: 'var(--color-fondo)' })
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF('p', 'mm', 'a4')
      const w = pdf.internal.pageSize.getWidth()
      const h = (canvas.height * w) / canvas.width
      let y = 0
      const pageH = pdf.internal.pageSize.getHeight()
      while (y < h) {
        if (y > 0) pdf.addPage()
        pdf.addImage(imgData, 'PNG', 0, -y, w, h)
        y += pageH
      }
      pdf.save(`Informe_Daneri_${sesion?.id || 'X'}_${sesion?.fecha || 'Hoy'}.pdf`)
    } catch(e) { console.error(e) }
    finally { setGenerando(false) }
  }

  if (sesion === undefined) return <div style={{padding:40,color:'var(--color-texto)'}}>Cargando sesión…</div>

  const nombreR = boxeadorR?.nombre || 'Rincón Rojo'
  const nombreA = boxeadorA?.nombre || 'Rincón Azul'

  return (
    <div style={{ height:'100%', display:'flex', flexDirection:'column', background:'var(--color-fondo)', overflow:'hidden' }}>
      {/* Toolbar */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'14px 40px', background:'var(--color-fondo)', borderBottom:'1px solid var(--color-borde)', flexShrink:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:16 }}>
          <button onClick={() => navigate(-1)} style={{ background:'transparent', border:'none', color:'var(--color-texto-suave)', cursor:'pointer', display:'flex', alignItems:'center', gap:6 }}>
            <ChevronLeft size={20}/> Volver
          </button>
          <h1 style={{ margin:0, fontSize:18, color:'var(--color-dorado)', fontWeight:800 }}>
            INFORME TÉCNICO — {nombreR} vs {nombreA}
          </h1>
        </div>
        <button onClick={exportarPDF} disabled={generando} className="boton-primario" style={{ display:'flex', gap:8, alignItems:'center', padding:'8px 20px' }}>
          <Download size={16}/> {generando ? 'Generando PDF…' : 'Exportar PDF'}
        </button>
      </div>

      {/* Contenido (scrollable + imprimible) */}
      <div style={{ flex:1, overflowY:'auto', padding:'32px 24px', display:'flex', justifyContent:'center' }}>
        <div ref={reportRef} style={{ width:'100%', maxWidth:900, display:'flex', flexDirection:'column', gap:28 }}>

          {/* ── ENCABEZADO ─────────────────────────────────────── */}
          <div style={{ background:'linear-gradient(135deg,var(--color-dorado-alfa),rgba(20,20,20,0))', border:'1px solid rgba(212,175,55,0.3)', borderRadius:16, padding:'28px 36px' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
              <div>
                <div style={{ fontSize:11, color:'var(--color-dorado)', fontWeight:800, letterSpacing:4, textTransform:'uppercase' }}>Equipo Daneri · Informe Técnico</div>
                <div style={{ fontSize:26, fontWeight:900, color:'var(--color-texto)', marginTop:6, letterSpacing:-1 }}>{nombreR} <span style={{color:'var(--color-texto-muted)'}}>vs</span> {nombreA}</div>
                <div style={{ fontSize:13, color:'var(--color-texto-suave)', marginTop:4 }}>{sesion.fecha} · {stats?.maxRound || 0} rounds analizados · {eventosRaw.length} eventos registrados</div>
              </div>
              <Award size={48} color="rgba(212,175,55,0.4)"/>
            </div>
          </div>

          {!stats ? (
            <div style={{ textAlign:'center', padding:60, color:'var(--color-texto-muted)' }}>Sin eventos registrados en esta sesión.</div>
          ) : (<>

          {/* ── KPIs ──────────────────────────────────────────── */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
            {[
              { label: nombreR, kpi: stats.kpiR, color: COLORES.roja },
              { label: nombreA, kpi: stats.kpiA, color: COLORES.azul },
            ].map(({ label, kpi, color }) => (
              <div key={label} style={{ background:'rgba(255,255,255,0.03)', border:`1px solid ${color}33`, borderRadius:14, padding:24 }}>
                <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:18 }}>
                  <div style={{ width:10, height:10, borderRadius:'50%', background:color }}/>
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
                    <div key={t} style={{ background:'rgba(255,255,255,0.04)', borderRadius:8, padding:'10px 12px', textAlign:'center' }}>
                      <div style={{ fontSize:22, fontWeight:900, color:c }}>{v}</div>
                      <div style={{ fontSize:10, color:'var(--color-texto-muted)', textTransform:'uppercase', letterSpacing:1, marginTop:4 }}>{t}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* ── GRÁFICOS ──────────────────────────────────────── */}
          <div style={{ display:'grid', gridTemplateColumns:'1.4fr 1fr', gap:20 }}>

            {/* Distribución de golpes */}
            <div style={{ background:'var(--color-superficie)', border:'1px solid var(--color-borde)', borderRadius:14, padding:24 }}>
              <div style={{ fontSize:12, fontWeight:700, color:'var(--color-dorado)', textTransform:'uppercase', letterSpacing:2, marginBottom:18 }}>Distribución de Golpes</div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={stats.distGolpes} barSize={18}>
                  <XAxis dataKey="name" stroke="var(--color-texto-muted)" fontSize={12}/>
                  <YAxis stroke="var(--color-texto-muted)" fontSize={11}/>
                  <Tooltip contentStyle={{ background:'var(--color-superficie-2)', border:'1px solid var(--color-borde)', borderRadius:8 }}/>
                  <Legend wrapperStyle={{ fontSize:12 }}/>
                  <Bar dataKey="Rojo" fill={COLORES.roja} radius={[4,4,0,0]}/>
                  <Bar dataKey="Azul" fill={COLORES.azul} radius={[4,4,0,0]}/>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Participación total */}
            <div style={{ background:'var(--color-superficie)', border:'1px solid var(--color-borde)', borderRadius:14, padding:24, display:'flex', flexDirection:'column', alignItems:'center' }}>
              <div style={{ fontSize:12, fontWeight:700, color:'var(--color-dorado)', textTransform:'uppercase', letterSpacing:2, marginBottom:18 }}>Participación Total</div>
              <PieChart width={200} height={200}>
                <Pie data={stats.pieData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({name,percent}) => `${name} ${(percent*100).toFixed(0)}%`} labelLine={false}>
                  <Cell fill={COLORES.roja}/>
                  <Cell fill={COLORES.azul}/>
                </Pie>
                <Tooltip contentStyle={{ background:'var(--color-superficie-2)', border:'1px solid var(--color-borde)', borderRadius:8 }}/>
              </PieChart>
            </div>
          </div>

          {/* Actividad por round + Radar */}
          <div style={{ display:'grid', gridTemplateColumns:'1.4fr 1fr', gap:20 }}>

            <div style={{ background:'var(--color-superficie)', border:'1px solid var(--color-borde)', borderRadius:14, padding:24 }}>
              <div style={{ fontSize:12, fontWeight:700, color:'var(--color-dorado)', textTransform:'uppercase', letterSpacing:2, marginBottom:18 }}>Actividad por Round</div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={stats.porRound} barSize={14}>
                  <XAxis dataKey="name" stroke="var(--color-texto-muted)" fontSize={11}/>
                  <YAxis stroke="var(--color-texto-muted)" fontSize={11}/>
                  <Tooltip contentStyle={{ background:'var(--color-superficie-2)', border:'1px solid var(--color-borde)', borderRadius:8 }}/>
                  <Legend wrapperStyle={{ fontSize:12 }}/>
                  <Bar dataKey="Rojo" fill={COLORES.roja} radius={[3,3,0,0]}/>
                  <Bar dataKey="Azul" fill={COLORES.azul} radius={[3,3,0,0]}/>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div style={{ background:'var(--color-superficie)', border:'1px solid var(--color-borde)', borderRadius:14, padding:24 }}>
              <div style={{ fontSize:12, fontWeight:700, color:'var(--color-dorado)', textTransform:'uppercase', letterSpacing:2, marginBottom:8 }}>Perfil Comparativo</div>
              <RadarChart width={220} height={200} data={stats.radarData} cx="50%" cy="50%" outerRadius={70}>
                <PolarGrid stroke="var(--color-borde)"/>
                <PolarAngleAxis dataKey="subject" tick={{ fill:'var(--color-texto-suave)', fontSize:10 }}/>
                <PolarRadiusAxis tick={false} axisLine={false}/>
                <Radar name={nombreR} dataKey="Rojo" stroke={COLORES.roja} fill={COLORES.roja} fillOpacity={0.3}/>
                <Radar name={nombreA} dataKey="Azul" stroke={COLORES.azul} fill={COLORES.azul} fillOpacity={0.3}/>
                <Legend wrapperStyle={{ fontSize:11 }}/>
              </RadarChart>
            </div>
          </div>

          {/* ── EVENTOS CRÍTICOS ──────────────────────────────── */}
          {stats.criticos.length > 0 && (
            <div style={{ background:'var(--color-superficie)', border:'1px solid var(--color-borde)', borderRadius:14, padding:24 }}>
              <div style={{ fontSize:12, fontWeight:700, color:'var(--color-dorado)', textTransform:'uppercase', letterSpacing:2, marginBottom:16 }}>Eventos Críticos ({stats.criticos.length})</div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))', gap:10 }}>
                {stats.criticos.map((ev,i) => (
                  <div key={i} style={{ display:'flex', gap:12, alignItems:'center', background:'rgba(231,76,60,0.07)', border:'1px solid rgba(231,76,60,0.2)', borderRadius:8, padding:'10px 14px' }}>
                    <div style={{ fontFamily:'monospace', fontSize:12, color:'var(--color-dorado)', flexShrink:0 }}>R{ev.round||1} · {stats.fmt(ev.timestamp)}</div>
                    <div style={{ fontSize:12, color:'var(--color-texto)' }}>{ev.tipo}</div>
                    <div style={{ fontSize:10, color: ev.esquina==='roja'?COLORES.roja:COLORES.azul, marginLeft:'auto', fontWeight:700, textTransform:'uppercase' }}>{ev.esquina}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── NOTAS DEL DT ──────────────────────────────────── */}
          <div style={{ background:'var(--color-superficie)', border:'1px solid var(--color-dorado-alfa)', borderRadius:14, padding:24 }}>
            <div style={{ fontSize:12, fontWeight:700, color:'var(--color-dorado)', textTransform:'uppercase', letterSpacing:2, marginBottom:14 }}>Notas del Entrenador (para el PDF)</div>
            <textarea
              value={notasDT}
              onChange={e => setNotasDT(e.target.value)}
              placeholder="Escribí las observaciones, ajustes tácticos y recomendaciones para el boxeador…"
              style={{ width:'100%', minHeight:120, background:'var(--color-superficie-2)', border:'1px solid var(--color-borde)', borderRadius:8, color:'var(--color-texto)', padding:'12px 16px', fontSize:13, lineHeight:1.6, resize:'vertical', outline:'none', fontFamily:'inherit', boxSizing:'border-box' }}
            />
          </div>

          {/* ── FIRMA ─────────────────────────────────────────── */}
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', borderTop:'1px solid var(--color-borde)', paddingTop:20 }}>
            <div style={{ display:'flex', alignItems:'center', gap:12 }}>
              <Award size={28} color="var(--color-dorado)"/>
              <div>
                <div style={{ color:'var(--color-texto)', fontSize:14, fontWeight:800 }}>MAURICIO DANERI</div>
                <div style={{ color:'var(--color-texto-muted)', fontSize:11 }}>Head Coach · Equipo Daneri</div>
              </div>
            </div>
            <div style={{ textAlign:'right', fontSize:10, color:'var(--color-texto-muted)' }}>
              <div>Generado por Plataforma Daneri v2.0</div>
              <div>© 2026 Equipo Daneri Analytics</div>
            </div>
          </div>

          </>)}
        </div>
      </div>
    </div>
  )
}
