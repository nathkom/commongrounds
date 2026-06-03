import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Eye, Heart, Bookmark, Users, ChevronDown, ChevronUp } from "lucide-react";
import { useUser } from "../context/UserContext";
import { fetchHostEvents, fetchHostAnalytics } from "../lib/analytics";
import EventAnalyticsDetail from "../components/EventAnalyticsDetail";

const CATEGORY_COLORS = {
  social: "bg-blue-100 text-blue-700",
  arts: "bg-purple-100 text-purple-700",
  outdoors: "bg-green-100 text-green-700",
  food: "bg-orange-100 text-orange-700",
  sports: "bg-red-100 text-red-700",
  educational: "bg-yellow-100 text-yellow-700",
};

const ICON_COLORS = {
  view: "#97BFFF",
  like: "#FD858A",
  bookmark: "#9FB366",
  attendees: "#5F77A5",
};

function formatDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
}

function StatCard({ icon: Icon, color, label, value }) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-5">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center flex-shrink-0">
          <Icon size={20} style={{ color }} />
        </div>
        <p className="text-sm font-medium text-gray-500">{label}</p>
      </div>
      <p className="text-3xl font-bold text-gray-900 mt-3">{value.toLocaleString()}</p>
    </div>
  );
}

function MetricChip({ icon: Icon, color, value }) {
  return (
    <div className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
      <Icon size={16} style={{ color }} />
      <span>{value.toLocaleString()}</span>
    </div>
  );
}

export default function HostAnalytics() {
  const { user } = useUser();
  const isHost = user?.role === "host" || user?.role === "admin";

  const [events, setEvents] = useState([]);
  const [counts, setCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedIds, setExpandedIds] = useState(() => new Set());

  function toggleExpanded(id) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  useEffect(() => {
    if (!isHost || !user?.id) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    Promise.all([fetchHostEvents(user.id), fetchHostAnalytics(user.id)])
      .then(([ev, ct]) => {
        if (cancelled) return;
        setEvents(ev);
        setCounts(ct);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err.message || "Failed to load analytics.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isHost, user?.id]);

  if (!user || !isHost) {
    return (
      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900">Access denied</h1>
          <p className="text-gray-500 mt-2">You need a host account to view analytics.</p>
          <Link
            to="/"
            className="inline-block mt-5 px-5 py-2 rounded-full bg-[#9FB366] text-white text-sm font-medium hover:opacity-90"
          >
            Back to home
          </Link>
        </div>
      </main>
    );
  }

  const totals = events.reduce(
    (acc, ev) => {
      const c = counts[ev.id] || {};
      acc.view += c.view || 0;
      acc.like += c.like || 0;
      acc.bookmark += c.bookmark || 0;
      acc.attendees += ev.attending_count || 0;
      return acc;
    },
    { view: 0, like: 0, bookmark: 0, attendees: 0 },
  );

  return (
    <main className="max-w-5xl mx-auto px-4 py-8">
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
        <p className="text-gray-500 mt-1">Performance overview for your events.</p>
      </header>

      {loading && (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-8 text-center text-gray-500">
          Loading analytics…
        </div>
      )}

      {!loading && error && (
        <div className="bg-white border border-red-200 rounded-2xl shadow-sm p-6 text-red-700">
          <p className="font-semibold">Couldn't load analytics</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      )}

      {!loading && !error && events.length === 0 && (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-8 text-center">
          <h2 className="text-lg font-semibold text-gray-900">No events yet</h2>
          <p className="text-gray-500 mt-1">Once you create an event, its metrics will appear here.</p>
          <Link
            to="/host"
            className="inline-block mt-5 px-5 py-2 rounded-full bg-[#9FB366] text-white text-sm font-medium hover:opacity-90"
          >
            Go to host tools
          </Link>
        </div>
      )}

      {!loading && !error && events.length > 0 && (
        <>
          <section className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <StatCard icon={Eye} color={ICON_COLORS.view} label="Total Views" value={totals.view} />
            <StatCard icon={Heart} color={ICON_COLORS.like} label="Total Likes" value={totals.like} />
            <StatCard icon={Bookmark} color={ICON_COLORS.bookmark} label="Total Bookmarks" value={totals.bookmark} />
            <StatCard icon={Users} color={ICON_COLORS.attendees} label="Total Attendees" value={totals.attendees} />
          </section>

          <section className="space-y-3">
            {events.map((ev) => {
              const c = counts[ev.id] || {};
              const catClass = CATEGORY_COLORS[ev.category] || "bg-gray-100 text-gray-600";
              const isExpanded = expandedIds.has(ev.id);
              return (
                <article
                  key={ev.id}
                  className="bg-white border border-gray-200 rounded-2xl shadow-sm p-5"
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-base font-semibold text-gray-900 truncate">{ev.title}</h3>
                        {ev.hidden && (
                          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                            Hidden
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-wrap mt-1.5">
                        <span className="text-sm text-gray-500">{formatDate(ev.date)}</span>
                        {ev.category && (
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${catClass}`}>
                            {ev.category}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-4 md:gap-5 flex-wrap">
                      <MetricChip icon={Eye} color={ICON_COLORS.view} value={c.view || 0} />
                      <MetricChip icon={Heart} color={ICON_COLORS.like} value={c.like || 0} />
                      <MetricChip icon={Bookmark} color={ICON_COLORS.bookmark} value={c.bookmark || 0} />
                      <MetricChip icon={Users} color={ICON_COLORS.attendees} value={ev.attending_count || 0} />
                      <button
                        onClick={() => toggleExpanded(ev.id)}
                        className="flex items-center gap-1 rounded-full border border-gray-200 px-3 py-1 text-xs font-medium text-gray-700 hover:border-[#9FB366] hover:text-[#9FB366] transition-colors"
                        aria-expanded={isExpanded}
                        aria-controls={`details-${ev.id}`}
                      >
                        {isExpanded ? "Hide details" : "View details"}
                        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div id={`details-${ev.id}`}>
                      <EventAnalyticsDetail eventId={ev.id} />
                    </div>
                  )}
                </article>
              );
            })}
          </section>
        </>
      )}
    </main>
  );
}
