// Vision AI Service for Menu Analysis using Gemini 1.5 Flash
import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY;

// Use 'gemini-1.5-flash' for speed and cost efficiency
const MODEL_NAME = "gemini-1.5-flash";

export async function analyzeMenuImage(imageUrl) {
    if (!API_KEY) {
        console.warn("[VisionAI] Gemini API Key missing.");
        return [];
    }
    if (!imageUrl) return [];

    try {
        const genAI = new GoogleGenerativeAI(API_KEY);
        const model = genAI.getGenerativeModel({ model: MODEL_NAME });

        // Fetch image and convert to suitable format
        const imagePart = await fetchImageAsPart(imageUrl);
        if (!imagePart) return [];

        const prompt = `
        You are an AI expert in Japanese food allergies. 
        Analyze this menu image. 
        Look strictly for items that are explicitly labeled as:
        - "Gluten Free" (グルテンフリー)
        - "Wheat Free" (小麦不使用)
        - "Egg Free" (卵不使用)
        - "Milk Free" (乳製品不使用)
        - "Allergy Friendly" (アレルギー対応)
        - "Rice Flour" (米粉)

        If found, list them in JSON format:
        [
          { "name": "Menu Name", "supportedAllergens": ["小麦"] (list removed allergens), "description": "Description found in image" }
        ]
        If nothing relevant is found, return [].
        Output ONLY valid JSON.
        `;

        const result = await model.generateContent([prompt, imagePart]);
        const response = await result.response;
        const text = response.text();

        // Extract JSON from markdown code block if present
        const jsonMatch = text.match(/```json\n([\s\S]*)\n```/) || text.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[1] || jsonMatch[0]);
        }
        return [];

    } catch (e) {
        console.error("[VisionAI] Analysis Failed:", e);
        return [];
    }
}

async function fetchImageAsPart(url) {
    try {
        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();
        const base64 = Buffer.from(arrayBuffer).toString("base64");
        return {
            inlineData: {
                data: base64,
                mimeType: response.headers.get("content-type") || "image/jpeg",
            },
        };
    } catch (e) {
        console.error("[VisionAI] Failed to fetch image:", url);
        return null; // analyzing nothing
    }
}
