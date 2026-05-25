import { useState, useEffect } from 'react'
import { db } from '../../servicios/db'
import { X, Upload } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const CATEGORIAS_PESO = [
  'Mínimo', 'Minimosca', 'Mosca', 'Supermosca', 'Gallo', 'Supergallo',
  'Pluma', 'Superpluma', 'Ligero', 'Superligero', 'Welter', 'Superwelter',
  'Mediano', 'Supermediano', 'Semipesado', 'Crucero', 'Pesado'
]

export default function ModalBoxeador({ isOpen, onClose, boxeador = null }) {
  const [nombre, setNombre] = useState(boxeador?.nombre || '')
  const [apodo, setApodo] = useState(boxeador?.apodo || '')
  const [categoriaPeso, setCategoriaPeso] = useState(boxeador?.categoriaPeso || 'Welter')
  const [estancia, setEstancia] = useState(boxeador?.estancia || 'Ortodoxa')
  const [notas, setNotas] = useState(boxeador?.notas || '')
  const [foto, setFoto] = useState(boxeador?.foto || null)

  // Sincronizar estado si el boxeador prop cambia (para edición)
  useEffect(() => {
    if (isOpen) {
      setNombre(boxeador?.nombre || '')
      setApodo(boxeador?.apodo || '')
      setCategoriaPeso(boxeador?.categoriaPeso || 'Welter')
      setEstancia(boxeador?.estancia || 'Ortodoxa')
      setNotas(boxeador?.notas || '')
      setFoto(boxeador?.foto || null)
    }
  }, [boxeador, isOpen])

  if (!isOpen) return null

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        // Guardamos la imagen en Base64 crudo
        setFoto(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const guardar = async (e) => {
    e.preventDefault()
    if (!nombre) return

    try {
      const data = {
        nombre,
        apodo,
        categoriaPeso,
        estancia,
        foto,
        notas,
        createdAt: boxeador?.createdAt || Date.now()
      }

      if (boxeador?.id) {
        await db.boxeadores.update(boxeador.id, data)
      } else {
        await db.boxeadores.add(data)
      }
      onClose()
    } catch (err) {
      console.error('[ModalBoxeador] Error al guardar boxeador:', err)
      alert('Error al guardar el boxeador: ' + err.message)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          style={estilos.overlay}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div 
            style={estilos.modal}
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ type: "spring", duration: 0.4 }}
          >
        <div style={estilos.header}>
          <h2 style={estilos.titulo}>{boxeador ? 'Editar Boxeador' : 'Nuevo Boxeador'}</h2>
          <button onClick={onClose} style={estilos.btnCerrar}><X size={20} /></button>
        </div>

        <form onSubmit={guardar} style={estilos.form}>
          <div style={estilos.grid}>
            {/* Foto Upload */}
            <div style={estilos.fotoContainer}>
              <label style={estilos.fotoLabel}>
                {foto ? (
                  <img src={foto} alt="Preview" style={estilos.fotoPreview} />
                ) : (
                  <div style={estilos.fotoPlaceholder}>
                    <Upload size={24} color="var(--color-texto-suave)" />
                    <span style={{ fontSize: 11, color: 'var(--color-texto-suave)', marginTop: 4 }}>Foto</span>
                  </div>
                )}
                <input type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
              </label>
            </div>

            {/* Campos Base */}
            <div style={estilos.camposBase}>
              <div style={estilos.campo}>
                <label style={estilos.label}>Nombre completo *</label>
                <input required value={nombre} onChange={e => setNombre(e.target.value)} style={estilos.input} placeholder="Ej. Juan Pérez" />
              </div>
              <div style={estilos.campo}>
                <label style={estilos.label}>Apodo</label>
                <input value={apodo} onChange={e => setApodo(e.target.value)} style={estilos.input} placeholder="Opcional" />
              </div>
            </div>
          </div>

          <div style={estilos.grid2}>
            <div style={estilos.campo}>
              <label style={estilos.label}>Categoría de Peso</label>
              <select value={categoriaPeso} onChange={e => setCategoriaPeso(e.target.value)} style={estilos.select}>
                {CATEGORIAS_PESO.map(c => <option key={c} value={c} style={{ background: '#1a1a1f', color: '#e0e0e0' }}>{c}</option>)}
              </select>
            </div>
            <div style={estilos.campo}>
              <label style={estilos.label}>Guardia (Estancia)</label>
              <select value={estancia} onChange={e => setEstancia(e.target.value)} style={estilos.select}>
                <option value="Ortodoxa" style={{ background: '#1a1a1f', color: '#e0e0e0' }}>Ortodoxa (Diestro)</option>
                <option value="Zurdo" style={{ background: '#1a1a1f', color: '#e0e0e0' }}>Zurdo (Southpaw)</option>
                <option value="Ambidiestro" style={{ background: '#1a1a1f', color: '#e0e0e0' }}>Ambidiestro</option>
              </select>
            </div>
          </div>

          <div style={estilos.campo}>
            <label style={estilos.label}>Notas / Contexto</label>
            <textarea value={notas} onChange={e => setNotas(e.target.value)} style={estilos.textarea} rows={3} placeholder="Lesiones, observaciones tácticas generales..." />
          </div>

          <div style={estilos.footer}>
            <button type="button" onClick={onClose} className="boton-secundario">Cancelar</button>
            <button type="submit" className="boton-primario">Guardar Boxeador</button>
          </div>
        </form>
        </motion.div>
      </motion.div>
      )}
    </AnimatePresence>
  )
}

const estilos = {
  overlay: {
    position: 'fixed',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modal: {
    background: 'var(--color-superficie)',
    border: '1px solid var(--color-borde)',
    borderRadius: '12px',
    width: 500,
    maxWidth: '90%',
    boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px 24px',
    borderBottom: '1px solid var(--color-borde)',
  },
  titulo: {
    fontSize: 18,
    fontWeight: 600,
    color: 'var(--color-texto)',
  },
  btnCerrar: {
    background: 'transparent',
    border: 'none',
    color: 'var(--color-texto-suave)',
    cursor: 'pointer',
  },
  form: {
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: 20,
  },
  grid: {
    display: 'flex',
    gap: 20,
  },
  grid2: {
    display: 'flex',
    gap: 20,
  },
  fotoContainer: {
    width: 100,
    flexShrink: 0,
  },
  fotoLabel: {
    display: 'block',
    cursor: 'pointer',
    width: 100,
    height: 100,
    borderRadius: 8,
    overflow: 'hidden',
    border: '1px dashed var(--color-borde)',
  },
  fotoPlaceholder: {
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'var(--color-superficie-2)',
  },
  fotoPreview: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  camposBase: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  campo: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    flex: 1,
  },
  label: {
    fontSize: 12,
    color: 'var(--color-texto-suave)',
    fontWeight: 500,
  },
  input: {
    background: 'var(--color-superficie-2)',
    border: '1px solid var(--color-borde)',
    color: 'var(--color-texto)',
    padding: '10px 12px',
    borderRadius: 6,
    outline: 'none',
    fontFamily: 'inherit',
  },
  select: {
    background: 'var(--color-superficie-2)',
    border: '1px solid var(--color-borde)',
    color: 'var(--color-texto)',
    padding: '10px 12px',
    borderRadius: 6,
    outline: 'none',
    fontFamily: 'inherit',
  },
  textarea: {
    background: 'var(--color-superficie-2)',
    border: '1px solid var(--color-borde)',
    color: 'var(--color-texto)',
    padding: '10px 12px',
    borderRadius: 6,
    outline: 'none',
    fontFamily: 'inherit',
    resize: 'none',
  },
  footer: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 8,
  }
}
