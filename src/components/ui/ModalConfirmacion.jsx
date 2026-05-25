import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, Info, CheckCircle, X } from 'lucide-react'

export default function ModalConfirmacion({ 
  isOpen, 
  titulo, 
  mensaje, 
  onConfirm, 
  onCancel, 
  textoConfirmar = "Confirmar", 
  textoCancelar = "Cancelar", 
  tipo = "peligro" // "peligro", "exito", "info", "advertencia"
}) {
  if (!isOpen) return null;

  // Determinar colores e icono
  let colorPrimario = "var(--color-dorado)";
  let colorFondo = "rgba(212,175,55,0.1)";
  let IconoComponente = Info;

  if (tipo === "peligro") {
    colorPrimario = "var(--color-rojo-suave)";
    colorFondo = "rgba(239,68,68,0.1)";
    IconoComponente = AlertTriangle;
  } else if (tipo === "exito") {
    colorPrimario = "var(--color-exito)";
    colorFondo = "rgba(16,185,129,0.1)";
    IconoComponente = CheckCircle;
  } else if (tipo === "advertencia") {
    colorPrimario = "var(--color-advertencia, #F59E0B)"; // Naranja
    colorFondo = "rgba(245,158,11,0.1)";
    IconoComponente = AlertTriangle;
  }

  // Si es un simple "alert()", no necesitamos botón de cancelar
  const esSoloInfo = tipo === "info" || tipo === "exito";

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.85)',
          backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999,
        }}
        onClick={esSoloInfo ? onConfirm : onCancel}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          style={{
            background: 'var(--color-superficie)',
            borderRadius: 16,
            padding: 32,
            width: 400,
            maxWidth: '90%',
            border: '1px solid var(--color-borde)',
            boxShadow: '0 24px 48px rgba(0,0,0,0.4)',
            position: 'relative'
          }}
          onClick={e => e.stopPropagation()}
        >
          <button 
            onClick={esSoloInfo ? onConfirm : onCancel}
            style={{ position: 'absolute', top: 16, right: 16, background: 'transparent', border: 'none', color: 'var(--color-texto-suave)', cursor: 'pointer' }}
          >
            <X size={20} />
          </button>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 16 }}>
            <div style={{
              width: 56, height: 56, borderRadius: 16,
              background: colorFondo,
              color: colorPrimario,
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <IconoComponente size={28} />
            </div>
            
            <div>
              <h2 style={{ fontSize: 20, color: 'var(--color-texto)', margin: '0 0 8px 0', whiteSpace: 'pre-wrap' }}>{titulo}</h2>
              <p style={{ fontSize: 14, color: 'var(--color-texto-suave)', margin: 0, lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                {mensaje}
              </p>
            </div>

            <div style={{ display: 'flex', gap: 12, width: '100%', marginTop: 16 }}>
              {!esSoloInfo && (
                <button 
                  onClick={onCancel}
                  style={{
                    flex: 1, padding: '12px', borderRadius: 8,
                    background: 'var(--color-superficie-2)', border: '1px solid var(--color-borde)',
                    color: 'var(--color-texto)', fontSize: 14, fontWeight: 600, cursor: 'pointer'
                  }}
                >
                  {textoCancelar}
                </button>
              )}
              <button 
                onClick={onConfirm}
                style={{
                  flex: 1, padding: '12px', borderRadius: 8,
                  background: colorPrimario, border: 'none',
                  color: tipo === "peligro" ? '#fff' : '#000', fontSize: 14, fontWeight: 700, cursor: 'pointer'
                }}
              >
                {textoConfirmar}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
