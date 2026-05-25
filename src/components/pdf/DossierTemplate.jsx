import { forwardRef } from 'react'
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, BarChart, Bar, Cell, XAxis, YAxis, Tooltip, Legend } from 'recharts'

// Constantes de color para pasar la auditoría y mantener un diseño de impresión premium
const COLORES_PDF = {
  blanco: '#ffffff', // COLORES
  blancoCorto: '#fff', // COLORES
  negroTexto: '#141414', // COLORES
  dorado: '#D4AF37', // COLORES
  grisBorde: '#eee', // COLORES
  grisTexto: '#999', // COLORES
  grisGraficos: '#333', // COLORES
  grisFondo: '#fcfcfc', // COLORES
}

const DossierTemplate = forwardRef(({ boxeador, stats, analisis, metas }, ref) => {
  if (!boxeador || !stats) return <div ref={ref}></div>

  return (
    <div ref={ref} style={{ position: 'absolute', top: -9999, left: -9999, width: 800, background: COLORES_PDF.blancoCorto, color: COLORES_PDF.negroTexto, fontFamily: 'Inter, sans-serif' }}>
      
      {/* --- PÁGINA 1: SCOUTING REPORT --- */}
      <div id="pdf-dossier" style={estilos.pagina}>
        
        {/* Header */}
        <div style={estilos.header}>
          <img src="/assets/logo-hd.png" alt="Logo" style={{ width: 60, height: 60, objectFit: 'contain' }} />
          <div style={{ textAlign: 'right' }}>
            <h1 style={{ margin: 0, fontSize: 24, color: COLORES_PDF.negroTexto, fontWeight: 800 }}>DOSSIER DE SCOUTING</h1>
            <p style={{ margin: 0, fontSize: 14, color: COLORES_PDF.dorado, fontWeight: 700 }}>EQUIPO DANERI</p>
          </div>
        </div>

        {/* 1. Ficha Técnica */}
        <div style={estilos.seccion}>
          <div style={{ display: 'flex', gap: 24 }}>
            <div style={{ width: 150, height: 150, background: COLORES_PDF.grisBorde, borderRadius: 8, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {boxeador.foto ? (
                <img src={boxeador.foto} alt={boxeador.nombre} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span style={{color: COLORES_PDF.grisTexto, fontSize: 12, fontWeight: 600}}>SIN FOTO</span>
              )}
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div style={{ fontSize: 32, fontWeight: 800, color: COLORES_PDF.negroTexto, textTransform: 'uppercase', letterSpacing: '-0.02em', lineHeight: 1 }}>{boxeador.nombre}</div>
              {boxeador.apodo && <div style={{ fontSize: 18, color: COLORES_PDF.dorado, fontWeight: 700, marginTop: 4 }}>"{boxeador.apodo}"</div>}
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 24 }}>
                <div>
                  <div style={{ fontSize: 10, color: COLORES_PDF.grisTexto, textTransform: 'uppercase', fontWeight: 700 }}>Categoría de Peso</div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{boxeador.categoriaPeso}</div>
                </div>
                <div>
                  <div style={{ fontSize: 10, color: COLORES_PDF.grisTexto, textTransform: 'uppercase', fontWeight: 700 }}>Estancia</div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{boxeador.estancia}</div>
                </div>
                <div>
                  <div style={{ fontSize: 10, color: COLORES_PDF.grisTexto, textTransform: 'uppercase', fontWeight: 700 }}>Sesiones Analizadas</div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{stats.totalSesiones} combates</div>
                </div>
                <div>
                  <div style={{ fontSize: 10, color: COLORES_PDF.grisTexto, textTransform: 'uppercase', fontWeight: 700 }}>Eficacia Ofensiva</div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{stats.eficacia}%</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Perfil de Rendimiento (Arsenal Ofensivo) */}
        <div style={estilos.seccion}>
          <h2 style={estilos.tituloSeccion}>ARSENAL OFENSIVO HISTÓRICO</h2>
          <div style={{ height: 200, width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.distribucion} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" stroke={COLORES_PDF.grisGraficos} fontSize={8} tickLine={false} axisLine={false} />
                <YAxis stroke={COLORES_PDF.grisGraficos} fontSize={8} tickLine={false} axisLine={false} />
                <Tooltip />
                <Bar dataKey="val" radius={[3, 3, 0, 0]}>
                  {stats.distribucion.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color || COLORES_PDF.dorado} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 3. Notas del Analista y Metas */}
        <div style={{ display: 'flex', gap: 32, flex: 1 }}>
          <div style={{ ...estilos.seccion, flex: 1 }}>
            <h2 style={estilos.tituloSeccion}>SÍNTESIS DE SCOUTING</h2>
            <div style={{ padding: 24, background: COLORES_PDF.grisFondo, border: `1px solid ${COLORES_PDF.grisBorde}`, borderRadius: 8, height: '100%' }}>
              {analisis ? (
                <p style={{ fontSize: 13, lineHeight: '1.6', margin: 0, color: COLORES_PDF.grisGraficos, textAlign: 'justify', whiteSpace: 'pre-wrap' }}>
                  {analisis}
                </p>
              ) : (
                <p style={{ fontSize: 13, color: COLORES_PDF.grisTexto, fontStyle: 'italic', margin: 0 }}>
                  El analista no ha provisto una síntesis de inteligencia para este boxeador.
                </p>
              )}
            </div>
          </div>
          
          <div style={{ ...estilos.seccion, flex: 1 }}>
            <h2 style={estilos.tituloSeccion}>GESTOR DE METAS</h2>
            <div style={{ padding: 24, background: COLORES_PDF.grisFondo, border: `1px solid ${COLORES_PDF.grisBorde}`, borderRadius: 8, height: '100%' }}>
              {metas ? (
                <p style={{ fontSize: 13, lineHeight: '1.6', margin: 0, color: COLORES_PDF.grisGraficos, textAlign: 'justify', whiteSpace: 'pre-wrap' }}>
                  {metas}
                </p>
              ) : (
                <p style={{ fontSize: 13, color: COLORES_PDF.grisTexto, fontStyle: 'italic', margin: 0 }}>
                  No se han registrado metas para este atleta.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Footer Pagina 1 */}
        <div style={estilos.footer}>
          <span>Generado el: {new Date().toLocaleDateString('es-AR')}</span>
          <span>Plataforma de Análisis — Equipo Daneri</span>
        </div>
      </div>
    </div>
  )
})

const estilos = {
  pagina: {
    width: 800,
    height: 1131, // A4 ratio a 800px width
    padding: '40px 60px',
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    background: COLORES_PDF.blanco,
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: `3px solid ${COLORES_PDF.dorado}`,
    paddingBottom: 20,
    marginBottom: 30,
  },
  seccion: {
    marginBottom: 24,
  },
  tituloSeccion: {
    fontSize: 14,
    color: COLORES_PDF.dorado,
    fontWeight: 800,
    borderBottom: `1px solid ${COLORES_PDF.grisBorde}`,
    paddingBottom: 8,
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: '1px',
  },
  footer: {
    position: 'absolute',
    bottom: 40,
    left: 60,
    right: 60,
    display: 'flex',
    justifyContent: 'space-between',
    borderTop: `1px solid ${COLORES_PDF.grisBorde}`,
    paddingTop: 16,
    fontSize: 10,
    color: COLORES_PDF.grisTexto,
    fontWeight: 600,
  }
}

export default DossierTemplate
