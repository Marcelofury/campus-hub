import "dotenv/config";
import cors from "cors";
import express from "express";
import { create, find, list, loadStore, remove, update } from "./store.js";

const app = express();
const port = Number(process.env.PORT || 4000);

app.use(cors({ origin: process.env.CLIENT_ORIGIN || "http://localhost:5173" }));
app.use(express.json({ limit: "1mb" }));

const roles = ["student", "admin", "super_admin"];
const roleRank = { student: 1, admin: 2, super_admin: 3 };
const requireRole = (allowedRoles) => (request, response, next) => {
  const role = request.header("x-user-role") || "student";
  if (!allowedRoles.includes(role)) {
    return response.status(403).json({ error: "This action requires an authorized campus role." });
  }
  request.userRole = role;
  next();
};

const requireResource = (resource) => (request, response, next) => {
  const item = find(resource, request.params.id);
  if (!item) return response.status(404).json({ error: `${resource.slice(0, -1)} not found.` });
  request.resource = item;
  next();
};

const cleanText = (value) => typeof value === "string" ? value.trim() : "";
const validateTitle = (value, label) => {
  const title = cleanText(value);
  return title.length >= 5 ? title : `${label} must be at least five characters.`;
};

app.get("/api/health", (_request, response) => {
  response.json({ service: "campus-hub-api", status: "ok", database: "local-json" });
});

app.post("/api/auth/login", (request, response) => {
  const email = cleanText(request.body.email).toLowerCase();
  const user = list("users").find((item) => item.email === email);
  if (!user) return response.status(401).json({ error: "Use a seeded demo UTAMU account." });
  response.json({ user, token: `local:${user.id}:${user.role}` });
});

app.get("/api/auth/me", (request, response) => {
  const token = request.header("x-local-token") || "";
  const userId = Number(token.split(":")[1]);
  const user = list("users").find((item) => item.id === userId);
  if (!user) return response.status(401).json({ error: "A valid local session is required." });
  response.json({ user });
});

app.get("/api/announcements", (_request, response) => response.json({ data: list("announcements") }));
app.post("/api/announcements", requireRole(["admin", "super_admin"]), async (request, response) => {
  const title = validateTitle(request.body.title, "Announcement title");
  if (title.includes("must be")) return response.status(400).json({ error: title });
  const item = await create("announcements", {
    title,
    category: cleanText(request.body.category) || "Campus",
    source: request.userRole === "super_admin" ? "Super admin" : "Campus admin",
    published: "Just now",
    priority: ["Important", "Update", "Opportunity"].includes(request.body.priority) ? request.body.priority : "Update",
  });
  response.status(201).json({ data: item });
});

app.get("/api/clubs", (_request, response) => response.json({ data: list("clubs") }));
app.post("/api/clubs", requireRole(["admin", "super_admin"]), async (request, response) => {
  const name = validateTitle(request.body.name, "Club name");
  if (name.includes("must be")) return response.status(400).json({ error: name });
  const item = await create("clubs", { name, category: cleanText(request.body.category) || "Community", description: cleanText(request.body.description), members: 0, verified: false });
  response.status(201).json({ data: item });
});
app.patch("/api/clubs/:id", requireRole(["admin", "super_admin"]), requireResource("clubs"), async (request, response) => {
  const name = request.body.name === undefined ? undefined : validateTitle(request.body.name, "Club name");
  if (name?.includes("must be")) return response.status(400).json({ error: name });
  const item = await update("clubs", request.params.id, { ...request.body, ...(name ? { name } : {}) });
  response.json({ data: item });
});
app.delete("/api/clubs/:id", requireRole(["super_admin"]), requireResource("clubs"), async (request, response) => {
  await remove("clubs", request.params.id);
  response.status(204).end();
});

app.get("/api/events", (_request, response) => response.json({ data: list("events") }));
app.post("/api/events", requireRole(["admin", "super_admin"]), async (request, response) => {
  const title = validateTitle(request.body.title, "Event title");
  if (title.includes("must be")) return response.status(400).json({ error: title });
  const item = await create("events", { title, type: cleanText(request.body.type) || "Community", when: cleanText(request.body.when) || "Date to be announced", place: cleanText(request.body.place) || "UTAMU campus", registrations: 0 });
  response.status(201).json({ data: item });
});
app.post("/api/events/:id/register", requireRole(roles), requireResource("events"), async (request, response) => {
  const item = await update("events", request.params.id, { registrations: request.resource.registrations + 1 });
  response.json({ data: item });
});

app.get("/api/groups", (_request, response) => response.json({ data: list("groups") }));
app.post("/api/groups", requireRole(roles), async (request, response) => {
  const name = validateTitle(request.body.name, "Group name");
  if (name.includes("must be")) return response.status(400).json({ error: name });
  const item = await create("groups", { name, detail: "1 member · Active now", members: 1, visibility: request.body.visibility === "private" ? "private" : "public" });
  response.status(201).json({ data: item });
});
app.get("/api/groups/:id/messages", requireRole(roles), requireResource("groups"), (request, response) => {
  response.json({ data: list("messages").filter((message) => message.groupId === Number(request.params.id)) });
});
app.post("/api/groups/:id/messages", requireRole(roles), requireResource("groups"), async (request, response) => {
  const body = cleanText(request.body.body);
  if (body.length < 1) return response.status(400).json({ error: "Message cannot be empty." });
  const item = await create("messages", { groupId: Number(request.params.id), author: request.body.author || "Ada", body, createdAt: "Just now" });
  response.status(201).json({ data: item });
});

app.get("/api/admin/summary", requireRole(["admin", "super_admin"]), (_request, response) => {
  response.json({ data: { role: _request.userRole, clubs: list("clubs").filter((club) => club.verified).length, reports: 3, students: 1248, admins: roleRank[_request.userRole] === 3 ? 6 : undefined } });
});
app.use((_request, response) => response.status(404).json({ error: "Route not found." }));

await loadStore();

if (process.env.NODE_ENV !== "test") {
  app.listen(port, () => console.log(`Campus Hub API listening on http://localhost:${port}`));
}

export default app;
