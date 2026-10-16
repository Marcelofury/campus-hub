import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;
const useAI = Boolean(apiKey && !apiKey.includes("your-key"));
const genAI = useAI ? new GoogleGenerativeAI(apiKey) : null;

export function isAIEnabled() {
  return useAI;
}

export async function generateText(prompt, systemInstruction = "") {
  if (!genAI) throw new Error("AI is not configured.");
  const model = genAI.getGenerativeModel({ model: "gemma-4-26b-a4b-it" });
  const fullPrompt = systemInstruction ? `${systemInstruction}\n\n${prompt}` : prompt;
  const result = await model.generateContent(fullPrompt);
  const response = await result.response;
  return response.text();
}

export async function summarizeCampus(announcements, events, clubs) {
  const prompt = `Summarize the following campus updates for a UTAMU student in 2-3 concise sentences. Focus on what is important and actionable.

Announcements:
${announcements.map((a) => `- ${a.title} (${a.category}, ${a.priority})`).join("\n")}

Events:
${events.map((e) => `- ${e.title} at ${e.when}, ${e.place}`).join("\n")}

Clubs:
${clubs.map((c) => `- ${c.name}: ${c.description}`).join("\n")}

Summary:`;

  return generateText(
    prompt,
    "You are a helpful campus assistant for UTAMU students. Be concise, friendly, and clear. Never invent information not in the provided data.",
  );
}