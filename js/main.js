/**
 * Meilin Starwell Character Companion - Main Entry Point
 * 
 * This module initializes the application using ES modules.
 * It imports core modules and sets up the application.
 * 
 * Note: This is a gradual migration. The legacy App object is still
 * used for most functionality. This module will eventually replace
 * all legacy code.
 */

// Core modules
import { store } from './core/state.js';
import { router } from './core/router.js';
import { events } from './core/events.js';
import { dataLoader } from './core/data-loader.js';
import { icons } from './core/icons.js';

// Page controllers (import for side effects - registers event listeners)
import * as rumorsPage from './pages/rumors.js';
import * as overviewPage from './pages/overview.js';
import * as backstoryPage from './pages/backstory.js';
import * as dmtoolsPage from './pages/dmtools.js';
import * as medicinePage from './pages/medicine.js';

// Web Components (import for side effects - registers custom elements)
import { ModalDialog, MedicineCard, RumorCard, LightBox } from './components/index.js';

/**
 * Application configuration
 */
const CONFIG = {
    PASSKEY: 'ms-13',
    STORAGE_KEY: 'meilin-backstory-unlocked',
    INVENTORY_STORAGE_KEY: 'meilin-inventory',
    PROTECTED_PAGES: ['overview', 'backstory', 'dmtools'],
    DEFAULT_PAGE: 'rumors'
};

/**
 * Initialize the application state
 */
function initializeState() {
    // Set initial state
    store.set('appUnlocked', false);
    store.set('currentPage', null);
    store.set('currentFilters', {
        search: '',
        category: 'all',
        difficulty: 'all',
        ingredientType: 'all'
    });
    store.set('medicines', []);
    store.set('ingredients', null);
    
    // Check for stored unlock status
    const storedUnlock = localStorage.getItem(CONFIG.STORAGE_KEY);
    if (storedUnlock === 'true') {
        store.set('appUnlocked', true);
    }
}

/**
 * Set up the router
 */
function initializeRouter() {
    // Register page routes
    router
        .setDefault(CONFIG.DEFAULT_PAGE)
        .register('overview', (params) => handlePageChange('overview', params))
        .register('rumors', (params) => handlePageChange('rumors', params))
        .register('backstory', (params) => handlePageChange('backstory', params))
        .register('medicine', (params) => handlePageChange('medicine', params))
        .register('dmtools', (params) => handlePageChange('dmtools', params));

    // Set up navigation guard for protected pages
    router.setGuard((path, previousPath) => {
        if (CONFIG.PROTECTED_PAGES.includes(path) && !store.get('appUnlocked')) {
            store.set('pendingPage', path);
            events.emit('passkey:required');
            return false;
        }
        return true;
    });
}

/**
 * Handle page changes
 */
function handlePageChange(pageName, params = {}) {
    store.set('currentPage', pageName);
    
    // Update active states in UI
    updateNavigation(pageName);
    updatePageVisibility(pageName);
    
    // Scroll to top
    window.scrollTo(0, 0);
    
    // Emit page change event for page-specific loading
    events.emit('page:change', { page: pageName, params });
    
    // Refresh icons after page change
    icons.refresh();
}

/**
 * Update navigation active states
 */
function updateNavigation(pageName) {
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.toggle('active', link.dataset.page === pageName);
    });
}

/**
 * Update page visibility
 */
function updatePageVisibility(pageName) {
    document.querySelectorAll('.page').forEach(page => {
        page.classList.toggle('active', page.id === `${pageName}-page`);
    });
}

/**
 * Set up global event listeners
 */
function bindGlobalEvents() {
    // Navigation click handling
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const page = link.dataset.page;
            router.navigate(page);
        });
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            events.emit('modal:close');
        }
    });
}

/**
 * Integrate with legacy App object
 * This bridges the new module system with existing code
 */
function bridgeLegacyApp() {
    // Make modules available globally for legacy code
    window.AppModules = {
        // Core
        store,
        router,
        events,
        dataLoader,
        icons,
        CONFIG,
        // Pages
        pages: {
            rumors: rumorsPage,
            overview: overviewPage,
            backstory: backstoryPage,
            dmtools: dmtoolsPage,
            medicine: medicinePage
        }
    };

    // Listen for events from legacy code
    events.on('page:loaded', () => {
        icons.refresh();
    });
    
    // Handle navigation requests from modules
    events.on('navigate:request', ({ page, section }) => {
        // Delegate to legacy App if available
        if (window.App && window.App.switchPage) {
            window.App.switchPage(page);
            if (page === 'dmtools' && section && window.App.switchDMToolsTab) {
                setTimeout(() => window.App.switchDMToolsTab(section), 100);
            } else if (section && window.App.scrollToSection) {
                setTimeout(() => window.App.scrollToSection(`${section}-section`), 100);
            }
        } else {
            router.navigate(page);
        }
    });
}

/**
 * Main initialization
 */
async function init() {
    console.log('Initializing Meilin Starwell Companion (ES Modules)...');
    
    try {
        // Set up markdown parser for data loader
        if (typeof marked !== 'undefined') {
            dataLoader.setMarkdownParser(marked.parse);
        }
        
        // Initialize components
        initializeState();
        initializeRouter();
        bindGlobalEvents();
        bridgeLegacyApp();
        
        // Initialize icons
        icons.init();
        
        // Note: Router.init() is NOT called here because the legacy
        // App.init() handles initial page load. Once fully migrated,
        // uncomment the line below:
        // router.init();
        
        console.log('ES Modules initialized successfully');
        events.emit('modules:ready');
        
    } catch (error) {
        console.error('Failed to initialize modules:', error);
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// Export for debugging
export { 
    store, router, events, dataLoader, icons, CONFIG,
    rumorsPage, overviewPage, backstoryPage, dmtoolsPage, medicinePage,
    ModalDialog, MedicineCard, RumorCard, LightBox
};
