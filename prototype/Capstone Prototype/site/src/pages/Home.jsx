import { useState, useMemo, useEffect, lazy, Suspense } from "react";
import { Link } from "react-router-dom";
import { SlidersHorizontal, X, MapPin, Users, Clock } from "lucide-react";
import { useUser } from "../context/UserContext";
import { useEvents } from "../hooks/useEvents";
import { useSpaces } from "../hooks/useSpaces";
import { filterEvents } from "../utils/filters";
import { spaces as staticSpaces } from "../data/spaces";
import BulletinBoard from "../components/BulletinBoard";
import FilterCard from "../components/FilterCard";
import EventCard from "../components/EventCard";
import EmptyState from "../components/EmptyState";
import headerBg from "../../wireframes/headerbackground1.png";
import thumbtackImg from "../../wireframes/thumbtack.png";

const NeighborhoodCarousel = lazy(() => import("../components/NeighborhoodCarousel"));

const ITEMS_PER_PAGE = 15;

const DEFAULT_FILTERS = {
  neighborhoods: [],
  categories: [],
  dateFrom: null,
  dateTo: null,
  cost: "all",
  accessibility: [],
  keyword: "",
};

const CATEGORY_BADGE = {
  "Café":             "bg-amber-100 text-amber-700",
  "Park":             "bg-green-100 text-green-700",
  "Gallery":          "bg-purple-100 text-purple-700",
  "Community Center": "bg-blue-100 text-blue-700",
  "Library":          "bg-indigo-100 text-indigo-700",
  "Brewery":          "bg-orange-100 text-orange-700",
  "Other":            "bg-gray-100 text-gray-600",
};

const AMENITY_LABELS = {
  wheelchair_accessible:   "Accessible",
  gender_neutral_restroom: "Gender-neutral restrooms",
  sensory_friendly:        "Sensory-friendly",
  dog_friendly:            "Dog-friendly",
  wifi:                    "WiFi",
};

function SpaceCard({ space }) {
  const badgeCls = CATEGORY_BADGE[space.category] || "bg-gray-100 text-gray-600";

  return (
    <div className="relative">
      <Link
        to={`/spaces/${space.id}`}
        className="block bg-[#F5F0E8] rounded-2xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow group h-[220px]"
        aria-label={`View details for ${space.name}`}
      >
        <div className="flex h-full">
          {/* Image — same width as FeedCard */}
          <div className="w-52 shrink-0 overflow-hidden">
            <img
              src={space.image_url || `${import.meta.env.BASE_URL}images/headway-F2KRf_QfCqw-unsplash.jpg`}
              alt={space.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />
          </div>

          {/* Content */}
          <div className="flex-1 p-4 flex flex-col min-w-0 overflow-hidden gap-1.5">
            <h3 className="text-lg font-bold text-gray-900 leading-tight line-clamp-1 group-hover:text-[#9FB366] transition-colors">
              {space.name}
            </h3>

            {/* Meta row — same icon colours as FeedCard */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-gray-500">
              {space.neighborhood && (
                <span className="flex items-center gap-1 truncate">
                  <MapPin size={11} className="text-[#FD858A] shrink-0" />
                  <span className="truncate">{space.neighborhood}, Seattle</span>
                </span>
              )}
              {space.capacity && (
                <span className="flex items-center gap-1">
                  <Users size={11} className="text-[#97BFFF] shrink-0" />
                  Up to {space.capacity}
                </span>
              )}
              {space.hours && (
                <span className="flex items-center gap-1 min-w-0">
                  <Clock size={11} className="text-[#FFA86C] shrink-0" />
                  <span className="truncate max-w-[180px]">{space.hours}</span>
                </span>
              )}
            </div>

            {space.description && (
              <p className="text-sm text-gray-600 leading-relaxed line-clamp-3">
                {space.description}
              </p>
            )}

            {/* Tags — same pill style as FeedCard, no action buttons */}
            <div className="flex flex-wrap gap-1 mt-auto min-w-0 overflow-hidden">
              <span className={`text-sm px-3 py-1 rounded-full font-semibold ${badgeCls}`}>
                {space.category}
              </span>
              {space.amenities?.slice(0, 2).map((a) => (
                <span
                  key={a}
                  className="text-sm px-3 py-1 rounded-full border border-green-300 text-green-700 capitalize whitespace-nowrap"
                >
                  {AMENITY_LABELS[a] || a.replace(/_/g, " ")}
                </span>
              ))}
            </div>
          </div>
        </div>
      </Link>

      {/* Thumbtack — same position as FeedCard */}
      <img
        src={thumbtackImg}
        alt=""
        aria-hidden="true"
        className="absolute -top-6 -right-3 w-[80px] pointer-events-none select-none z-10 rotate-12"
      />
    </div>
  );
}

function CatalogToggle({ value, onChange }) {
  return (
    <div className="flex items-center gap-2.5 shrink-0">
      <span className="text-base font-bold text-gray-900">Show me:</span>
      <div className="flex items-center bg-gray-100 rounded-full p-1">
        <button
          onClick={() => onChange("events")}
          className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all ${
            value === "events"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Events
        </button>
        <button
          onClick={() => onChange("spaces")}
          className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all ${
            value === "spaces"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Spaces
        </button>
      </div>
    </div>
  );
}

export default function Home() {
  const [catalogView, setCatalogView] = useState("events");

  const { bookmarkedEvents, toggleBookmark, createdSpaces, deletedStaticSpaceIds, likedEvents, toggleLike, getLikeCount } = useUser();
  const { events: allEvents, loading } = useEvents();
  const { spaces: dbSpaces, loading: spacesLoading } = useSpaces();
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [displayCount, setDisplayCount] = useState(ITEMS_PER_PAGE);

  // Reset pagination whenever the view or filters change
  useEffect(() => {
    setDisplayCount(ITEMS_PER_PAGE);
  }, [catalogView, filters]);


  const filteredEvents = useMemo(
    () => filterEvents(allEvents, filters),
    [allEvents, filters],
  );

  // createdSpaces (optimistic host updates) take precedence over DB rows;
  // DB rows take precedence over static fallback data.
  const allSpaces = useMemo(() => {
    const seen = new Set();
    return [...createdSpaces, ...dbSpaces, ...staticSpaces]
      .filter((s) => !s.hidden)
      .filter((s) => !deletedStaticSpaceIds.has(s.id))
      .filter((s) => { if (seen.has(s.id)) return false; seen.add(s.id); return true; });
  }, [createdSpaces, dbSpaces, deletedStaticSpaceIds]);

  // When filters are active, show only spaces that host at least one matching event.
  // space_name on events is matched to space.name (existing convention throughout the app).
  const filteredSpaces = useMemo(() => {
    const noFilters =
      filters.neighborhoods.length === 0 &&
      filters.categories.length === 0 &&
      filters.dateFrom === null &&
      filters.dateTo === null &&
      filters.cost === "all" &&
      filters.accessibility.length === 0 &&
      filters.keyword === "";
    if (noFilters) return allSpaces;
    const activeSpaceNames = new Set(
      filteredEvents.map((e) => e.space_name).filter(Boolean)
    );
    return allSpaces.filter((s) => activeSpaceNames.has(s.name));
  }, [allSpaces, filteredEvents, filters]);

  const displayedEvents = filteredEvents.slice(0, displayCount);
  const displayedSpaces = filteredSpaces.slice(0, displayCount);
  const hasMoreEvents = displayCount < filteredEvents.length;
  const hasMoreSpaces = displayCount < filteredSpaces.length;

  function handleClear() {
    setFilters(DEFAULT_FILTERS);
  }

  return (
    <main>
      {/* Section A — Bulletin Board */}
      <BulletinBoard />

      {/* Divider */}
      <div className="border-t border-gray-100" />

      {/* Section B — Feed */}
      <div className="max-w-7xl mx-auto px-4 pt-4 pb-8">
        {/* Feed header — mobile only */}
        <div className="flex items-center justify-between mb-4 md:hidden">
          <h2 className="text-2xl font-bold text-gray-900">Your Feed</h2>
          <div className="flex items-center gap-3">
            <CatalogToggle value={catalogView} onChange={setCatalogView} />
            {catalogView === "events" && (
              <button
                className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 hover:border-green-500 transition-colors"
                onClick={() => setMobileFilterOpen(true)}
                aria-label="Open filters"
              >
                <SlidersHorizontal size={16} />
                Filters
              </button>
            )}
          </div>
        </div>

        <div className="flex gap-6 items-start">
          {/* Sidebar — always visible, filters apply when in events view */}
          <aside className="hidden md:block w-72 shrink-0 sticky top-20 self-start">
            <FilterCard
              filters={filters}
              onChange={setFilters}
              onClear={handleClear}
              heading="Your Feed"
            />
          </aside>

          {/* Catalog */}
          <section className="flex-1 min-w-0" aria-label={catalogView === "events" ? "Event feed" : "Spaces catalog"}>
            {/* Desktop: banner + toggle */}
            <div className="hidden md:flex items-center justify-between mb-4">
              <div
                className="w-1/2 flex items-center px-8 py-4 rounded-xl overflow-hidden"
                style={{
                  backgroundImage: `url(${headerBg})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              >
                <h2 className="text-3xl font-bold text-black">
                  Find your third space
                </h2>
              </div>
              <CatalogToggle value={catalogView} onChange={setCatalogView} />
            </div>

            {/* Events view */}
            {catalogView === "events" && (
              loading ? (
                <div className="flex flex-col gap-4">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-36 bg-gray-200 animate-pulse rounded-2xl" />
                  ))}
                </div>
              ) : filteredEvents.length === 0 ? (
                <EmptyState />
              ) : (
                <div className="flex flex-col gap-4">
                  {displayedEvents.map((event) => (
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
                  {hasMoreEvents ? (
                    <div className="flex justify-center pt-4 pb-2">
                      <button
                        onClick={() => setDisplayCount((c) => c + ITEMS_PER_PAGE)}
                        className="px-8 py-3 bg-[#F5F0E8] text-gray-700 font-semibold rounded-xl border border-gray-400 hover:border-gray-500 hover:bg-[#ede8de] active:scale-95 transition-all shadow-sm"
                      >
                        Show more
                      </button>
                    </div>
                  ) : filteredEvents.length > ITEMS_PER_PAGE ? (
                    <p className="text-center text-sm text-gray-400 pt-4 pb-2">
                      You've seen all {filteredEvents.length} events
                    </p>
                  ) : null}
                </div>
              )
            )}

            {/* Spaces view */}
            {catalogView === "spaces" && (
              spacesLoading ? (
                <div className="flex flex-col gap-4">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-[220px] bg-gray-200 animate-pulse rounded-2xl" />
                  ))}
                </div>
              ) : filteredSpaces.length === 0 ? (
                <EmptyState />
              ) : (
                <div className="flex flex-col gap-4">
                  {displayedSpaces.map((space) => (
                    <SpaceCard key={space.id} space={space} />
                  ))}
                  {hasMoreSpaces ? (
                    <div className="flex justify-center pt-4 pb-2">
                      <button
                        onClick={() => setDisplayCount((c) => c + ITEMS_PER_PAGE)}
                        className="px-8 py-3 bg-[#F5F0E8] text-gray-700 font-semibold rounded-xl border border-gray-400 hover:border-gray-500 hover:bg-[#ede8de] active:scale-95 transition-all shadow-sm"
                      >
                        Show more
                      </button>
                    </div>
                  ) : filteredSpaces.length > ITEMS_PER_PAGE ? (
                    <p className="text-center text-sm text-gray-400 pt-4 pb-2">
                      You've seen all {filteredSpaces.length} spaces
                    </p>
                  ) : null}
                </div>
              )
            )}
          </section>
        </div>
      </div>

      {/* Section C — Neighborhood carousel */}
      <Suspense fallback={<div className="h-64" />}>
        <NeighborhoodCarousel />
      </Suspense>

      {/* Mobile filter drawer — events only */}
      {mobileFilterOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end"
          role="dialog"
          aria-modal="true"
          aria-label="Filter events"
        >
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setMobileFilterOpen(false)}
          />
          <div className="relative w-full bg-white rounded-t-2xl max-h-[85vh] overflow-y-auto p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Filters</h3>
              <button
                onClick={() => setMobileFilterOpen(false)}
                className="p-1 rounded-full hover:bg-gray-100"
                aria-label="Close filters"
              >
                <X size={20} />
              </button>
            </div>
            <FilterCard
              filters={filters}
              onChange={setFilters}
              onClear={handleClear}
            />
            <button
              onClick={() => setMobileFilterOpen(false)}
              className="mt-4 w-full bg-[#9FB366] text-white py-3 rounded-xl font-semibold hover:bg-[#8a9c57] transition-colors"
            >
              Apply Filters
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
