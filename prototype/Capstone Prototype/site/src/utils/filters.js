/**
 * filterEvents — filters the events array based on a filters object.
 * All filtering logic lives here, not in components.
 */
export function filterEvents(events, filters) {
  const {
    neighborhoods = [],
    categories = [],
    dateFrom = null,
    dateTo = null,
    cost = "all",
    accessibility = [],
    keyword = ""
  } = filters;

  return events.filter((event) => {
    // Neighborhood filter
    if (neighborhoods.length > 0) {
      const neighborhoodId = event.neighborhood.toLowerCase().replace(/\s+/g, "-");
      if (!neighborhoods.includes(neighborhoodId)) return false;
    }

    // Category filter
    if (categories.length > 0) {
      if (!categories.includes(event.category)) return false;
    }

    // Date range filter
    if (dateFrom) {
      if (event.date < dateFrom) return false;
    }
    if (dateTo) {
      if (event.date > dateTo) return false;
    }

    // Cost filter
    if (cost === "free") {
      if (event.cost !== "free") return false;
    } else if (cost === "paid") {
      if (event.cost === "free") return false;
    }

    // Accessibility filter
    if (accessibility.length > 0) {
      const hasAll = accessibility.every((tag) =>
        event.accessibility.includes(tag)
      );
      if (!hasAll) return false;
    }

    // Keyword search
    if (keyword.trim()) {
      const q = keyword.toLowerCase();
      const searchable = [
        event.title,
        event.description,
        event.space_name,
        ...(event.tags || [])
      ]
        .join(" ")
        .toLowerCase();
      if (!searchable.includes(q)) return false;
    }

    return true;
  });
}

export const NEIGHBORHOODS = [
  { id: "capitol-hill", name: "Capitol Hill" },
  { id: "ballard", name: "Ballard" },
  { id: "fremont", name: "Fremont" },
  { id: "columbia-city", name: "Columbia City" },
  { id: "rainier-valley", name: "Rainier Valley" },
  { id: "university-district", name: "University District" },
  { id: "west-seattle", name: "West Seattle" },
  { id: "south-lake-union", name: "South Lake Union" }
];

export const CATEGORIES = [
  { id: "social", label: "Social" },
  { id: "arts", label: "Arts" },
  { id: "outdoors", label: "Outdoors" },
  { id: "food", label: "Food" },
  { id: "sports", label: "Sports" },
  { id: "educational", label: "Educational" }
];

export const ACCESSIBILITY_OPTIONS = [
  { id: "wheelchair_accessible", label: "Wheelchair Accessible" },
  { id: "gender_neutral_restroom", label: "Gender Neutral Restroom" },
  { id: "sensory_friendly", label: "Sensory Friendly" },
  { id: "dog_friendly", label: "Dog Friendly" }
];
