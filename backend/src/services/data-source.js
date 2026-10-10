import { createClient } from "@supabase/supabase-js";
import {
  create as localCreate,
  find as localFind,
  list as localList,
  loadStore as loadLocalStore,
  remove as localRemove,
  update as localUpdate,
} from "../models/store.js";

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const useSupabase = Boolean(supabaseUrl && serviceRoleKey && !supabaseUrl.includes("your-project"));
const supabase = useSupabase ? createClient(supabaseUrl, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } }) : null;

const resourceTables = {
  announcements: "announcements",
  clubs: "clubs",
  events: "events",
  groups: "groups",
  messages: "messages",
};

function requireSupabase() {
  if (!supabase) throw new Error("Supabase is not configured.");
  return supabase;
}

function profileToUser(profile) {
  return { id: profile.id, name: profile.name, email: profile.email, role: profile.role };
}

export function databaseName() {
  return useSupabase ? "supabase" : "local-json";
}

export async function loadDataSource() {
  if (!useSupabase) return loadLocalStore();
}

export async function list(resource) {
  if (!useSupabase) return localList(resource);
  const { data, error } = await requireSupabase().from(resourceTables[resource]).select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function find(resource, id) {
  if (!useSupabase) return localFind(resource, id);
  const { data, error } = await requireSupabase().from(resourceTables[resource]).select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data;
}

export async function create(resource, input) {
  if (!useSupabase) return localCreate(resource, input);
  const { data, error } = await requireSupabase().from(resourceTables[resource]).insert(input).select("*").single();
  if (error) throw error;
  return data;
}

export async function update(resource, id, input) {
  if (!useSupabase) return localUpdate(resource, id, input);
  const { data, error } = await requireSupabase().from(resourceTables[resource]).update(input).eq("id", id).select("*").single();
  if (error) throw error;
  return data;
}

export async function remove(resource, id) {
  if (!useSupabase) return localRemove(resource, id);
  const { error } = await requireSupabase().from(resourceTables[resource]).delete().eq("id", id);
  if (error) throw error;
  return true;
}

export async function login(email, password) {
  if (!useSupabase) {
    const user = (await list("users")).find((item) => item.email === email);
    if (!user) return null;
    return { user, token: `local:${user.id}:${user.role}` };
  }
  if (!password) return null;
  const { data, error } = await requireSupabase().auth.signInWithPassword({ email, password });
  if (error || !data.session || !data.user) return null;
  const { data: profile, error: profileError } = await requireSupabase().from("profiles").select("*").eq("auth_id", data.user.id).single();
  if (profileError) throw profileError;
  return { user: profileToUser({ ...profile, email: data.user.email }), token: data.session.access_token };
}

export async function authenticate(token) {
  if (!token) return null;
  if (!useSupabase) {
    const userId = Number(token.split(":")[1]);
    return (await list("users")).find((item) => item.id === userId) || null;
  }
  const { data, error } = await requireSupabase().auth.getUser(token);
  if (error || !data.user) return null;
  const { data: profile, error: profileError } = await requireSupabase().from("profiles").select("*").eq("auth_id", data.user.id).single();
  if (profileError) throw profileError;
  return profileToUser({ ...profile, email: data.user.email });
}

export { useSupabase };
