import { supabase } from "./supabase";

export async function fetchHostEvents(hostId) {
  const { data, error } = await supabase
    .from("events")
    .select("id, title, date, category, attending_count, hidden")
    .eq("host_id", hostId)
    .order("date", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function fetchHostAnalytics(hostId) {
  const { data: events, error: evErr } = await supabase
    .from("events")
    .select("id")
    .eq("host_id", hostId);
  if (evErr) throw evErr;

  const eventIds = (events ?? []).map((e) => e.id);
  if (!eventIds.length) return {};

  // Views/bookmarks come from the append-only analytics log. Likes are
  // current-state and come from event_likes (counted as live rows) so
  // toggle spam in the past doesn't inflate the displayed total.
  const [analyticsRes, likesRes] = await Promise.all([
    supabase
      .from("event_analytics")
      .select("event_id, action")
      .in("event_id", eventIds),
    supabase
      .from("event_likes")
      .select("event_id")
      .in("event_id", eventIds),
  ]);
  if (analyticsRes.error) throw analyticsRes.error;
  if (likesRes.error) throw likesRes.error;

  const counts = {};
  for (const id of eventIds) {
    counts[id] = { view: 0, like: 0, bookmark: 0 };
  }
  for (const row of analyticsRes.data ?? []) {
    if (row.action === "like") continue;
    if (!counts[row.event_id]) counts[row.event_id] = { view: 0, like: 0, bookmark: 0 };
    counts[row.event_id][row.action] = (counts[row.event_id][row.action] ?? 0) + 1;
  }
  for (const row of likesRes.data ?? []) {
    if (!counts[row.event_id]) counts[row.event_id] = { view: 0, like: 0, bookmark: 0 };
    counts[row.event_id].like += 1;
  }
  return counts;
}

// Fetches raw timestamped action rows for a single event.
// Returns { actions: [{action, created_at}], attendance: [{created_at}] }.
// Caller buckets these into daily series client-side.
export async function fetchEventTimeSeries(eventId, sinceIso) {
  // Drop historical 'like' rows from event_analytics — they were inflated by
  // toggle spam pre-fix. Likes now come from event_likes.created_at.
  let analyticsQuery = supabase
    .from("event_analytics")
    .select("action, created_at")
    .eq("event_id", eventId)
    .neq("action", "like");
  let attendanceQuery = supabase
    .from("event_attendance")
    .select("created_at")
    .eq("event_id", eventId);
  let likesQuery = supabase
    .from("event_likes")
    .select("created_at")
    .eq("event_id", eventId);

  if (sinceIso) {
    analyticsQuery = analyticsQuery.gte("created_at", sinceIso);
    attendanceQuery = attendanceQuery.gte("created_at", sinceIso);
    likesQuery = likesQuery.gte("created_at", sinceIso);
  }

  const [
    { data: actions, error: aErr },
    { data: attendance, error: atErr },
    { data: likes, error: lErr },
  ] = await Promise.all([analyticsQuery, attendanceQuery, likesQuery]);
  if (aErr) throw aErr;
  if (atErr) throw atErr;
  if (lErr) throw lErr;

  // Re-shape like rows into the same {action, created_at} format the chart
  // consumes, so EventAnalyticsDetail's "Likes per day" bucketing works
  // without any caller-side changes.
  const likeActions = (likes ?? []).map((r) => ({ action: "like", created_at: r.created_at }));

  return {
    actions: [...(actions ?? []), ...likeActions],
    attendance: attendance ?? [],
  };
}
