const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemma-4-26b-a4b-it";
const OLLAMA_BASE_URL = (process.env.OLLAMA_BASE_URL || "").replace(/\/+$/, "");
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "gemma3:4b";
const TIMEOUT_MS = Number(process.env.AI_TIMEOUT_MS) || 30000;
const MAX_OUTPUT_TOKENS = Number(process.env.AI_MAX_TOKENS) || 2048;

const geminiReady = Boolean(GEMINI_API_KEY && !GEMINI_API_KEY.includes("your-"));
const ollamaReady = Boolean(OLLAMA_BASE_URL);

export function isAIEnabled() {
  return geminiReady || ollamaReady;
}

export function aiProvider() {
  if (geminiReady) return "gemini-online";
  if (ollamaReady) return "ollama-local";
  return "disabled";
}

async function fetchWithTimeout(url, options, timeoutMs = TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

function cleanSummary(text) {
  return text.replace(/^["'`]+|["'`]+$/g, "").replace(/\s+/g, " ").trim();
}

// Gemma 4 is a reasoning model: it emits a [THOUGHT] part and then a final
// [ANSWER] part, and thinking cannot be disabled via thinkingConfig. We keep
// only the non-thought part; if the model ran out of tokens before answering we
// return empty so the caller falls back instead of showing the reasoning.
function extractGeminiAnswer(candidate) {
  const parts = candidate?.content?.parts ?? [];
  const answer = parts.filter((part) => !part.thought).map((part) => part.text || "").join("");
  return answer.trim() ? cleanSummary(answer) : "";
}

async function generateWithGemini(prompt, systemInstruction) {
  const body = {
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.3, maxOutputTokens: MAX_OUTPUT_TOKENS },
  };
  if (systemInstruction) body.systemInstruction = { parts: [{ text: systemInstruction }] };
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;
  const response = await fetchWithTimeout(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`Gemma request failed (${response.status}). ${detail.slice(0, 160)}`);
  }
  const payload = await response.json();
  const answer = extractGeminiAnswer(payload?.candidates?.[0]);
  if (!answer) throw new Error("Gemma returned an incomplete response.");
  return answer;
}

async function generateWithOllama(prompt, systemInstruction) {
  const messages = [];
  if (systemInstruction) messages.push({ role: "system", content: systemInstruction });
  messages.push({ role: "user", content: prompt });
  const response = await fetchWithTimeout(`${OLLAMA_BASE_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: OLLAMA_MODEL, messages, stream: false, options: { temperature: 0.3 } }),
  });
  if (!response.ok) throw new Error(`Ollama request failed (${response.status}).`);
  const payload = await response.json();
  const answer = cleanSummary(payload?.message?.content ?? "");
  if (!answer) throw new Error("Ollama returned an empty response.");
  return answer;
}

export async function generateText(prompt, systemInstruction = "") {
  const providers = [];
  if (geminiReady) providers.push(generateWithGemini);
  if (ollamaReady) providers.push(generateWithOllama);
  if (!providers.length) throw new Error("AI is not configured.");

  let lastError;
  for (const provider of providers) {
    for (let attempt = 1; attempt <= 3; attempt += 1) {
      try {
        return await provider(prompt, systemInstruction);
      } catch (error) {
        lastError = error;
        if (error?.name === "AbortError") break;
        await new Promise((resolve) => setTimeout(resolve, 400 * attempt));
      }
    }
  }
  throw lastError ?? new Error("The campus brief could not be generated.");
}

export async function summarizeCampus(announcements, events, clubs) {
  const prompt = `Summarize the following campus updates for a UTAMU student in 2-3 concise sentences. Focus on what is important and actionable.

Announcements:
${announcements.map((a) => `- ${a.title} (${a.category}, ${a.priority})`).join("\n")}

Events:
${events.map((e) => `- ${e.title} at ${e.when}, ${e.place}`).join("\n")}

Clubs:
${clubs.map((c) => `- ${c.name}: ${c.description}`).join("\n")}

Reply with only the final 2-3 sentence summary.`;

  return generateText(
    prompt,
    "You are a helpful campus assistant for UTAMU students. Be concise, friendly, and clear. Never invent information not in the provided data.",
  );
}

export function fallbackSummary(announcements, events, clubs) {
  const parts = [];
  if (announcements.length) parts.push(`${announcements.length} campus update${announcements.length > 1 ? "s" : ""}, including “${announcements[0].title}”`);
  if (events.length) parts.push(`${events.length} event${events.length > 1 ? "s" : ""} such as “${events[0].title}” (${events[0].when})`);
  if (clubs.length) parts.push(`${clubs.length} club${clubs.length > 1 ? "s" : ""} to explore`);
  if (!parts.length) return "No campus updates yet — check back soon for announcements, events and clubs.";
  return `Today on campus: ${parts.join(", ")}. Open the dashboard for the full details.`;
}
