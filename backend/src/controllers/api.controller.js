import { create, databaseName, list, login, register, remove, update } from "../services/data-source.js";
import { fallbackSummary, isAIEnabled, summarizeCampus } from "../services/ai.js";

const roles = ["student", "admin", "super_admin"];
const roleRank = { student: 1, admin: 2, super_admin: 3 };
const cleanText = (value) => typeof value === "string" ? value.trim() : "";
const validateTitle = (value, label) => {
  const title = cleanText(value);
  return title.length >= 5 ? title : `${label} must be at least five characters.`;
};

export const health = (_request, response) => response.json({ service: "campus-hub-api", status: "ok", database: databaseName() });

export async function authLogin(request, response) {
  const result = await login(cleanText(request.body.email).toLowerCase(), cleanText(request.body.password));
  if (!result) return response.status(401).json({ error: "Use a seeded demo UTAMU account." });
  response.json(result);
}

export async function authRegister(request, response) {
  const name = cleanText(request.body.name);
  const email = cleanText(request.body.email).toLowerCase();
  const password = typeof request.body.password === "string" ? request.body.password : "";
  if (name.length < 2) return response.status(400).json({ error: "Enter your full name (at least two characters)." });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return response.status(400).json({ error: "Enter a valid email address." });
  if (password.length < 8) return response.status(400).json({ error: "Password must be at least eight characters." });
  const result = await register(name, email, password);
  if (!result) return response.status(409).json({ error: "An account with that email already exists." });
  response.status(201).json(result);
}

export const currentUser = (request, response) => response.json({ user: request.user });
export const listResource = (resource) => async (_request, response) => response.json({ data: await list(resource) });

export async function createAnnouncement(request, response) {
  const title = validateTitle(request.body.title, "Announcement title");
  if (title.includes("must be")) return response.status(400).json({ error: title });
  const item = await create("announcements", {
    title,
    category: cleanText(request.body.category) || "Campus",
    source: request.user.name,
    published: "Just now",
    priority: ["Important", "Update", "Opportunity"].includes(request.body.priority) ? request.body.priority : "Update",
  });
  response.status(201).json({ data: item });
}

export async function createClub(request, response) {
  const name = validateTitle(request.body.name, "Club name");
  if (name.includes("must be")) return response.status(400).json({ error: name });
  const item = await create("clubs", { name, category: cleanText(request.body.category) || "Community", description: cleanText(request.body.description), members: 0, verified: false });
  response.status(201).json({ data: item });
}

export async function patchClub(request, response) {
  const name = request.body.name === undefined ? undefined : validateTitle(request.body.name, "Club name");
  if (name?.includes("must be")) return response.status(400).json({ error: name });
  const item = await update("clubs", request.params.id, { ...request.body, ...(name ? { name } : {}) });
  response.json({ data: item });
}

export async function deleteClub(request, response) {
  await remove("clubs", request.params.id);
  response.status(204).end();
}

export async function createEvent(request, response) {
  const title = validateTitle(request.body.title, "Event title");
  if (title.includes("must be")) return response.status(400).json({ error: title });
  const item = await create("events", { title, type: cleanText(request.body.type) || "Community", when: cleanText(request.body.when) || "Date to be announced", place: cleanText(request.body.place) || "UTAMU campus", registrations: 0 });
  response.status(201).json({ data: item });
}

export async function registerForEvent(request, response) {
  const item = await update("events", request.params.id, { registrations: request.resource.registrations + 1 });
  response.json({ data: item });
}

export async function createGroup(request, response) {
  const name = validateTitle(request.body.name, "Group name");
  if (name.includes("must be")) return response.status(400).json({ error: name });
  const item = await create("groups", { name, detail: "1 member · Active now", members: 1, visibility: request.body.visibility === "private" ? "private" : "public" });
  response.status(201).json({ data: item });
}

export const listMessages = async (request, response) => response.json({ data: (await list("messages")).filter((message) => message.groupId === Number(request.params.id)) });

export async function sendMessage(request, response) {
  const body = cleanText(request.body.body);
  if (body.length < 1) return response.status(400).json({ error: "Message cannot be empty." });
  const item = await create("messages", { groupId: Number(request.params.id), author: request.user.name, body, createdAt: "Just now" });
  response.status(201).json({ data: item });
}

export async function adminSummary(request, response) {
  const clubs = await list("clubs");
  response.json({ data: { role: request.user.role, clubs: clubs.filter((club) => club.verified).length, reports: 0, students: 0, admins: roleRank[request.user.role] === 3 ? 0 : undefined } });
}

const briefCache = { summary: "", generatedAt: 0 };
const BRIEF_CACHE_MS = Number(process.env.BRIEF_CACHE_MS) || 5 * 60 * 1000;

export async function campusBrief(_request, response) {
  if (briefCache.summary && Date.now() - briefCache.generatedAt < BRIEF_CACHE_MS) {
    return response.json({ data: { summary: briefCache.summary, generatedAt: new Date(briefCache.generatedAt).toISOString(), cached: true } });
  }
  const [announcements, events, clubs] = await Promise.all([list("announcements"), list("events"), list("clubs")]);
  if (!isAIEnabled()) {
    return response.json({ data: { summary: fallbackSummary(announcements, events, clubs), generatedAt: new Date().toISOString(), fallback: true } });
  }
  try {
    const summary = await summarizeCampus(announcements, events, clubs);
    briefCache.summary = summary;
    briefCache.generatedAt = Date.now();
    response.json({ data: { summary, generatedAt: new Date(briefCache.generatedAt).toISOString() } });
  } catch (error) {
    console.warn("Campus brief generation failed:", error.message);
    response.json({ data: { summary: fallbackSummary(announcements, events, clubs), generatedAt: new Date().toISOString(), fallback: true } });
  }
}

export { roles };
