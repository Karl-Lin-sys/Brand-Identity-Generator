import { GoogleGenAI, Type } from "@google/genai";

export interface BrandIdentityText {
  colors: { hex: string; name: string; usage: string }[];
  typography: {
    headerFont: string;
    bodyFont: string;
    notes: string;
  };
  logoPrompt: string;
  secondaryMarkPrompt: string;
}

export async function generateBrandIdentityText(mission: string): Promise<BrandIdentityText> {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: `Based on the following company mission, generate a brand identity including a 5-color hex palette with usage notes, and suggested Google Font pairings for headers and body text. Also generate detailed prompts for a primary logo and a secondary mark.
    
    Company Mission: ${mission}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          colors: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                hex: { type: Type.STRING, description: "Hex code starting with #" },
                name: { type: Type.STRING, description: "Color name" },
                usage: { type: Type.STRING, description: "Usage notes" }
              },
              required: ["hex", "name", "usage"]
            }
          },
          typography: {
            type: Type.OBJECT,
            properties: {
              headerFont: { type: Type.STRING, description: "Google Font name for headers" },
              bodyFont: { type: Type.STRING, description: "Google Font name for body text" },
              notes: { type: Type.STRING, description: "Typography usage notes" }
            },
            required: ["headerFont", "bodyFont", "notes"]
          },
          logoPrompt: { type: Type.STRING, description: "A detailed prompt to generate a primary logo image for this brand." },
          secondaryMarkPrompt: { type: Type.STRING, description: "A detailed prompt to generate a secondary mark or icon image for this brand." }
        },
        required: ["colors", "typography", "logoPrompt", "secondaryMarkPrompt"]
      }
    }
  });

  return JSON.parse(response.text || "{}");
}

export async function generateBrandImage(prompt: string, size: "1K" | "2K" | "4K"): Promise<string> {
  // Requires user API key
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API Key not selected");

  const ai = new GoogleGenAI({ apiKey });
  const response = await ai.models.generateContent({
    model: "gemini-3-pro-image-preview",
    contents: {
      parts: [{ text: prompt }]
    },
    config: {
      imageConfig: {
        aspectRatio: "1:1",
        imageSize: size
      }
    }
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
    }
  }
  throw new Error("Failed to generate image");
}
