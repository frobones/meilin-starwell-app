# Meilin Starwell | Character Companion

A static web app serving as a complete character reference for the Meilin Starwell character in Spelljammer campaigns. Built for both players and DMs.

## Features

### Character Overview

- Core concept, trouble, and defining moment
- Character drives, boundaries, and party dynamics
- Tiered secrets (player-known, DM-only, deep lore)

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
   - Install dependencies
   - Run the build script (generates SRI hashes for CDN scripts)
   - Deploy the `dist/` folder to GitHub Pages
3. Access at `https://yourusername.github.io/repository-name/`

**First-time setup:**

1. Go to Settings > Pages
2. Under "Build and deployment", select "GitHub Actions"

**Manual deployment (alternative):**

If you prefer manual deployment without the build step:

1. Go to Settings > Pages
2. Select "Deploy from a branch" and choose your branch
3. The app will work but without SRI hash verification for CDN scripts

### Build Script

The build script (`scripts/build.js`) performs:

- Copies all source files to `dist/`
- Fetches CDN scripts and computes SHA-384 SRI hashes
- Injects `integrity` attributes into script tags for security

## File Structure

```text
meilin-starwell-app/
├── index.html              # Single-page application entry point
├── 404.html                # Custom 404 page for GitHub Pages
├── README.md
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
│       ├── rumors.css      # Rumors page with gallery
│       ├── backstory.css   # Backstory reader
│       ├── dmtools.css     # DM tools page
│       └── medicine.css    # Herbal medicine system
├── js/
│   ├── main.js             # Application entry point
│   ├── core/
│   │   ├── auth.js         # Simple authentication
│   │   ├── data-loader.js  # JSON/Markdown loading utilities
│   │   ├── debug.js        # Debug logging utility
│   │   ├── easter-eggs.js  # Hidden features
│   │   ├── events.js       # Event bus system
│   │   ├── focus-trap.js   # Modal focus management
│   │   ├── icons.js        # Lucide icon initialization
│   │   ├── navigation.js   # Page routing
│   │   ├── state.js        # Reactive state management
│   │   ├── templates.js    # HTML template utilities
│   │   └── ui.js           # UI utilities
│   ├── components/
│   │   ├── index.js        # Web component registration
│   │   ├── lightbox.js     # Lightbox component
│   │   ├── medicine-card.js
│   │   ├── modal-dialog.js
│   │   └── rumor-card.js
│   ├── pages/
│   │   ├── backstory.js
│   │   ├── craft.js        # Crafting system
│   │   ├── dmtools.js
│   │   ├── ingredients.js
│   │   ├── medicine.js
│   │   ├── overview.js
│   │   ├── potionrules.js
│   │   ├── rumors.js
│   │   └── vignettes.js
│   └── data/
│       ├── medicines.json
│       └── ingredients.json
├── content/
│   ├── backstory/
│   │   ├── backstory.md
│   │   └── chapters/        # 12 life chapter files
│   ├── character/
│   │   └── overview.json   # Core character data
│   ├── dm/
│   │   ├── knives.json     # Plot hooks
│   │   ├── relationships.json
│   │   ├── mindersand.json # Location data
│   │   └── medica.json     # Location data
│   ├── rumors.json
│   └── vignettes/          # 10 character vignettes
└── img/
    ├── banner.png
    ├── key_art.png
    ├── portrait.png
    ├── scene.png
    ├── turnaround.png
    └── rumor_*.png         # 9 rumor scene images
```

## Architecture

The app uses a modular ES6 architecture with:

- **Event Bus**: Pub/sub system for loose coupling between modules
- **Reactive State**: Simple state management with change listeners
- **Data Loader**: Centralized JSON/Markdown loading with caching
- **Web Components**: Custom elements for reusable UI patterns

CSS follows a component-based organization with CSS custom properties for theming. Stylesheets are loaded in parallel via `<link>` tags for optimal performance.

## Data Sources

- Character data derived from Meilin Starwell character files
- Medicine and ingredient data from the Alchemy Almanac homebrew system

## Credits

- Character: Meilin Starwell
- System: Alchemy Almanac (homebrew)
- Setting: Spelljammer / Rock of Bral
