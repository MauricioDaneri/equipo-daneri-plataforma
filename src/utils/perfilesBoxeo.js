/**
 * perfilesBoxeo.js — Algoritmo de clasificación de perfiles tácticos de Boxeo
 * Plataforma de Análisis — Equipo Daneri
 */

import { calcularMetricas } from './matematicaTactica'

export function clasificarPerfiles(eventos = [], esquina = 'roja') {
  // 1. Contar eventos por tipo
  const GOLPES_OFENSIVOS = ['Jab', 'Recto', 'Cross', 'Gancho', 'Uppercut', 'Swing'];
  const counts = {
    Jab: 0,
    Recto: 0,
    Cross: 0,
    Gancho: 0,
    Uppercut: 0,
    Swing: 0,
    Finta: 0,
    Esquiva: 0,
    Bloqueo: 0,
    Clinch: 0,
    Pivoteo: 0,
    'Marca General': 0,
    Conectado: 0,
    Errado: 0,
    // Nuevas estadísticas por mano
    adelantadaLanzados: 0,
    adelantadaConectados: 0,
    adelantadaErrados: 0,
    adelantadaFintas: 0,
    atrasadaLanzados: 0,
    atrasadaConectados: 0,
    atrasadaErrados: 0,
    atrasadaFintas: 0
  }

  const filtrados = eventos.filter(e => e.esquina === esquina)

  // Si no hay eventos para este boxeador, devolver todo en 0%
  if (filtrados.length === 0) {
    return {
      estilista: 0,
      fajador: 0,
      slugger: 0,
      counter: 0,
      mixto: 0,
      counts,
      resumen: {
        eficacia: 0,
        rc: 0,
        volumen: 0,
        defensas: 0
      }
    }
  }

  filtrados.forEach(e => {
    if (counts[e.tipo] !== undefined) {
      counts[e.tipo]++
    }
    
    // Check if it's connected, missed or feint
    if (e.tipo === 'Golpe Conectado') {
      counts.Conectado++
    } else if (e.tipo === 'Golpe Errado') {
      counts.Errado++
    } else if (GOLPES_OFENSIVOS.includes(e.tipo)) {
      // Determinar mano (adelantada o atrasada)
      let mano = e.mano;
      if (!mano) {
        // Asignación automática por defecto basada en boxeo
        if (e.tipo === 'Jab' || e.tipo === 'Gancho' || e.tipo === 'Recto') {
          mano = 'adelantada';
        } else {
          mano = 'atrasada';
        }
      }
      
      const resultado = e.resultado || 'Conectado';
      
      if (resultado === 'Conectado') {
        counts.Conectado++
        if (mano === 'adelantada') {
          counts.adelantadaConectados++
          counts.adelantadaLanzados++
        } else {
          counts.atrasadaConectados++
          counts.atrasadaLanzados++
        }
      } else if (resultado === 'Errado') {
        counts.Errado++
        if (mano === 'adelantada') {
          counts.adelantadaErrados++
          counts.adelantadaLanzados++
        } else {
          counts.atrasadaErrados++
          counts.atrasadaLanzados++
        }
      } else if (resultado === 'Finta') {
        counts.Finta++
        if (mano === 'adelantada') {
          counts.adelantadaFintas++
          counts.adelantadaLanzados++
        } else {
          counts.atrasadaFintas++
          counts.atrasadaLanzados++
        }
      }
    }
  })

  // Golpes de poder y totales
  const golpesDePoder = counts.Cross + counts.Gancho + counts.Uppercut + counts.Recto + counts.Swing
  const golpesTotales = counts.Jab + golpesDePoder
  const defensasTotales = counts.Esquiva + counts.Bloqueo
  
  // Eficacia
  const totalGolpesConexion = counts.Conectado + counts.Errado
  const eficacia = totalGolpesConexion > 0 ? (counts.Conectado / totalGolpesConexion) * 100 : 0

  // Métricas avanzadas usando matematicaTactica.js
  const kpis = calcularMetricas(eventos, esquina)
  const rc = kpis.ratioContraataque // Ratio de contraataque %

  // --- CALCULAR COMPATIBILIDAD POR PERFIL (0 - 100) ---

  // 1. Estilista (Out-Fighter)
  // Jabs > 40% de golpes, Esquivas > 60% de defensas, Clinches bajos, alta movilidad (esquivas/pivoteos)
  let estilista = 0
  if (golpesTotales > 0) {
    const pctJab = (counts.Jab / golpesTotales) * 100
    const pctEsquiva = defensasTotales > 0 ? (counts.Esquiva / defensasTotales) * 100 : 0
    
    // Contribuidores
    const c1 = Math.min(pctJab / 40, 1) * 40 // Hasta 40 pts por Jabs
    const c2 = Math.min(pctEsquiva / 60, 1) * 35 // Hasta 35 pts por Esquivas
    const c3 = (counts.Pivoteo > 0 ? 15 : 5) // Movilidad de piernas
    const c4 = Math.max(0, 10 - counts.Clinch * 2) // Penalización por clinch (prefiere distancia)
    
    estilista = Math.round(c1 + c2 + c3 + c4)
  }

  // 2. Fajador (In-Fighter)
  // Hook + Upper > 50% de golpes, alto clinch, presiona adentro
  let fajador = 0
  if (golpesTotales > 0) {
    const powerShort = counts.Gancho + counts.Uppercut
    const pctShort = (powerShort / golpesTotales) * 100
    
    const c1 = Math.min(pctShort / 50, 1) * 50 // Hasta 50 pts por golpes de corta distancia
    const c2 = Math.min(counts.Clinch * 10, 25) // Hasta 25 pts por clinch (adentro)
    const c3 = Math.min(counts.Bloqueo * 8, 25) // Prefiere bloqueos para entrar
    
    fajador = Math.round(c1 + c2 + c3)
  }

  // 3. Pegador (Slugger)
  // Golpes de poder (Cross, Hook, Upper, Recto, Swing) > 75%, baja movilidad
  let slugger = 0
  if (golpesTotales > 0) {
    const pctPoder = (golpesDePoder / golpesTotales) * 100
    
    const c1 = Math.min(pctPoder / 75, 1) * 70 // Hasta 70 pts por golpes potentes
    const c2 = eficacia > 45 ? 20 : Math.max(0, eficacia * 0.4) // Eficacia (pesa su puntería)
    const c3 = Math.max(0, 10 - counts.Esquiva) // Prefiere pararse que esquivar
    
    slugger = Math.round(c1 + c2 + c3)
  }

  // 4. Contragolpeador (Counter-Puncher)
  // Alto RC, fintas, bloqueos, esquivas
  let counter = 0
  if (defensasTotales > 0 || counts.Finta > 0) {
    const c1 = Math.min(rc / 50, 1) * 50 // Hasta 50 pts por velocidad de contra
    const c2 = Math.min(counts.Finta * 12, 25) // Fintas para provocar
    const c3 = Math.min(defensasTotales * 6, 25) // Respuestas defensivas
    
    counter = Math.round(c1 + c2 + c3)
  }

  // 5. Mixto (Boxer-Puncher)
  // Distribución equilibrada, eficacia general alta (> 50%)
  let mixto = 0
  if (golpesTotales > 0) {
    const pctJab = (counts.Jab / golpesTotales) * 100
    const pctPoder = (golpesDePoder / golpesTotales) * 100
    // Equilibrio óptimo: 35-50% Jab, 50-65% Poder
    const equilibrio = Math.abs(pctJab - 40) < 15 && Math.abs(pctPoder - 60) < 15 ? 40 : 20
    
    const c1 = equilibrio
    const c2 = Math.min(eficacia / 50, 1) * 40 // Hasta 40 pts por eficacia
    const c3 = Math.min(defensasTotales * 5, 20) // Capacidad defensiva equilibrada
    
    mixto = Math.round(c1 + c2 + c3)
  }

  // Normalizar a rangos [0, 100]
  return {
    estilista: Math.min(Math.max(estilista, 5), 100),
    fajador: Math.min(Math.max(fajador, 5), 100),
    slugger: Math.min(Math.max(slugger, 5), 100),
    counter: Math.min(Math.max(counter, 5), 100),
    mixto: Math.min(Math.max(mixto, 5), 100),
    counts,
    resumen: {
      eficacia: Math.round(eficacia),
      rc: Math.round(rc),
      volumen: golpesTotales,
      defensas: defensasTotales
    }
  }
}
