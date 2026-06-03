import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Bookmark,
  CalendarPlus,
  Share2,
  Download,
  Check,
} from "lucide-react";
import { spaces as staticSpaces } from "../data/spaces";
import paperclipImg from "../../wireframes/Paperclip.png";
import headerBg from "../../wireframes/headerbackground1.png";
import thumbtackImg from "../../wireframes/thumbtack.png";
import EventCard, { useEventActions, googleCalUrl, downloadIcs, CopiedToast } from "../components/EventCard";
import EventGallery from "../components/EventGallery";
import AccessibilityTags from "../components/AccessibilityTags";
import { useUser } from "../context/UserContext";
import { useEvents } from "../hooks/useEvents";
import { trackAnalytic } from "../lib/events";

const CATEGORY_LABELS = {
  social: "Social",
  arts: "Arts & Culture",
  outdoors: "Outdoors",
  food: "Food & Drink",
  sports: "Sports & Fitness",
  educational: "Educational",
};

const COST_LABEL = {
  free: "Free",
  suggested_donation: "Fundraiser",
  paid: "Paid",
};

function getCrowdLabel(level) {
  if (level <= 20) return "Quiet";
  if (level <= 40) return "Light";
  if (level <= 60) return "Moderately busy";
  if (level <= 80) return "Busy";
  return "Very busy";
}

function formatDate(isoDate) {
  if (!isoDate) return "";
  const [year, month, day] = isoDate.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function EventDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    user,
    bookmarkedEvents,
    toggleBookmark,
    attendingEvents,
    markAttending,
    unmarkAttending,
    createdSpaces,
    likedEvents,
    toggleLike,
    getLikeCount,
  } = useUser();
  const { events: allEvents, loading } = useEvents();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  // Track page view once the event is resolved
  useEffect(() => {
    if (id) trackAnalytic(id, "view", user?.id ?? null);
  }, [id]);

  const event = allEvents.find((e) => e.id === id);

  const allSpaces = useMemo(
    () => [...createdSpaces, ...staticSpaces],
    [createdSpaces],
  );
  const linkedSpace = event
    ? allSpaces.find((s) => s.name === event.space_name)
    : null;

  const spaceEvents = useMemo(() => {
    if (!event) return [];
    return allEvents
      .filter((e) => e.space_name === event.space_name && e.id !== event.id)
      .slice(0, 3);
  }, [allEvents, event]);

  const { calOpen, setCalOpen, calRef, copied, handleShare } = useEventActions(event ?? { id: "" });

  const [attendPop, setAttendPop] = useState(false);
  // Local optimistic delta on top of event.attending_count. A DB trigger keeps
  // attending_count in sync with event_attendance, so on next refetch the DB
  // count already reflects this delta — drop it when the count or event id
  // changes (derive-during-render reset to avoid setState-in-effect).
  const [attendDelta, setAttendDelta] = useState(0);
  const dbAttendingCount = event?.attending_count ?? 0;
  const attendResetKey = `${event?.id ?? ""}|${dbAttendingCount}`;
  const [prevResetKey, setPrevResetKey] = useState(attendResetKey);
  if (prevResetKey !== attendResetKey) {
    setPrevResetKey(attendResetKey);
    setAttendDelta(0);
  }

  if (loading) {
    return (
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="h-8 w-24 bg-gray-200 animate-pulse rounded mb-6" />
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1 h-[500px] bg-gray-200 animate-pulse rounded-2xl" />
          <div className="w-full lg:w-80 h-64 bg-gray-200 animate-pulse rounded-2xl" />
        </div>
      </main>
    );
  }

  if (!event) {
    return (
      <main className="max-w-4xl mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Event not found
        </h1>
        <p className="text-gray-500 mb-6">
          That event doesn't exist or may have been removed.
        </p>
        <Link
          to="/events"
          className="inline-flex items-center gap-2 text-green-700 font-semibold hover:underline"
        >
          <ArrowLeft size={16} /> Back to Events
        </Link>
      </main>
    );
  }

  const related = allEvents
    .filter((e) => e.neighborhood === event.neighborhood && e.id !== event.id)
    .slice(0, 3);

  const costLabel =
    event.cost === "suggested_donation"
      ? "Fundraiser"
      : event.cost_amount
        ? `${COST_LABEL[event.cost]} · $${String(event.cost_amount).replace(/^\$/, "")}`
        : COST_LABEL[event.cost];

  const isAttending = attendingEvents.has(event.id);
  const dbCount = event.attending_count || 0;
  const effectiveAttendingCount = Math.max(0, dbCount + attendDelta);
  const isFull =
    !isAttending &&
    event.attending_limit != null &&
    effectiveAttendingCount >= event.attending_limit;

  function handleMarkAttending() {
    if (isFull) return;
    if (!isAttending) {
      markAttending(event.id);
      setAttendDelta((d) => d + 1);
      setAttendPop(true);
      setTimeout(() => setAttendPop(false), 400);
    } else {
      unmarkAttending(event.id);
      setAttendDelta((d) => d - 1);
    }
  }

  return (
    <main className="bg-gray-50 min-h-screen pb-16">
      <CopiedToast visible={copied} />
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
              {/* Title + tags */}
              <div className="p-6 pb-4">
                <div className="flex items-start gap-3 mb-3">
                  <h1 className="flex-1 text-3xl font-bold text-gray-900 leading-tight">
                    {event.title}
                  </h1>
                  <button
                    onClick={() => toggleLike(event.id)}
                    className={`shrink-0 flex items-center gap-1.5 font-semibold transition-colors mt-1 ${
                      likedEvents.has(event.id)
                        ? "text-red-500"
                        : "text-gray-400 hover:text-red-400"
                    }`}
                    aria-label={
                      likedEvents.has(event.id) ? "Unlike event" : "Like event"
                    }
                  >
                    ❤️ <span className="text-base">{getLikeCount(event)}</span>
                  </button>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium px-3 py-1 rounded-full border border-green-300 text-green-700">
                    {costLabel}
                  </span>
                  <span className="text-sm font-medium px-3 py-1 rounded-full border border-green-300 text-green-700">
                    {CATEGORY_LABELS[event.category] ?? event.category}
                  </span>
                  {event.tags?.slice(0, 2).map((tag) => (
                    <span
                      key={tag}
                      className="text-sm font-medium px-3 py-1 rounded-full border border-green-300 text-green-700 capitalize"
                    >
                      {tag.replace(/_/g, " ")}
                    </span>
                  ))}
                </div>
              </div>

              {/* Gallery / hero image */}
              <EventGallery
                images={
                  event.gallery_images?.length
                    ? event.gallery_images
                    : [{ url: event.image_url, alt: event.title }]
                }
                title={event.title}
              />

              {/* Date / time / location */}
              <div className="px-6 pt-3 pb-0 flex flex-col gap-1.5">
                <div className="flex items-center gap-3 text-gray-700">
                  <Calendar
                    size={18}
                    className="text-[#97BFFF] shrink-0"
                    aria-hidden="true"
                  />
                  <span className="font-medium">
                    {formatDate(event.date)}&nbsp;&nbsp;{event.time}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-gray-700">
                  <MapPin
                    size={18}
                    className="text-[#FD858A] shrink-0"
                    aria-hidden="true"
                  />
                  {linkedSpace ? (
                    <Link
                      to={`/spaces/${linkedSpace.id}`}
                      className="font-medium hover:text-[#9FB366] transition-colors"
                    >
                      {event.space_name}, Seattle
                    </Link>
                  ) : (
                    <span className="font-medium">
                      {event.space_name}, Seattle
                    </span>
                  )}
                </div>
              </div>

              {/* Description */}
              <div className="px-6 pt-3 pb-5">
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {event.description}
                </p>
              </div>
            </div>
          </div>

          {/* RIGHT — sticky column */}
          <div className="w-full lg:w-80 shrink-0 flex flex-col gap-4 lg:sticky lg:top-24 pt-6">
            {/* What to Expect card */}
            <div className="relative">
              <img
                src={paperclipImg}
                alt=""
                aria-hidden="true"
                className="absolute -top-5 -right-5 w-14 z-10 pointer-events-none select-none"
              />
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
                {/* What to expect header */}
                <div className="bg-[#5F77A5] px-6 py-5 border-b border-[#4d6592]">
                  <h2 className="text-xl font-bold text-white">
                    What to expect
                  </h2>
                </div>

                {/* Key-value rows */}
                <div className="px-6 py-5 flex flex-col gap-3 flex-1">
                  {event.noise_level && (
                    <p className="text-sm text-gray-700">
                      <span className="font-semibold">Noise level: </span>
                      {event.noise_level}
                    </p>
                  )}
                  {event.accessibility?.length > 0 && (
                    <div>
                      <p className="text-sm font-semibold text-gray-700 mb-1.5">
                        Accessibility:
                      </p>
                      <AccessibilityTags tags={event.accessibility} />
                    </div>
                  )}
                  {event.space_format && (
                    <p className="text-sm text-gray-700">
                      <span className="font-semibold">Space format: </span>
                      {event.space_format}
                    </p>
                  )}

                  {/* Crowd level */}
                  {event.crowd_level != null && (
                    <div className="mt-3">
                      <h3 className="font-bold text-gray-900 mb-3">
                        Crowd Level (estimated):
                      </h3>
                      <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-green-500 rounded-full"
                          style={{ width: `${event.crowd_level}%` }}
                        />
                      </div>
                      <p className="text-sm font-semibold text-gray-700 mt-2">
                        {getCrowdLabel(event.crowd_level)}
                      </p>
                    </div>
                  )}
                </div>

                {/* Action buttons */}
                <div className="px-5 py-4 border-t border-gray-100 flex items-center gap-2">
                  <button
                    onClick={() => toggleBookmark(event.id)}
                    className={`flex items-center justify-center gap-1.5 flex-1 border font-semibold py-2.5 rounded-xl text-sm transition-colors ${
                      bookmarkedEvents.has(event.id)
                        ? "border-[#9FB366] bg-green-50 text-[#9FB366]"
                        : "border-gray-200 hover:border-[#9FB366] hover:text-[#9FB366] text-gray-700"
                    }`}
                    aria-label={
                      bookmarkedEvents.has(event.id)
                        ? "Remove bookmark"
                        : "Save this event"
                    }
                  >
                    <Bookmark size={15} />
                    {bookmarkedEvents.has(event.id) ? "Saved" : "Save"}
                  </button>
                  <div ref={calRef} className="relative flex-1">
                    <button
                      type="button"
                      onClick={(e) => { e.preventDefault(); setCalOpen((o) => !o); }}
                      className={`w-full flex items-center justify-center gap-1.5 border font-semibold py-2.5 rounded-xl text-sm transition-colors ${
                        calOpen
                          ? "border-[#9FB366] bg-green-50 text-[#9FB366]"
                          : "border-gray-200 hover:border-[#9FB366] hover:text-[#9FB366] text-gray-700"
                      }`}
                      aria-label="Add to calendar"
                    >
                      <CalendarPlus size={15} />
                      Calendar
                    </button>
                    {calOpen && (
                      <div className="absolute bottom-full left-0 mb-1.5 w-48 bg-white rounded-xl border border-gray-200 shadow-lg z-50 overflow-hidden">
                        <p className="px-3.5 pt-2.5 pb-1 text-[11px] font-semibold text-gray-400 uppercase tracking-wide">
                          Add to calendar
                        </p>
                        <button
                          type="button"
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); window.open(googleCalUrl(event), "_blank", "noopener,noreferrer"); setCalOpen(false); }}
                          className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <img
                            src="https://www.google.com/favicon.ico"
                            alt=""
                            className="w-3.5 h-3.5 rounded-sm"
                            onError={(e) => { e.target.style.display = "none"; }}
                          />
                          Google Calendar
                        </button>
                        <button
                          type="button"
                          onClick={(e) => { e.preventDefault(); downloadIcs(event); setCalOpen(false); }}
                          className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <Download size={13} className="text-gray-400 shrink-0" />
                          Apple Calendar
                        </button>
                        <button
                          type="button"
                          onClick={(e) => { e.preventDefault(); downloadIcs(event); setCalOpen(false); }}
                          className="w-full flex items-center gap-2.5 px-3.5 py-2 pb-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <Download size={13} className="text-gray-400 shrink-0" />
                          Outlook
                        </button>
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={handleShare}
                    className={`border p-2.5 rounded-xl transition-colors ${
                      copied
                        ? "border-[#9FB366] bg-green-50 text-[#9FB366]"
                        : "border-gray-200 hover:border-[#9FB366] hover:text-[#9FB366] text-gray-700"
                    }`}
                    aria-label="Share this event"
                  >
                    {copied ? <Check size={15} /> : <Share2 size={15} />}
                  </button>
                </div>
              </div>
            </div>

            {/* About the space card */}
            {linkedSpace && (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="bg-[#5F77A5] px-6 py-5 border-b border-[#4d6592]">
                  <h2 className="text-xl font-bold text-white">
                    About the space
                  </h2>
                </div>
                <div className="px-6 py-5 flex flex-col gap-3">
                  <p className="font-semibold text-gray-900">
                    {linkedSpace.name}
                  </p>
                  {linkedSpace.space_format && (
                    <p className="text-sm text-gray-600">
                      {linkedSpace.space_format}
                    </p>
                  )}
                  {linkedSpace.hours && (
                    <p className="text-sm text-gray-500">{linkedSpace.hours}</p>
                  )}
                  <Link
                    to={`/spaces/${linkedSpace.id}`}
                    className="mt-1 w-full flex items-center justify-center bg-[#9FB366] hover:bg-[#8a9c57] text-white font-semibold py-2.5 rounded-xl text-sm transition-colors"
                  >
                    See the space
                  </Link>
                </div>
              </div>
            )}

            {/* Attending card */}
            <div
              className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${isFull ? "border-gray-300" : "border-gray-200"}`}
            >
              <div
                className={`px-6 py-5 border-b ${isFull ? "bg-gray-400 border-gray-500" : "bg-[#5F77A5] border-[#4d6592]"}`}
              >
                <h2 className="text-xl font-bold text-white">
                  {isFull ? "Attendance Full" : "Want to attend?"}
                </h2>
              </div>
              <div className="px-6 py-5 flex flex-col gap-4">
                {/* Capacity bar — only when show_attendance is on and a limit is set */}
                {event.attending_limit && event.show_attendance !== false ? (
                  <div>
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-gray-700 font-semibold">
                        {effectiveAttendingCount} attending
                      </span>
                      <span className="text-gray-400">
                        {event.attending_limit} spots total
                      </span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${isFull ? "bg-gray-400" : "bg-[#5F77A5]"}`}
                        style={{
                          width: `${Math.min(100, (effectiveAttendingCount / event.attending_limit) * 100)}%`,
                        }}
                      />
                    </div>
                    <p className="text-xs text-gray-400 mt-1.5">
                      {isFull
                        ? "No spots remaining"
                        : `${Math.max(0, event.attending_limit - effectiveAttendingCount)} spots remaining`}
                    </p>
                  </div>
                ) : null}

                {/* Attend button */}
                {user ? (
                  <button
                    onClick={handleMarkAttending}
                    disabled={isFull}
                    className={`w-full font-semibold py-3 rounded-xl text-sm transition-all duration-200 ${attendPop ? "scale-95" : ""} ${
                      isFull
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200"
                        : isAttending
                          ? "bg-[#5F77A5] text-white"
                          : "bg-[#9FB366] hover:bg-[#8a9c57] text-white"
                    }`}
                  >
                    {isFull
                      ? "Attendance is full"
                      : isAttending
                        ? "✓ You're Attending!"
                        : "Mark as Attending"}
                  </button>
                ) : (
                  <Link
                    to="/signin"
                    className="w-full flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 rounded-xl text-sm transition-colors"
                  >
                    Sign in to attend
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* More events at this space */}
        {spaceEvents.length > 0 && (
          <section className="mt-10" aria-labelledby="space-events-heading">
            <div className="flex items-center justify-between mb-5">
              <div
                className="inline-flex items-center px-8 py-4 rounded-xl overflow-hidden"
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
                  More events at {event.space_name}
                </h2>
              </div>
              {linkedSpace && (
                <Link
                  to={`/spaces/${linkedSpace.id}`}
                  className="text-sm text-[#9FB366] font-semibold hover:underline"
                >
                  View space →
                </Link>
              )}
            </div>
            <div className="flex flex-col gap-4">
              {spaceEvents.map((e, i) => (
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

        {/* Related events */}
        {related.length > 0 && (
          <section className="mt-14" aria-labelledby="related-heading">
            <div
              className="inline-flex items-center px-8 py-4 rounded-xl overflow-hidden mb-5"
              style={{
                backgroundImage: `url(${headerBg})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            >
              <h2
                id="related-heading"
                className="text-2xl font-bold text-black"
              >
                More events in {event.neighborhood}
              </h2>
            </div>
            <div className="flex flex-col gap-4">
              {related.map((e) => (
                <EventCard
                  key={e.id}
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
