// Hardcoded coordinates for known Seattle venues. Keyed by lowercased,
// punctuation-stripped venue name (see normalizeVenueKey) so that small
// variations in the way hosts type a name still match.
//
// Coordinates are approximate (street-level), gathered from public records.
// Used by NeighborhoodsMap to place real pins for venues we recognize;
// anything not in this table falls back to deterministic random sampling
// inside the neighborhood polygon.

export function normalizeVenueKey(name) {
  if (!name) return "";
  return name
    .toLowerCase()
    .replace(/\(.*?\)/g, " ")        // drop parenthetical hints like "(start)"
    .replace(/[^\p{L}\p{N}\s]/gu, " ") // drop punctuation
    .replace(/\s+/g, " ")
    .trim();
}

// Pull a "city, ST zip" style address apart just enough to know whether it's
// a real street address or a PO Box. PO Boxes can't be mapped to a real
// location, so we treat them as unknown and let the fallback handle them.
export function isMappableAddress(address) {
  if (!address) return false;
  return !/^\s*p\.?\s*o\.?\s*box/i.test(address);
}

const RAW_VENUES = {
  // ── Spaces (data/spaces.js) ────────────────────────────────────────────────
  "Elm Coffee Roasters":           { lat: 47.5985, lng: -122.3314 },
  "Mox Boarding House":            { lat: 47.6651, lng: -122.3122 },
  "Gas Works Park":                { lat: 47.6456, lng: -122.3344 },
  "Hugo House":                    { lat: 47.6160, lng: -122.3172 },
  "Pratt Fine Arts Center":        { lat: 47.5984, lng: -122.3083 },
  "Ballard Farmers Market":        { lat: 47.6680, lng: -122.3837 },
  "Columbia City Gallery":         { lat: 47.5594, lng: -122.2926 },
  "Golden Gardens Park":           { lat: 47.6919, lng: -122.4036 },
  "University Branch Library":     { lat: 47.6646, lng: -122.3174 },
  // Fremont Arts Council is a PO Box — placed near Fremont Center on the
  // street they're commonly associated with.
  "Fremont Arts Council":          { lat: 47.6517, lng: -122.3563 },

  // ── Event venues (data/events.js) ──────────────────────────────────────────
  "Pioneer Square Galleries":      { lat: 47.6010, lng: -122.3331 },
  "Nordic Heritage Museum":        { lat: 47.6680, lng: -122.3870 },
  "Sunset Tavern":                 { lat: 47.6681, lng: -122.3838 },
  "Fremont Sunday Market":         { lat: 47.6515, lng: -122.3500 },
  "Cal Anderson Park Shelter":     { lat: 47.6171, lng: -122.3186 },
  "Optimism Brewing":              { lat: 47.6147, lng: -122.3210 },
  "Hale's Ales Brewery":           { lat: 47.6611, lng: -122.3766 },
  "Lake Union Park":               { lat: 47.6281, lng: -122.3361 },
  "South Lake Union Park":         { lat: 47.6281, lng: -122.3361 },
  "WeWork South Lake Union":       { lat: 47.6240, lng: -122.3310 },
  "Alki Beach":                    { lat: 47.5780, lng: -122.4080 },
  "Alki Beach Park":               { lat: 47.5780, lng: -122.4080 },
  "Lincoln Park Beach":            { lat: 47.5340, lng: -122.3950 },
  "West Seattle Branch Library":   { lat: 47.5750, lng: -122.3856 },
  "California Ave SW":             { lat: 47.5610, lng: -122.3870 },
  "Kane Hall, UW Campus":          { lat: 47.6570, lng: -122.3090 },
  "UW Physics & Astronomy Building": { lat: 47.6540, lng: -122.3110 },
  "College Inn Pub":               { lat: 47.6573, lng: -122.3138 },
  "University Heights Community Center": { lat: 47.6650, lng: -122.3140 },
  "Unexpected Productions":        { lat: 47.6090, lng: -122.3410 },
  "Fremont Public Library":        { lat: 47.6515, lng: -122.3506 },
  "Fremont Canal Park":            { lat: 47.6489, lng: -122.3590 },
  "Fremont Community Garden":      { lat: 47.6500, lng: -122.3510 },
  "Columbia City Library":         { lat: 47.5600, lng: -122.2910 },
  "Columbia City Cinema":          { lat: 47.5600, lng: -122.2920 },
  "Columbia City Farmers Market":  { lat: 47.5600, lng: -122.2920 },
  "Columbia City Community Center": { lat: 47.5570, lng: -122.2910 },
  "Columbia City Light Rail Station": { lat: 47.5601, lng: -122.2920 },
  "Rainier Beach Library":         { lat: 47.5310, lng: -122.2700 },
  "Rainier Beach Community Center": { lat: 47.5340, lng: -122.2690 },
  "Rainier Beach Urban Farm":      { lat: 47.5230, lng: -122.2730 },
  "Rainier Community Center":      { lat: 47.5630, lng: -122.2790 },
  "Van Asselt Community Center":   { lat: 47.5390, lng: -122.2990 },
  "Ballard Ave Starting Point":    { lat: 47.6680, lng: -122.3837 },
};

// Build the lookup with normalized keys so callers don't need to know about
// our normalization rules.
export const VENUE_COORDS = Object.fromEntries(
  Object.entries(RAW_VENUES).map(([name, coords]) => [
    normalizeVenueKey(name),
    coords,
  ]),
);

// Convenience: look up by either an event/space name or a free-text address
// that starts with a known venue ("Elm Coffee Roasters, 240 2nd Ave...").
export function lookupVenueCoords(spaceName) {
  if (!spaceName) return null;
  const key = normalizeVenueKey(spaceName);
  if (VENUE_COORDS[key]) return VENUE_COORDS[key];
  // Try the leading segment before the first comma — handles cases where the
  // host pasted "Venue Name, 123 Main St, Seattle".
  const firstSegment = spaceName.split(",")[0];
  if (firstSegment && firstSegment !== spaceName) {
    const altKey = normalizeVenueKey(firstSegment);
    if (VENUE_COORDS[altKey]) return VENUE_COORDS[altKey];
  }
  return null;
}
