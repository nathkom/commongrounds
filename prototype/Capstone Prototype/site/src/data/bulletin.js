export const bulletins = [
  { id: "feb-2026", month: "February 2026", image: "images/bulletin/february.png" },
  { id: "mar-2026", month: "March 2026",    image: "images/bulletin/march.png"    },
  { id: "apr-2026", month: "April 2026",    image: "images/bulletin/april.png"    },
  { id: "may-2026", month: "May 2026",      image: "images/bulletin/may.png"      },
  { id: "jun-2026", month: "June 2026",     image: "images/bulletin/june.png"     },
  { id: "jul-2026", month: "July 2026",     image: "images/bulletin/july.png"     },
];

// Backward-compat alias
export const bulletin = bulletins.find(b => b.id === "mar-2026");
