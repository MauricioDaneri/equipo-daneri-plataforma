/**
 * bridge.js - El sistema nervioso que une Antigravity con Agent_Tactical_01
 * Permite la transmisión de telemetría y la recepción de lógica de combate.
 */

export const enviarASstudio = async (payload, apiKey) => {
  console.log("[ANTIGRAVITY] Transmitiendo a Tactical_01...");
  
  const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${apiKey}`;

  try {
    const response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{ 
          parts: [{ text: typeof payload === 'string' ? payload : JSON.stringify(payload) }] 
        }]
      })
    });

    if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
    
    const data = await response.json();
    const respuestaIA = data.candidates[0].content.parts[0].text;
    
    console.log("[ANTIGRAVITY] Respuesta recibida de Tactical_01.");
    return respuestaIA;
  } catch (error) {
    console.error("Error en el puente táctico:", error);
    return { error: error.message };
  }
};
