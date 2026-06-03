import { useState, useEffect, useCallback } from "react";
import { X, ChevronLeft, ChevronRight, Images } from "lucide-react";

/* ─── Lightbox ──────────────────────────────────────────────────────────────── */
function Lightbox({ images, startIndex, onClose }) {
  const [current, setCurrent] = useState(startIndex);

  const prev = useCallback(
    () => setCurrent((i) => (i - 1 + images.length) % images.length),
    [images.length]
  );
  const next = useCallback(
    () => setCurrent((i) => (i + 1) % images.length),
    [images.length]
  );

  useEffect(() => {
    function onKey(e) {
      if (e.key === "ArrowLeft") prev();
      else if (e.key === "ArrowRight") next();
      else if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [prev, next, onClose]);

  // Lock body scroll while open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-black/90 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Image gallery"
    >
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 shrink-0">
        <span className="text-white/70 text-sm font-medium">
          {current + 1} / {images.length}
        </span>
        <button
          onClick={onClose}
          className="text-white/80 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors"
          aria-label="Close gallery"
        >
          <X size={22} />
        </button>
      </div>

      {/* Main image */}
      <div className="relative flex-1 flex items-center justify-center min-h-0 px-14">
        <img
          key={current}
          src={images[current].url}
          alt={images[current].alt}
          className="max-h-full max-w-full object-contain rounded-lg select-none"
          draggable={false}
        />

        {/* Prev */}
        {images.length > 1 && (
          <button
            onClick={prev}
            className="absolute left-2 p-2.5 rounded-full bg-black/50 text-white hover:bg-black/80 transition-colors"
            aria-label="Previous image"
          >
            <ChevronLeft size={22} />
          </button>
        )}

        {/* Next */}
        {images.length > 1 && (
          <button
            onClick={next}
            className="absolute right-2 p-2.5 rounded-full bg-black/50 text-white hover:bg-black/80 transition-colors"
            aria-label="Next image"
          >
            <ChevronRight size={22} />
          </button>
        )}
      </div>

      {/* Thumbnail strip */}
      {images.length > 1 && (
        <div className="shrink-0 flex gap-2 justify-center px-4 py-4 overflow-x-auto">
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`shrink-0 w-16 h-12 rounded-lg overflow-hidden border-2 transition-all ${
                i === current
                  ? "border-green-400 opacity-100 scale-105"
                  : "border-transparent opacity-50 hover:opacity-80"
              }`}
              aria-label={`View image ${i + 1}`}
              aria-current={i === current}
            >
              <img
                src={img.url}
                alt={img.alt}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Gallery grid (wireframe layout) ──────────────────────────────────────── */
export default function EventGallery({ images, title }) {
  const [lightboxIndex, setLightboxIndex] = useState(null);

  if (!images || images.length === 0) return null;

  const open = (i) => setLightboxIndex(i);
  const close = () => setLightboxIndex(null);

  // Single image — full-width hero
  if (images.length === 1) {
    return (
      <>
        <div
          className="aspect-video w-full bg-green-100 cursor-zoom-in overflow-hidden"
          onClick={() => open(0)}
        >
          <img
            src={images[0].url}
            alt={images[0].alt || title}
            className="w-full h-full object-cover hover:scale-[1.02] transition-transform duration-300"
          />
        </div>
        {lightboxIndex !== null && (
          <Lightbox images={images} startIndex={lightboxIndex} onClose={close} />
        )}
      </>
    );
  }

  // Multi-image wireframe layout
  // Left: large primary image  |  Right: 2×2 grid of thumbs
  const primary = images[0];
  const thumbs = images.slice(1, 5); // up to 4 thumbs
  const overflow = images.length - 5; // images beyond the 5 shown

  return (
    <>
      <div className="flex gap-1.5 h-72 sm:h-80 lg:h-96 bg-green-50 overflow-hidden">

        {/* Large primary image */}
        <button
          className="relative flex-[3] overflow-hidden focus:outline-none group"
          onClick={() => open(0)}
          aria-label={`View photo 1 of ${images.length}`}
        >
          <img
            src={primary.url}
            alt={primary.alt || title}
            className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
          />
        </button>

        {/* 2×2 thumbnail grid */}
        {thumbs.length > 0 && (
          <div className="flex-[2] grid grid-cols-2 gap-1.5">
            {thumbs.map((img, idx) => {
              const globalIdx = idx + 1;
              const isLast = idx === 3;
              const showMore = isLast && overflow > 0;

              return (
                <button
                  key={globalIdx}
                  className="relative overflow-hidden focus:outline-none group"
                  onClick={() => open(showMore ? 4 : globalIdx)}
                  aria-label={
                    showMore
                      ? `View all ${images.length} photos`
                      : `View photo ${globalIdx + 1} of ${images.length}`
                  }
                >
                  <img
                    src={img.url}
                    alt={img.alt || title}
                    className="w-full h-full object-cover group-hover:scale-[1.05] transition-transform duration-300"
                  />

                  {/* "View more" overlay on last thumb when overflow exists */}
                  {showMore && (
                    <div className="absolute inset-0 bg-black/55 flex flex-col items-center justify-center gap-1">
                      <Images size={20} className="text-white" aria-hidden="true" />
                      <span className="text-white text-sm font-semibold">
                        +{overflow + 1} more
                      </span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Photo count pill */}
      <div className="flex justify-end px-4 py-2">
        <button
          onClick={() => open(0)}
          className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-[#9FB366] transition-colors"
          aria-label={`View all ${images.length} photos`}
        >
          <Images size={13} aria-hidden="true" />
          {images.length} photos
        </button>
      </div>

      {lightboxIndex !== null && (
        <Lightbox images={images} startIndex={lightboxIndex} onClose={close} />
      )}
    </>
  );
}
