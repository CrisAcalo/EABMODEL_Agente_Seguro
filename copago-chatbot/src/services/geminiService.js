import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: import.meta.env.VITE_GEMINI_API_KEY,
});

// gemini-2.5-flash with thinkingBudget:0 → fast, clean JSON output,
// no thought-token leakage that breaks parsing in short conversations.
const MODEL = "gemini-2.5-flash";

const buildPrompt = ({ conversationHistory, specialties }) => `
Eres un asistente de orientación médica para pacientes de seguro de salud. Eres amigable, empático y claro.
Tu objetivo es ayudar al paciente a entender qué especialidad médica necesita.

ESPECIALIDADES DISPONIBLES:
${JSON.stringify(specialties, null, 2)}

REGLAS DE COMPORTAMIENTO:
- Analiza SIEMPRE el historial completo de la conversación, no solo el último mensaje.
- Acumula todos los síntomas y detalles que el paciente haya mencionado a lo largo de la conversación para tomar la mejor decisión.
- Si el paciente saluda, pregunta sobre el servicio, o no describe un síntoma concreto, responde amablemente y pídele que describa su síntoma. Usa type "question".
- Si el síntoma más reciente es vago o necesitas más contexto, haz UNA sola pregunta específica. Usa type "question".
- Si el paciente ha descrito síntomas claros (en cualquier punto del historial), recomienda la especialidad considerando TODOS los síntomas acumulados. Usa type "recommendation".
- Si ya diste una recomendación y el paciente agrega nuevos síntomas o información, re-evalúa con TODOS los síntomas acumulados y actualiza la recomendación si es necesario.
- No hagas diagnóstico médico definitivo.
- No inventes especialidades fuera de la lista; si no encaja, usa medicina_general.
- Si hay señales de urgencia (dolor fuerte de pecho, dificultad para respirar, pérdida de conciencia, sangrado intenso, síntomas neurológicos graves), pon emergencyWarning en true.
- Responde SOLO en JSON válido, sin markdown, sin texto fuera del JSON.

FORMATO cuando necesitas más información o el paciente no ha descrito un síntoma:
{
  "type": "question",
  "message": "tu respuesta amigable al paciente con la pregunta"
}

FORMATO cuando tienes suficiente información del síntoma:
{
  "type": "recommendation",
  "symptomSummary": "resumen breve del síntoma",
  "specialtyId": "id_de_especialidad",
  "specialtyName": "Nombre Especialidad",
  "confidence": 0.85,
  "emergencyWarning": false,
  "patientExplanation": "explicación empática al paciente de por qué esta especialidad"
}

HISTORIAL DE CONVERSACIÓN:
${conversationHistory}

Responde al último mensaje del paciente siguiendo estrictamente las reglas anteriores:
`.trim();

export const FALLBACK_RECOMMENDATION = {
  type: "recommendation",
  specialtyId: "medicina_general",
  specialtyName: "Medicina General",
  confidence: 0.4,
  emergencyWarning: false,
  symptomSummary: "No se pudo identificar el síntoma con precisión",
  patientExplanation:
    "No pude identificar una especialidad exacta para lo que describes. Te recomiendo comenzar con **Medicina General**, donde el médico te orientará al especialista adecuado.",
};

function parseJSON(text) {
  if (!text) throw new Error("Empty response");

  // Attempt 1: direct parse
  try { return JSON.parse(text); } catch { /* continue */ }

  // Attempt 2: strip markdown fences
  try {
    const cleaned = text.replace(/```json/g, "").replace(/```/g, "").trim();
    return JSON.parse(cleaned);
  } catch { /* continue */ }

  // Attempt 3: extract first {...} block (handles any surrounding text)
  const match = text.match(/\{[\s\S]*\}/);
  if (match) {
    try { return JSON.parse(match[0]); } catch { /* continue */ }
  }

  throw new Error("Could not parse JSON from response");
}

export async function analyzeSymptom({ messages, specialties }) {
  const apiKey = (import.meta.env.VITE_GEMINI_API_KEY ?? "").trim();
  if (!apiKey || apiKey === "TU_API_KEY_DE_GOOGLE_AI_STUDIO") {
    throw new Error("API_KEY_MISSING");
  }

  // Build conversation history; skip the initial bot greeting (index 0)
  const conversationHistory = messages
    .slice(1)
    .map((m) => `${m.role === "user" ? "Paciente" : "Asistente"}: ${m.content}`)
    .join("\n");

  const prompt = buildPrompt({ conversationHistory, specialties });

  const response = await ai.models.generateContent({
    model: MODEL,
    contents: prompt,
    // Disable thinking mode: prevents thought tokens from leaking into response.text
    // and ensures fast, clean JSON output for every conversation length.
    config: {
      thinkingConfig: { thinkingBudget: 0 },
    },
  });

  try {
    const parsed = parseJSON(response.text);
    if (parsed.type !== "question" && parsed.type !== "recommendation") {
      return { ...FALLBACK_RECOMMENDATION };
    }
    return parsed;
  } catch {
    return { ...FALLBACK_RECOMMENDATION };
  }
}
