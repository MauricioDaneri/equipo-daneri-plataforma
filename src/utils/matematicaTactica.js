/**
 * matematicaTactica.js
 * Lógica oficial para el cálculo de KPIs en la Plataforma Equipo Daneri.
 */

export const calcularMetricas = (eventos, esquina) => {
  const filtrados = eventos.filter(e => e.esquina === esquina);
  
  // 1. Eficacia Ofensiva (EO)
  // Definición: % de golpes que impactan (suponemos que en el editor el analista solo marca impactos, 
  // pero para el modelo táctico diferenciamos lanzados de conectados si existieran).
  // En la versión actual, calculamos volumen relativo.
  const golpes = filtrados.filter(e => ['Jab', 'Recto', 'Cross', 'Gancho', 'Uppercut', 'Swing'].includes(e.tipo)).length;
  const defensas = filtrados.filter(e => ['Esquiva', 'Bloqueo'].includes(e.tipo)).length;
  
  // 2. Ratio de Contraataque (RC)
  // Definición: % de veces que se lanza un golpe en menos de 1 segundo tras una esquiva.
  const esquivas = filtrados.filter(e => e.tipo === 'Esquiva');
  let contraataques = 0;
  
  esquivas.forEach(esq => {
    const siguienteAccion = filtrados.find(e => 
      e.timestamp > esq.timestamp && 
      e.timestamp <= esq.timestamp + 1.0 && 
      ['Jab', 'Recto', 'Cross', 'Gancho', 'Uppercut', 'Swing'].includes(e.tipo)
    );
    if (siguienteAccion) contraataques++;
  });

  const rc = esquivas.length > 0 ? (contraataques / esquivas.length) * 100 : 0;

  return {
    volumenGolpeo: golpes,
    capacidadDefensiva: defensas,
    ratioContraataque: Math.round(rc)
  };
};
