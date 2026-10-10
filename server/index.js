import "dotenv/config";
import cors from "cors";
import express from "express";
import { createClient } from "@supabase/supabase-js";

const app = express();
const port = Number(process.env.PORT || 4000);
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

app.use(cors({ origin: process.env.CLIENT_ORIGIN || "http://localhost:5173" }));
app.use(express.json({ limit: "1mb" }));

const requireRole = (roles) => (request, response, next) => {
  const role = request.header("x-user-role") || "student";
  if (!roles.includes(role)) {
    return response.status(403).json({ error: "This action requires an authorized campus role." });
  }
  request.userRole = role;
  next();
};

app.get("/api/health", (_request, response) => {
  response.json({
    service: "campus-hub-api",
    status: "ok",
    database: supabase ? "configured" : "not-configured",
  });
});

app.get("/api/announcements", async (_request, response) => {
  if (!supabase) {
    return response.status(503).json({ error: "Supabase is not configured on this server." });
  }

  const { data, error } = await supabase
    .from("announcements")
    .select("id,title,category,source,published_at,priority")
    .order("published_at", { ascending: false });

  if (error) {
    console.error("Failed to load announcements:", error.message);
    return response.status(500).json({ error: "Unable to load announcements." });
  }

  response.json({ data });
});

app.post("/api/announcements", requireRole(["admin", "super_admin"]), async (request, response) => {
  const { title, category = "Campus", priority = "Update" } = request.body;
  if (typeof title !== "string" || title.trim().length < 5) {
    return response.status(400).json({ error: "An announcement title of at least five characters is required." });
  }
  if (!supabase) {
    return response.status(503).json({ error: "Supabase is not configured on this server." });
  }

  const { data, error } = await supabase
    .from("announcements")
    .insert({ title: title.trim(), category, priority })
    .select("id,title,category,source,published_at,priority")
    .single();

  if (error) {
    console.error("Failed to publish announcement:", error.message);
    return response.status(500).json({ error: "Unable to publish announcement." });
  }

  response.status(201).json({ data });
});

app.use((_request, response) => {
  response.status(404).json({ error: "Route not found." });
});

app.listen(port, () => {
  console.log(`Campus Hub API listening on http://localhost:${port}`);
});
