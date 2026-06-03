import { supabase } from "./supabase";

async function requireUser() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return user;
}

export async function fetchUserBookmarks(userId) {
  const { data, error } = await supabase
    .from("event_bookmarks")
    .select("event_id, group_ids")
    .eq("user_id", userId);
  if (error) throw error;
  return data ?? [];
}

export async function fetchUserBookmarkGroups(userId) {
  const { data, error } = await supabase
    .from("bookmark_groups")
    .select("id, name")
    .eq("user_id", userId)
    .order("created_at");
  if (error) throw error;
  return data ?? [];
}

export async function insertBookmark(eventId, groupIds = ["default"]) {
  const user = await requireUser();
  const { error } = await supabase
    .from("event_bookmarks")
    .insert({ user_id: user.id, event_id: eventId, group_ids: groupIds });
  if (error) throw error;
}

export async function deleteBookmark(eventId) {
  const user = await requireUser();
  const { error } = await supabase
    .from("event_bookmarks")
    .delete()
    .eq("user_id", user.id)
    .eq("event_id", eventId);
  if (error) throw error;
}

export async function updateBookmarkGroups(eventId, groupIds) {
  const user = await requireUser();
  const safeGroupIds = groupIds.length > 0 ? groupIds : ["default"];
  const { error } = await supabase
    .from("event_bookmarks")
    .update({ group_ids: safeGroupIds })
    .eq("user_id", user.id)
    .eq("event_id", eventId);
  if (error) throw error;
}

export async function insertBookmarkGroup(name) {
  const user = await requireUser();
  const { data, error } = await supabase
    .from("bookmark_groups")
    .insert({ user_id: user.id, name })
    .select("id, name")
    .single();
  if (error) throw error;
  return data;
}

export async function deleteBookmarkGroup(groupId) {
  const user = await requireUser();
  const { error } = await supabase
    .from("bookmark_groups")
    .delete()
    .eq("user_id", user.id)
    .eq("id", groupId);
  if (error) throw error;
}
