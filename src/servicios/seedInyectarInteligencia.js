import { db } from './db'

export async function inyectarInteligenciaDanele() {
  const dossierJSON = {
    resumen: "Iván Danele demostró una lectura defensiva de elite en el Round 1, evadiendo múltiples intentos de clinch y bloqueando ataques frontales con precisión. Aunque Leveti logró conectar dos manos sólidas hacia el minuto 2:30 aprovechando un breve descuido en la guardia de Iván tras un intercambio, el boxeador azul recuperó inmediatamente el centro del ring y cerró el asalto con combinaciones de jab-cross que confirmaron su superioridad volumétrica y táctica.",
    metricas: [
      { label: "Ofensiva", rojo: 45, azul: 88 },
      { label: "Precisión", rojo: 55, azul: 82 },
      { label: "Defensa", rojo: 40, azul: 92 },
      { label: "Control", rojo: 35, azul: 85 },
      { label: "Estamina", rojo: 85, azul: 95 }
    ],
    ajustes: [
      "Mantener la mano derecha alta tras la salida del cross; Leveti detectó una apertura en el t=380.",
      "Continuar el uso del pivoteo lateral para castigar los intentos fallidos de clinch de Leveti.",
      "Explotar el 'Neuromuscular Decay' detectado en Leveti al fallar sus ataques de poder.",
      "Incrementar el volumen de golpes al cuerpo tras las esquivas exitosas para mermar la movilidad del rival."
    ]
  };

  try {
    // Buscamos la sesión de Iván vs Leveti
    const ivan = await db.boxeadores.where('nombre').equals('Iván Danele').first();
    if (!ivan) throw new Error("No se encontró el perfil de Iván.");

    const sesion = await db.sesiones.where('boxeadorRojoId').equals(ivan.id).first() 
                || await db.sesiones.where('boxeadorAzulId').equals(ivan.id).first();
    
    if (!sesion) throw new Error("No se encontró la sesión de análisis.");

    await db.sesiones.update(sesion.id, {
      sintesis: JSON.stringify(dossierJSON)
    });

    return { ok: true, mensaje: "Inteligencia Táctica de AGENT_TACTICAL_01 inyectada con éxito." };
  } catch (error) {
    console.error(error);
    return { ok: false, error: error.message };
  }
}
