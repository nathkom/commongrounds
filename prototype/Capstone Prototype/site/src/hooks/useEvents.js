import { useState, useEffect, useMemo } from "react";
import { fetchAllEvents, fetchCatalogEvents } from "../lib/events";
import { useUser } from "../context/UserContext";
import { getCached, fetchWithCache, setCached } from "../lib/cache";

// mode:
//   "catalog" — slim columns, shared cache; for Home / Events / Neighborhoods / UserDashboard
//   "full"    — every column, no cache; for HostTools editing
export function useEvents({ mode = "catalog", includeHidden = false } = {}) {
  const { createdEvents, deletedEventIds, editedEvents, attendingEvents, hiddenEventIds, user } = useUser();

  const cacheKey = mode === "catalog" ? "events:catalog" : null;
  const fetcher = mode === "catalog" ? fetchCatalogEvents : fetchAllEvents;

  const initial = cacheKey ? getCached(cacheKey) : null;
  const [dbEvents, setDbEvents] = useState(initial ?? []);
  const [loading, setLoading] = useState(!initial);
  const [error, setError] = useState(null);

  const base = import.meta.env.BASE_URL;

  function normalizeImages(event) {
    function fixUrl(url) {
      if (!url || url.startsWith("http") || url.startsWith("data:") || url.startsWith(base)) return url;
      return base + url.replace(/^\//, "");
    }
    return {
      ...event,
      image_url: fixUrl(event.image_url),
      gallery_images: (event.gallery_images ?? []).map((g) =>
        typeof g === "string" ? fixUrl(g) : { ...g, url: fixUrl(g.url) }
      ),
    };
  }

  async function load() {
    setError(null);
    try {
      const data = cacheKey
        ? await fetchWithCache(cacheKey, fetcher)
        : await fetcher();
      setDbEvents(data.map(normalizeImages));
    } catch (err) {
      console.error("Failed to load events:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function refetch() {
    if (cacheKey) setCached(cacheKey, null);
    setLoading(true);
    return load();
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  const events = useMemo(() => {
    const optimisticIds = new Set(createdEvents.map((e) => e.id));
    const baseList = [
      ...createdEvents,
      ...dbEvents.filter((e) => !optimisticIds.has(e.id)),
    ];
    const isAdmin = user?.role === "admin";
    return baseList
      .filter((e) => !deletedEventIds.has(e.id))
      .map((e) => (editedEvents[e.id] ? { ...e, ...editedEvents[e.id] } : e))
      .filter((e) => includeHidden || (!e.hidden && !hiddenEventIds.has(e.id)))
      .filter((e) => {
        if (!e.hide_when_full || !e.attending_limit || isAdmin) return true;
        if (attendingEvents.has(e.id)) return true;
        return (e.attending_count || 0) < e.attending_limit;
      });
  }, [dbEvents, createdEvents, deletedEventIds, editedEvents, attendingEvents, hiddenEventIds, user?.role]);

  return { events, loading, error, refetch };
}
