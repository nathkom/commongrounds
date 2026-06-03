import { useState, useRef, useLayoutEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";

import imgCapitolHill from "../../images/neighborhood_images/capitolhill.jpg";
import imgBallard from "../../images/neighborhood_images/ballard.png";
import imgBelltown from "../../images/neighborhood_images/belltown.webp";
import imgFremont from "../../images/neighborhood_images/fremont.jpg";
import imgSouthLakeUnion from "../../images/neighborhood_images/southlakeunion.jpg";
import imgUDistrict from "../../images/neighborhood_images/udistrict.jpg";

import tapeBluetape from "../../images/stickers/bluetape.png";
import tapeDotstape from "../../images/stickers/dotstape.png";
import tapeGreentape from "../../images/stickers/greentape.png";
import tapeRedplaidtape from "../../images/stickers/redplaidtape.png";
import tapeStartape from "../../images/stickers/startape.png";
import tapeYellowtape from "../../images/stickers/yellowtape.png";

const NEIGHBORHOODS = [
  {
    id: "capitol-hill",
    name: "Capitol Hill",
    image: imgCapitolHill,
    tape: tapeBluetape,
  },
  { id: "ballard", name: "Ballard", image: imgBallard, tape: tapeDotstape },
  { id: "belltown", name: "Belltown", image: imgBelltown, tape: tapeGreentape },
  { id: "fremont", name: "Fremont", image: imgFremont, tape: tapeRedplaidtape },
  {
    id: "south-lake-union",
    name: "South Lake Union",
    image: imgSouthLakeUnion,
    tape: tapeStartape,
  },
  {
    id: "university-district",
    name: "University District",
    image: imgUDistrict,
    tape: tapeYellowtape,
  },
];

const GAP = 16; // px between cards

export default function NeighborhoodCarousel() {
  // activeIndex = index of the CENTER card; range [1, N-2] so left+right cards always exist
  const [activeIndex, setActiveIndex] = useState(1);
  const [containerWidth, setContainerWidth] = useState(0);
  const containerRef = useRef(null);
  const navigate = useNavigate();

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => setContainerWidth(el.offsetWidth);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  // Clip container matches the navbar content column (max-w-7xl minus px-4 each side)
  const navWidth = Math.min(containerWidth - 32, 1248);
  const cardWidth = containerWidth > 0 ? (navWidth - 2 * GAP) / 3 : 0;
  // Shift left by one card-width per step; activeIndex 1 → cards [0,1,2] fill the clip box exactly
  const translateX = -(activeIndex - 1) * (cardWidth + GAP);

  const canPrev = activeIndex > 1;
  const canNext = activeIndex < NEIGHBORHOODS.length - 2;
  const goTo = (i) =>
    setActiveIndex(Math.max(1, Math.min(NEIGHBORHOODS.length - 2, i)));

  return (
    <section
      className="py-10 border-t border-gray-100"
      aria-label="Explore neighborhoods"
    >
      <div className="max-w-7xl mx-auto px-4 mb-6">
        <h2 className="text-3xl font-bold text-gray-900">
          Explore spaces in other neighborhoods
        </h2>
      </div>

      {/* Full-width div for measuring viewport width */}
      <div ref={containerRef}>
        {/* Clip box: exactly navWidth wide, centered — nothing leaks outside */}
        <div
          className="overflow-hidden mx-auto"
          style={{ width: containerWidth > 0 ? `${navWidth}px` : "100%" }}
        >
          <div
            className="flex items-start transition-transform duration-[420ms] ease-in-out"
            style={{
              transform: `translateX(${translateX}px)`,
              gap: `${GAP}px`,
            }}
          >
            {NEIGHBORHOODS.map((n, i) => (
              <div
                key={n.id}
                style={{ width: `${cardWidth}px`, flexShrink: 0 }}
                className="relative pt-6 opacity-100"
              >
                {/*
                ── HOME PAGE CAROUSEL TAPE ─────────────────────────────────────
                Edit tape appearance HERE for the main page carousel only.
                Neighborhoods page tape is in Neighborhoods.jsx > NeighborhoodTile.
                • Size:     w-20 (w-16 smaller · w-28 bigger)
                • Up/down:  -translate-y-1/2 (1/3 lower · 2/3 higher)
                • Tilt:     add rotate-3 or -rotate-6
                ────────────────────────────────────────────────────────────────
              */}
                <img
                  src={n.tape}
                  alt=""
                  aria-hidden="true"
                  className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/12 w-40 z-10 pointer-events-none select-none drop-shadow-sm"
                />

                <button
                  onClick={() => navigate(`/neighborhoods?id=${n.id}`)}
                  className="group w-full focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 rounded-[28px]"
                  aria-label={`Explore ${n.name}`}
                >
                  <div className="relative w-full rounded-[28px] overflow-hidden aspect-square">
                    <img
                      src={n.image}
                      alt={n.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      loading="lazy"
                    />
                    {/* Wavy cut-out at bottom matching section background */}
                    <svg
                      className="absolute bottom-0 left-0 w-full h-10"
                      viewBox="0 0 400 40"
                      preserveAspectRatio="none"
                      aria-hidden="true"
                    >
                      <path
                        d="M0,20 Q100,0 200,20 Q300,40 400,20 L400,40 L0,40 Z"
                        fill="white"
                      />
                    </svg>
                  </div>
                  <h3 className="mt-3 text-xl font-semibold text-gray-900 group-hover:text-[#9FB366] transition-colors text-center">
                    {n.name}
                  </h3>
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Navigation arrows — same style as BulletinBoard */}
      <div className="flex items-center justify-center gap-4 mt-6">
        <button
          onClick={() => goTo(activeIndex - 1)}
          disabled={!canPrev}
          aria-label="Previous neighborhood"
          className="p-2 rounded-full border border-gray-300 text-gray-600 hover:border-[#5F77A5] hover:text-[#5F77A5] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft size={20} />
        </button>
        <button
          onClick={() => goTo(activeIndex + 1)}
          disabled={!canNext}
          aria-label="Next neighborhood"
          className="p-2 rounded-full border border-gray-300 text-gray-600 hover:border-[#5F77A5] hover:text-[#5F77A5] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight size={20} />
        </button>
      </div>
    </section>
  );
}
