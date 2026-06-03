import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ArrowLeft, MapPin } from "lucide-react";
import { neighborhoods } from "../data/neighborhoods";
import { useEvents } from "../hooks/useEvents";
import { useSpaces } from "../hooks/useSpaces";
import { spaces as staticSpaces } from "../data/spaces";

// ── Neighborhood images ───────────────────────────────────────────────────────
import imgCapitolHill from "../../images/neighborhood_images/capitolhill.jpg";
import imgBallard from "../../images/neighborhood_images/ballard.png";
import imgBelltown from "../../images/neighborhood_images/belltown.webp";
import imgFremont from "../../images/neighborhood_images/fremont.jpg";
import imgSouthLakeUnion from "../../images/neighborhood_images/southlakeunion.jpg";
import imgUDistrict from "../../images/neighborhood_images/udistrict.jpg";

// ── Tape stickers (one per card, no repeats) ──────────────────────────────────
import tapeBluetape from "../../images/stickers/bluetape.png";
import tapeDotstape from "../../images/stickers/dotstape.png";
import tapeGreentape from "../../images/stickers/greentape.png";
import tapeRedplaidtape from "../../images/stickers/redplaidtape.png";
import tapeStartape from "../../images/stickers/startape.png";
import tapeYellowtape from "../../images/stickers/yellowtape.png";

const NEIGHBORHOOD_IMAGES = {
  "capitol-hill": imgCapitolHill,
  ballard: imgBallard,
  belltown: imgBelltown,
  fremont: imgFremont,
  "south-lake-union": imgSouthLakeUnion,
  "university-district": imgUDistrict,
};

const NEIGHBORHOOD_TAPES = {
  "capitol-hill": tapeBluetape,
  ballard: tapeDotstape,
  belltown: tapeGreentape,
  fremont: tapeRedplaidtape,
  "south-lake-union": tapeStartape,
  "university-district": tapeYellowtape,
};
import { useUser } from "../context/UserContext";
import EventCard from "../components/EventCard";
import EmptyState from "../components/EmptyState";
import NeighborhoodsMap from "../components/NeighborhoodsMap";
import thumbtackImg from "../../wireframes/thumbtack.png";

// ─── Neighborhood grid card ───────────────────────────────────────────────────
function NeighborhoodTile({ neighborhood, onClick }) {
  const image = NEIGHBORHOOD_IMAGES[neighborhood.id];
  const tape = NEIGHBORHOOD_TAPES[neighborhood.id];
  if (!image) return null;

  return (
    // pt-6 reserves space above the card so the tape isn't clipped
    <div className="relative pt-6">
      {/*
        ── NEIGHBORHOODS PAGE TAPE ────────────────────────────────────────────
        Edit tape appearance HERE for the neighborhoods page grid only.
        Main page carousel tape is in NeighborhoodCarousel.jsx.
        • Size:     w-38 (w-28 smaller · w-44 bigger)
        • Up/down:  -translate-y-1/14 (1/3 lower · 1/2 higher)
        • Tilt:     add rotate-3 or -rotate-6
        ──────────────────────────────────────────────────────────────────────
      */}
      <img
        src={tape}
        alt=""
        aria-hidden="true"
        className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/14 w-38 z-10 pointer-events-none select-none drop-shadow-sm"
      />

      <button
        onClick={() => onClick(neighborhood.id)}
        className="group flex flex-col items-center w-full focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 rounded-[28px]"
        aria-label={`Explore ${neighborhood.name}`}
      >
        <div className="relative w-full rounded-[28px] overflow-hidden aspect-square">
          <img
            src={image}
            alt={neighborhood.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            loading="lazy"
          />
          <svg
            className="absolute bottom-0 left-0 w-full h-10"
            viewBox="0 0 400 40"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <path
              d="M0,20 Q100,0 200,20 Q300,40 400,20 L400,40 L0,40 Z"
              fill="#f9fafb"
            />
          </svg>
        </div>
        <h2 className="mt-2 text-3xl font-semibold text-gray-900 group-hover:text-[#9FB366] transition-colors text-center">
          {neighborhood.name}
        </h2>
      </button>
    </div>
  );
}

// ─── Neighborhood detail view ─────────────────────────────────────────────────
function NeighborhoodDetail({
  neighborhood,
  onBack,
  allEvents,
  bookmarkedEvents,
  toggleBookmark,
  likedEvents,
  toggleLike,
  getLikeCount,
}) {
  const neighborhoodEvents = allEvents.filter(
    (e) => e.neighborhood === neighborhood.name,
  );

  return (
    <div>
      {/* Back button */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-[#9FB366] transition-colors mb-6"
        aria-label="Back to all neighborhoods"
      >
        <ArrowLeft size={16} />
        All Neighborhoods
      </button>

      {/* Hero banner */}
      <div className="relative rounded-2xl overflow-hidden h-56 md:h-72 mb-8">
        <img
          src={neighborhood.image_url}
          alt={neighborhood.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/20 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <span className="inline-block bg-white/20 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1 rounded-full mb-2 border border-white/30">
            {neighborhood.descriptor}
          </span>
          <h1 className="text-white text-3xl md:text-4xl font-bold drop-shadow">
            {neighborhood.name}
          </h1>
        </div>
      </div>

      {/* Description + meta row */}
      <div className="flex flex-col md:flex-row md:items-start gap-6 mb-10">
        <p className="text-gray-600 leading-relaxed flex-1 text-base">
          {neighborhood.description}
        </p>
        <div className="shrink-0 flex items-center gap-2 text-sm text-green-700 font-semibold bg-green-50 border border-green-200 px-4 py-2 rounded-xl">
          <MapPin size={15} aria-hidden="true" />
          {neighborhoodEvents.length} event
          {neighborhoodEvents.length !== 1 ? "s" : ""} happening here
        </div>
      </div>

      {/* Event list */}
      {neighborhoodEvents.length === 0 ? (
        <EmptyState message="No events in this neighborhood right now. Check back soon!" />
      ) : (
        <div className="flex flex-col gap-4">
          {neighborhoodEvents.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              bookmarked={bookmarkedEvents?.has(event.id)}
              onToggleBookmark={toggleBookmark}
              liked={likedEvents?.has(event.id)}
              likeCount={getLikeCount?.(event)}
              onToggleLike={toggleLike}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function Neighborhoods() {
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    bookmarkedEvents,
    toggleBookmark,
    likedEvents,
    toggleLike,
    getLikeCount,
    createdSpaces,
    deletedStaticSpaceIds,
  } = useUser();
  const { events: allEvents } = useEvents();
  const { spaces: dbSpaces } = useSpaces();
  const selectedId = searchParams.get("id");

  // Merge spaces from all sources, drop hidden + deleted-static IDs, dedupe.
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

  const selected = selectedId
    ? neighborhoods.find((n) => n.id === selectedId)
    : null;

  function handleSelect(id) {
    setSearchParams({ id });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const [mapSelectedNeighborhood, setMapSelectedNeighborhood] = useState("");

  function handleBack() {
    setSearchParams({});
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleMapNeighborhoodClick(name) {
    setMapSelectedNeighborhood((prev) => (prev === name ? "" : name));
  }

  // ── Detail view ──
  if (selected) {
    return (
      <main className="max-w-7xl mx-auto px-4 py-8">
        <NeighborhoodDetail
          neighborhood={selected}
          onBack={handleBack}
          allEvents={allEvents}
          bookmarkedEvents={bookmarkedEvents}
          toggleBookmark={toggleBookmark}
          likedEvents={likedEvents}
          toggleLike={toggleLike}
          getLikeCount={getLikeCount}
        />
      </main>
    );
  }

  // ── Grid catalog ──
  return (
    <main className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-10">
        {/* Interactive map */}
        <div className="relative mb-10">
          <NeighborhoodsMap
            events={allEvents}
            spaces={allSpaces}
            selectedNeighborhood={mapSelectedNeighborhood}
            onNeighborhoodClick={handleMapNeighborhoodClick}
            height={600}
          />
          <img
            src={thumbtackImg}
            alt=""
            aria-hidden="true"
            className="absolute -top-6 left-60 w-[80px] pointer-events-none select-none z-10 -rotate-12 scale-x-[-1]"
          />
          <img
            src={thumbtackImg}
            alt=""
            aria-hidden="true"
            className="absolute -top-6 -right-3 w-[80px] pointer-events-none select-none z-10 rotate-12"
          />
        </div>

        {/* Page header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Explore Neighborhoods
          </h1>
          <p className="text-gray-500 mt-1.5 text-base">
            Discover community events in your corner of Greater Seattle Area.
          </p>
        </div>

        {/* Neighborhood grid — 3 per row, only cards with a custom image */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {neighborhoods
            .filter((n) => NEIGHBORHOOD_IMAGES[n.id])
            .map((n) => (
              <NeighborhoodTile
                key={n.id}
                neighborhood={n}
                onClick={handleSelect}
              />
            ))}
        </div>
      </div>
    </main>
  );
}
