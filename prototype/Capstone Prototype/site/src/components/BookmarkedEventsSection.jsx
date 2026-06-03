import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { Bookmark, BookmarkPlus, Check, Eye, Plus, Trash2 } from "lucide-react";

// ─── Individual bookmarked event card ─────────────────────────────────────────

function BookmarkedEventCard({ event, bookmarkGroups, eventGroups, addEventToGroup, removeEventFromGroup, onRemove }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  const dateStr = event.date
    ? new Date(event.date + "T00:00:00").toLocaleDateString("en-US", {
        month: "short", day: "numeric", year: "numeric",
      })
    : "";

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 flex items-center gap-4">
      <img
        src={event.image_url}
        alt={event.title}
        className="w-16 h-16 rounded-xl object-cover flex-shrink-0"
      />
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-gray-900 text-sm truncate">{event.title}</h3>
        <p className="text-xs text-gray-500 truncate mt-0.5">
          {event.space_name} · {event.neighborhood}
        </p>
        <p className="text-xs text-gray-400 mt-0.5">
          {dateStr}{event.time ? ` · ${event.time}` : ""}
        </p>
      </div>

      <div className="flex gap-2 flex-shrink-0 items-center">
        {/* Add to group context menu */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
              menuOpen
                ? "border-green-400 text-green-700 bg-green-50"
                : "border-gray-200 text-gray-700 hover:bg-gray-50"
            }`}
          >
            <BookmarkPlus size={13} />
            <span className="hidden sm:inline">Add to</span>
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl border border-gray-200 shadow-lg z-50 overflow-hidden">
              {bookmarkGroups.map((g) => {
                const inGroup = eventGroups.includes(g.id);
                return (
                  <button
                    key={g.id}
                    onClick={() => {
                      if (inGroup) {
                        removeEventFromGroup(event.id, g.id);
                      } else {
                        addEventToGroup(event.id, g.id);
                      }
                    }}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors text-left"
                  >
                    <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${
                      inGroup ? "bg-green-700 border-green-700" : "border-gray-300"
                    }`}>
                      {inGroup && <Check size={10} className="text-white" />}
                    </div>
                    <span className="truncate">{g.name}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <Link
          to={`/events/${event.id}`}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm transition-colors font-medium"
        >
          <Eye size={13} />
          <span className="hidden sm:inline">View</span>
        </Link>
        <button
          onClick={onRemove}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 text-sm transition-colors font-medium"
        >
          <Trash2 size={13} />
          <span className="hidden sm:inline">Remove</span>
        </button>
      </div>
    </div>
  );
}

// ─── Bookmarked Events Section ─────────────────────────────────────────────────

export default function BookmarkedEventsSection({
  allEvents,
  bookmarkedEvents,
  bookmarkGroups,
  eventGroupMap,
  toggleBookmark,
  addBookmarkGroup,
  removeBookmarkGroup,
  addEventToGroup,
  removeEventFromGroup,
}) {
  const [activeGroup, setActiveGroup] = useState("all");
  const [showNewGroupForm, setShowNewGroupForm] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");

  const savedEvents = allEvents.filter((e) => bookmarkedEvents.has(e.id));

  const displayedEvents =
    activeGroup === "all"
      ? savedEvents
      : savedEvents.filter((e) => (eventGroupMap[e.id] || ["default"]).includes(activeGroup));

  function handleAddGroup() {
    if (!newGroupName.trim()) return;
    addBookmarkGroup(newGroupName.trim());
    setNewGroupName("");
    setShowNewGroupForm(false);
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Bookmarked Events</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {savedEvents.length} saved event{savedEvents.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={() => setShowNewGroupForm(true)}
          className="flex items-center gap-2 bg-[#9FB366] hover:bg-[#8a9c57] text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors flex-shrink-0"
        >
          <Plus size={14} />
          New Group
        </button>
      </div>

      {/* New group form */}
      {showNewGroupForm && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 flex gap-2">
          <input
            type="text"
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddGroup()}
            placeholder="Group name…"
            className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            autoFocus
          />
          <button
            onClick={handleAddGroup}
            className="px-4 py-2 rounded-xl bg-[#9FB366] hover:bg-[#8a9c57] text-white text-sm font-semibold transition-colors"
          >
            Create
          </button>
          <button
            onClick={() => { setShowNewGroupForm(false); setNewGroupName(""); }}
            className="px-3 py-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm transition-colors"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Group filter tabs */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setActiveGroup("all")}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            activeGroup === "all"
              ? "bg-gray-900 text-white"
              : "bg-white border border-gray-200 text-gray-600 hover:border-green-300"
          }`}
        >
          All
          <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeGroup === "all" ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"}`}>
            {savedEvents.length}
          </span>
        </button>

        {bookmarkGroups.map((group) => {
          const count = savedEvents.filter(
            (e) => (eventGroupMap[e.id] || ["default"]).includes(group.id)
          ).length;
          const isActive = activeGroup === group.id;
          return (
            <button
              key={group.id}
              onClick={() => setActiveGroup(group.id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                isActive
                  ? "bg-gray-900 text-white"
                  : "bg-white border border-gray-200 text-gray-600 hover:border-green-300"
              }`}
            >
              {group.name}
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${isActive ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"}`}>
                {count}
              </span>
              {group.id !== "default" && (
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    removeBookmarkGroup(group.id);
                    if (activeGroup === group.id) setActiveGroup("all");
                  }}
                  className="ml-0.5 text-gray-400 hover:text-red-500 text-sm leading-none cursor-pointer"
                  role="button"
                  aria-label={`Remove ${group.name} group`}
                >
                  ×
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Events list */}
      {displayedEvents.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-12 flex flex-col items-center text-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
            <Bookmark size={22} className="text-gray-400" />
          </div>
          <div>
            <p className="font-semibold text-gray-700">
              {activeGroup === "all" ? "No saved events yet" : "No events in this group"}
            </p>
            <p className="text-sm text-gray-400 mt-1">
              {activeGroup === "all"
                ? "Bookmark events across the site to save them here."
                : "Use the 'Add to' button on any bookmarked event to add it to this group."}
            </p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {displayedEvents.map((event) => (
            <BookmarkedEventCard
              key={event.id}
              event={event}
              bookmarkGroups={bookmarkGroups}
              eventGroups={eventGroupMap[event.id] || ["default"]}
              addEventToGroup={addEventToGroup}
              removeEventFromGroup={removeEventFromGroup}
              onRemove={() => {
                if (activeGroup === "all") {
                  toggleBookmark(event.id);
                } else {
                  removeEventFromGroup(event.id, activeGroup);
                }
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
