// ── setupTests.js — Global Test Mocks (Skill_setupTests) ────────────────────
// Mock de IndexedDB automático usando fake-indexeddb
import 'fake-indexeddb/auto'

// Mock de BroadcastChannel para comunicación multi-monitor
class MockBroadcastChannel {
  constructor(name) {
    this.name = name
    this.onmessage = null
  }
  postMessage(data) {
    // Enviar asíncronamente para imitar comportamiento real
    setTimeout(() => {
      if (typeof this.onmessage === 'function') {
        this.onmessage({ data })
      }
    }, 0)
  }
  close() {}
}
globalThis.BroadcastChannel = MockBroadcastChannel

// Mock de Web Speech API (SpeechRecognition)
class MockSpeechRecognition {
  constructor() {
    this.continuous = false
    this.interimResults = false
    this.lang = 'es-ES'
    this.onresult = null
    this.onend = null
    this.onerror = null
    
    // Almacenar instancia para poder interactuar en tests
    if (!globalThis.SpeechRecognition.instances) {
      globalThis.SpeechRecognition.instances = []
    }
    globalThis.SpeechRecognition.instances.push(this)
  }
  start() {
    this.isStarted = true
  }
  stop() {
    this.isStarted = false
    if (typeof this.onend === 'function') {
      this.onend()
    }
  }
  // Método auxiliar para los tests para simular voz capturada
  triggerResult(transcript) {
    if (typeof this.onresult === 'function') {
      const event = {
        results: [
          [
            { transcript }
          ]
        ]
      }
      this.onresult(event)
    }
  }
}
globalThis.SpeechRecognition = MockSpeechRecognition
globalThis.webkitSpeechRecognition = MockSpeechRecognition
globalThis.SpeechRecognition.instances = []

// Mock de AudioContext para los sonidos sintéticos
class MockAudioContext {
  constructor() {
    this.currentTime = 0
  }
  createOscillator() {
    return {
      type: 'sine',
      frequency: {
        setValueAtTime: vi.fn(),
        value: 440
      },
      connect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn()
    }
  }
  createGain() {
    return {
      gain: {
        setValueAtTime: vi.fn(),
        exponentialRampToValueAtTime: vi.fn()
      },
      connect: vi.fn()
    }
  }
  destination = {}
  close() {
    return Promise.resolve()
  }
}
globalThis.AudioContext = MockAudioContext
globalThis.webkitAudioContext = MockAudioContext

// Silenciar warnings de consola esperados durante tests
console.warn = vi.fn()

// Mock de Canvas para testing headless de Fabric.js en JSDOM
if (typeof window !== 'undefined') {
  HTMLCanvasElement.prototype.getContext = function (type) {
    if (type === '2d') {
      return {
        fillRect: () => {},
        clearRect: () => {},
        getImageData: (x, y, w, h) => ({ data: new Uint8ClampedArray(w * h * 4) }),
        putImageData: () => {},
        createImageData: () => [],
        setTransform: () => {},
        drawImage: () => {},
        save: () => {},
        restore: () => {},
        beginPath: () => {},
        moveTo: () => {},
        lineTo: () => {},
        closePath: () => {},
        stroke: () => {},
        translate: () => {},
        scale: () => {},
        rotate: () => {},
        arc: () => {},
        fill: () => {},
        measureText: () => ({ width: 0 }),
        transform: () => {},
        rect: () => {},
        clip: () => {},
      }
    }
    return null
  }
  HTMLCanvasElement.prototype.toDataURL = function () {
    return 'data:image/png;base64,'
  }
}

