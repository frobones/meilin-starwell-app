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

// Web Components
import { ModalDialog, MedicineCard, RumorCard, LightBox } from './components/index.js';

/**
 * Application configuration
 */
const CONFIG = {
    STORAGE_KEY: 'meilin-backstory-unlocked',
    INVENTORY_STORAGE_KEY: 'meilin-inventory',
    DEFAULT_PAGE: 'rumors'
};

/**
 * Load application data
 */
async function loadData() {
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
        console.error('Failed to load data:', error);
        ui.showError('Failed to load data. Please refresh the page.');
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
 * Handle page changes and lazy load content
 */
function setupPageLoading() {
    events.on('page:change', async ({ page }) => {
        switch (page) {
            case 'rumors':
                if (!rumorsPage.getRumorsData()) {
                    await rumorsPage.loadRumors();
                }
                break;
            case 'overview':
                if (!overviewPage.getOverviewData()) {
                    await overviewPage.loadOverview();
                }
                break;
            case 'dmsummary':
                if (!dmsummaryPage.getDMSummaryData()) {
                    await dmsummaryPage.loadDMSummary();
                }
                break;
            case 'novelette':
                if (!novelettePage.getNovelette()) {
                    await novelettePage.loadNovelette();
                }
                break;
            case 'vignettes':
                if (!vignettesPage.getVignettes()?.length) {
                    await vignettesPage.loadVignettes();
                }
                break;
            case 'dmtools':
                await dmtoolsPage.loadDMToolsContent();
                break;
            case 'medicine':
                medicinePage.renderMedicines();
                ingredientsPage.renderIngredients();
                rulesPage.renderQuickRules();
                rulesPage.renderHarvestingRules();
                rulesPage.renderPotionRules();
                craftPage.initCraft();
                break;
        }
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
        
        // Load data
        const dataLoaded = await loadData();
        if (!dataLoaded) return;
        
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
    store, events, dataLoader, icons, CONFIG,
    auth, navigation, ui, easterEggs,
    rumorsPage, overviewPage, novelettePage, dmsummaryPage, dmtoolsPage, medicinePage,
    ingredientsPage, vignettesPage, rulesPage, craftPage,
    ModalDialog, MedicineCard, RumorCard, LightBox
};
