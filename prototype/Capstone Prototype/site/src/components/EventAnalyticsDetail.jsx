import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { fetchEventTimeSeries } from "../lib/analytics";

const METRIC_OPTIONS = [
  { value: "totalVisits", label: "Total visits over time", chart: "line" },
  { value: "visits", label: "Visits per day", chart: "bar" },
  { value: "likes", label: "Likes per day", chart: "bar" },
  { value: "bookmarks", label: "Bookmarks per day", chart: "bar" },
  { value: "attendees", label: "Attendees per day", chart: "bar" },
];

const RANGES = [
  { value: "7d", label: "7d", days: 7 },
  { value: "30d", label: "30d", days: 30 },
  { value: "90d", label: "90d", days: 90 },
  { value: "all", label: "All", days: null },
];

const METRIC_COLOR = {
  totalVisits: "#97BFFF",
  visits: "#97BFFF",
  likes: "#FD858A",
  bookmarks: "#9FB366",
  attendees: "#5F77A5",
};

const ACTION_FOR_METRIC = {
  totalVisits: "view",
  visits: "view",
  likes: "like",
  bookmarks: "bookmark",
};

function ymd(date) {
  return date.toISOString().slice(0, 10);
}

function shortLabel(dateStr) {
  const d = new Date(`${dateStr}T00:00:00Z`);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
}

function getRangeStart(range) {
  const r = RANGES.find((x) => x.value === range);
  if (!r || r.days == null) return null;
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() - (r.days - 1));
  return d;
}

function buildSeries({ metric, range, actions, attendance }) {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  let start = getRangeStart(range);
  if (!start) {
    // "all" — find earliest timestamp across both sources, fall back to 30d
    const allDates = [
      ...actions.map((a) => a.created_at),
      ...attendance.map((a) => a.created_at),
    ];
    if (allDates.length) {
      const earliest = allDates.reduce((m, d) => (d < m ? d : m));
      start = new Date(`${earliest.slice(0, 10)}T00:00:00Z`);
    } else {
      start = new Date(today);
      start.setUTCDate(today.getUTCDate() - 29);
    }
  }

  const days = [];
  const cursor = new Date(start);
  while (cursor <= today) {
    days.push(ymd(cursor));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  const counts = Object.fromEntries(days.map((d) => [d, 0]));

  if (metric === "attendees") {
    for (const row of attendance) {
      const key = row.created_at.slice(0, 10);
      if (counts[key] != null) counts[key] += 1;
    }
  } else {
    const action = ACTION_FOR_METRIC[metric];
    for (const row of actions) {
      if (row.action !== action) continue;
      const key = row.created_at.slice(0, 10);
      if (counts[key] != null) counts[key] += 1;
    }
  }

  if (metric === "totalVisits") {
    let running = 0;
    return days.map((d) => {
      running += counts[d];
      return { date: d, label: shortLabel(d), value: running };
    });
  }

  return days.map((d) => ({ date: d, label: shortLabel(d), value: counts[d] }));
}

function ChartTooltip({ active, payload, metricLabel }) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;
  return (
    <div className="rounded-md border border-gray-200 bg-white px-2.5 py-1.5 text-xs shadow">
      <p className="font-semibold text-gray-900">{point.label}</p>
      <p className="text-gray-600">
        {metricLabel}: <span className="font-medium">{point.value.toLocaleString()}</span>
      </p>
    </div>
  );
}

export default function EventAnalyticsDetail({ eventId }) {
  const [metric, setMetric] = useState("totalVisits");
  const [range, setRange] = useState("30d");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actions, setActions] = useState([]);
  const [attendance, setAttendance] = useState([]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    const start = getRangeStart(range);
    const sinceIso = start ? start.toISOString() : null;

    fetchEventTimeSeries(eventId, sinceIso)
      .then((res) => {
        if (cancelled) return;
        setActions(res.actions);
        setAttendance(res.attendance);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err.message || "Failed to load chart data.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [eventId, range]);

  const series = useMemo(
    () => buildSeries({ metric, range, actions, attendance }),
    [metric, range, actions, attendance],
  );

  const currentOption = METRIC_OPTIONS.find((m) => m.value === metric);
  const color = METRIC_COLOR[metric];
  const totalForRange = series.reduce(
    (sum, p) => (metric === "totalVisits" ? Math.max(sum, p.value) : sum + p.value),
    0,
  );

  return (
    <div className="mt-4 border-t border-gray-100 pt-4">
      {/* Controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            Metric
          </label>
          <select
            value={metric}
            onChange={(e) => setMetric(e.target.value)}
            className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 focus:border-[#9FB366] focus:outline-none focus:ring-1 focus:ring-[#9FB366]"
          >
            {METRIC_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-1 rounded-lg border border-gray-200 bg-gray-50 p-1">
          {RANGES.map((r) => (
            <button
              key={r.value}
              onClick={() => setRange(r.value)}
              className={`px-2.5 py-1 text-xs rounded-md transition-colors ${
                range === r.value
                  ? "bg-white text-gray-900 shadow-sm font-medium"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Range total */}
      <div className="mb-3 flex items-baseline gap-2">
        <span className="text-2xl font-bold text-gray-900">
          {totalForRange.toLocaleString()}
        </span>
        <span className="text-xs text-gray-500">
          {metric === "totalVisits"
            ? `cumulative visits (${range === "all" ? "all time" : `last ${range}`})`
            : `total in ${range === "all" ? "all time" : `last ${range}`}`}
        </span>
      </div>

      {/* Chart */}
      <div className="h-56 w-full">
        {loading ? (
          <div className="flex h-full items-center justify-center text-sm text-gray-400">
            Loading chart…
          </div>
        ) : error ? (
          <div className="flex h-full items-center justify-center text-sm text-red-600">
            {error}
          </div>
        ) : series.every((p) => p.value === 0) ? (
          <div className="flex h-full flex-col items-center justify-center text-sm text-gray-400">
            <p>No {currentOption?.label.toLowerCase()} in this period.</p>
            {(metric === "likes" || metric === "bookmarks") && (
              <p className="mt-1 text-xs">
                ({metric === "likes" ? "Likes" : "Bookmarks"} tracking may not be wired up yet.)
              </p>
            )}
          </div>
        ) : currentOption?.chart === "line" ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={series} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: "#64748b" }}
                tickLine={false}
                axisLine={{ stroke: "#e2e8f0" }}
                minTickGap={20}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 11, fill: "#64748b" }}
                tickLine={false}
                axisLine={{ stroke: "#e2e8f0" }}
                width={32}
              />
              <Tooltip
                content={<ChartTooltip metricLabel={currentOption.label} />}
                cursor={{ stroke: "#cbd5e1", strokeDasharray: "3 3" }}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke={color}
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 5, fill: color }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={series} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: "#64748b" }}
                tickLine={false}
                axisLine={{ stroke: "#e2e8f0" }}
                minTickGap={20}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 11, fill: "#64748b" }}
                tickLine={false}
                axisLine={{ stroke: "#e2e8f0" }}
                width={32}
              />
              <Tooltip
                content={<ChartTooltip metricLabel={currentOption.label} />}
                cursor={{ fill: "#f8fafc" }}
              />
              <Bar dataKey="value" fill={color} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
