# Meilin's Apothecary

A static web app for looking up herbal medicines from the Alchemy Almanac system, designed for use with the Meilin Starwell character in Spelljammer campaigns.

## Features

- **Medicine Lookup**: Search and filter all recipes by name, category, difficulty, or ingredient
- **Recipe Cards**: View full details including effects, duration, DC, and required components
- **Dice Roller**: Roll d20 for crafting checks with advantage toggle
- **Ingredient Reference**: Find where to gather each ingredient by terrain type
- **Quick Rules**: Collapsible reference for crafting and gathering rules

## Usage

### Local Development

Simply open `index.html` in a web browser. No build step required.

For local development with live reload, you can use any simple HTTP server:

```bash
# Python 3
python -m http.server 8000

# Node.js (if you have npx)
npx serve
```

### GitHub Pages Deployment

1. Push this folder to a GitHub repository
2. Go to Settings > Pages
3. Select "Deploy from a branch" and choose `main` (or your branch)
4. Your app will be available at `https://yourusername.github.io/repository-name/`

## File Structure

```text
meilin-starwell-app/
├── index.html              # Main app page
├── css/
│   └── style.css           # Apothecary-themed styles
├── js/
│   ├── app.js              # Main app logic
│   ├── dice.js             # Dice rolling utilities
│   └── data/
│       ├── medicines.json  # All recipes
│       └── ingredients.json # Flora and creature parts
└── README.md               # This file
```

## Data Sources

Medicine and ingredient data is derived from the Alchemy Almanac homebrew system, as documented in the Meilin Starwell character files.

## Credits

- Character: Meilin Starwell
- System: Alchemy Almanac (homebrew)
- Setting: Spelljammer / Rock of Bral
