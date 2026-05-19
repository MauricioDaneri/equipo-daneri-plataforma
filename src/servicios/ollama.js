/**
 * ollama.js — Cliente de la API de Ollama
 * Plataforma de Análisis — Equipo Daneri
 * Skill_OllamaIntegration — Ollama es OPCIONAL
 */

const getConfig = async () => {
  const { db } = await import('./db.js')
  const config = await db.configuracion.get(1)
  return {
    url: config?.ollamaUrl ?? 'http://localhost:11434',
    modelo: config?.ollamaModelo ?? 'llama3.2',
  }
}

/**
 * Verifica si Ollama está corriendo.
 * @returns {Promise<boolean>}
 */
export async function verificarOllama() {
  try {
    const { url } = await getConfig()
    const res = await fetch(`${url}/api/tags`, {
      signal: AbortSignal.timeout(2000),
    })
    return res.ok
  } catch {
    return false
  }
}

/**
 * Construye el prompt para análisis táctico de una sesión.
 */
function construirPrompt({ boxeadorRojo, boxeadorAzul, rounds, eventos, golpes }) {
  return `Eres un analista de boxeo profesional de élite para el Equipo Daneri.
Analizá esta sesión en español latinoamericano, de forma directa y accionable.

DATOS DE LA SESIÓN:
- Boxeador Rojo: ${boxeadorRojo ?? 'Desconocido'}
- Boxeador Azul: ${boxeadorAzul ?? 'Desconocido'}
- Rounds: ${rounds ?? 0}
- Eventos críticos: ${JSON.stringify(eventos ?? [])}
- Distribución de golpes: ${JSON.stringify(golpes ?? {})}

Generá un análisis con estas secciones:
1. Resumen de la pelea (2-3 oraciones)
2. Puntos fuertes del Rincón Rojo
3. Puntos a mejorar del Rincón Rojo
4. Recomendación táctica para la próxima sesión`.trim()
}

/**
 * Genera la síntesis táctica de una sesión usando Ollama.
 * Si Ollama no está disponible, lanza un error para que el caller lo maneje.
 *
 * @param {Object} datosSesion
 * @returns {Promise<string>} Texto de análisis
 */
export async function generarSintesis(datosSesion) {
  const { url, modelo } = await getConfig()

  const res = await fetch(`${url}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: modelo,
      prompt: construirPrompt(datosSesion),
      stream: false,
      options: { temperature: 0.3 },
    }),
    signal: AbortSignal.timeout(60000), // 60s timeout para modelos lentos
  })

  if (!res.ok) throw new Error(`Ollama respondió con ${res.status}`)

  const data = await res.json()
  return data.response ?? ''
}

/**
 * Genera la síntesis táctica de un BOXEADOR usando Ollama.
 */
export async function generarSintesisDossier(datos) {
  const { url, modelo } = await getConfig()

  const prompt = `Eres el asistente experto de boxeo "Einstein" del Equipo Daneri.
Analiza este perfil de boxeador:
- Nombre: ${datos.nombre}
- Eficacia Ofensiva: ${datos.stats.eficacia}%
- Defensas Totales: ${datos.stats.bloqueos + datos.stats.esquivas}
- Golpes más usados: ${JSON.stringify(datos.stats.distribucion)}
- Sesiones analizadas: ${datos.stats.totalSesiones}

Genera:
1. Resumen de estilo de pelea (2-3 oraciones)
2. Punto fuerte
3. Área crítica a mejorar
Sé directo y profesional.`.trim()

  const res = await fetch(`${url}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: modelo,
      prompt,
      stream: false,
      options: { temperature: 0.3 },
    }),
    signal: AbortSignal.timeout(60000),
  })

  if (!res.ok) throw new Error(`Ollama respondió con ${res.status}`)

  const data = await res.json()
  return data.response ?? ''
}

/**
 * Analiza un fotograma del video usando un modelo multimodal de Ollama (ej. Llava o llama3.2-vision).
 * 
 * @param {string} base64Image Imagen en base64 (con o sin el prefijo "data:image...")
 * @param {string} [modeloOverride] Modelo de visión a usar
 * @returns {Promise<Object>} Resultado parseado JSON con la acción de boxeo detectada
 */
export async function analizarFrameConOllama(base64Image, modeloOverride) {
  const { url } = await getConfig()
  const modeloVision = modeloOverride || 'llava' // llava es el default para vision en ollama

  // Limpiar el prefijo base64 si existe
  let base64Limpia = base64Image
  if (base64Image.includes(',')) {
    base64Limpia = base64Image.split(',')[1]
  }

  const prompt = `Analiza este fotograma de una pelea de boxeo y determina si hay un golpe o acción táctica ocurriendo en este instante preciso.
Responde estrictamente en formato JSON utilizando exactamente el siguiente esquema. No agregues explicaciones, markdown ni texto adicional.

Esquema JSON a retornar:
{
  "golpeDetectado": true o false,
  "tipo": "Jab" | "Cross" | "Gancho" | "Uppercut" | "Esquiva" | "Bloqueo" | "Clinch" | null,
  "esquina": "roja" | "azul" | null,
  "zona": "Cabeza Izquierda" | "Cabeza Derecha" | "Cabeza Centro" | "Cuerpo Izquierdo (Hígado)" | "Cuerpo Derecho (Bazo)" | "Cuerpo Centro" | null,
  "nota": "Breve descripción táctica de la acción en español"
}`

  const res = await fetch(`${url}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: modeloVision,
      prompt,
      images: [base64Limpia],
      stream: false,
      format: 'json',
      options: { temperature: 0.1 }
    }),
    signal: AbortSignal.timeout(30000), // 30s timeout para análisis de imagen
  })

  if (!res.ok) throw new Error(`Ollama respondió con ${res.status}`)

  const data = await res.json()
  try {
    return JSON.parse(data.response.trim())
  } catch (err) {
    // Si falla el parsing JSON de Ollama, intentar regex simple o devolver objeto vacío estructurado
    const respText = data.response || ''
    const golpeDetectado = respText.includes('true') || respText.toLowerCase().includes('detectado": true')
    let tipo = null
    if (respText.includes('Jab')) tipo = 'Jab'
    else if (respText.includes('Cross')) tipo = 'Cross'
    else if (respText.includes('Gancho')) tipo = 'Gancho'
    else if (respText.includes('Uppercut')) tipo = 'Uppercut'
    else if (respText.includes('Esquiva')) tipo = 'Esquiva'
    else if (respText.includes('Bloqueo')) tipo = 'Bloqueo'
    else if (respText.includes('Clinch')) tipo = 'Clinch'

    let esquina = null
    if (respText.toLowerCase().includes('roja')) esquina = 'roja'
    else if (respText.toLowerCase().includes('azul')) esquina = 'azul'

    let zona = null
    if (respText.includes('Hígado') || respText.includes('Izquierdo')) zona = 'Cuerpo Izquierdo (Hígado)'
    else if (respText.includes('Bazo') || respText.includes('Derecho')) zona = 'Cuerpo Derecho (Bazo)'
    else if (respText.includes('Cabeza Centro')) zona = 'Cabeza Centro'
    else if (respText.includes('Cabeza Izquierda')) zona = 'Cabeza Izquierda'
    else if (respText.includes('Cabeza Derecha')) zona = 'Cabeza Derecha'

    return {
      golpeDetectado,
      tipo,
      esquina,
      zona,
      nota: 'Análisis de IA local (Ollama Vision)'
    }
  }
}

