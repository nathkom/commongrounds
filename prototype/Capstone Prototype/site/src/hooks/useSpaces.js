import { useEffect, useState } from "react";
import { fetchCatalogSpaces } from "../lib/spaces";
import { getCached, fetchWithCache } from "../lib/cache";

const CACHE_KEY = "spaces:catalog";

// Public spaces catalog with shared in-memory cache.
// Serves cached rows synchronously on mount and revalidates when stale.
export function useSpaces() {
  const initial = getCached(CACHE_KEY);
  const [spaces, setSpaces] = useState(initial ?? []);
  const [loading, setLoading] = useState(!initial);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetchWithCache(CACHE_KEY, fetchCatalogSpaces)
      .then((data) => {
        if (cancelled) return;
        setSpaces(data);
        setLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("Failed to load spaces:", err);
        setError(err.message);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { spaces, loading, error };
}
