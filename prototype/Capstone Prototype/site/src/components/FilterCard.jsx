import { X } from "lucide-react";
import {
  NEIGHBORHOODS,
  CATEGORIES,
  ACCESSIBILITY_OPTIONS,
} from "../utils/filters";
import filterBackImg from "../../wireframes/ffilterback.png";
import tapeImg from "../../wireframes/graybluetape1.png";

const COST_OPTIONS = [
  { id: "all", label: "All" },
  { id: "free", label: "Free only" },
  { id: "paid", label: "Paid only" },
];

export default function FilterCard({ filters, onChange, onClear, heading }) {
  const activeCount = [
    filters.neighborhoods?.length > 0,
    filters.categories?.length > 0,
    filters.dateFrom,
    filters.dateTo,
    filters.cost !== "all",
    filters.accessibility?.length > 0,
  ].filter(Boolean).length;

  function toggle(key, value) {
    const current = filters[key] ?? [];
    const next = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    onChange({ ...filters, [key]: next });
  }

  const filterControls = (
    <>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-gray-900 text-sm uppercase tracking-wide">
          Filters
          {activeCount > 0 && (
            <span className="ml-2 bg-[#9FB366] text-white text-xs font-bold px-2 py-0.5 rounded-full">
              {activeCount}
            </span>
          )}
        </h2>
        {activeCount > 0 && (
          <button
            onClick={onClear}
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-500 transition-colors"
            aria-label="Clear all filters"
          >
            <X size={12} />
            Clear all
          </button>
        )}
      </div>

      {/* Event Type / Category */}
      <fieldset>
        <legend className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">
          Event Type
        </legend>
        <div className="space-y-1.5">
          {CATEGORIES.map((cat) => (
            <label
              key={cat.id}
              className="flex items-center gap-2 cursor-pointer group"
            >
              <input
                type="checkbox"
                checked={filters.categories?.includes(cat.id) ?? false}
                onChange={() => toggle("categories", cat.id)}
                className="accent-green-700 w-4 h-4 rounded"
                aria-label={`Filter by ${cat.label}`}
              />
              <span className="text-sm text-gray-700 group-hover:text-[#9FB366] transition-colors">
                {cat.label}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      {/* Neighborhood */}
      <fieldset>
        <legend className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">
          Neighborhood
        </legend>
        <select
          value={filters.neighborhoods?.[0] ?? ""}
          onChange={(e) =>
            onChange({
              ...filters,
              neighborhoods: e.target.value ? [e.target.value] : [],
            })
          }
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500"
          aria-label="Filter by neighborhood"
        >
          <option value="">All Neighborhoods</option>
          {NEIGHBORHOODS.map((n) => (
            <option key={n.id} value={n.id}>
              {n.name}
            </option>
          ))}
        </select>
      </fieldset>

      {/* Date Range */}
      <fieldset>
        <legend className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">
          Date Range
        </legend>
        <div className="space-y-2">
          <input
            type="date"
            value={filters.dateFrom ?? ""}
            onChange={(e) =>
              onChange({ ...filters, dateFrom: e.target.value || null })
            }
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500"
            aria-label="Filter from date"
          />
          <input
            type="date"
            value={filters.dateTo ?? ""}
            onChange={(e) =>
              onChange({ ...filters, dateTo: e.target.value || null })
            }
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500"
            aria-label="Filter to date"
          />
        </div>
      </fieldset>

      {/* Price */}
      <fieldset>
        <legend className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">
          Price
        </legend>
        <div className="space-y-1.5">
          {COST_OPTIONS.map((opt) => (
            <label
              key={opt.id}
              className="flex items-center gap-2 cursor-pointer group"
            >
              <input
                type="radio"
                name="cost"
                value={opt.id}
                checked={filters.cost === opt.id}
                onChange={() => onChange({ ...filters, cost: opt.id })}
                className="accent-green-700 w-4 h-4"
                aria-label={`${opt.label} price filter`}
              />
              <span className="text-sm text-gray-700 group-hover:text-[#9FB366] transition-colors">
                {opt.label}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      {/* Accessibility */}
      <fieldset>
        <legend className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">
          Accessibility
        </legend>
        <div className="space-y-1.5">
          {ACCESSIBILITY_OPTIONS.map((opt) => (
            <label
              key={opt.id}
              className="flex items-center gap-2 cursor-pointer group"
            >
              <input
                type="checkbox"
                checked={filters.accessibility?.includes(opt.id) ?? false}
                onChange={() => toggle("accessibility", opt.id)}
                className="accent-green-700 w-4 h-4 rounded"
                aria-label={`Filter by ${opt.label}`}
              />
              <span className="text-sm text-gray-700 group-hover:text-[#9FB366] transition-colors">
                {opt.label}
              </span>
            </label>
          ))}
        </div>
      </fieldset>
    </>
  );

  // Desktop sidebar: paper outer container with tape + heading + solid filter card inside
  if (heading) {
    return (
      <div className="relative">
        {/* Tape — anchored to the corner of the whole sidebar, outside overflow-hidden */}
        <img
          src={tapeImg}
          alt=""
          aria-hidden="true"
          className="absolute -top-4 -right-7 w-36 -rotate-6 pointer-events-none select-none z-20"
        />

        {/* Paper background, clipped to rounded corners */}
        <div
          className="relative rounded-2xl overflow-hidden"
          style={{
            backgroundImage: `url(${filterBackImg})`,
            backgroundSize: "120%",
            backgroundPosition: "top center",
          }}
        >
          {/* "Your Feed" heading on the paper */}
          <h2 className="text-2xl font-bold text-gray-900 px-6 pt-6 pb-3">
            {heading}
          </h2>

          {/* Solid-background filter panel, centered on the paper */}
          <aside
            className="bg-[#F5F0E8] border border-gray-200 rounded-xl mx-5 mb-6 p-5 space-y-5"
            aria-label="Event filters"
          >
            {filterControls}
          </aside>
        </div>
      </div>
    );
  }

  // Mobile drawer: plain aside, no paper decorations
  return (
    <aside
      className="bg-white border border-gray-200 rounded-xl p-5 space-y-5 w-full"
      aria-label="Event filters"
    >
      {filterControls}
    </aside>
  );
}
