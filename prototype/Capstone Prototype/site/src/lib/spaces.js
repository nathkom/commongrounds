import { supabase } from "./supabase";

// Public catalog rendering only — heavy fields stay in the detail/admin queries.
const CATALOG_SPACE_COLUMNS =
  "id,name,neighborhood,category,description,hours,capacity," +
  "amenities,image_url,hidden,host_id";

export async function fetchAllSpaces() {
  const { data, error } = await supabase.from("spaces").select("*").order("name");
  if (error) throw error;
  return data ?? [];
}

export async function fetchCatalogSpaces() {
  const { data, error } = await supabase
    .from("spaces")
    .select(CATALOG_SPACE_COLUMNS)
    .eq("hidden", false)
    .order("name");
  if (error) throw error;
  return data ?? [];
}

export async function fetchSpacesByHost(hostId) {
  const { data, error } = await supabase
    .from("spaces")
    .select("*")
    .eq("host_id", hostId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

const ALLOWED_SPACE_FIELDS = new Set([
  "id", "name", "address", "neighborhood", "category", "description",
  "hours", "capacity", "website", "noise_level", "space_format",
  "amenities", "image_url", "gallery_images", "host_id", "hidden",
]);

function sanitizeSpace(obj) {
  const out = {};
  for (const key of ALLOWED_SPACE_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) out[key] = obj[key];
  }
  if (out.name) out.name = String(out.name).slice(0, 200);
  if (out.description) out.description = String(out.description).slice(0, 5000);
  if (out.capacity != null) out.capacity = Math.max(1, Math.floor(Number(out.capacity))) || null;
  return out;
}

export async function createSpace(spaceObj) {
  const { data, error } = await supabase
    .from("spaces")
    .insert([sanitizeSpace(spaceObj)])
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateSpace(id, patch) {
  const { data, error } = await supabase
    .from("spaces")
    .upsert({ ...sanitizeSpace(patch), id }, { onConflict: "id" })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteSpace(id) {
  const { error } = await supabase.from("spaces").delete().eq("id", id);
  if (error) throw error;
}

export async function setSpaceHidden(id, hidden) {
  const { error } = await supabase.from("spaces").update({ hidden }).eq("id", id);
  if (error) throw error;
}

export async function uploadSpaceImage(file, spaceId) {
  const ext = file.name.split(".").pop() || "jpg";
  const path = `${spaceId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const { error } = await supabase.storage
    .from("space-images")
    .upload(path, file, { upsert: true });
  if (error) throw error;
  const { data } = supabase.storage.from("space-images").getPublicUrl(path);
  return data.publicUrl;
}
