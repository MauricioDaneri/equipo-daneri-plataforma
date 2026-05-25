import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { db } from '../servicios/db'
import { useLiveQuery } from 'dexie-react-hooks'
import { Play, Pause, SkipBack, SkipForward } from 'lucide-react'

const ACCIONES_FILA_1 = ['Jab', 'Recto', 'Cross', 'Gancho', 'Uppercut', 'Swing']
const ACCIONES_FILA_2 = ['Finta', 'Esquiva', 'Bloqueo', 'Clinch', 'Pivoteo', 'Marca General']
const ESTADOS_FISICOS = []

export default function PanelControl() {
  const { id } = useParams()
  const [esquinaDestino, setEsquinaDestino] = useState('roja')
  const [isPlaying, setIsPlaying] = useState(false)
  const configuracion = useLiveQuery(() => db.configuracion.get(1))
  const hotkeys = configuracion?.hotkeys || {}
  const channel = new BroadcastChannel('daneri-editor')

  const sendCmd = (cmd, payload) => {
    channel.postMessage({ cmd, payload })
  }

  useEffect(() => {
    // Notificar al editor que el panel remoto está abierto
    sendCmd('panelReady')

    const handleMessage = (e) => {
      const { cmd, payload } = e.data || {}
      if (cmd === 'stateUpdate') {
        if (payload.isPlaying !== undefined) {
          setIsPlaying(payload.isPlaying)
        }
        if (payload.esquinaDestino !== undefined) {
          setEsquinaDestino(payload.esquinaDestino)
        }
      }
    }
    channel.addEventListener('message', handleMessage)
    
    const handleUnload = () => {
      sendCmd('panelClosed')
    }
    window.addEventListener('beforeunload', handleUnload)
    return () => {
      window.removeEventListener('beforeunload', handleUnload)
      channel.removeEventListener('message', handleMessage)
      sendCmd('panelClosed')
    }
  }, [])

  const togglePlay = () => {
    setIsPlaying(!isPlaying)
    sendCmd('togglePlay')
  }

  const handleSetEsquina = (esq) => {
    setEsquinaDestino(esq)
    sendCmd('setEsquinaDestino', esq)
  }

  const formatearTecla = (code) => {
    if (!code) return ''
    if (code.startsWith('Key')) return code.replace('Key', '')
    if (code.startsWith('Digit')) return code.replace('Digit', '')
    if (code === 'Space') return 'Espacio'
    if (code === 'ArrowLeft') return '←'
    if (code === 'ArrowRight') return '→'
    return code
  }

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.repeat) return
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return
      
      const registrar = (tipo) => {
        e.preventDefault()
        sendCmd('registrarEvento', { tipo, esquina: esquinaDestino })
      }

      switch(e.code) {
        case hotkeys.PlayPause: e.preventDefault(); togglePlay(); break;
        case hotkeys.Atras: e.preventDefault(); sendCmd('saltar', -5); break;
        case hotkeys.Adelante: e.preventDefault(); sendCmd('saltar', 5); break;
        case hotkeys.RinconRojo: e.preventDefault(); handleSetEsquina('roja'); break;
        case hotkeys.RinconAzul: e.preventDefault(); handleSetEsquina('azul'); break;
        case hotkeys.Jab: registrar('Jab'); break;
        case hotkeys.Recto: registrar('Recto'); break;
        case hotkeys.Cross: registrar('Cross'); break;
        case hotkeys.Gancho: registrar('Gancho'); break;
        case hotkeys.Uppercut: registrar('Uppercut'); break;
        case hotkeys.Swing: registrar('Swing'); break;
        case hotkeys.Finta: registrar('Finta'); break;
        case hotkeys.Esquiva: registrar('Esquiva'); break;
        case hotkeys.Bloqueo: registrar('Bloqueo'); break;
        case hotkeys.Clinch: registrar('Clinch'); break;
        case hotkeys.Pivoteo: registrar('Pivoteo'); break;
        case hotkeys["Marca General"]: registrar('Marca General'); break;
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [esquinaDestino, hotkeys, isPlaying])

  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 24, background: 'var(--color-fondo)', minHeight: '100vh', color: 'var(--color-texto)' }}>
      <h2 style={{ margin: 0, fontSize: 16, textAlign: 'center', color: 'var(--color-dorado)' }}>PANEL DE CONTROL REMOTO</h2>
      
      <div style={{ display: 'flex', justifyContent: 'center', gap: 16, background: 'var(--color-superficie)', padding: 16, borderRadius: 8 }}>
        <button style={estilos.btnPlayback} onClick={() => sendCmd('saltar', -5)}><SkipBack size={24} color="var(--color-texto)" /></button>
        <button style={estilos.btnPlayMain} onClick={togglePlay}>
          {isPlaying ? <Pause size={28} color="var(--color-fondo)" /> : <Play size={28} color="var(--color-fondo)" style={{marginLeft: 4}}/>}
        </button>
        <button style={estilos.btnPlayback} onClick={() => sendCmd('saltar', 5)}><SkipForward size={24} color="var(--color-texto)" /></button>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
        <div style={estilos.toggleFocoWrapper}>
          <button style={estilos.btnFoco('roja', esquinaDestino)} onClick={() => handleSetEsquina('roja')}>
            <span style={{ fontSize: 10, opacity: 0.7, marginRight: 6 }}>[{formatearTecla(hotkeys.RinconRojo)}]</span>Rincón Rojo
          </button>
          <button style={estilos.btnFoco('azul', esquinaDestino)} onClick={() => handleSetEsquina('azul')}>
            <span style={{ fontSize: 10, opacity: 0.7, marginRight: 6 }}>[{formatearTecla(hotkeys.RinconAzul)}]</span>Rincón Azul
          </button>
        </div>
      </div>

      <div style={estilos.gridFila1}>
        {ACCIONES_FILA_1.map(act => (
          <button key={act} style={estilos.btnAccionPrincipal(esquinaDestino)} onClick={() => sendCmd('registrarEvento', {tipo: act, esquina: esquinaDestino})}>
            {act} <span style={estilos.hotkeyHint}>[{formatearTecla(hotkeys[act])}]</span>
          </button>
        ))}
      </div>


      <div style={estilos.gridFila2}>
        {ACCIONES_FILA_2.map(act => (
          <button key={act} style={estilos.btnAccionSecundaria} onClick={() => sendCmd('registrarEvento', {tipo: act, esquina: esquinaDestino})}>
            {act} {hotkeys[act] && <span style={estilos.hotkeyHint}>[{formatearTecla(hotkeys[act])}]</span>}
          </button>
        ))}
      </div>
    </div>
  )
}

const estilos = {
  btnPlayback: { background: 'transparent', border: 'none', cursor: 'pointer', opacity: 0.8 },
  btnPlayMain: { background: 'var(--color-dorado)', border: 'none', width: 56, height: 56, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 0 20px rgba(212,175,55,0.4)', transition: 'transform 0.1s' },
  toggleFocoWrapper: { display: 'flex', background: 'var(--color-superficie)', borderRadius: 6, padding: 4, border: '1px solid var(--color-borde)', width: '100%' },
  btnFoco: (esquina, activo) => ({
    flex: 1, padding: '12px', borderRadius: 4, fontSize: 14, fontWeight: 700, textTransform: 'uppercase', cursor: 'pointer', border: 'none', transition: 'all 0.2s',
    background: activo === esquina ? (esquina === 'roja' ? 'rgba(231,76,60,0.15)' : 'rgba(52,152,219,0.15)') : 'transparent',
    color: activo === esquina ? (esquina === 'roja' ? 'var(--color-rojo-suave)' : 'var(--color-azul-suave)') : 'var(--color-texto-suave)',
  }),
  hotkeyHint: { opacity: 0.5, fontSize: 10, marginLeft: 4, fontWeight: 500 },
  gridFila1: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 },
  gridFila2: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 },
  btnAccionPrincipal: (foco) => ({ background: 'var(--color-superficie)', border: `1px solid ${foco === 'roja' ? 'rgba(231,76,60,0.5)' : 'rgba(52,152,219,0.5)'}`, color: foco === 'roja' ? 'var(--color-rojo-suave)' : 'var(--color-azul-suave)', padding: '16px 0', borderRadius: 6, fontSize: 16, fontWeight: 700, cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.05em' }),
  btnAccionSecundaria: { background: 'var(--color-superficie)', border: '1px solid var(--color-borde)', color: 'var(--color-texto)', padding: '12px 4px', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer', textTransform: 'uppercase' },
}
