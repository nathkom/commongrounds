import { supabase } from "./supabase";

async function requireUser() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return user;
}

export async function fetchUserLikes(userId) {
  const { data, error } = await supabase
    .from("event_likes")
    .select("event_id")
    .eq("user_id", userId);
  if (error) throw error;
  return data?.map((r) => r.event_id) ?? [];
}

export async function insertLike(eventId) {
  const user = await requireUser();
  const { error } = await supabase
    .from("event_likes")
    .insert({ user_id: user.id, event_id: eventId });
  if (error) throw error;
}

export async function deleteLike(eventId) {
  const user = await requireUser();
  const { error } = await supabase
    .from("event_likes")
    .delete()
    .eq("user_id", user.id)
    .eq("event_id", eventId);
  if (error) throw error;
}
