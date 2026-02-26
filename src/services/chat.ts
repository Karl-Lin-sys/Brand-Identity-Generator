import { GoogleGenAI } from "@google/genai";

export async function sendChatMessage(history: { role: "user" | "model", parts: { text: string }[] }[], message: string, brandContext: string) {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  
  const contents = history.map(h => ({
    role: h.role,
    parts: h.parts
  }));
  
  contents.push({
    role: "user",
    parts: [{ text: message }]
  });

  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: contents,
    config: {
      systemInstruction: `You are a brand identity expert and assistant. You are helping a user refine and understand their newly generated brand identity. Here is the current brand context:\n\n${brandContext}`,
    }
  });

  return response.text || "";
}
