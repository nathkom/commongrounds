import { SearchX } from "lucide-react";

export default function EmptyState({
  message = "No events match your filters. Try adjusting or clearing them."
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center px-4">
      <SearchX size={48} className="text-green-300 mb-4" aria-hidden="true" />
      <p className="text-gray-500 text-lg max-w-sm">{message}</p>
    </div>
  );
}
