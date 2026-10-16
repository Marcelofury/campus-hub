import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env");
  process.exit(1);
}

const dataFile = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "../data/local.json",
);

const seed = JSON.parse(await readFile(dataFile, "utf8"));

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const passwords = {
  "ada@utamu.ac.ug": "Utamu#Student1",
  "admin@utamu.ac.ug": "Utamu#Admin1",
  "superadmin@utamu.ac.ug": "Utamu#Owner1",
};

async function ensureAuthUser({ email, name }) {
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password: passwords[email],
    email_confirm: true,
    user_metadata: { name },
  });
  if (!error) return data.user;

  const { data: list, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) throw listError;
  const existing = list.users.find((user) => user.email === email);
  if (!existing) throw error;
  await supabase.auth.admin.updateUserById(existing.id, {
    password: passwords[email],
    email_confirm: true,
    user_metadata: { name },
  });
  return existing;
}

async function isSeeded(table) {
  const { count, error } = await supabase
    .from(table)
    .select("*", { count: "exact", head: true });
  if (error) throw error;
  return count > 0;
}

async function main() {
  console.log("Seeding Supabase...");

  for (const user of seed.users) {
    const authUser = await ensureAuthUser(user);
    const { error } = await supabase.from("profiles").upsert(
      {
        auth_id: authUser.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      { onConflict: "email" },
    );
    if (error) throw error;
    console.log(`  profile: ${user.email} (${user.role})`);
  }

  if (await isSeeded("announcements")) {
    console.log("  announcements: already seeded, skipped");
  } else {
    const rows = seed.announcements.map(
      ({ title, category, source, published, priority }) => ({
        title,
        category,
        source,
        published,
        priority,
      }),
    );
    const { error } = await supabase.from("announcements").insert(rows);
    if (error) throw error;
    console.log(`  announcements: ${rows.length} rows`);
  }

  if (await isSeeded("clubs")) {
    console.log("  clubs: already seeded, skipped");
  } else {
    const rows = seed.clubs.map(
      ({ name, category, members, description, verified }) => ({
        name,
        category,
        members,
        description,
        verified,
      }),
    );
    const { error } = await supabase.from("clubs").insert(rows);
    if (error) throw error;
    console.log(`  clubs: ${rows.length} rows`);
  }

  if (await isSeeded("events")) {
    console.log("  events: already seeded, skipped");
  } else {
    const rows = seed.events.map(({ title, type, when, place, registrations }) => ({
      title,
      type,
      when,
      place,
      registrations,
    }));
    const { error } = await supabase.from("events").insert(rows);
    if (error) throw error;
    console.log(`  events: ${rows.length} rows`);
  }

  const groupIdMap = {};
  const { data: existingGroups } = await supabase.from("groups").select("id, name");

  if (existingGroups && existingGroups.length > 0) {
    console.log("  groups: already seeded, skipped");
  } else {
    const rows = seed.groups.map(({ name, detail, members, visibility }) => ({
      name,
      detail,
      members,
      visibility,
    }));
    const { data, error } = await supabase.from("groups").insert(rows).select("id");
    if (error) throw error;
    seed.groups.forEach((group, index) => {
      groupIdMap[group.id] = data[index].id;
    });
    console.log(`  groups: ${rows.length} rows`);
  }

  if (await isSeeded("messages")) {
    console.log("  messages: already seeded, skipped");
  } else {
    const { data: groupRows, error: groupError } = await supabase
      .from("groups")
      .select("id, name")
      .order("id", { ascending: true });
    if (groupError) throw groupError;
    seed.groups.forEach((group, index) => {
      groupIdMap[group.id] = groupRows[index].id;
    });

    const rows = seed.messages.map(({ groupId, author, body, createdAt }) => ({
      group_id: groupIdMap[groupId],
      author,
      body,
      created_at: createdAt,
    }));
    const { error } = await supabase.from("messages").insert(rows);
    if (error) throw error;
    console.log(`  messages: ${rows.length} rows`);
  }

  console.log("Done.");
  console.log("\nLogin credentials:");
  for (const [email, password] of Object.entries(passwords)) {
    console.log(`  ${email} / ${password}`);
  }
}

main().catch((error) => {
  console.error("Seed failed:", error.message ?? error);
  process.exit(1);
});
