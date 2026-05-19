import { forwardRef } from 'react'
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts'

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
  grisMedio: '#666', // COLORES
  doradoRincon: '#b59328', // COLORES
  rojoErrado: '#E74C3C', // COLORES
  grisFondoMapa: '#f5f5f5', // COLORES
  grisBordeMapa: '#ccc', // COLORES
  grisFondoEvento: '#f9f9f9', // COLORES
}

// Este componente NO se ve en la UI normal (está oculto off-screen).
// Solo se renderiza para que html2canvas le tome una "foto".

const radarDataMock = [
  { subject: 'Velocidad', A: 85, fullMark: 100 },
  { subject: 'Potencia', A: 90, fullMark: 100 },
  { subject: 'Precisión', A: 75, fullMark: 100 },
  { subject: 'Defensa', A: 65, fullMark: 100 },
  { subject: 'Resistencia', A: 80, fullMark: 100 },
]

const barrasDataMock = [
  { name: 'Jab', Conectado: 40, Errado: 20 },
  { name: 'Cross', Conectado: 25, Errado: 15 },
  { name: 'Gancho', Conectado: 15, Errado: 10 },
  { name: 'Uppercut', Conectado: 5, Errado: 8 },
]

const InformeTemplate = forwardRef((props, ref) => {
  return (
    <div ref={ref} style={{ position: 'absolute', top: -9999, left: -9999, width: 800, background: COLORES_PDF.blancoCorto, color: COLORES_PDF.negroTexto, fontFamily: 'Inter, sans-serif' }}>
      
      {/* --- PÁGINA 1 --- */}
      <div id="pdf-pagina-1" style={estilos.pagina}>
        
        {/* Header */}
        <div style={estilos.header}>
          <img src="/assets/logo-hd.png" alt="Logo" style={{ width: 60, height: 60, objectFit: 'contain' }} />
          <div style={{ textAlign: 'right' }}>
            <h1 style={{ margin: 0, fontSize: 24, color: COLORES_PDF.negroTexto, fontWeight: 800 }}>INFORME TÉCNICO</h1>
            <p style={{ margin: 0, fontSize: 14, color: COLORES_PDF.dorado, fontWeight: 700 }}>EQUIPO DANERI</p>
          </div>
        </div>

        {/* 1. Perfil del Boxeador */}
        <div style={estilos.seccion}>
          <h2 style={estilos.tituloSeccion}>1. PERFIL DEL BOXEADOR</h2>
          <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
            <div style={{ width: 100, height: 100, background: COLORES_PDF.grisBorde, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{color: COLORES_PDF.grisTexto}}>FOTO</span>
            </div>
            <div>
              <div style={{ fontSize: 24, fontWeight: 700 }}>Juan Pérez</div>
              <div style={{ fontSize: 16, color: COLORES_PDF.grisMedio }}>Peso Welter (Ortodoxa)</div>
              <div style={{ marginTop: 8, padding: '4px 12px', background: 'rgba(212,175,55,0.2)', color: COLORES_PDF.doradoRincon, fontWeight: 700, borderRadius: 4, display: 'inline-block' }}>
                VICTORIA POR DECISIÓN
              </div>
            </div>
          </div>
        </div>

        {/* 2. Síntesis de la Pelea */}
        <div style={estilos.seccion}>
          <h2 style={estilos.tituloSeccion}>2. SÍNTESIS DE LA PELEA</h2>
          <p style={{ fontSize: 14, lineHeight: '1.6', color: COLORES_PDF.grisGraficos, textAlign: 'justify' }}>
            El rincón rojo estableció dominio temprano mediante el uso constante del jab, dictando la distancia durante los primeros cuatro asaltos. Sin embargo, se observó una caída en la resistencia cardiovascular a partir del quinto round, lo que permitió al rincón azul capitalizar con golpes al cuerpo. La clave de la victoria radicó en la precisión de los contragolpes (cross de derecha) durante los intercambios en corta distancia.
          </p>
          <div style={{ fontSize: 11, color: COLORES_PDF.grisTexto, marginTop: 8, fontStyle: 'italic' }}>
            Análisis · Mauricio Daneri
          </div>
        </div>

        {/* 3. Métricas de Rendimiento */}
        <div style={estilos.seccion}>
          <h2 style={estilos.tituloSeccion}>3. MÉTRICAS DE RENDIMIENTO</h2>
          <div style={{ height: 300, width: '100%', display: 'flex', justifyContent: 'center' }}>
            <RadarChart width={400} height={300} cx="50%" cy="50%" outerRadius="80%" data={radarDataMock}>
              <PolarGrid />
              <PolarAngleAxis dataKey="subject" tick={{ fill: COLORES_PDF.grisGraficos, fontSize: 12, fontWeight: 600 }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
              <Radar name="Rojo" dataKey="A" stroke={COLORES_PDF.dorado} fill={COLORES_PDF.dorado} fillOpacity={0.6} />
            </RadarChart>
          </div>
        </div>

        {/* Footer Pagina 1 */}
        <div style={estilos.footer}>
          <span>Fecha: 12/05/2026</span>
          <span>Analista: Mauricio Daneri — Equipo Daneri</span>
        </div>
      </div>

      <div style={{ height: 20, background: COLORES_PDF.grisBorde }}></div> {/* Separador visual para debug */}

      {/* --- PÁGINA 2 --- */}
      <div id="pdf-pagina-2" style={estilos.pagina}>
        
        {/* 4. Distribución de Golpeo */}
        <div style={estilos.seccion}>
          <h2 style={estilos.tituloSeccion}>4. DISTRIBUCIÓN DE GOLPEO</h2>
          <div style={{ height: 250, width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barrasDataMock} layout="vertical" margin={{ top: 0, right: 30, left: 20, bottom: 0 }}>
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fill: COLORES_PDF.grisGraficos, fontWeight: 600}} width={80} />
                <Tooltip />
                <Legend />
                <Bar dataKey="Conectado" stackId="a" fill={COLORES_PDF.dorado} barSize={30} />
                <Bar dataKey="Errado" stackId="a" fill={COLORES_PDF.rojoErrado} barSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 40 }}>
          {/* 5. Línea de Tiempo */}
          <div style={{ flex: 1, ...estilos.seccion }}>
            <h2 style={estilos.tituloSeccion}>5. EVENTOS CRÍTICOS</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={estilos.evento}><strong>R1 0:45</strong> — Finta + Jab conectado</div>
              <div style={estilos.evento}><strong>R3 1:12</strong> — Centro de Ring establecido</div>
              <div style={estilos.evento}><strong>R4 2:30</strong> — Guardia Baja (peligro)</div>
              <div style={estilos.evento}><strong>R6 0:15</strong> — Indicios de Fatiga</div>
            </div>
          </div>

          {/* 6. Mapa de Calor */}
          <div style={{ width: 250, ...estilos.seccion }}>
            <h2 style={estilos.tituloSeccion}>6. MAPA DE CALOR</h2>
            <div style={{ width: '100%', height: 200, background: COLORES_PDF.grisFondoMapa, border: `1px dashed ${COLORES_PDF.grisBordeMapa}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: COLORES_PDF.grisTexto, fontSize: 12 }}>
              [ SVG Cuerpo Boxeador ]
            </div>
          </div>
        </div>

        {/* 7. Recomendaciones */}
        <div style={{ ...estilos.seccion, flex: 1 }}>
          <h2 style={estilos.tituloSeccion}>7. RECOMENDACIONES DEL ENTRENADOR</h2>
          <div style={{ padding: 20, background: COLORES_PDF.grisFondo, border: `1px solid ${COLORES_PDF.grisBorde}`, borderRadius: 8, height: '100%' }}>
            <p style={{ fontSize: 14, lineHeight: '1.6', margin: 0, color: COLORES_PDF.grisGraficos }}>
              Se debe trabajar en el acondicionamiento aeróbico para evitar la fatiga mostrada después del cuarto round. 
              Tácticamente, el cruzado de derecha es altamente efectivo, pero el boxeador tiende a bajar la mano izquierda al tirarlo, abriendo un hueco peligroso para el contragolpe.
            </p>
          </div>
        </div>

        {/* Footer Pagina 2 */}
        <div style={estilos.footer}>
          <span>Firma: ___________________________</span>
          <span>Analista Principal — Equipo Daneri</span>
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
  evento: {
    fontSize: 13,
    color: COLORES_PDF.grisGraficos,
    padding: '8px 12px',
    background: COLORES_PDF.grisFondoEvento,
    borderRadius: 4,
    borderLeft: `3px solid ${COLORES_PDF.dorado}`,
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

export default InformeTemplate
