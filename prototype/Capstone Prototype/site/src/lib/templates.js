import { supabase } from "./supabase";

export async function fetchHostTemplates(hostId) {
  const { data, error } = await supabase
    .from("host_templates")
    .select("*")
    .eq("host_id", hostId)
    .order("created_at");
  if (error) throw error;
  return data ?? [];
}

export async function upsertTemplate(tpl) {
  const { data, error } = await supabase
    .from("host_templates")
    .upsert(
      {
        id:          tpl.id,
        host_id:     tpl.host_id,
        name:        tpl.name,
        category:    tpl.category,
        description: tpl.description,
        prefill:     tpl.prefill ?? {},
        last_edited: tpl.last_edited ?? tpl.lastEdited ?? "",
        image:       tpl.image ?? null,
        images:      tpl.images ?? [],
      },
      { onConflict: "id" }
    )
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteTemplate(id) {
  const { error } = await supabase
    .from("host_templates")
    .delete()
    .eq("id", id);
  if (error) throw error;
}
