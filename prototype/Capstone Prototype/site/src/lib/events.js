import { supabase } from "./supabase";

// Catalog-only projection: just what EventCard renders + what filterEvents
// reads. Heavy fields (gallery_images, accessibility_info, noise_level,
// space_format, crowd_level, show_attendance, contact_email) load lazily
// via fetchEventById on the detail page or via fetchAllEvents in host tools.
const CATALOG_EVENT_COLUMNS =
  "id,title,space_name,neighborhood,category,description,date,time," +
  "cost,cost_amount,accessibility,tags,image_url,featured," +
  "attending_count,attending_limit,hide_when_full,hidden,host_id,likes";

// All columns needed for host/admin management, but gallery_images is excluded
// from the list query — it loads per-event via fetchEventById to avoid timeouts
// caused by base64-encoded images stored in that column.
const HOST_EVENT_COLUMNS =
  "id,title,space_name,neighborhood,category,description," +
  "date,time,cost,cost_amount,accessibility,tags," +
  "image_url,contact_email,featured," +
  "noise_level,accessibility_info,space_format,crowd_level," +
  "attending_limit,show_attendance,attending_count,hidden," +
  "hide_when_full,host_id,likes";

export async function fetchAllEvents() {
  const { data, error } = await supabase
    .from("events")
    .select(HOST_EVENT_COLUMNS)
    .order("date");
  if (error) throw error;
  return data ?? [];
}

export async function fetchCatalogEvents() {
  const { data, error } = await supabase
    .from("events")
    .select(CATALOG_EVENT_COLUMNS)
    .order("date");
  if (error) throw error;
  return data ?? [];
}

export async function fetchEventById(id) {
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data;
}

const ALLOWED_EVENT_FIELDS = new Set([
  "id", "title", "space_name", "neighborhood", "category", "description",
  "date", "time", "cost", "cost_amount", "accessibility", "tags",
  "image_url", "gallery_images", "contact_email", "featured",
  "noise_level", "accessibility_info", "space_format", "crowd_level",
  "attending_limit", "show_attendance", "attending_count", "hidden",
  "hide_when_full", "host_id",
]);

function sanitizeEvent(obj) {
  const out = {};
  for (const key of ALLOWED_EVENT_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) out[key] = obj[key];
  }
  if (out.title) out.title = String(out.title).slice(0, 200);
  if (out.description) out.description = String(out.description).slice(0, 5000);
  if (out.cost_amount != null) out.cost_amount = Math.max(0, Number(out.cost_amount)) || null;
  if (out.crowd_level != null) out.crowd_level = Math.min(100, Math.max(0, Number(out.crowd_level)));
  if (out.attending_limit != null) out.attending_limit = Math.max(1, Math.floor(Number(out.attending_limit))) || null;
  return out;
}

export async function createEvent(eventObj) {
  const { data, error } = await supabase
    .from("events")
    .insert([sanitizeEvent(eventObj)])
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateEvent(id, patch) {
  // upsert so edits work even if the event was never persisted (pre-fix stale data)
  const { data, error } = await supabase
    .from("events")
    .upsert({ ...sanitizeEvent(patch), id }, { onConflict: "id" })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteEvent(id) {
  const { error } = await supabase.from("events").delete().eq("id", id);
  if (error) throw error;
}

export async function setEventHidden(id, hidden) {
  const { error } = await supabase.from("events").update({ hidden }).eq("id", id);
  if (error) throw error;
}

// ── Attendance ────────────────────────────────────────────────────────────────

export async function fetchUserAttendance(userId) {
  const { data, error } = await supabase
    .from("event_attendance")
    .select("event_id")
    .eq("user_id", userId);
  if (error) throw error;
  return data?.map((r) => r.event_id) ?? [];
}

export async function markAttendance(eventId) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { error } = await supabase
    .from("event_attendance")
    .insert({ event_id: eventId, user_id: user.id });
  if (error) throw error;
}

export async function unmarkAttendance(eventId) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { error } = await supabase
    .from("event_attendance")
    .delete()
    .eq("event_id", eventId)
    .eq("user_id", user.id);
  if (error) throw error;
}

export async function fetchEventAttendees(eventId) {
  const { data, error } = await supabase
    .from("event_attendance")
    .select("user_id, created_at, profiles(full_name, email)")
    .eq("event_id", eventId)
    .order("created_at");
  if (error) throw error;
  return data ?? [];
}

export async function uploadEventImage(file, eventId) {
  const ext = file.name.split(".").pop() || "jpg";
  const path = `${eventId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const { error } = await supabase.storage
    .from("event-images")
    .upload(path, file, { upsert: true });
  if (error) throw error;
  const { data } = supabase.storage.from("event-images").getPublicUrl(path);
  return data.publicUrl;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function trackAnalytic(eventId, action, userId = null) {
  if (!eventId || !UUID_RE.test(String(eventId))) return;
  supabase
    .from("event_analytics")
    .insert([{ event_id: eventId, action, user_id: userId || null }])
    .then(({ error }) => {
      if (error) console.warn("Analytics insert failed:", error.message);
    });
}
