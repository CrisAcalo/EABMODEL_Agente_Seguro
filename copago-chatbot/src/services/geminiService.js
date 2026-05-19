import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: import.meta.env.VITE_GEMINI_API_KEY
});

const buildPrompt = ({ userMessage, specialties }) => `
Eres un asistente de orientación de cobertura médica para pacientes.

Tu tarea:
1. Leer el síntoma o necesidad médica del paciente.
2. Elegir la especialidad médica más probable usando SOLO esta lista de especialidades disponibles.
3. Detectar si hay señales de urgencia.
4. Responder únicamente en JSON válido.

Especialidades disponibles:
${JSON.stringify(specialties, null, 2)}

Mensaje del paciente:
"${userMessage}"

Reglas:
- No hagas diagnóstico médico definitivo.
- No inventes especialidades fuera de la lista.
- Si hay dolor fuerte de pecho, dificultad para respirar, pérdida de conciencia, sangrado intenso, síntomas neurológicos graves o dolor muy intenso, marca emergencyWarning como true.
- Si no estás seguro, usa medicina_general.
- Devuelve SOLO JSON, sin markdown.

Formato exacto:
{
  "symptomSummary": "resumen breve del síntoma",
  "specialtyId": "id_de_la_especialidad",
  "specialtyName": "Nombre de la especialidad",
  "confidence": 0.0,
  "emergencyWarning": false,
  "patientExplanation": "explicación simple para el paciente"
}
`;

const FALLBACK = {
  specialtyId: "medicina_general",
  specialtyName: "Medicina General",
  confidence: 0.4,
  emergencyWarning: false,
  symptomSummary: "No se pudo identificar el síntoma",
  patientExplanation:
    "No pude identificar una especialidad exacta, por eso te recomiendo iniciar con Medicina General."
};

export async function analyzeSymptom({ userMessage, specialties }) {
  if (!import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.VITE_GEMINI_API_KEY === "TU_API_KEY_DE_GOOGLE_AI_STUDIO") {
    throw new Error("API_KEY_MISSING");
  }

  const prompt = buildPrompt({ userMessage, specialties });

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt
  });

  const text = response.text;

  try {
    return JSON.parse(text);
  } catch {
    const cleaned = text
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();
    try {
      return JSON.parse(cleaned);
    } catch {
      return { ...FALLBACK };
    }
  }
}

export { FALLBACK };
