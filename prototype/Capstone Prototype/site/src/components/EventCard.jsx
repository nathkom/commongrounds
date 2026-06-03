import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { MapPin, Calendar, Clock, Bookmark, CalendarPlus, Share2, Check, Download } from "lucide-react";
import thumbtackImg from "../../wireframes/thumbtack.png";

const COST_BADGE = {
  free: "bg-green-100 text-green-700",
  suggested_donation: "bg-yellow-100 text-yellow-700",
  paid: "bg-gray-100 text-gray-600",
};

const COST_LABEL = {
  free: "Free",
  suggested_donation: "Fundraiser",
  paid: "Paid",
};

function formatDate(dateStr) {
  if (!dateStr) return "";
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// ── Calendar helpers ──────────────────────────────────────────────────────────

function parseTo24(t) {
  const m = t.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!m) return null;
  let h = +m[1];
  const min = +m[2];
  const mer = m[3].toUpperCase();
  if (mer === "PM" && h !== 12) h += 12;
  if (mer === "AM" && h === 12) h = 0;
  return { h, min };
}

function toIcsDate(dateStr, t24) {
  const [y, mo, d] = dateStr.split("-");
  return `${y}${mo}${d}T${String(t24.h).padStart(2, "0")}${String(t24.min).padStart(2, "0")}00`;
}

function getEventTimes(dateStr, timeStr) {
  if (!dateStr || !timeStr || timeStr === "TBD") return null;
  const parts = timeStr.split(/\s*[–—-]\s*/);
  const start = parseTo24(parts[0]);
  if (!start) return null;
  const end = parts[1] ? parseTo24(parts[1]) : { h: start.h + 1, min: start.min };
  return {
    start: toIcsDate(dateStr, start),
    end: toIcsDate(dateStr, end || { h: start.h + 1, min: start.min }),
  };
}

export function googleCalUrl(event) {
  const times = getEventTimes(event.date, event.time);
  const base = "https://calendar.google.com/calendar/render?action=TEMPLATE";
  const title = encodeURIComponent(event.title || "Event");
  const location = encodeURIComponent(event.space_name || "");
  if (!times) {
    const d = (event.date || "").replace(/-/g, "");
    return `${base}&text=${title}&dates=${d}/${d}&location=${location}`;
  }
  return `${base}&text=${title}&dates=${times.start}/${times.end}&location=${location}`;
}

function buildIcs(event) {
  const times = getEventTimes(event.date, event.time);
  const d = (event.date || "").replace(/-/g, "");
  const start = times ? times.start : `${d}T000000`;
  const end = times ? times.end : `${d}T235900`;
  const uid = `${event.id}@thirdspace`;
  const now = new Date().toISOString().replace(/[-:.]/g, "").slice(0, 15) + "Z";
  const esc = (s) => (s || "").replace(/[,;\\]/g, "\\$&").replace(/\n/g, "\\n");
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//ThirdSpace//Event//EN",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${now}`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${esc(event.title)}`,
    `LOCATION:${esc(event.space_name)}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

export function downloadIcs(event) {
  const blob = new Blob([buildIcs(event)], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${(event.title || "event").replace(/\s+/g, "-").toLowerCase()}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ── Shared action hook ────────────────────────────────────────────────────────

export function useEventActions(event) {
  const [calOpen, setCalOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const calRef = useRef(null);

  useEffect(() => {
    if (!calOpen) return;
    function handleOutside(e) {
      if (calRef.current && !calRef.current.contains(e.target)) {
        setCalOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [calOpen]);

  async function handleShare(e) {
    e.preventDefault();
    const url = `${window.location.origin}${import.meta.env.BASE_URL}events/${event.id}`;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const el = document.createElement("textarea");
      el.value = url;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return { calOpen, setCalOpen, calRef, copied, handleShare };
}

// ── Toast ─────────────────────────────────────────────────────────────────────

export function CopiedToast({ visible }) {
  return (
    <div
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] px-4 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-full shadow-lg pointer-events-none transition-all duration-300 ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
      }`}
    >
      Link copied to clipboard
    </div>
  );
}

// ── Calendar dropdown ─────────────────────────────────────────────────────────

export function CalendarDropdown({ event, calRef, calOpen, setCalOpen }) {
  return (
    <div ref={calRef} className="relative">
      <button
        type="button"
        onClick={(e) => { e.preventDefault(); setCalOpen((o) => !o); }}
        className={`p-2.5 flex items-center justify-center rounded-lg border transition-colors ${
          calOpen
            ? "border-[#9FB366] text-[#9FB366] bg-green-50"
            : "border-gray-400 hover:border-[#9FB366] hover:text-[#9FB366] text-gray-600"
        }`}
        aria-label="Add to calendar"
      >
        <CalendarPlus size={16} />
      </button>

      {calOpen && (
        <div className="absolute bottom-full right-0 mb-1.5 w-48 bg-white rounded-xl border border-gray-200 shadow-lg z-50 overflow-hidden">
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
  );
}

// ── Feed card (horizontal, h-220) — used on Home ─────────────────────────────
function FeedCard({ event, costClass, costLabel, liked, likeCount, onToggleLike, bookmarked, onToggleBookmark }) {
  const { calOpen, setCalOpen, calRef, copied, handleShare } = useEventActions(event);

  return (
    <>
    <div className="relative">
      <Link
        to={`/events/${event.id}`}
        className="block bg-[#F5F0E8] rounded-2xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow group h-[220px]"
        aria-label={`View details for ${event.title}`}
      >
        <div className="flex h-full">
          {/* Image */}
          <div className="w-52 shrink-0 overflow-hidden">
            <img
              src={event.image_url}
              alt={event.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />
          </div>

          {/* Content */}
          <div className="flex-1 p-4 flex flex-col min-w-0 overflow-hidden gap-1.5">

            {/* Title */}
            <h3 className="text-lg font-bold text-gray-900 leading-tight line-clamp-1 group-hover:text-[#9FB366] transition-colors">
              {event.title}
            </h3>

            {/* Meta — single row */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-gray-500">
              {event.date && (
                <span className="flex items-center gap-1">
                  <Calendar size={11} className="text-[#97BFFF] shrink-0" />
                  {formatDate(event.date)}
                </span>
              )}
              {event.time && (
                <span className="flex items-center gap-1">
                  <Clock size={11} className="text-[#FFA86C] shrink-0" />
                  {event.time}
                </span>
              )}
              {event.space_name && (
                <span className="flex items-center gap-1 truncate">
                  <MapPin size={11} className="text-[#FD858A] shrink-0" />
                  <span className="truncate">{event.space_name}, Seattle</span>
                </span>
              )}
            </div>

            {/* Description */}
            {event.description && (
              <p className="text-sm text-gray-600 leading-relaxed line-clamp-3">
                {event.description}
              </p>
            )}

            {/* Tags + action buttons — pushed to bottom */}
            <div className="flex items-center justify-between mt-auto gap-2">
              <div className="flex flex-wrap gap-1 min-w-0 overflow-hidden">
                <span className={`text-sm px-3 py-1 rounded-full font-semibold ${costClass}`}>
                  {costLabel}
                </span>
                {event.tags?.slice(0, 2).map((tag) => (
                  <span
                    key={tag}
                    className="text-sm px-3 py-1 rounded-full border border-green-300 text-green-700 capitalize whitespace-nowrap"
                  >
                    {tag.replace(/_/g, " ")}
                  </span>
                ))}
              </div>

              {/* Action buttons — like inline with the rest */}
              <div className="flex gap-1 shrink-0" onClick={(e) => e.preventDefault()}>
                <button
                  onClick={(e) => { e.preventDefault(); onToggleLike?.(event.id); }}
                  className={`p-2.5 rounded-lg border transition-colors flex items-center gap-1 ${
                    liked
                      ? "border-red-300 text-red-500 bg-red-50"
                      : "border-gray-400 hover:border-red-400 hover:text-red-500 text-gray-600"
                  }`}
                  aria-label={liked ? "Unlike event" : "Like event"}
                >
                  ❤️ <span className="text-xs">{likeCount ?? 0}</span>
                </button>

                <button
                  onClick={() => onToggleBookmark?.(event.id)}
                  className={`p-2.5 rounded-lg border transition-colors ${
                    bookmarked
                      ? "border-[#9FB366] text-[#9FB366] bg-green-50"
                      : "border-gray-400 hover:border-[#9FB366] hover:text-[#9FB366] text-gray-600"
                  }`}
                  aria-label={bookmarked ? "Remove bookmark" : "Bookmark event"}
                >
                  <Bookmark size={16} />
                </button>

                <CalendarDropdown event={event} calRef={calRef} calOpen={calOpen} setCalOpen={setCalOpen} />

                <button
                  onClick={handleShare}
                  className={`p-2.5 rounded-lg border transition-colors ${
                    copied
                      ? "border-[#9FB366] text-[#9FB366] bg-green-50"
                      : "border-gray-400 hover:border-[#9FB366] hover:text-[#9FB366] text-gray-600"
                  }`}
                  aria-label={copied ? "Link copied!" : "Share event"}
                >
                  {copied ? <Check size={16} /> : <Share2 size={16} />}
                </button>
              </div>
            </div>
          </div>
        </div>
      </Link>
      {/* Thumbtack decoration */}
      <img
        src={thumbtackImg}
        alt=""
        aria-hidden="true"
        className="absolute -top-6 -right-3 w-[80px] pointer-events-none select-none z-10 rotate-12"
      />
    </div>
    <CopiedToast visible={copied} />
  </>
  );
}

// ── Grid card (vertical) — used on Events page ────────────────────────────────
function GridCard({ event, costClass, costLabel, liked, likeCount, onToggleLike, bookmarked, onToggleBookmark }) {
  const { calOpen, setCalOpen, calRef, copied, handleShare } = useEventActions(event);

  return (
    <>
    <div className="relative">
      <Link
        to={`/events/${event.id}`}
        className="group flex flex-col bg-[#F5F0E8] rounded-2xl border border-gray-200 hover:border-green-300 hover:shadow-lg transition-all overflow-hidden"
        aria-label={`View details for ${event.title}`}
      >
        {/* Image */}
        <div className="w-full h-44 overflow-hidden bg-green-50 shrink-0">
          <img
            src={event.image_url}
            alt={event.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        </div>

        {/* Content */}
        <div className="flex flex-col gap-1.5 px-3 pt-2.5 pb-3 flex-1">
          <h3 className="font-bold text-gray-900 text-base leading-snug group-hover:text-[#9FB366] transition-colors line-clamp-2 w-full">
            {event.title}
          </h3>

          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <Calendar size={12} className="text-[#97BFFF]" aria-hidden="true" />
            <span>{formatDate(event.date)}</span>
            <span className="mx-0.5">·</span>
            <Clock size={12} className="text-[#FFA86C]" aria-hidden="true" />
            <span>{event.time}</span>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <MapPin size={12} className="text-[#FD858A]" aria-hidden="true" />
            <span className="truncate">
              {event.space_name} · {event.neighborhood}
            </span>
          </div>

          <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed mt-0.5">
            {event.description}
          </p>

          <div className="flex items-center justify-between mt-auto pt-2 gap-2">
            <div className="flex flex-wrap gap-1 min-w-0 overflow-hidden">
              {event.tags?.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="text-sm bg-green-50 text-green-700 px-3 py-1 rounded-full capitalize font-medium whitespace-nowrap"
                >
                  {tag.replace(/_/g, " ")}
                </span>
              ))}
            </div>
            {/* Action buttons — like inline with the rest */}
            <div className="flex gap-1 shrink-0" onClick={(e) => e.preventDefault()}>
              <button
                onClick={(e) => { e.preventDefault(); onToggleLike?.(event.id); }}
                className={`p-2.5 rounded-lg border transition-colors flex items-center gap-1 ${
                  liked
                    ? "border-red-300 text-red-500 bg-red-50"
                    : "border-gray-400 hover:border-red-400 hover:text-red-500 text-gray-600"
                }`}
                aria-label={liked ? "Unlike event" : "Like event"}
              >
                ❤️ <span className="text-xs">{likeCount ?? 0}</span>
              </button>

              <button
                onClick={() => onToggleBookmark?.(event.id)}
                className={`p-2.5 rounded-lg border transition-colors ${
                  bookmarked
                    ? "border-[#9FB366] text-[#9FB366] bg-green-50"
                    : "border-gray-400 hover:border-[#9FB366] hover:text-[#9FB366] text-gray-600"
                }`}
                aria-label={bookmarked ? "Remove bookmark" : "Bookmark event"}
              >
                <Bookmark size={16} />
              </button>

              <CalendarDropdown event={event} calRef={calRef} calOpen={calOpen} setCalOpen={setCalOpen} />

              <button
                onClick={handleShare}
                className={`p-2.5 rounded-lg border transition-colors ${
                  copied
                    ? "border-[#9FB366] text-[#9FB366] bg-green-50"
                    : "border-gray-400 hover:border-[#9FB366] hover:text-[#9FB366] text-gray-600"
                }`}
                aria-label={copied ? "Link copied!" : "Share event"}
              >
                {copied ? <Check size={16} /> : <Share2 size={16} />}
              </button>
            </div>
          </div>
        </div>
      </Link>
      {/* Thumbtack decoration */}
      <img
        src={thumbtackImg}
        alt=""
        aria-hidden="true"
        className="absolute -top-6 -right-3 w-[80px] pointer-events-none select-none z-10 rotate-12"
      />
    </div>
    <CopiedToast visible={copied} />
    </>
  );
}

// ── Exported component ────────────────────────────────────────────────────────
export default function EventCard({
  event,
  variant = "feed",
  liked,
  likeCount,
  onToggleLike,
  bookmarked,
  onToggleBookmark,
}) {
  const costClass = COST_BADGE[event.cost] ?? COST_BADGE.paid;
  const costLabel = event.cost === "suggested_donation"
    ? "Fundraiser"
    : event.cost_amount
      ? `${COST_LABEL[event.cost]} · $${String(event.cost_amount).replace(/^\$/, "")}`
      : COST_LABEL[event.cost];

  if (variant === "grid") {
    return (
      <GridCard
        event={event}
        costClass={costClass}
        costLabel={costLabel}
        liked={liked}
        likeCount={likeCount}
        onToggleLike={onToggleLike}
        bookmarked={bookmarked}
        onToggleBookmark={onToggleBookmark}
      />
    );
  }

  return (
    <FeedCard
      event={event}
      costClass={costClass}
      costLabel={costLabel}
      liked={liked}
      likeCount={likeCount}
      onToggleLike={onToggleLike}
      bookmarked={bookmarked}
      onToggleBookmark={onToggleBookmark}
    />
  );
}
