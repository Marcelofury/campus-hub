import "dotenv/config";
import { createServer } from "node:http";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey || supabaseUrl.includes("your-project")) {
  console.log("Supabase smoke test skipped: set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to enable it.");
  process.exit(0);
}

const accounts = [
  { role: "student", email: process.env.SEED_STUDENT_EMAIL || "ada@utamu.ac.ug", password: process.env.SEED_STUDENT_PASSWORD || "Utamu#Student1" },
  { role: "admin", email: process.env.SEED_ADMIN_EMAIL || "admin@utamu.ac.ug", password: process.env.SEED_ADMIN_PASSWORD || "Utamu#Admin1" },
  { role: "super_admin", email: process.env.SEED_SUPERADMIN_EMAIL || "superadmin@utamu.ac.ug", password: process.env.SEED_SUPERADMIN_PASSWORD || "Utamu#Owner1" },
];

process.env.NODE_ENV = "test";
const { default: app } = await import("../src/app.js");

const server = createServer(app);
await new Promise((resolve) => server.listen(0, resolve));
const base = `http://127.0.0.1:${server.address().port}/api`;

const cleanupClient = createClient(supabaseUrl, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });
const created = { announcements: [], clubs: [], events: [], groups: [], messages: [], account: null };

let pass = 0;
let fail = 0;
const failures = [];

function check(name, condition, detail = "") {
  if (condition) {
    pass += 1;
    console.log(`  PASS  ${name}`);
  } else {
    fail += 1;
    failures.push(`${name}${detail ? ` -> ${detail}` : ""}`);
    console.log(`  FAIL  ${name}${detail ? ` -> ${detail}` : ""}`);
  }
}

async function req(method, path, { token, body } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetch(`${base}${path}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
  const text = await response.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = text;
  }
  return { status: response.status, body: json };
}

async function cleanup() {
  if (created.account) {
    const { data } = await cleanupClient.from("profiles").select("auth_id").eq("email", created.account).maybeSingle();
    if (data?.auth_id) await cleanupClient.auth.admin.deleteUser(data.auth_id);
    await cleanupClient.from("profiles").delete().eq("email", created.account);
  }
  for (const id of created.messages) await cleanupClient.from("messages").delete().eq("id", id);
  for (const id of created.groups) await cleanupClient.from("groups").delete().eq("id", id);
  for (const id of created.events) await cleanupClient.from("events").delete().eq("id", id);
  for (const id of created.announcements) await cleanupClient.from("announcements").delete().eq("id", id);
  for (const id of created.clubs) await cleanupClient.from("clubs").delete().eq("id", id);
}

async function run() {
  console.log("\n== Health ==");
  {
    const { status, body } = await req("GET", "/health");
    check("health 200", status === 200, `status ${status}`);
    check("reports supabase database", body?.database === "supabase", `database ${body?.database}`);
  }

  console.log("\n== Auth ==");
  const tokens = {};
  for (const account of accounts) {
    const { status, body } = await req("POST", "/auth/login", { body: { email: account.email, password: account.password } });
    check(`login ${account.role}`, status === 200 && body?.user?.role === account.role && typeof body?.token === "string", `status ${status} ${JSON.stringify(body?.user)}`);
    tokens[account.role] = body?.token;
  }
  {
    const { status } = await req("POST", "/auth/login", { body: { email: accounts[0].email, password: "definitely-wrong" } });
    check("reject wrong password", status === 401, `status ${status}`);
  }
  {
    const { status, body } = await req("GET", "/auth/me", { token: tokens.admin });
    check("auth/me returns admin", status === 200 && body?.user?.role === "admin", `status ${status}`);
  }
  {
    const { status } = await req("GET", "/auth/me");
    check("auth/me anonymous denied", status === 403, `status ${status}`);
  }

  console.log("\n== Registration ==");
  {
    created.account = `smoke-${Date.now()}@utamu.ac.ug`;
    const register = await req("POST", "/auth/register", { body: { name: "Smoke Student", email: created.account, password: "StrongPass1" } });
    check("registers a student account", register.status === 201 && register.body?.user?.role === "student", `status ${register.status}`);
    const duplicate = await req("POST", "/auth/register", { body: { name: "Smoke Student", email: created.account, password: "StrongPass1" } });
    check("rejects duplicate registration", duplicate.status === 409, `status ${duplicate.status}`);
    const weak = await req("POST", "/auth/register", { body: { name: "Smoke Student", email: `weak-${Date.now()}@utamu.ac.ug`, password: "short" } });
    check("rejects weak password", weak.status === 400, `status ${weak.status}`);
  }

  console.log("\n== Read resources ==");
  for (const resource of ["announcements", "clubs", "events"]) {
    const { status, body } = await req("GET", `/${resource}`);
    check(`GET ${resource}`, status === 200 && Array.isArray(body?.data), `status ${status}`);
  }
  {
    const { status, body } = await req("GET", "/groups", { token: tokens.student });
    const group = body?.data?.[0];
    check("GET groups shape", status === 200 && group && "id" in group && "name" in group && "detail" in group && "members" in group && "visibility" in group, `status ${status}`);
  }

  console.log("\n== Authorization ==");
  check("student cannot announce", (await req("POST", "/announcements", { token: tokens.student, body: { title: "nope not allowed" } })).status === 403);
  check("student cannot summarize", (await req("GET", "/admin/summary", { token: tokens.student })).status === 403);
  check("anonymous cannot summarize", (await req("GET", "/admin/summary")).status === 403);
  check("admin can summarize", (await req("GET", "/admin/summary", { token: tokens.admin })).status === 200);

  console.log("\n== Write flows ==");
  {
    const { status, body } = await req("POST", "/announcements", { token: tokens.admin, body: { title: "Smoke test announcement", category: "Testing" } });
    check("admin creates announcement", status === 201 && body?.data?.source === "Campus Admin", `status ${status}`);
    if (body?.data?.id) created.announcements.push(body.data.id);
  }
  let clubId;
  {
    const { status, body } = await req("POST", "/clubs", { token: tokens.admin, body: { name: "Smoke Test Club", category: "Testing", description: "temp" } });
    check("admin creates club", status === 201, `status ${status}`);
    clubId = body?.data?.id;
    if (clubId) created.clubs.push(clubId);
  }
  if (clubId) {
    const patch = await req("PATCH", `/clubs/${clubId}`, { token: tokens.admin, body: { description: "updated" } });
    check("admin patches club", patch.status === 200 && patch.body?.data?.description === "updated", `status ${patch.status}`);
    const del = await req("DELETE", `/clubs/${clubId}`, { token: tokens.super_admin });
    check("super admin deletes club", del.status === 204, `status ${del.status}`);
    created.clubs = created.clubs.filter((id) => id !== clubId);
    check("admin cannot delete club", (await req("DELETE", "/clubs/999999", { token: tokens.admin })).status === 403);
  }
  let eventId;
  {
    const { status, body } = await req("POST", "/events", { token: tokens.admin, body: { title: "Smoke Test Event", type: "Testing", when: "Now", place: "Lab" } });
    check("admin creates event", status === 201, `status ${status}`);
    eventId = body?.data?.id;
    if (eventId) created.events.push(eventId);
  }
  if (eventId) {
    const before = (await req("GET", "/events")).body?.data?.find((event) => event.id === eventId)?.registrations ?? 0;
    const { status, body } = await req("POST", `/events/${eventId}/register`, { token: tokens.student });
    check("student registers for event", status === 200 && body?.data?.registrations === before + 1, `status ${status}`);
    check("missing event 404", (await req("POST", "/events/999999/register", { token: tokens.student })).status === 404);
  }

  console.log("\n== Groups & messages ==");
  let groupId;
  {
    const { status, body } = await req("POST", "/groups", { token: tokens.student, body: { name: "Smoke Test Group", visibility: "public" } });
    check("student creates group", status === 201, `status ${status}`);
    groupId = body?.data?.id;
    if (groupId) created.groups.push(groupId);
  }
  if (groupId) {
    const empty = await req("GET", `/groups/${groupId}/messages`, { token: tokens.student });
    check("list messages", empty.status === 200 && Array.isArray(empty.body?.data), `status ${empty.status}`);
    const send = await req("POST", `/groups/${groupId}/messages`, { token: tokens.student, body: { body: "Smoke test message", author: "spoofed" } });
    check("send message 201", send.status === 201, `status ${send.status}`);
    check("author comes from session", send.body?.data?.author === "Ada Okello", JSON.stringify(send.body?.data));
    check("message uses frontend groupId", send.body?.data?.groupId === groupId, `groupId=${send.body?.data?.groupId}`);
    check("message uses frontend createdAt", typeof send.body?.data?.createdAt === "string", `createdAt=${send.body?.data?.createdAt}`);
    if (send.body?.data?.id) created.messages.push(send.body.data.id);
    const after = await req("GET", `/groups/${groupId}/messages`, { token: tokens.student });
    check("messages persisted with frontend shape", Array.isArray(after.body?.data) && after.body.data.every((message) => message.groupId === groupId), JSON.stringify(after.body?.data));
    check("empty message rejected", (await req("POST", `/groups/${groupId}/messages`, { token: tokens.student, body: { body: "" } })).status === 400);
  }

  console.log("\n== Misc ==");
  check("unknown route 404", (await req("GET", "/does-not-exist")).status === 404);
}

try {
  await run();
} finally {
  console.log("\n== Cleanup ==");
  await cleanup();
  console.log("  cleaned up smoke test rows");
  await new Promise((resolve) => server.close(resolve));
}

console.log(`\n==== RESULT: ${pass} passed, ${fail} failed ====`);
if (failures.length) {
  console.log("Failures:");
  for (const failure of failures) console.log(`  - ${failure}`);
}
process.exit(fail === 0 ? 0 : 1);
