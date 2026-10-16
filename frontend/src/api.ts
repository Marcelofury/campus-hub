export type Role = "student" | "admin" | "super_admin";
export type Section = "overview" | "clubs" | "events" | "groups" | "admin";

export type User = { id: number; name: string; email: string; role: Role };
export type Announcement = { id: number; title: string; category: string; source: string; published: string; priority: "Important" | "Update" | "Opportunity" };
export type Club = { id: number; name: string; category: string; members: number; description: string; verified: boolean };
export type Event = { id: number; title: string; type: string; when: string; place: string; registrations: number };
export type Group = { id: number; name: string; detail: string; members: number; visibility: string };
export type Message = { id: number; groupId: number; author: string; body: string; createdAt: string };

const apiBase = import.meta.env.VITE_API_URL || "http://localhost:4000/api";
const STORAGE_KEY = "campus-hub-session";

function readStoredSession(): { user: User; token: string } | null {
  try { const raw = localStorage.getItem(STORAGE_KEY); return raw ? (JSON.parse(raw) as { user: User; token: string }) : null; } catch { return null; }
}

function persistSession() {
  try { session ? localStorage.setItem(STORAGE_KEY, JSON.stringify(session)) : localStorage.removeItem(STORAGE_KEY); } catch { /* storage unavailable */ }
}

let session: { user: User; token: string } | null = readStoredSession();

export function getSession() {
  return session;
}

export async function validateSession() {
  if (!session) return null;
  try { const result = await request<{ user: User }>("/auth/me"); session = { ...session, user: result.user }; persistSession(); return result.user; }
  catch { session = null; persistSession(); return null; }
}

export async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");
  if (session) headers.set("Authorization", `Bearer ${session.token}`);
  if (session?.token.startsWith("local:")) headers.set("x-local-token", session.token);
  const response = await fetch(`${apiBase}${path}`, { ...options, headers });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || "The campus service could not complete that request.");
  return body;
}

export async function login(email: string, password: string) {
  const result = await request<{ user: User; token: string }>("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
  session = result; persistSession();
  return result.user;
}

export async function register(name: string, email: string, password: string) {
  const result = await request<{ user: User; token: string }>("/auth/register", { method: "POST", body: JSON.stringify({ name, email, password }) });
  session = result; persistSession();
  return result.user;
}

export function logout() {
  session = null; persistSession();
}

export const getAnnouncements = () => request<{ data: Announcement[] }>("/announcements");
export const getClubs = () => request<{ data: Club[] }>("/clubs");
export const getEvents = () => request<{ data: Event[] }>("/events");
export const getGroups = () => request<{ data: Group[] }>("/groups");
export const getAdminSummary = () => request<{ data: { role: Role; clubs: number; reports: number; students: number; admins?: number } }>("/admin/summary");
export const createAnnouncement = (title: string) => request<{ data: Announcement }>("/announcements", { method: "POST", body: JSON.stringify({ title }) });
export const createClub = (input: Pick<Club, "name" | "category" | "description">) => request<{ data: Club }>("/clubs", { method: "POST", body: JSON.stringify(input) });
export const createEvent = (input: Pick<Event, "title" | "type" | "when" | "place">) => request<{ data: Event }>("/events", { method: "POST", body: JSON.stringify(input) });
export const createGroup = (name: string, visibility = "public") => request<{ data: Group }>("/groups", { method: "POST", body: JSON.stringify({ name, visibility }) });
export const registerForEvent = (id: number) => request<{ data: Event }>(`/events/${id}/register`, { method: "POST" });
export const getMessages = (id: number) => request<{ data: Message[] }>(`/groups/${id}/messages`);
export const sendMessage = (id: number, body: string, author: string) => request<{ data: Message }>(`/groups/${id}/messages`, { method: "POST", body: JSON.stringify({ body, author }) });
export const getCampusBrief = () => request<{ data: { summary: string; generatedAt: string } }>("/ai/campus-brief");
