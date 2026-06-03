import { useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, MapPin, Clock, Globe, Share2 } from "lucide-react";
import { spaces as staticSpaces } from "../data/spaces";
import EventCard from "../components/EventCard";
import EventGallery from "../components/EventGallery";
import AccessibilityTags from "../components/AccessibilityTags";
import { useUser } from "../context/UserContext";
import { useEvents } from "../hooks/useEvents";
import headerBg from "../../wireframes/headerbackground1.png";
import thumbtackImg from "../../wireframes/thumbtack.png";

function CapacityBar({ capacity }) {
  if (!capacity) return null;
  const max = 1000;
  const pct = Math.min(100, Math.round((capacity / max) * 100));
  const label =
    capacity <= 30
      ? "Intimate"
      : capacity <= 80
        ? "Small–medium"
        : capacity <= 200
          ? "Medium"
          : capacity <= 500
            ? "Large"
            : "Very large";
  return (
    <div>
      <p className="text-sm text-gray-700 mb-1">
        <span className="font-semibold">Capacity: </span>
        {capacity} people · {label}
      </p>
      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-[#5F77A5] rounded-full"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default function SpaceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    createdSpaces,
    bookmarkedEvents,
    toggleBookmark,
    likedEvents,
    toggleLike,
    getLikeCount,
  } = useUser();
  const { events: allEvents } = useEvents();

  const allSpaces = useMemo(
    () => [...createdSpaces, ...staticSpaces],
    [createdSpaces],
  );
  const space = allSpaces.find((s) => s.id === id);

  const spaceEvents = useMemo(() => {
    if (!space) return [];
    return allEvents.filter((e) => e.space_name === space.name);
  }, [allEvents, space]);

  const displayEvents = useMemo(() => spaceEvents.slice(0, 3), [spaceEvents]);

  if (!space) {
    return (
      <main className="max-w-4xl mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Space not found
        </h1>
        <p className="text-gray-500 mb-6">
          That space doesn't exist or may have been removed.
        </p>
        <Link
          to="/events"
          className="inline-flex items-center gap-2 text-green-700 font-semibold hover:underline"
        >
          <ArrowLeft size={16} /> Browse Events
        </Link>
      </main>
    );
  }

  const galleryImages = space.gallery_images?.length
    ? space.gallery_images
    : space.image_url
      ? [{ url: space.image_url, alt: space.name }]
      : [];

  return (
    <main className="bg-gray-50 min-h-screen pb-16">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-[#9FB366] transition-colors mb-6"
          aria-label="Go back"
        >
          <ArrowLeft size={16} />
          Back
        </button>

        {/* Two-column layout */}
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          {/* LEFT — main content card */}
          <div className="relative flex-1 min-w-0 pt-6">
            <img
              src={thumbtackImg}
              alt=""
              aria-hidden="true"
              className="absolute top-1 -left-2 w-[55px] pointer-events-none select-none z-10 -rotate-12 scale-x-[-1]"
            />
            <img
              src={thumbtackImg}
              alt=""
              aria-hidden="true"
              className="absolute top-1 -right-2 w-[55px] pointer-events-none select-none z-10 rotate-12"
            />
            <div className="bg-[#F5F0E8] rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              {/* Title + badges */}
              <div className="p-6 pb-4">
                <h1 className="text-3xl font-bold text-gray-900 leading-tight mb-3">
                  {space.name}
                </h1>
                <div className="flex flex-wrap gap-2">
                  {space.category && (
                    <span className="text-sm font-medium px-3 py-1 rounded-full border border-green-300 text-green-700">
                      {space.category}
                    </span>
                  )}
                  {space.neighborhood && (
                    <span className="text-sm font-medium px-3 py-1 rounded-full border border-green-300 text-green-700">
                      {space.neighborhood}
                    </span>
                  )}
                </div>
              </div>

              {/* Gallery */}
              <EventGallery images={galleryImages} title={space.name} />

              {/* Address */}
              {space.address && (
                <div className="px-6 pt-5 flex items-center gap-3 text-gray-700">
                  <MapPin
                    size={18}
                    className="text-[#FD858A] shrink-0"
                    aria-hidden="true"
                  />
                  <span className="font-medium">{space.address}</span>
                </div>
              )}

              {/* Hours */}
              {space.hours && (
                <div className="px-6 pt-2 flex items-center gap-3 text-gray-700">
                  <Clock
                    size={18}
                    className="text-[#97BFFF] shrink-0"
                    aria-hidden="true"
                  />
                  <span className="font-medium">{space.hours}</span>
                </div>
              )}

              {/* Description */}
              <div className="px-6 py-5">
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {space.description}
                </p>
              </div>
            </div>
          </div>

          {/* RIGHT — sticky sidebar */}
          <div className="w-full lg:w-80 shrink-0 flex flex-col gap-4 lg:sticky lg:top-24 pt-6">
            {/* About this Space card */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="bg-[#5F77A5] px-6 py-5 border-b border-[#4d6592]">
                <h2 className="text-xl font-bold text-white">
                  About this Space
                </h2>
              </div>
              <div className="px-6 py-5 flex flex-col gap-3">
                {space.noise_level && (
                  <p className="text-sm text-gray-700">
                    <span className="font-semibold">Noise level: </span>
                    {space.noise_level}
                  </p>
                )}
                {space.space_format && (
                  <p className="text-sm text-gray-700">
                    <span className="font-semibold">Format: </span>
                    {space.space_format}
                  </p>
                )}
                {space.capacity && <CapacityBar capacity={space.capacity} />}
                {space.amenities?.length > 0 && (
                  <div>
                    <p className="text-sm font-semibold text-gray-700 mb-1.5">
                      Amenities:
                    </p>
                    <AccessibilityTags tags={space.amenities} />
                  </div>
                )}
              </div>
              <div className="px-5 py-4 border-t border-gray-100 flex items-center gap-2">
                {space.website && (
                  <a
                    href={`https://${space.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-1.5 flex-1 border border-gray-200 hover:border-[#9FB366] hover:text-[#9FB366] text-gray-700 font-semibold py-2.5 rounded-xl text-sm transition-colors"
                  >
                    <Globe size={15} />
                    Visit Website
                  </a>
                )}
                <button
                  className="border border-gray-200 hover:border-[#9FB366] hover:text-[#9FB366] text-gray-700 p-2.5 rounded-xl transition-colors"
                  aria-label="Share this space"
                >
                  <Share2 size={15} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Events at this space section */}
        {displayEvents.length > 0 && (
          <section className="mt-14" aria-labelledby="space-events-heading">
            <div
              className="inline-flex items-center px-8 py-4 rounded-xl overflow-hidden mb-5"
              style={{
                backgroundImage: `url(${headerBg})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            >
              <h2
                id="space-events-heading"
                className="text-2xl font-bold text-black"
              >
                Events at {space.name}
              </h2>
            </div>
            <div className="flex flex-col gap-4">
              {displayEvents.map((e, i) => (
                <EventCard
                  key={`${e.id}-${i}`}
                  event={e}
                  bookmarked={bookmarkedEvents.has(e.id)}
                  onToggleBookmark={toggleBookmark}
                  liked={likedEvents.has(e.id)}
                  likeCount={getLikeCount(e)}
                  onToggleLike={toggleLike}
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
