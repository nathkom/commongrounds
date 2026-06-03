import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import EventCard from "./EventCard";

export default function NeighborhoodCard({ neighborhood, events }) {
  return (
    <section
      id={neighborhood.id}
      className="scroll-mt-20"
      aria-labelledby={`nh-${neighborhood.id}`}
    >
      {/* Neighborhood header */}
      <div className="flex items-end justify-between gap-4 mb-4">
        <div>
          <span className="text-xs font-semibold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
            {neighborhood.descriptor}
          </span>
          <h2
            id={`nh-${neighborhood.id}`}
            className="text-2xl font-bold text-gray-900 mt-1"
          >
            {neighborhood.name}
          </h2>
          <p className="text-sm text-gray-500 mt-0.5 max-w-xl">
            {neighborhood.description}
          </p>
        </div>
        <Link
          to={`/events?neighborhood=${neighborhood.id}`}
          className="shrink-0 flex items-center gap-1 text-sm font-semibold text-green-700 hover:underline"
          aria-label={`See all events in ${neighborhood.name}`}
        >
          See all <ArrowRight size={14} />
        </Link>
      </div>

      {/* Event preview row */}
      <div className="flex flex-col gap-3">
        {events.map((event) => (
          <EventCard key={event.id} event={event} />
        ))}
      </div>
    </section>
  );
}
