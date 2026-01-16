/**
 * Meilin's Apothecary - Core Application
 * Main App object and initialization
 */

window.App = {
    // Data storage
    medicines: [],
    ingredients: null,
    rules: null,
    harvesting: null,
    primaryComponents: null,
    creaturePartsLookup: null,
    
    // Craft data
    ingredientInventory: {},
    ingredientsList: null,
    craftModalState: null,
    craftEventsBound: false,
    INVENTORY_STORAGE_KEY: 'meilin-inventory',
    
    // At a Glance data (top-level page)
    overviewData: null,
    
    // Backstory data
    backstoryContent: null,
    vignettes: [],
    knives: [],
    relationships: null,
    mindersandData: null,
    medicaData: null,
    rumorsData: null,
    
    // Passkey configuration
    PASSKEY: 'ms-13',
    STORAGE_KEY: 'meilin-backstory-unlocked',
    PROTECTED_PAGES: ['overview', 'backstory', 'dmtools'],
    
    // Current state
    currentFilters: {
        search: '',
        category: 'all',
        difficulty: 'all',
        ingredientType: 'all'
    },
    currentTab: 'medicines',
    selectedTerrain: 'Arctic',
    currentPage: null,
    currentSubtab: 'background',
    appUnlocked: false,
    pendingPage: 'overview',

    /**
     * Initialize the application
     */
    async init() {
        try {
            await this.loadData();
            this.bindEvents();
            this.bindPageEvents();
            this.bindPasskeyEvents();
            this.bindGlobalLightbox();
            this.checkStoredUnlock();
            this.renderMedicines();
            this.renderIngredients();
            this.renderQuickRules();
            this.renderHarvestingRules();
            this.renderPotionRules();
            
            // Initialize craft tab
            this.buildIngredientsList();
            this.loadInventory();
            this.renderCraftInventory();
            this.renderCraftableMedicines();
            this.bindCraftEvents();
            
            // Handle initial page based on URL hash
            this.handleHashChange();
            
            console.log('Meilin Starwell Companion initialized successfully');
        } catch (error) {
            console.error('Failed to initialize app:', error);
            this.showError('Failed to load data. Please refresh the page.');
        }
    },

    /**
     * Load JSON data files
     */
    async loadData() {
        const [medicinesResponse, ingredientsResponse] = await Promise.all([
            fetch('js/data/medicines.json'),
            fetch('js/data/ingredients.json')
        ]);

        if (!medicinesResponse.ok || !ingredientsResponse.ok) {
            throw new Error('Failed to fetch data files');
        }

        const medicinesData = await medicinesResponse.json();
        const ingredientsData = await ingredientsResponse.json();

        this.medicines = medicinesData.medicines;
        this.rules = medicinesData.rules;
        this.harvesting = medicinesData.harvesting;
        this.primaryComponents = medicinesData.primaryComponents;
        this.ingredients = ingredientsData;
        
        // Build creature parts lookup by name for quick access
        this.creaturePartsLookup = this.buildCreaturePartsLookup();
    },
    
    /**
     * Build a lookup map for creature parts by name
     */
    buildCreaturePartsLookup() {
        const lookup = {};
        const creatureParts = this.ingredients?.creatureParts;
        
        if (!creatureParts) return lookup;
        
        for (const [creatureType, parts] of Object.entries(creatureParts)) {
            for (const part of parts) {
                if (lookup[part.name]) {
                    lookup[part.name].creatureTypes.push(creatureType);
                    lookup[part.name].sources.push({
                        creatureType: creatureType,
                        source: part.source
                    });
                } else {
                    lookup[part.name] = {
                        name: part.name,
                        creatureTypes: [creatureType],
                        dc: part.dc,
                        amount: part.amount,
                        sources: [{
                            creatureType: creatureType,
                            source: part.source
                        }],
                        use: part.use
                    };
                }
            }
        }
        
        return lookup;
    },

    /**
     * Refresh Lucide icons after dynamic content render
     */
    refreshIcons() {
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    },

    /**
     * Fetch and parse a markdown file
     */
    async fetchMarkdown(path) {
        try {
            const response = await fetch(path);
            if (!response.ok) {
                throw new Error(`Failed to fetch ${path}`);
            }
            const markdown = await response.text();
            return marked.parse(markdown);
        } catch (error) {
            console.error('Error loading markdown:', error);
            return `<p class="error-message">Failed to load content.</p>`;
        }
    },

    /**
     * Show error message
     */
    showError(message) {
        const grid = document.getElementById('medicine-grid');
        if (grid) {
            grid.innerHTML = `
                <div class="no-results">
                    <div class="no-results-icon"><i data-lucide="triangle-alert"></i></div>
                    <p>${message}</p>
                </div>
            `;
        }
    },

    /**
     * Get star display for difficulty level (legacy, used for rules display)
     */
    getStars(difficulty) {
        const filled = '★'.repeat(difficulty);
        const empty = '☆'.repeat(5 - difficulty);
        return filled + empty;
    },

    /**
     * Get difficulty label
     */
    getDifficultyLabel(difficulty) {
        const labels = {
            1: 'Low',
            2: 'Moderate',
            3: 'High',
            4: 'Very High',
            5: 'Maximum'
        };
        return labels[difficulty] || 'Unknown';
    },

    /**
     * Get the name of a secondary ingredient (handles both string and object formats)
     */
    getSecondaryName(secondary) {
        return typeof secondary === 'object' ? secondary.name : secondary;
    }
};

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.App.init();
});
