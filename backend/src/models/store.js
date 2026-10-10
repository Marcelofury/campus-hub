import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const dataDirectory = path.join(path.dirname(fileURLToPath(import.meta.url)), "../../../data");
const dataFile = path.join(dataDirectory, "local.json");

const seed = {
  nextIds: { announcements: 4, clubs: 4, events: 4, groups: 4, messages: 4, users: 4 },
  users: [
    { id: 1, name: "Ada Okello", email: "ada@utamu.ac.ug", role: "student" },
    { id: 2, name: "Campus Admin", email: "admin@utamu.ac.ug", role: "admin" },
    { id: 3, name: "System Owner", email: "superadmin@utamu.ac.ug", role: "super_admin" },
  ],
  announcements: [
    { id: 1, title: "Semester registration closes this Friday", category: "Academic", source: "Academic Registrar", published: "Today, 08:40", priority: "Important" },
    { id: 2, title: "UTAMU Innovation Week is now open for applications", category: "Opportunity", source: "Innovation Hub", published: "Yesterday", priority: "Opportunity" },
    { id: 3, title: "Inter-faculty football fixtures are out", category: "Sports", source: "Sports Office", published: "2 days ago", priority: "Update" },
  ],
  clubs: [
    { id: 1, name: "UTAMU Developers Community", category: "Technology", members: 284, description: "Build, learn and ship useful technology together.", verified: true },
    { id: 2, name: "Entrepreneurship & Innovation Club", category: "Innovation", members: 167, description: "Turn ideas into practical ventures and impact.", verified: true },
    { id: 3, name: "Debate & Public Speaking Society", category: "Leadership", members: 93, description: "Practice confident speaking and critical thinking.", verified: true },
  ],
  events: [
    { id: 1, title: "Football: School of Computing vs Business", type: "Football", when: "Today · 4:00 PM", place: "Main Sports Grounds", registrations: 42 },
    { id: 2, title: "Women in Tech networking circle", type: "Club event", when: "Tomorrow · 2:00 PM", place: "Innovation Lab", registrations: 28 },
    { id: 3, title: "Netball trials and team registration", type: "Netball", when: "Saturday · 10:00 AM", place: "Sports Pavilion", registrations: 17 },
  ],
  groups: [
    { id: 1, name: "BIS Year 2 — Study Circle", detail: "48 members · Active 5 min ago", members: 48, visibility: "public" },
    { id: 2, name: "UTAMU Creatives", detail: "126 members · Active 12 min ago", members: 126, visibility: "public" },
    { id: 3, name: "Hostel & Accommodation Help", detail: "312 members · Active 1 hour ago", members: 312, visibility: "public" },
  ],
  messages: [
    { id: 1, groupId: 1, author: "Brian", body: "Has anyone started the database assignment?", createdAt: "Today, 09:12" },
    { id: 2, groupId: 1, author: "Mariam", body: "I can share the notes after lunch.", createdAt: "Today, 09:16" },
    { id: 3, groupId: 2, author: "Joan", body: "The poster design meetup is tomorrow.", createdAt: "Yesterday, 18:30" },
  ],
};

let state = structuredClone(seed);

export async function loadStore() {
  try {
    const raw = await fs.readFile(dataFile, "utf8");
    state = JSON.parse(raw);
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
    await persistStore();
  }
  return state;
}

export async function persistStore() {
  await fs.mkdir(dataDirectory, { recursive: true });
  await fs.writeFile(dataFile, JSON.stringify(state, null, 2));
}

export function list(resource) {
  return state[resource] ?? [];
}

export function find(resource, id) {
  return list(resource).find((item) => item.id === Number(id));
}

export async function create(resource, input) {
  const id = state.nextIds[resource]++;
  const item = { id, ...input };
  state[resource].unshift(item);
  await persistStore();
  return item;
}

export async function update(resource, id, input) {
  const item = find(resource, id);
  if (!item) return null;
  Object.assign(item, input);
  await persistStore();
  return item;
}

export async function remove(resource, id) {
  const items = list(resource);
  const index = items.findIndex((item) => item.id === Number(id));
  if (index < 0) return false;
  items.splice(index, 1);
  await persistStore();
  return true;
}

export function resetForTests() {
  state = structuredClone(seed);
}
