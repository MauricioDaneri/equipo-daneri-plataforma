import { describe, it, expect } from 'vitest'
import { calcularMetricas } from '../matematicaTactica'

describe('matematicaTactica.js — Lógica de KPIs del Equipo Daneri', () => {
  it('debe calcular métricas básicas correctamente', () => {
    const eventos = [
      { tipo: 'Jab', esquina: 'roja', timestamp: 1.0 },
      { tipo: 'Cross', esquina: 'roja', timestamp: 2.0 },
      { tipo: 'Gancho', esquina: 'roja', timestamp: 3.0 },
      { tipo: 'Esquiva', esquina: 'roja', timestamp: 4.0 },
      { tipo: 'Bloqueo', esquina: 'roja', timestamp: 5.0 },
      { tipo: 'Jab', esquina: 'azul', timestamp: 1.5 }, // Esquina azul ignorada
    ]

    const metricas = calcularMetricas(eventos, 'roja')
    
    expect(metricas.volumenGolpeo).toBe(3)
    expect(metricas.capacidadDefensiva).toBe(2)
    expect(metricas.ratioContraataque).toBe(0) // No hay golpes inmediatos tras esquiva
  })

  it('debe calcular el Ratio de Contraataque (RC) en la ventana de 1.0 segundo', () => {
    const eventos = [
      // Esquiva en t=10s, golpe inmediato en t=10.5s (Contraataque válido)
      { tipo: 'Esquiva', esquina: 'roja', timestamp: 10.0 },
      { tipo: 'Cross', esquina: 'roja', timestamp: 10.5 },

      // Esquiva en t=20s, golpe tardío en t=21.5s (Fuera de la ventana)
      { tipo: 'Esquiva', esquina: 'roja', timestamp: 20.0 },
      { tipo: 'Jab', esquina: 'roja', timestamp: 21.5 },
    ]

    const metricas = calcularMetricas(eventos, 'roja')
    
    expect(metricas.volumenGolpeo).toBe(2)
    expect(metricas.capacidadDefensiva).toBe(2)
    expect(metricas.ratioContraataque).toBe(50) // 1 de 2 esquivas contraatacadas con éxito (50%)
  })
})
