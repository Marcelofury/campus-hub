import assert from "node:assert/strict";
import { createServer } from "node:http";
import { after, before, describe, it } from "node:test";

process.env.NODE_ENV = "test";
process.env.SUPABASE_URL = "";
process.env.SUPABASE_SERVICE_ROLE_KEY = "";
const { default: app } = await import("../src/app.js");

let server;
let baseUrl;

before(async () => {
  server = createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
});

async function request(path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, options);
  const body = response.status === 204 ? null : await response.json();
  return { response, body };
}

describe("Campus Hub API", () => {
  it("reports a healthy local-json service", async () => {
    const { response, body } = await request("/api/health");
    assert.equal(response.status, 200);
    assert.deepEqual(body, { service: "campus-hub-api", status: "ok", database: "local-json" });
  });

  it("logs in a seeded UTAMU user", async () => {
    const { response, body } = await request("/api/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "ada@utamu.ac.ug" }),
    });
    assert.equal(response.status, 200);
    assert.equal(body.user.role, "student");
    assert.match(body.token, /^local:\d+:student$/);
  });

  it("rejects unknown login accounts", async () => {
    const { response, body } = await request("/api/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "unknown@example.com" }),
    });
    assert.equal(response.status, 401);
    assert.equal(body.error, "Use a seeded demo UTAMU account.");
  });

  it("registers a new student account and rejects duplicates", async () => {
    const email = `new-${Date.now()}@utamu.ac.ug`;
    const payload = { name: "New Student", email, password: "StrongPass1" };
    const { response, body } = await request("/api/auth/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    assert.equal(response.status, 201);
    assert.equal(body.user.role, "student");
    assert.match(body.token, /^local:\d+:student$/);

    const duplicate = await request("/api/auth/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    assert.equal(duplicate.response.status, 409);
  });

  it("rejects invalid registration input", async () => {
    for (const payload of [
      { name: "A", email: "valid@utamu.ac.ug", password: "StrongPass1", error: "Enter your full name (at least two characters)." },
      { name: "Valid Name", email: "not-an-email", password: "StrongPass1", error: "Enter a valid email address." },
      { name: "Valid Name", email: "short@utamu.ac.ug", password: "short", error: "Password must be at least eight characters." },
    ]) {
      const { response, body } = await request("/api/auth/register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      assert.equal(response.status, 400);
      assert.equal(body.error, payload.error);
    }
  });

  it("protects admin summary from students", async () => {
    const { response, body } = await request("/api/admin/summary", {
      headers: { "x-user-role": "student" },
    });
    assert.equal(response.status, 403);
    assert.equal(body.error, "This action requires an authorized campus role.");
  });

  it("returns seeded announcements", async () => {
    const { response, body } = await request("/api/announcements");
    assert.equal(response.status, 200);
    assert.ok(Array.isArray(body.data));
    assert.ok(body.data.length > 0);
  });
});
