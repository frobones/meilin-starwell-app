# Meilin Starwell | Character Companion

A static web app serving as a complete character reference for the Meilin Starwell character in Spelljammer campaigns. Built for both players and DMs.

## Features

### Character Overview

- Core concept, trouble, and defining moment
- Character drives, boundaries, and party dynamics
- Tiered secrets (player-known, DM-only, deep lore)

The passkey is a spoiler gate, not access control: this repository is public and all `content/` JSON is readable by anyone. Don't publish anything that must stay secret.

### Rumors (Player-Facing)

- Interactive rumor mill with hover-to-reveal effects
- Character gallery with crossfading images
- Character turnaround with interactive hotspots

### Backstory

- Full narrative backstory with chapter navigation
- 12 life chapters from childhood to present day
- 10 character vignettes showcasing personality and skills

### DM Tools

- **Knives**: Plot hooks and pressure points for dramatic tension
- **Relationships**: NPCs, factions, and connection details
- **Locations**: Key setting information (Mindersand, Medica)

### Herbal Medicine

- Medicine lookup with search and category filters
- Recipe cards with effects, duration, DC, and components
- Ingredient reference organized by terrain type
- Interactive crafting system with inventory management
- Collapsible crafting and gathering rules

## Content sources

This directory is a **separate git repository** for the website only. Narrative content and characters art are **authored** in the parent campaign workspace:

`characters/Meilin_Starwell/`

Mirrored/publish targets here:

- `content/backstory/chapters/*.json`, `content/vignettes/*.json` (from author chapter/vignette Markdown)
- `content/rumors.json` (from Rumor Mill; DM truth key is not published)
- `img/` web JPEGs encoded from the PNG masters (portrait, sidebar avatar, turnaround, key art, banner, scene, easter egg, rumor stills)

**Prefer not to hand-edit** those mirrored files. From the campaign workspace root:

```bash
make sync-dry
make sync
# or: node scripts/sync-meilin-app.mjs
```

Still maintained in this app (not v1-scripted): `content/character/*`, `content/dm/*`, `content/backstory/backstory.json`, `js/data/medicines.json`, `js/data/ingredients.json`.

## Usage

### Local Development

Open `index.html` in a web browser. No build step required.

For local development with live reload:

```bash
# Python 3
python -m http.server 8000

# Node.js
npx serve
```

### GitHub Pages Deployment

The app includes a GitHub Actions workflow for automated deployment:

1. Push to the `main` branch
2. GitHub Actions will automatically:
   - Run the build script (copies the site to `dist/`)
   - Deploy the `dist/` folder to GitHub Pages
3. Access at `https://yourusername.github.io/repository-name/`

**First-time setup:**

1. Go to Settings > Pages
2. Under "Build and deployment", select "GitHub Actions"

**Manual deployment (alternative):**

If you prefer manual deployment without the build step:

1. Go to Settings > Pages
2. Select "Deploy from a branch" and choose your branch
3. The app works the same; the build step only trims repo tooling from what's published

### Build Script

The build script (`scripts/build.js`) copies the site to `dist/`, leaving out repo tooling (`scripts/`, `.github/`, `package.json`). It fetches nothing: `marked` and `lucide` are vendored at pinned versions in `js/vendor/` with their licenses, so the Content Security Policy allows scripts from `'self'` only.

## File Structure

```text
meilin-starwell-app/
├── index.html              # Single-page application entry point
├── 404.html                # Custom 404 page for GitHub Pages
├── README.md
├── package.json            # build/dev scripts (no dependencies)
├── .github/workflows/
│   └── deploy.yml          # Build and deploy to GitHub Pages
├── scripts/
│   └── build.js            # Copy the site to dist/
├── css/
│   ├── base/
│   │   ├── variables.css   # CSS custom properties
│   │   ├── reset.css       # Base reset and root styles
│   │   ├── typography.css  # Text styling
│   │   ├── utilities.css   # Utility classes
│   │   └── print.css       # Print-specific styles
│   ├── layout/
│   │   ├── app-layout.css  # Main app grid/flexbox layout
│   │   ├── sidebar.css     # Navigation sidebar
│   │   └── header.css      # Page headers
│   ├── components/
│   │   ├── modals.css      # Modal dialogs
│   │   ├── lightbox.css    # Image lightbox
│   │   ├── cards.css       # Card components
│   │   ├── tabs.css        # Tab navigation
│   │   ├── forms.css       # Form elements
│   │   ├── tables.css      # Data tables
│   │   ├── rules.css       # Rules reference styling
│   │   ├── footer.css      # Footer styling
│   │   └── notifications.css # Toast notifications
│   └── pages/
│       ├── overview.css    # Character overview page
│       ├── dmsummary.css   # Condensed DM backstory
│       ├── rumors.css      # Rumors page with gallery
│       ├── novelette.css   # Backstory reader
│       ├── vignettes.css   # Vignette cards and modal
│       ├── dmtools.css     # DM tools page
│       └── medicine.css    # Herbal medicine system
├── js/
│   ├── main.js             # Application entry point
│   ├── core/
│   │   ├── auth.js         # Passkey spoiler gate
│   │   ├── data-loader.js  # JSON fetching with caching
│   │   ├── debug.js        # Debug logging utility
│   │   ├── easter-eggs.js  # Hidden features
│   │   ├── events.js       # Event bus system
│   │   ├── focus-trap.js   # Modal focus management
│   │   ├── icons.js        # Lucide icon initialization
│   │   ├── navigation.js   # Page routing
│   │   ├── pages.js        # Page registry (ids, titles, passkey gate)
│   │   ├── state.js        # Reactive state management
│   │   └── ui.js           # UI utilities and notifications
│   ├── components/
│   │   └── index.js        # Placeholder; no web components registered
│   ├── pages/
│   │   ├── overview.js     # At-a-glance character overview
│   │   ├── dmsummary.js    # Condensed DM backstory
│   │   ├── novelette.js    # Backstory reader with chapters
│   │   ├── vignettes.js    # Vignette cards and modal
│   │   ├── rumors.js       # Rumor mill and gallery
│   │   ├── dmtools.js      # Knives, relationships, locations
│   │   ├── medicine.js     # Medicine list and filters
│   │   ├── ingredients.js  # Ingredients by terrain
│   │   ├── craft.js        # Crafting and inventory
│   │   └── rules.js        # Quick, harvesting, and potion rules
│   ├── data/
│   │   ├── medicines.json
│   │   └── ingredients.json
│   └── vendor/             # marked 9.1.6 and lucide 0.562.0, with licenses
├── content/
│   ├── backstory/
│   │   ├── backstory.json  # Novelette sections and config
│   │   └── chapters/       # 12 life chapter files (chapter-NN.json)
│   ├── character/
│   │   ├── overview.json   # Core character data
│   │   └── dm-summary.json # Condensed DM backstory
│   ├── dm/
│   │   ├── knives.json     # Plot hooks
│   │   ├── relationships.json
│   │   ├── mindersand.json # Location data
│   │   └── medica.json     # Location data
│   ├── rumors.json
│   └── vignettes/          # index.json + 10 vignette-NN.json files
└── img/                    # Web JPEGs encoded by the workspace sync
    ├── banner.jpg
    ├── easter_egg.jpg
    ├── key_art.jpg
    ├── portrait.jpg
    ├── portrait_avatar.jpg # 512px sidebar avatar
    ├── scene.jpg
    ├── turnaround.jpg
    └── rumor_*.jpg         # 9 rumor scene images
```

## Architecture

The app uses a modular ES6 architecture with:

- **Event Bus**: Pub/sub system for loose coupling between modules
- **Reactive State**: Simple state management with change listeners
- **Data Loader**: Centralized JSON loading with caching; chapter and vignette JSON embeds Markdown rendered with `marked`
- **Page controllers**: One module per page; reusable UI is plain HTML with CSS classes (no web components)

CSS follows a component-based organization with CSS custom properties for theming. Stylesheets are loaded in parallel via `<link>` tags for optimal performance.

## Data Sources

- Character data derived from Meilin Starwell character files (publish with `scripts/sync-meilin-app.mjs` in the campaign workspace)
- Medicine and ingredient data from the Alchemy Almanac homebrew system

## Credits

- Character: Meilin Starwell
- System: Alchemy Almanac (homebrew)
- Setting: Spelljammer / Rock of Bral
