import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useSpeechControl } from '../useSpeechControl'

describe('Speech Control Engine - useSpeechControl Hook', () => {
  let onComandoMock
  let getCurrentTimeMock
  let getCurrentRoundMock

  beforeEach(() => {
    onComandoMock = vi.fn()
    getCurrentTimeMock = vi.fn(() => 42) // 42 segundos de video
    getCurrentRoundMock = vi.fn(() => 2) // Round 2
    if (globalThis.SpeechRecognition) {
      globalThis.SpeechRecognition.instances = []
    }
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('debe inicializarse con el soporte adecuado de Web Speech API', () => {
    const { result } = renderHook(() => useSpeechControl({
      onComando: onComandoMock,
      getCurrentTime: getCurrentTimeMock,
      getCurrentRound: getCurrentRoundMock
    }))

    expect(result.current.soportado).toBe(true)
    expect(result.current.escuchando).toBe(false)
    expect(result.current.ultimaFrase).toBe('')
    expect(result.current.ultimoComando).toBeNull()
  })

  it('debe poder activar y desactivar la escucha', () => {
    const { result } = renderHook(() => useSpeechControl({
      onComando: onComandoMock,
      getCurrentTime: getCurrentTimeMock,
      getCurrentRound: getCurrentRoundMock
    }))

    // Iniciar escucha
    act(() => {
      result.current.iniciarEscucha()
    })
    expect(result.current.escuchando).toBe(true)

    // Detener escucha
    act(() => {
      result.current.detenerEscucha()
    })
    expect(result.current.escuchando).toBe(false)
  })

  it('debe registrar y procesar comandos de voz correctamente', async () => {
    const { result } = renderHook(() => useSpeechControl({
      onComando: onComandoMock,
      getCurrentTime: getCurrentTimeMock,
      getCurrentRound: getCurrentRoundMock
    }))

    act(() => {
      result.current.iniciarEscucha()
    })

    // Recuperar la instancia mockeada de SpeechRecognition
    const recognitionInstance = globalThis.SpeechRecognition.prototype
    
    // Simular que el usuario dice "jab"
    act(() => {
      // Obtenemos el handler registrado en la inicialización
      // Como usamos renderHook, se ejecuta el useEffect. Busquemos la instancia de recognition creada.
      // En nuestro mock de setupTests, registramos onresult en el constructor.
      // Vamos a disparar un resultado ficticio:
      const inst = globalThis.webkitSpeechRecognition.instances?.[0] || globalThis.SpeechRecognition.instances?.[0]
      if (inst && typeof inst.onresult === 'function') {
        inst.onresult({
          results: [[{ transcript: 'jab' }]]
        })
      }
    })

    // Esperamos que se haya procesado el comando
    expect(result.current.ultimaFrase).toBe('jab')
    expect(onComandoMock).toHaveBeenCalledWith('Jab', 'jab')
  })

  it('debe registrar comentarios generales que no sean comandos de voz', () => {
    const { result } = renderHook(() => useSpeechControl({
      onComando: onComandoMock,
      getCurrentTime: getCurrentTimeMock,
      getCurrentRound: getCurrentRoundMock
    }))

    act(() => {
      result.current.iniciarEscucha()
    })

    act(() => {
      const inst = globalThis.SpeechRecognition.instances?.[0]
      if (inst && typeof inst.onresult === 'function') {
        inst.onresult({
          results: [[{ transcript: 'El boxeador se mueve muy bien y mantiene la guardia alta' }]]
        })
      }
    })

    expect(result.current.ultimaFrase).toBe('el boxeador se mueve muy bien y mantiene la guardia alta')
    // No debe disparar onComando ya que no coincide con palabras clave de comandos exactas
    expect(onComandoMock).not.toHaveBeenCalled()
  })

  it('debe generar la transcripción en Markdown correctamente', () => {
    const { result } = renderHook(() => useSpeechControl({
      onComando: onComandoMock,
      getCurrentTime: getCurrentTimeMock,
      getCurrentRound: getCurrentRoundMock
    }))

    act(() => {
      result.current.iniciarEscucha()
    })

    // Agregar eventos al log simulando voz
    act(() => {
      const inst = globalThis.SpeechRecognition.instances?.[0]
      if (inst) {
        inst.onresult({ results: [[{ transcript: 'jab' }]] })
        inst.onresult({ results: [[{ transcript: 'esquiva excelente' }]] })
      }
    })

    const md = result.current.generarTranscripcionMD('Iván vs Leveti')
    expect(md).toContain('# Transcripción de Sesión — Iván vs Leveti')
    expect(md).toContain('Round 2')
    expect(md).toContain('COMANDO: Jab')
    expect(md).toContain('esquiva excelente')
  })

  it('debe poder limpiar el log y resetear el estado', () => {
    const { result } = renderHook(() => useSpeechControl({
      onComando: onComandoMock,
      getCurrentTime: getCurrentTimeMock,
      getCurrentRound: getCurrentRoundMock
    }))

    act(() => {
      result.current.iniciarEscucha()
      const inst = globalThis.SpeechRecognition.instances?.[0]
      if (inst) inst.onresult({ results: [[{ transcript: 'jab' }]] })
    })

    expect(result.current.totalFrases).toBe(1)

    act(() => {
      result.current.limpiarLog()
    })

    expect(result.current.totalFrases).toBe(0)
    expect(result.current.ultimaFrase).toBe('')
  })
})
