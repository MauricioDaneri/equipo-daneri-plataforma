import { useState, useRef } from 'react'
import { FileText, Download, CheckCircle } from 'lucide-react'
import InformeTemplate from '../components/pdf/InformeTemplate'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

export default function Informes() {
  const [generando, setGenerando] = useState(false)
  const templateRef = useRef(null)

  const generarPDF = async () => {
    setGenerando(true)
    try {
      // Damos 500ms para asegurar que Recharts y las fuentes están renderizadas
      await new Promise(resolve => setTimeout(resolve, 500))

      const pag1 = document.getElementById('pdf-pagina-1')
      const pag2 = document.getElementById('pdf-pagina-2')

      const canvas1 = await html2canvas(pag1, { scale: 2, useCORS: true })
      const canvas2 = await html2canvas(pag2, { scale: 2, useCORS: true })

      const img1 = canvas1.toDataURL('image/png')
      const img2 = canvas2.toDataURL('image/png')

      const pdf = new jsPDF('p', 'mm', 'a4')
      
      // A4 es 210x297mm
      pdf.addImage(img1, 'PNG', 0, 0, 210, 297)
      pdf.addPage()
      pdf.addImage(img2, 'PNG', 0, 0, 210, 297)

      pdf.save('Informe_Daneri_JuanPerez_12-05-2026.pdf')

    } catch (error) {
      console.error("Error generando PDF:", error)
      alert("Hubo un problema al generar el PDF.")
    } finally {
      setGenerando(false)
    }
  }

  return (
    <div style={estilos.pagina}>
      <header style={estilos.header}>
        <div>
          <h1 style={estilos.tituloSeccion}>INFORMES Y DOSSIER</h1>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--color-texto-suave)' }}>
            Generación de documentación oficial en alta calidad.
          </p>
        </div>
      </header>

      <div style={estilos.grid}>
        
        {/* Generador Manual */}
        <div className="tarjeta" style={estilos.tarjeta}>
          <div style={estilos.iconoContainer}>
            <FileText size={32} color="var(--color-dorado)" />
          </div>
          <h2 style={{ fontSize: 16, margin: '0 0 8px 0', color: 'var(--color-texto)' }}>Generar Informe Técnico</h2>
          <p style={{ fontSize: 13, color: 'var(--color-texto-suave)', marginBottom: 24, flex: 1 }}>
            Exporta el análisis completo de una sesión (2 páginas) con gráficos vectoriales y el branding oficial del Equipo Daneri.
          </p>
          
          <button 
            className="boton-primario" 
            onClick={generarPDF}
            disabled={generando}
            style={{ width: '100%', display: 'flex', justifyContent: 'center', gap: 8 }}
          >
            {generando ? (
              'Renderizando PDF...'
            ) : (
              <><Download size={18} /> Descargar Archivo PDF</>
            )}
          </button>
        </div>

        {/* Info lateral */}
        <div className="tarjeta" style={{ ...estilos.tarjeta, background: 'transparent', border: '1px dashed var(--color-borde)' }}>
          <h3 style={{ fontSize: 14, color: 'var(--color-texto)', textTransform: 'uppercase', marginBottom: 16 }}>Características del Informe</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={estilos.featureItem}>
              <CheckCircle size={16} color="var(--color-dorado)" />
              <span>Gráficos de radar y distribución de golpes de <strong>Recharts</strong> renderizados en alta resolución.</span>
            </div>
            <div style={estilos.featureItem}>
              <CheckCircle size={16} color="var(--color-dorado)" />
              <span>Dossier táctico pre-poblado por <strong>Ollama</strong> (si está activo).</span>
            </div>
            <div style={estilos.featureItem}>
              <CheckCircle size={16} color="var(--color-dorado)" />
              <span>Generación ofuscada off-screen con <strong>html2canvas</strong> para no interferir con la UI oscura del analista.</span>
            </div>
            <div style={estilos.featureItem}>
              <CheckCircle size={16} color="var(--color-dorado)" />
              <span>Diseño A4 imprimible con fondo blanco y estética premium.</span>
            </div>
          </div>
        </div>

      </div>

      {/* COMPONENTE OCULTO PARA EL PDF */}
      <div style={{ position: 'absolute', top: -9999, left: -9999, width: 800 }}>
        <InformeTemplate ref={templateRef} />
      </div>

    </div>
  )
}

const estilos = {
  pagina: {
    padding: '32px 40px',
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    position: 'relative',
  },
  header: {
    marginBottom: 40,
  },
  tituloSeccion: {
    fontSize: 20,
    fontWeight: 700,
    color: 'var(--color-texto)',
    letterSpacing: '-0.02em',
    margin: '0 0 4px 0',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: '400px 1fr',
    gap: 32,
  },
  tarjeta: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    padding: 32,
  },
  iconoContainer: {
    width: 64,
    height: 64,
    borderRadius: 16,
    background: 'rgba(212,175,55,0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  featureItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 12,
    fontSize: 13,
    color: 'var(--color-texto-suave)',
    lineHeight: '1.5',
  }
}
