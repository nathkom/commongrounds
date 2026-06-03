import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { LayoutGrid, Map, Search } from "lucide-react";
import { filterEvents } from "../utils/filters";
import EmptyState from "../components/EmptyState";
import NeighborhoodsMap from "../components/NeighborhoodsMap";
import FilterCard from "../components/FilterCard";
import EventCard from "../components/EventCard";
import { useUser } from "../context/UserContext";
import { useEvents } from "../hooks/useEvents";
import { useSpaces } from "../hooks/useSpaces";
import { spaces as staticSpaces } from "../data/spaces";

const DEFAULT_FILTERS = {
  neighborhoods: [],
  categories: [],
  dateFrom: null,
  dateTo: null,
  cost: "all",
  accessibility: [],
  keyword: "",
};

export default function Events() {
  const { bookmarkedEvents, toggleBookmark, likedEvents, toggleLike, getLikeCount, createdSpaces, deletedStaticSpaceIds } = useUser();
  const { events, loading } = useEvents();
  const { spaces: dbSpaces } = useSpaces();
  const [searchParams, setSearchParams] = useSearchParams();

  // Mirror Home.jsx merge: createdSpaces > dbSpaces > staticSpaces; filter
  // hidden + deleted-static IDs; dedupe by id.
  const allSpaces = useMemo(() => {
    const seen = new Set();
    return [...createdSpaces, ...dbSpaces, ...staticSpaces]
      .filter((s) => !s.hidden)
      .filter((s) => !deletedStaticSpaceIds.has(s.id))
      .filter((s) => {
        if (seen.has(s.id)) return false;
        seen.add(s.id);
        return true;
      });
  }, [createdSpaces, dbSpaces, deletedStaticSpaceIds]);

  const urlKeyword = searchParams.get("q") || "";

  const [filters, setFilters] = useState(() => {
    const nbParam = searchParams.get("neighborhood");
    const costParam = searchParams.get("cost");
    const dateFromParam = searchParams.get("dateFrom");
    const dateToParam = searchParams.get("dateTo");
    return {
      ...DEFAULT_FILTERS,
      neighborhoods: nbParam ? [nbParam] : [],
      cost: costParam && ["free", "paid"].includes(costParam) ? costParam : "all",
      dateFrom: dateFromParam || null,
      dateTo: dateToParam || null,
    };
  });

  const [viewMode, setViewMode] = useState("card");
  const [mapSelectedNeighborhood, setMapSelectedNeighborhood] = useState("");

  useEffect(() => {
    const nbParam = searchParams.get("neighborhood");
    const costParam = searchParams.get("cost");
    if (nbParam) {
      setFilters((f) => ({ ...f, neighborhoods: [nbParam] }));
    }
    if (costParam && ["free", "paid"].includes(costParam)) {
      setFilters((f) => ({ ...f, cost: costParam }));
    }
  }, []);

  const effectiveFilters = useMemo(
    () => ({ ...filters, keyword: urlKeyword }),
    [filters, urlKeyword],
  );

  const filteredEvents = useMemo(
    () => filterEvents(events, effectiveFilters),
    [events, effectiveFilters],
  );

  const activeCount = [
    filters.neighborhoods.length > 0,
    filters.categories.length > 0,
    filters.dateFrom,
    filters.dateTo,
    filters.cost !== "all",
    filters.accessibility.length > 0,
    urlKeyword.trim() !== "",
  ].filter(Boolean).length;

  function handleClear() {
    setFilters(DEFAULT_FILTERS);
    setSearchParams({});
  }

  function handleSearchChange(val) {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (val.trim()) next.set("q", val);
        else next.delete("q");
        return next;
      },
      { replace: true },
    );
  }

  const searchBar = (
    <label className="flex-1 min-w-0 bg-white rounded-2xl border border-gray-200 shadow-sm flex items-center gap-2.5 px-4 cursor-text focus-within:ring-2 focus-within:ring-[#9FB366] focus-within:border-transparent transition-shadow hover:shadow-md self-stretch">
      <Search size={16} className="text-gray-400 shrink-0" aria-hidden="true" />
      <input
        type="text"
        value={urlKeyword}
        onChange={(e) => handleSearchChange(e.target.value)}
        placeholder="Search events, venues, tags…"
        className="flex-1 min-w-0 bg-transparent text-sm focus:outline-none placeholder:text-gray-400 py-4"
        aria-label="Search events"
      />
      {urlKeyword && (
        <button
          type="button"
          onClick={() => handleSearchChange("")}
          className="text-gray-400 hover:text-gray-600 text-xs shrink-0 px-1"
          aria-label="Clear search"
        >
          Clear
        </button>
      )}
    </label>
  );

  const viewToggle = (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-2 flex gap-1.5">
      <button
        onClick={() => setViewMode("card")}
        className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-semibold transition-colors ${
          viewMode === "card"
            ? "bg-gray-900 text-white"
            : "text-gray-500 hover:bg-gray-50"
        }`}
      >
        <LayoutGrid size={14} />
        Card View
      </button>
      <button
        onClick={() => setViewMode("map")}
        className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-semibold transition-colors ${
          viewMode === "map"
            ? "bg-gray-900 text-white"
            : "text-gray-500 hover:bg-gray-50"
        }`}
      >
        <Map size={14} />
        Map View
      </button>
    </div>
  );

  return (
    <main className="bg-gray-50 min-h-screen pb-16">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {viewMode === "map" ? (
          <div className="flex flex-col gap-5">
            <div className="flex items-start gap-6">
              <div className="w-72 shrink-0">{viewToggle}</div>
              <div className="flex-1 min-w-0 flex items-center gap-4">
                <div className="shrink-0">
                  <h1 className="text-2xl font-bold text-gray-900">Browse Events</h1>
                  <p className="text-gray-500 text-sm mt-0.5">
                    {filteredEvents.length} event
                    {filteredEvents.length !== 1 ? "s" : ""} in the Greater Seattle Area
                    {activeCount > 0 && (
                      <button
                        onClick={handleClear}
                        className="ml-3 inline-flex items-center gap-1 text-sm font-semibold text-red-500 hover:text-red-700 transition-colors"
                        aria-label="Clear all filters"
                      >
                        × Clear {activeCount} filter{activeCount !== 1 ? "s" : ""}
                      </button>
                    )}
                  </p>
                </div>
                {searchBar}
              </div>
            </div>
            <NeighborhoodsMap
              events={filteredEvents}
              spaces={allSpaces}
              selectedNeighborhood={mapSelectedNeighborhood}
              onNeighborhoodClick={(name) =>
                setMapSelectedNeighborhood((prev) => (prev === name ? "" : name))
              }
              height={Math.round(window.innerHeight * 0.75 - 80)}
            />
          </div>
        ) : (
          <div className="flex gap-6 items-start">
            <aside className="w-72 shrink-0 sticky top-20 self-start flex flex-col gap-3">
              {viewToggle}
              <FilterCard
                filters={filters}
                onChange={setFilters}
                onClear={handleClear}
                heading="Browse Events"
              />
            </aside>

            <div className="flex-1 min-w-0">
              <div className="sticky top-16 z-30 -mt-4 pt-4 pb-3 bg-gray-50 flex">
                {searchBar}
              </div>
              <p className="text-gray-500 text-sm mb-5">
                {filteredEvents.length} event
                {filteredEvents.length !== 1 ? "s" : ""} in the Greater Seattle Area
                {activeCount > 0 && (
                  <button
                    onClick={handleClear}
                    className="ml-3 inline-flex items-center gap-1 text-sm font-semibold text-red-500 hover:text-red-700 transition-colors"
                    aria-label="Clear all filters"
                  >
                    × Clear {activeCount} filter{activeCount !== 1 ? "s" : ""}
                  </button>
                )}
              </p>

              {loading ? (
                <div className="flex flex-col gap-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-[220px] bg-gray-200 animate-pulse rounded-2xl" />
                  ))}
                </div>
              ) : filteredEvents.length === 0 ? (
                <EmptyState />
              ) : (
                <div className="flex flex-col gap-4">
                  {filteredEvents.map((event) => (
                    <EventCard
                      key={event.id}
                      event={event}
                      liked={likedEvents.has(event.id)}
                      likeCount={getLikeCount(event)}
                      onToggleLike={toggleLike}
                      bookmarked={bookmarkedEvents.has(event.id)}
                      onToggleBookmark={toggleBookmark}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
