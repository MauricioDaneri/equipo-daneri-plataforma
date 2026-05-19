import { describe, it, expect } from 'vitest'
import { clasificarPerfiles } from '../perfilesBoxeo'

describe('perfilesBoxeo.js — Algoritmos de Clasificación de Estilos de Boxeo', () => {
  it('debe clasificar a un boxeador como Estilista (Out-Fighter)', () => {
    // Un estilista usa muchos Jabs y Esquivas, tiene baja cantidad de clinches y alta movilidad
    const eventos = [
      { tipo: 'Jab', esquina: 'roja', timestamp: 1.0 },
      { tipo: 'Jab', esquina: 'roja', timestamp: 2.0 },
      { tipo: 'Jab', esquina: 'roja', timestamp: 3.0 },
      { tipo: 'Cross', esquina: 'roja', timestamp: 4.0 }, // 3 Jabs, 1 Cross -> Jabs = 75%
      { tipo: 'Esquiva', esquina: 'roja', timestamp: 5.0 },
      { tipo: 'Esquiva', esquina: 'roja', timestamp: 6.0 },
      { tipo: 'Bloqueo', esquina: 'roja', timestamp: 7.0 }, // 2 Esquivas, 1 Bloqueo -> Esquivas = 66%
      { tipo: 'Pivoteo', esquina: 'roja', timestamp: 8.0 },
    ]

    const perfiles = clasificarPerfiles(eventos, 'roja')
    
    expect(perfiles.estilista).toBeGreaterThan(perfiles.fajador)
    expect(perfiles.estilista).toBeGreaterThan(perfiles.slugger)
    expect(perfiles.estilista).toBeGreaterThanOrEqual(50)
  })

  it('debe clasificar a un boxeador como Fajador (In-Fighter)', () => {
    // Un fajador usa Ganchos y Uppercuts, clinches y bloqueos para presionar
    const eventos = [
      { tipo: 'Gancho', esquina: 'roja', timestamp: 1.0 },
      { tipo: 'Uppercut', esquina: 'roja', timestamp: 2.0 },
      { tipo: 'Gancho', esquina: 'roja', timestamp: 3.0 },
      { tipo: 'Jab', esquina: 'roja', timestamp: 4.0 }, // hook/upper = 75%
      { tipo: 'Clinch', esquina: 'roja', timestamp: 5.0 },
      { tipo: 'Clinch', esquina: 'roja', timestamp: 6.0 },
      { tipo: 'Bloqueo', esquina: 'roja', timestamp: 7.0 },
    ]

    const perfiles = clasificarPerfiles(eventos, 'roja')
    
    expect(perfiles.fajador).toBeGreaterThan(perfiles.estilista)
    expect(perfiles.fajador).toBeGreaterThanOrEqual(40)
  })

  it('debe clasificar a un boxeador como Pegador (Slugger)', () => {
    // Un slugger lanza principalmente golpes de poder (Cross, Gancho, Uppercut) y tiene baja movilidad (bloqueos sobre esquivas)
    const eventos = [
      { tipo: 'Cross', esquina: 'roja', timestamp: 1.0 },
      { tipo: 'Gancho', esquina: 'roja', timestamp: 2.0 },
      { tipo: 'Uppercut', esquina: 'roja', timestamp: 3.0 },
      { tipo: 'Cross', esquina: 'roja', timestamp: 4.0 }, // 100% golpes de poder
      { tipo: 'Bloqueo', esquina: 'roja', timestamp: 5.0 },
      { tipo: 'Golpe Conectado', esquina: 'roja', timestamp: 6.0 }, // sube la eficacia
    ]

    const perfiles = clasificarPerfiles(eventos, 'roja')
    
    expect(perfiles.slugger).toBeGreaterThan(perfiles.estilista)
    expect(perfiles.slugger).toBeGreaterThanOrEqual(50)
  })

  it('debe clasificar a un boxeador como Contragolpeador (Counter-Puncher)', () => {
    // Alto ratio de contraataque (RC), fintas, bloqueos
    const eventos = [
      { tipo: 'Esquiva', esquina: 'roja', timestamp: 10.0 },
      { tipo: 'Cross', esquina: 'roja', timestamp: 10.5 }, // Contraataque en t=10.5
      { tipo: 'Finta', esquina: 'roja', timestamp: 12.0 },
      { tipo: 'Bloqueo', esquina: 'roja', timestamp: 15.0 },
    ]

    const perfiles = clasificarPerfiles(eventos, 'roja')
    
    expect(perfiles.counter).toBeGreaterThan(perfiles.estilista)
    expect(perfiles.counter).toBeGreaterThanOrEqual(40)
  })
})
