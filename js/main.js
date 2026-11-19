/**
 * Meilin Starwell Character Companion - Main Entry Point
 * ES Module application that fully drives the app.
 */

// Core modules
import { store } from './core/state.js';
import { events } from './core/events.js';
import { dataLoader } from './core/data-loader.js';
import { icons } from './core/icons.js';
import { debug } from './core/debug.js';

// Core functionality
import * as auth from './core/auth.js';
import * as navigation from './core/navigation.js';
import * as ui from './core/ui.js';
import * as easterEggs from './core/easter-eggs.js';
import { PAGES } from './core/pages.js';

// Page controllers
import * as rumorsPage from './pages/rumors.js';
import * as overviewPage from './pages/overview.js';
import * as novelettePage from './pages/novelette.js';
import * as dmsummaryPage from './pages/dmsummary.js';
import * as dmtoolsPage from './pages/dmtools.js';
import * as medicinePage from './pages/medicine.js';
import * as ingredientsPage from './pages/ingredients.js';
import * as vignettesPage from './pages/vignettes.js';
import * as rulesPage from './pages/rules.js';
import * as craftPage from './pages/craft.js';

// Components module (no web components currently registered)
import './components/index.js';

/**
 * Load the herbal medicine data the first time that page opens.
 * Kept off the startup path so a failure here can't take down the other pages.
 * @returns {Promise<boolean>} Whether the data is available
 */
async function loadHerbalData() {
    if (store.get('medicines')) return true;
    try {
        const [medicinesData, ingredientsData] = await Promise.all([
            dataLoader.loadJSON('js/data/medicines.json'),
            dataLoader.loadJSON('js/data/ingredients.json')
        ]);
        
        store.set('medicines', medicinesData.medicines || []);
        store.set('rules', medicinesData.rules || {});
        store.set('harvesting', medicinesData.harvesting || {});
        store.set('primaryComponents', medicinesData.primaryComponents || {});
        store.set('ingredients', ingredientsData);
        
        return true;
    } catch (error) {
        console.error('Failed to load herbal medicine data:', error);
        ui.showError("Couldn't load the herbal medicine data. Check your connection, then open this page again.");
        return false;
    }
}

/**
 * Initialize application state
 */
function initializeState() {
    store.set('appUnlocked', false);
    store.set('currentPage', null);
    store.set('currentTab', 'ingredients');
    store.set('selectedTerrain', 'Arctic');
    store.set('currentFilters', {
        search: '',
        category: 'all',
        difficulty: 'all',
        ingredientType: 'all'
    });
    
    // Check stored unlock status
    auth.checkStoredUnlock();
}

/**
 * Bind filter events for medicine page
 */
function bindFilterEvents() {
    const searchInput = document.getElementById('search-input');
    const clearSearch = document.getElementById('clear-search');
    
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const filters = store.get('currentFilters');
            store.set('currentFilters', { ...filters, search: e.target.value.toLowerCase() });
        });
    }
    
    if (clearSearch) {
        clearSearch.addEventListener('click', () => {
            if (searchInput) searchInput.value = '';
            const filters = store.get('currentFilters');
            store.set('currentFilters', { ...filters, search: '' });
        });
    }
    
    ['category-filter', 'difficulty-filter', 'ingredient-type-filter', 'sort-filter'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('change', (e) => {
                const key = id.replace('-filter', '').replace('-', '');
                const filters = store.get('currentFilters');
                store.set('currentFilters', { ...filters, [key === 'ingredienttype' ? 'ingredientType' : key]: e.target.value });
            });
        }
    });
}

/**
 * Loader for each page in the registry (js/core/pages.js), run on every visit.
 * Each loader skips work that's already done.
 */
const PAGE_LOADERS = {
    rumors: async () => {
        if (!rumorsPage.getRumorsData()) await rumorsPage.loadRumors();
    },
    overview: async () => {
        if (!overviewPage.getOverviewData()) await overviewPage.loadOverview();
    },
    dmsummary: async () => {
        if (!dmsummaryPage.getDMSummaryData()) await dmsummaryPage.loadDMSummary();
    },
    novelette: async () => {
        if (!novelettePage.getNovelette()) await novelettePage.loadNovelette();
    },
    vignettes: async () => {
        if (!vignettesPage.getVignettes()?.length) await vignettesPage.loadVignettes();
    },
    dmtools: async () => {
        await dmtoolsPage.loadDMToolsContent();
    },
    medicine: async () => {
        if (!await loadHerbalData()) return;
        medicinePage.renderMedicines();
        ingredientsPage.renderIngredients();
        rulesPage.renderQuickRules();
        rulesPage.renderHarvestingRules();
        rulesPage.renderPotionRules();
        craftPage.initCraft();
    }
};

/**
 * Handle page changes and lazy load content
 */
function setupPageLoading() {
    const missing = PAGES.filter(page => !PAGE_LOADERS[page.id]).map(page => page.id);
    if (missing.length) {
        debug.error(`No loader for page(s): ${missing.join(', ')}`);
    }
    events.on('page:change', async ({ page }) => {
        await PAGE_LOADERS[page]?.();
    });
}

/**
 * Main initialization
 */
async function init() {
    debug.log('Initializing Meilin Starwell Companion...');
    
    try {
        // Set up markdown parser
        if (typeof marked !== 'undefined') {
            dataLoader.setMarkdownParser(marked.parse);
        }
        
        // Initialize state
        initializeState();
        
        // Bind UI events
        auth.bindPasskeyEvents();
        navigation.bindNavigationEvents();
        ui.bindGlobalLightbox();
        ui.bindModalEvents();
        ui.addDynamicStyles();
        bindFilterEvents();
        
        // Setup page loading
        setupPageLoading();
        
        // Initialize icons
        icons.init();
        
        // Initialize easter eggs
        easterEggs.initEasterEggs();
        
        // Handle initial page from URL hash
        navigation.handleHashChange();
        
        debug.log('Meilin Starwell Companion initialized successfully');
        events.emit('app:ready');
        
    } catch (error) {
        console.error('Failed to initialize app:', error);
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// Export for debugging and external access
export {
    store, events, dataLoader, icons,
    auth, navigation, ui, easterEggs,
    rumorsPage, overviewPage, novelettePage, dmsummaryPage, dmtoolsPage, medicinePage,
    ingredientsPage, vignettesPage, rulesPage, craftPage
};
