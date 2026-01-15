# Meilin Starwell | Character Companion

A static web app serving as a complete character reference for the Meilin Starwell character in Spelljammer campaigns. Built for both players and DMs.

## Features

### Character Overview

- Core concept, trouble, and defining moment
- Character drives, boundaries, and party dynamics
- Tiered secrets (player-known, DM-only, deep lore)

### Backstory

- Full narrative backstory with chapter navigation
- 12 life stages from childhood to present day
- 10 character vignettes showcasing personality and skills

### DM Tools

- **Knives**: Plot hooks and pressure points for dramatic tension
- **Relationships**: NPCs, factions, and connection details
- **Locations**: Key setting information (Mindersand, etc.)

### Herbal Medicine

- Medicine lookup with search and category filters
- Recipe cards with effects, duration, DC, and components
- Ingredient reference organized by terrain type
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

1. Push this folder to a GitHub repository
2. Go to Settings > Pages
3. Select "Deploy from a branch" and choose your branch
4. Access at `https://yourusername.github.io/repository-name/`

## File Structure

```text
meilin-starwell-app/
├── index.html
├── css/
│   └── style.css
├── js/
│   ├── app.js
│   └── data/
│       ├── medicines.json
│       └── ingredients.json
├── content/
│   ├── backstory/
│   │   ├── backstory.md
│   │   └── stages/          # 12 life stage chapters
│   ├── character/
│   │   └── overview.json    # Core character data
│   ├── dm/
│   │   ├── knives.json      # Plot hooks
│   │   ├── relationships.json
│   │   └── mindersand.json  # Location data
│   └── vignettes/           # 10 character vignettes
└── README.md
```

## Data Sources

- Character data derived from Meilin Starwell character files
- Medicine and ingredient data from the Alchemy Almanac homebrew system

## Credits

- Character: Meilin Starwell
- System: Alchemy Almanac (homebrew)
- Setting: Spelljammer / Rock of Bral
