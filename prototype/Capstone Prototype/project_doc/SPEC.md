# Third Space Finder — Project Specification

## Project Context

You are building **Third Space Finder**, a community-centered web platform for the greater Seattle area. The platform helps people discover local third spaces (cafes, parks, libraries, community centers) and small events. It prioritizes accessibility, relevance, and genuine social connection over profit-driven visibility.

**Problem Statement:** How might greater Seattle community members better locate and promote local third spaces so that they can increase attendance and awareness of these spaces through better visibility?

**Demo Scope:** This is a prototype. Do not connect to any database. Use hardcoded mock data in `/src/data/`. All filters and search should operate on mock data only.

---

## Tech Stack

| Layer | Technology | Notes |
|---|---|---|
| Framework | React + Vite | Use Vite, not Create React App |
| Routing | React Router v6 | Client-side routing only |
| Styling | Tailwind CSS | Utility-first, no custom CSS files unless necessary |
| Icons | Lucide React | Use consistently throughout |
| State | useState + useContext | No Redux or Zustand needed for demo |
| Data | Mock JSON in `/src/data/` | Replaces Supabase for demo phase |
| Hosting | Vercel or Netlify | Free tier, deploy from GitHub |

**Future backend (post-demo, do not build now):** Supabase (PostgreSQL, Auth, Storage, RLS)

---

## Project Structure

Organize the project exactly as follows:

```
src/
  components/
    NavBar.jsx
    EventCard.jsx
    FilterCard.jsx
    BulletinBoard.jsx
    NeighborhoodCard.jsx
    AccessibilityTags.jsx
    EmptyState.jsx
  pages/
    Home.jsx
    Neighborhoods.jsx
    Events.jsx
    EventDetail.jsx
  data/
    events.js
    neighborhoods.js
    bulletin.js
  context/
    UserContext.jsx
  utils/
    filters.js
wireframes/
  home.png
  neighborhoods.png
  events.png
SPEC.md
```

---

## Routes

| Route | Page Component | Purpose |
|---|---|---|
| `/` | `Home.jsx` | Bulletin board + personalized event feed |
| `/neighborhoods` | `Neighborhoods.jsx` | Events aggregated by Seattle neighborhood |
| `/events` | `Events.jsx` | Full searchable event catalog with filters |
| `/events/:id` | `EventDetail.jsx` | Individual event detail page |

---

## Data Models

Use these exact shapes for all mock data. Place in `/src/data/`.

### Event (`/src/data/events.js`)

```js
{
  id: "uuid",
  title: "Community Board Game Night",
  space_name: "Lighthouse Coffee",
  neighborhood: "Capitol Hill",
  category: "social",         // social | arts | outdoors | food | sports | educational
  description: "Drop-in, all skill levels welcome.",
  date: "2026-03-15",
  time: "6:00 PM - 9:00 PM",
  cost: "free",               // free | suggested_donation | paid
  cost_amount: null,          // e.g. "$5" if paid
  accessibility: ["wheelchair_accessible", "gender_neutral_restroom"],
  tags: ["drop_in", "beginner_friendly", "indoor"],
  image_url: "https://picsum.photos/seed/event1/400/200",
  contact_email: "organizer@example.com",
  featured: false             // true = eligible for bulletin board spotlight
}
```

Create at least 15 diverse mock events spread across the neighborhoods listed below.

### Neighborhood (`/src/data/neighborhoods.js`)

```js
{
  id: "capitol-hill",
  name: "Capitol Hill",
  descriptor: "Arts, nightlife & community",
  description: "A vibrant, walkable neighborhood known for its arts scene and community spaces.",
  image_url: "https://picsum.photos/seed/caphill/600/300",
  event_ids: ["uuid1", "uuid2", "uuid3"]
}
```

Use these 8 neighborhoods: Capitol Hill, Ballard, Fremont, Columbia City, Rainier Valley, University District, West Seattle, South Lake Union. Each should have 3–4 associated events.

### Bulletin Board (`/src/data/bulletin.js`)

```js
{
  month: "March 2026",
  headline: "Spring is here — get outside and connect.",
  editorial_note: "This month we're spotlighting outdoor community spaces...",
  featured_items: [
    {
      id: "b1",
      type: "event",            // event | space | announcement
      title: "Spring Community Cleanup",
      description: "Join neighbors for a morning of...",
      image_url: "https://picsum.photos/seed/bulletin1/800/400",
      link_to: "/events/uuid"
    }
  ]
}
```

---

## Page Specifications

### Page 1: Home (`/`)

The home page has two distinct vertical sections separated by a clear visual divider.

#### Section A — Digital Bulletin Board

- Renders content from `/src/data/bulletin.js`
- Visually distinct from the feed below — treat it like a community newspaper front page
- Show the month label, editorial headline, editorial note, and 2–3 featured item cards
- Featured item cards should be larger/more prominent than regular EventCards
- This section is static for the demo — hardcoded monthly content, no user interaction required

#### Section B — Event Feed + Sticky Filter Card

- Below the bulletin board, render a feed of EventCards from `/src/data/events.js`
- If a `UserContext` user is present, show "Your Feed" as the heading. If no user, show "Upcoming Events" with a subtle prompt to sign in for a personalized feed
- The FilterCard is **sticky** — it stays visible as the user scrolls through the feed
  - Desktop: sticky sidebar to the left or right of the feed
  - Mobile: collapses into a bottom drawer or modal, triggered by a floating "Filter" button
- The FilterCard filters the feed in real time using the `filters.js` utility

**Filter fields on the FilterCard:**
- Neighborhood (multi-select dropdown)
- Category (multi-select chips: social, arts, outdoors, food, sports, educational)
- Date range (from/to date pickers or preset options: Today, This Week, This Month)
- Cost (radio: All / Free only / Paid only)
- Accessibility (checkboxes: wheelchair accessible, gender neutral restroom, sensory friendly, dog friendly)
- Clear all filters button — resets everything

---

### Page 2: Neighborhoods (`/neighborhoods`)

- Displays all 8 Seattle neighborhoods as sections on a single scrollable page
- Each neighborhood section includes:
  - Neighborhood name and descriptor tag
  - Short description
  - Row of 3–4 preview EventCards (horizontal scroll on mobile, grid on desktop)
  - "See all in [Neighborhood]" link that navigates to `/events?neighborhood=[id]`
- Include a neighborhood jump nav at the top of the page (anchor links to each section)

---

### Page 3: Events (`/events`)

- Full searchable and filterable catalog of all events
- Accepts a `?neighborhood=` query param from Neighborhoods page links and pre-applies that filter on load
- Layout: filter controls at the top, EventCard grid below

**Filter controls (top bar):**
- Keyword search input (searches title, description, space_name, tags)
- Neighborhood dropdown
- Category chips
- Date filter
- Cost filter
- Accessibility checkboxes
- "X active filters" badge — clicking it clears all

**Event grid:**
- Responsive: 1 column mobile, 2 columns tablet, 3 columns desktop
- Show EmptyState component when no results match
- Each card links to `/events/:id`

---

### Page 4: Event Detail (`/events/:id`)

- Full detail view for a single event
- Show all event fields: title, space name, neighborhood, category, full description, date, time, cost, accessibility tags, contact email
- Include a back button to return to the previous page
- Show 3 related events from the same neighborhood at the bottom

---

## Shared Components

Build each of these as a standalone reusable component.

### `NavBar.jsx`
- Logo/wordmark on the left: "Third Space Finder"
- Nav links: Home, Neighborhoods, Events
- Right side: Sign In button (non-functional for demo, just renders)
- Sticky at the top of the viewport on all pages
- Mobile: collapses into a hamburger menu

### `EventCard.jsx`
Props: `event` (full event object)
- Show: image, title, space_name, neighborhood, date + time, cost badge (color-coded: green=free, yellow=donation, gray=paid), AccessibilityTags
- Entire card is clickable, navigates to `/events/:id`
- Consistent fixed height with truncated description text

### `FilterCard.jsx`
Props: `filters` (current filter state), `onChange` (callback), `onClear`
- Renders all filter fields listed in the Home page spec
- Calls `onChange` on every user interaction for real-time filtering
- Shows count of active filters in the header

### `BulletinBoard.jsx`
Props: `data` (bulletin object from bulletin.js)
- Renders the editorial section as described in the Home page spec
- Visually prominent — use a distinct background color or texture to set it apart from the feed

### `NeighborhoodCard.jsx`
Props: `neighborhood` (neighborhood object), `events` (array of event objects)
- Renders a full neighborhood section: header, description, event preview row, see-all link

### `AccessibilityTags.jsx`
Props: `tags` (array of accessibility strings)
- Renders each tag as a small colored pill/badge
- Use consistent icons from Lucide React for each tag type

### `EmptyState.jsx`
Props: `message` (optional string)
- Friendly illustration or icon + message when no results are found
- Default message: "No events match your filters. Try adjusting or clearing them."

---

## Utilities

### `/src/utils/filters.js`

Export a `filterEvents(events, filters)` function that takes the full events array and a filters object and returns the filtered subset. All filtering logic should live here, not in components.

```js
// filters object shape
{
  neighborhoods: [],     // array of neighborhood ids
  categories: [],        // array of category strings
  dateFrom: null,        // ISO date string or null
  dateTo: null,
  cost: "all",           // "all" | "free" | "paid"
  accessibility: []      // array of accessibility tag strings
  keyword: ""            // searches title, description, space_name, tags
}
```

---

## Design Guidelines

- **Brand color:** Green — use Tailwind's `green-700` as primary, `green-50` for backgrounds
- **Tone:** Warm, community-focused, approachable — not corporate or startup-y
- **Typography:** Use Tailwind's default font stack; keep heading sizes consistent across pages
- **Accessibility:** WCAG 2.1 AA minimum — sufficient color contrast, keyboard navigability, semantic HTML, ARIA labels on all interactive elements
- **Mobile-first:** Design for mobile first, then scale up to tablet and desktop breakpoints
- **No account required to browse:** Guests can see all content; personalization is additive

---

## Wireframes

Wireframes are located in `/wireframes/`. Read the relevant wireframe image before building each page.

| Page | File |
|---|---|
| Home | `/wireframes/home.png` |
| Neighborhoods | `/wireframes/neighborhoods.png` |
| Events | `/wireframes/events.png` |

If a wireframe conflicts with this spec, follow the wireframe for layout decisions and this spec for data/logic decisions.

---

## Build Order

Follow this sequence. Complete and confirm each phase before starting the next.

1. **Scaffold** — Vite + React + Tailwind setup, React Router with 4 routes, NavBar, placeholder page components
2. **Data** — Create all mock data files with realistic content (15+ events, 8 neighborhoods, bulletin data)
3. **Shared components** — Build EventCard, AccessibilityTags, EmptyState, FilterCard, BulletinBoard, NeighborhoodCard
4. **Home page** — Bulletin board section, event feed, sticky FilterCard wired to filterEvents()
5. **Neighborhoods page** — All 8 neighborhoods with preview events and jump nav
6. **Events page** — Full catalog grid, all filters, keyword search, query param support
7. **Event Detail page** — Full detail view and related events
8. **Polish** — Mobile layouts, accessibility audit, empty states, loading states, visual consistency

---

## Out of Scope (Do Not Build)

- Database connection or API calls of any kind
- User authentication or account creation
- Form submissions that persist data
- Real map integration (use a static placeholder if a map is needed)
- Email or notification features
- CMS for bulletin board content
