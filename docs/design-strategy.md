# 2025 Photobook Experience Design Strategy

## Product Vision
The 2025 Photobook celebrates a year's worth of moments across events, teams, and personal highlights. The experience should feel archival yet vibrant—easy to browse, quick to search, and delightful on any device.

---

## Primary Audiences
- **Community Members** looking to relive events they attended and download favorites.
- **Event Organizers** needing a quick way to surface galleries they managed.
- **Newcomers & Press** seeking a curated overview of flagship milestones.

Each journey prioritizes lightweight discovery, high-quality visuals, and easy sharing/exporting.

---

## User Journeys

### 1. Browse by Month
1. Land on the Home page with a hero collage and a timeline ribbon.
2. Scroll or use the sticky month scroller to jump to a specific month.
3. Preview key events in that month via stacked cards showing cover photo, title, tags, and quick stats.
4. Open a month detail view that surfaces featured galleries, highlights, and metadata filters.
5. Add favorite photos to a personal collection or share a gallery link.

**Goals**: quick temporal navigation, contextual storytelling, entry points into galleries.

### 2. View Event Galleries
1. Enter from the month view, search, or featured carousel.
2. See an immersive gallery header (hero image, date, location, tags, download/share CTA).
3. Browse the gallery grid with adaptive column counts and lazy loading.
4. Use filters (photographer, tag, spotlight items) to refine.
5. Open the lightbox to view metadata, captions, EXIF highlights, and related galleries.

**Goals**: high-quality viewing, frictionless filtering, smooth transitions between photos.

### 3. Discover via Metadata Filters
1. From the global nav or search, open the “Explore” page.
2. Combine filters (month, event type, location, photographer, people, vibe) using chips.
3. View results as a mosaic grid or list, with inline previews.
4. Save filter sets to favorites; optionally export as CSV/contact sheet.

**Goals**: empower power users and press to quickly curate themed sets.

---

## Metadata-Driven Navigation Framework

| Filter Category | Metadata Source | UI Treatment | Notes |
| --- | --- | --- | --- |
| Month / Season | Event dates | Horizontal scroll timeline; sticky on desktop, dropdown on mobile | Supports keyboard navigation |
| Event Type | Curated taxonomy (Festival, Workshop, Launch) | Multi-select chips | Display counts and highlight trending types |
| Location | City / Venue metadata | Hierarchical dropdown with search | Show map pin on hover (desktop) |
| Photographer | Credits metadata | Typeahead | Display avatar when available |
| People Featured | Tagged individuals | Tokenized chips with avatars | Add "request removal" link |
| Mood / Vibe | Curated tags (Joyful, Intimate, Energetic) | Color-coded pills | Sync color accents with palette |
| Accessibility Notes | Alt text tags | Filter toggle (“Show events with full accessibility coverage”) | Tie into ADA compliance status |

**Data Model Considerations**
- Maintain normalized metadata tables for events, galleries, and assets.
- Support many-to-many relationships (e.g., multiple photographers per gallery).
- Enable synonyms/aliases for search (e.g., “conference” ↔ “summit”).

---

## Responsive Layout Concepts

### Desktop (≥1280px)
- **Global Header**: left-aligned logo, centered navigation (Home, Explore, Timeline, About, Support), right-aligned search and profile menu.
- **Hero Section**: full-width collage with overlayed tagline and primary CTA (“Start Exploring”).
- **Timeline Ribbon**: horizontal slider pinned under hero with months and quick stats.
- **Content Grid**: 3–4 column masonry cards with hover reveals (date, tags, quick actions).
- **Gallery View**: split layout—left sticky metadata panel, right scrollable grid (4 columns).
- **Footer**: multi-column with quick links, newsletter sign-up, social badges.

### Tablet (768–1279px)
- Collapsible hamburger navigation with persistent search icon.
- Content grid shifts to 2–3 columns; timeline becomes swipeable carousel.
- Gallery view uses top metadata accordion and 3-column grid.

### Mobile (≤767px)
- Sticky top bar with logo, search, and overflow menu.
- Hero compresses to stacked image with tagline below.
- Timeline becomes horizontal chip list with snap scroll and “Jump to Month” modal.
- Content cards stack in a single column with prominent CTAs.
- Gallery view presents 2-column grid with floating filter button opening bottom sheet.

---

## Typography System
- **Display / Hero**: `Fraunces 144pt` (serif with modern flair) for hero headlines.
- **Headings**: `DM Serif Display` (H1-H3) emphasizing archival tone.
- **Body Text**: `Inter` for readability across devices.
- **UI Labels & Meta**: `Inter SemiBold` small caps for tags and filters.

### Type Scale
| Role | Size | Weight | Usage |
| --- | --- | --- | --- |
| H1 | 56px | 600 | Hero headlines |
| H2 | 40px | 500 | Section headers |
| H3 | 28px | 500 | Subsections |
| Body Large | 18px | 400 | Descriptive text |
| Body Base | 16px | 400 | Copy, captions |
| Meta | 12px | 600 | Tags, filter labels |

---

## Color Palette

| Purpose | Color | Hex | Usage |
| --- | --- | --- | --- |
| Primary | Aurora Violet | `#6C4EFF` | Buttons, highlights |
| Secondary | Sunlit Amber | `#FFB43B` | Accents, hover states |
| Background | Polar White | `#F5F7FB` | Page background |
| Surface | Glacier Gray | `#E1E6EF` | Cards, panels |
| Text Primary | Deep Space | `#1B1F2A` | Body text |
| Text Secondary | Slate Drift | `#4C5365` | Metadata |
| Success | Alpine Green | `#3CBF7C` | Status badges |
| Danger | Ember Red | `#E0565B` | Alerts |

**Accessibility**: Ensure 4.5:1 contrast between text and backgrounds; use darker overlays on hero images (rgba(27,31,42,0.6)).

---

## Wireframe Summaries

### Home Page
```
+------------------------------------------------------------+
| Sticky Header                                              |
| Logo | Timeline | Explore | About | Search | Profile        |
+------------------------------------------------------------+
| HERO COLLAGE + CTA                                         |
| [Tagline + Button]                                         |
+------------------------------------------------------------+
| TIMELINE RIBBON (Month chips with counts)                  |
+------------------------------------------------------------+
| FEATURED MONTH (Grid of 4 cards)                           |
| [Event Card][Event Card][Event Card][Event Card]           |
+------------------------------------------------------------+
| STORY STRIP (Editorial highlight with copy + image)        |
+------------------------------------------------------------+
| FOOTER                                                     |
+------------------------------------------------------------+
```

### Month Detail Page
```
+-----------------------------------------------+
| Header (Month title, summary, filters)        |
+-------------------+---------------------------+
| Sticky filter rail | Featured gallery carousel |
| (chips)            |                           |
+-------------------+---------------------------+
| Gallery grid (3-4 columns with cover images)  |
+-----------------------------------------------+
| Related months / CTA                          |
+-----------------------------------------------+
```

### Gallery Page
```
+--------------------------------------------------+
| Header: Hero image, title, location, CTAs        |
+-------------+------------------------------------+
| Meta Panel  | Photo Grid (4 column masonry)      |
| - Date      |                                    |
| - Photog    |                                    |
| - Tags      |                                    |
| - Download  |                                    |
+-------------+------------------------------------+
| Lightbox overlay triggered on click              |
+--------------------------------------------------+
```

### Mobile Home (Condensed)
```
+------------------------------+
| Top Bar: ☰ Logo  🔍          |
+------------------------------+
| Hero image                   |
| Tagline + CTA                |
+------------------------------+
| Timeline chips (horizontal)  |
+------------------------------+
| Single column event cards    |
+------------------------------+
| Footer                       |
+------------------------------+
```

---

## Key Page Priorities
- **Home**: Inspire exploration, spotlight key months/events.
- **Timeline / Browse**: Quick month-to-month navigation.
- **Gallery**: Immersive viewing with intuitive filtering.
- **Explore**: Advanced metadata-driven discovery.
- **About**: Showcase mission, contributors, contact.

---

## Next Steps
1. Build interactive prototypes in Figma following these guidelines.
2. Conduct usability testing with target audiences (community members, organizers, press).
3. Iterate on metadata taxonomy based on actual content ingestion.
4. Align engineering on data model and API endpoints supporting filters and search.

