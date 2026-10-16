const openapi = {
  openapi: "3.0.3",
  info: {
    title: "Campus Hub API",
    version: "0.1.0",
    description: "REST API for UTAMU announcements, clubs, events, groups and campus communication.",
  },
  servers: [{ url: "http://localhost:4000/api", description: "Local development API" }],
  tags: [
    { name: "Health" },
    { name: "Authentication" },
    { name: "Announcements" },
    { name: "Clubs" },
    { name: "Events" },
    { name: "Groups" },
    { name: "Administration" },
    { name: "AI" },
  ],
  components: {
    securitySchemes: {
      bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
    },
    schemas: {
      Error: { type: "object", required: ["error"], properties: { error: { type: "string" } } },
      User: { type: "object", required: ["id", "name", "email", "role"], properties: { id: { type: "string" }, name: { type: "string" }, email: { type: "string", format: "email" }, role: { type: "string", enum: ["student", "admin", "super_admin"] } } },
      Announcement: { type: "object", properties: { id: { type: "integer" }, title: { type: "string" }, category: { type: "string" }, source: { type: "string" }, published: { type: "string" }, priority: { type: "string", enum: ["Important", "Update", "Opportunity"] } } },
      Club: { type: "object", properties: { id: { type: "integer" }, name: { type: "string" }, category: { type: "string" }, members: { type: "integer" }, description: { type: "string" }, verified: { type: "boolean" } } },
      Event: { type: "object", properties: { id: { type: "integer" }, title: { type: "string" }, type: { type: "string" }, when: { type: "string" }, place: { type: "string" }, registrations: { type: "integer" } } },
      Group: { type: "object", properties: { id: { type: "integer" }, name: { type: "string" }, detail: { type: "string" }, members: { type: "integer" }, visibility: { type: "string", enum: ["public", "private"] } } },
      Message: { type: "object", properties: { id: { type: "integer" }, groupId: { type: "integer" }, author: { type: "string" }, body: { type: "string" }, createdAt: { type: "string" } } },
    },
  },
  paths: {
    "/health": { get: { tags: ["Health"], summary: "Check API health", responses: { 200: { description: "Service status" } } } },
    "/auth/login": { post: { tags: ["Authentication"], summary: "Sign in", requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["email", "password"], properties: { email: { type: "string", format: "email" }, password: { type: "string", format: "password" } } } } } }, responses: { 200: { description: "Authenticated user and access token" }, 401: { description: "Invalid credentials", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } } } } },
    "/auth/me": { get: { tags: ["Authentication"], security: [{ bearerAuth: [] }], summary: "Get current user", responses: { 200: { description: "Current user" }, 401: { description: "Unauthenticated" } } } },
    "/auth/register": { post: { tags: ["Authentication"], summary: "Register a student account", requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["name", "email", "password"], properties: { name: { type: "string" }, email: { type: "string", format: "email" }, password: { type: "string", format: "password", minLength: 8 } } } } } }, responses: { 201: { description: "Registered user and access token" }, 400: { description: "Invalid input", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } }, 409: { description: "Email already registered", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } } } } },
    "/announcements": { get: { tags: ["Announcements"], summary: "List announcements", responses: { 200: { description: "Announcement list" } } }, post: { tags: ["Announcements"], security: [{ bearerAuth: [] }], summary: "Publish an announcement", responses: { 201: { description: "Created" }, 403: { description: "Admin access required" } } } },
    "/clubs": { get: { tags: ["Clubs"], summary: "List clubs", responses: { 200: { description: "Club list" } } }, post: { tags: ["Clubs"], security: [{ bearerAuth: [] }], summary: "Create a club", responses: { 201: { description: "Created" }, 403: { description: "Admin access required" } } } },
    "/events": { get: { tags: ["Events"], summary: "List events", responses: { 200: { description: "Event list" } } }, post: { tags: ["Events"], security: [{ bearerAuth: [] }], summary: "Create an event", responses: { 201: { description: "Created" } } } },
    "/events/{id}/register": { post: { tags: ["Events"], security: [{ bearerAuth: [] }], summary: "Register for an event", parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }], responses: { 200: { description: "Updated event" }, 403: { description: "Authentication required" } } } },
    "/groups": { get: { tags: ["Groups"], summary: "List groups", responses: { 200: { description: "Group list" } } }, post: { tags: ["Groups"], security: [{ bearerAuth: [] }], summary: "Create a group", responses: { 201: { description: "Created" } } } },
    "/groups/{id}/messages": { get: { tags: ["Groups"], security: [{ bearerAuth: [] }], summary: "List group messages", parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }], responses: { 200: { description: "Message list" } } }, post: { tags: ["Groups"], security: [{ bearerAuth: [] }], summary: "Send a group message", parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }], responses: { 201: { description: "Created" } } } },
    "/admin/summary": { get: { tags: ["Administration"], security: [{ bearerAuth: [] }], summary: "Get admin summary", responses: { 200: { description: "Admin summary" }, 403: { description: "Admin access required" } } } },
    "/ai/campus-brief": { get: { tags: ["AI"], security: [{ bearerAuth: [] }], summary: "Get an AI-generated campus brief", responses: { 200: { description: "Campus brief summary" }, 503: { description: "AI not configured" }, 500: { description: "Generation failed" } } } },
  },
};

export default openapi;
