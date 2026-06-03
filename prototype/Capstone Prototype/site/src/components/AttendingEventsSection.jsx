import { Link } from "react-router-dom";
import { CalendarCheck, X } from "lucide-react";

function AttendingEventCard({ event, onCancel }) {
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
        <div className="flex items-center gap-2 mb-0.5">
          <h3 className="font-semibold text-gray-900 text-sm truncate">{event.title}</h3>
          <span className="flex-shrink-0 text-xs px-2 py-0.5 rounded-full bg-[#5F77A5]/10 text-[#5F77A5] font-medium">
            Attending
          </span>
        </div>
        <p className="text-xs text-gray-500 truncate mt-0.5">
          {event.space_name} · {event.neighborhood}
        </p>
        <p className="text-xs text-gray-400 mt-0.5">
          {dateStr}{event.time ? ` · ${event.time}` : ""}
        </p>
      </div>
      <div className="flex gap-2 flex-shrink-0">
        <Link
          to={`/events/${event.id}`}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm transition-colors font-medium"
        >
          View
        </Link>
        <button
          onClick={onCancel}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 text-sm transition-colors font-medium"
          aria-label="Cancel attendance"
        >
          <X size={13} />
          <span className="hidden sm:inline">Cancel</span>
        </button>
      </div>
    </div>
  );
}

export default function AttendingEventsSection({ allEvents, attendingEvents, unmarkAttending }) {
  const myEvents = allEvents.filter((e) => attendingEvents.has(e.id));

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-lg font-bold text-gray-900">Attending Events</h2>
        <p className="text-sm text-gray-500 mt-0.5">
          {myEvents.length} event{myEvents.length !== 1 ? "s" : ""} you're attending
        </p>
      </div>

      {myEvents.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-12 flex flex-col items-center text-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
            <CalendarCheck size={22} className="text-gray-400" />
          </div>
          <div>
            <p className="font-semibold text-gray-700">No events yet</p>
            <p className="text-sm text-gray-400 mt-1">
              Mark events as attending on their detail pages to see them here.
            </p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {myEvents.map((event) => (
            <AttendingEventCard
              key={event.id}
              event={event}
              onCancel={() => unmarkAttending(event.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
