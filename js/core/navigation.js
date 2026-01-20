/**
 * Navigation Module
 * Handles page switching, tab handling, URL hash routing, and mobile drawer.
 */

import { store } from './state.js';
import { events } from './events.js';
import { icons } from './icons.js';
import { canNavigateTo } from './auth.js';

// ============================================
// Screen Reader Announcements
// ============================================

// Friendly page names for screen reader announcements
const PAGE_NAMES = {
    'overview': 'Character Overview',
    'dmsummary': 'DM Summary',
    'rumors': 'Rumors',
    'novelette': 'Novelette',
    'vignettes': 'Vignettes',
    'dmtools': 'DM Tools',
    'medicine': 'Herbal Medicine'
};

/**
 * Announce a message to screen readers via aria-live region
 * @param {string} message - The message to announce
 */
function announce(message) {
    const el = document.getElementById('sr-announcements');
    if (el) {
        // Clear first to ensure repeated announcements are read
        el.textContent = '';
        // Use setTimeout to ensure the clear registers before new content
        setTimeout(() => {
            el.textContent = message;
        }, 50);
    }
}

// ============================================
// Mobile Drawer
// ============================================

/**
 * Open the mobile drawer
 */
export function openDrawer() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('drawer-overlay');
    if (sidebar) sidebar.classList.add('open');
    if (overlay) overlay.classList.add('active');
    document.body.style.overflow = 'hidden'; // Prevent scroll when drawer is open
}

/**
 * Close the mobile drawer
 */
export function closeDrawer() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('drawer-overlay');
    if (sidebar) sidebar.classList.remove('open');
    if (overlay) overlay.classList.remove('active');
    document.body.style.overflow = ''; // Restore scroll
}

/**
 * Toggle the mobile drawer
 */
export function toggleDrawer() {
    const sidebar = document.getElementById('sidebar');
    if (sidebar?.classList.contains('open')) {
        closeDrawer();
    } else {
        openDrawer();
    }
}

/**
 * Check if we're on mobile (drawer mode)
 */
function isMobileView() {
    return window.innerWidth <= 768;
}

/**
 * Bind mobile drawer events
 */
export function bindDrawerEvents() {
    const hamburgerBtn = document.getElementById('hamburger-btn');
    const overlay = document.getElementById('drawer-overlay');
    
    // Hamburger button toggles drawer
    if (hamburgerBtn) {
        hamburgerBtn.addEventListener('click', toggleDrawer);
    }
    
    // Overlay click closes drawer
    if (overlay) {
        overlay.addEventListener('click', closeDrawer);
    }
    
    // Close drawer on escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeDrawer();
        }
    });
}

/**
 * Handle URL hash changes
 */
export function handleHashChange() {
    const hash = window.location.hash.slice(1) || 'rumors';
    const validPages = ['overview', 'dmsummary', 'medicine', 'novelette', 'vignettes', 'dmtools', 'rumors'];
    if (validPages.includes(hash)) {
        switchPage(hash, false);
    }
}

/**
 * Switch between main pages
 */
export function switchPage(pageName, updateHash = true) {
    // Check if page requires authentication
    if (!canNavigateTo(pageName)) {
        return;
    }
    
    store.set('currentPage', pageName);
    
    // Update sidebar nav
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.toggle('active', link.dataset.page === pageName);
    });
    
    // Update page visibility
    document.querySelectorAll('.page').forEach(page => {
        page.classList.toggle('active', page.id === `${pageName}-page`);
    });
    
    // Update URL hash
    if (updateHash) {
        history.replaceState(null, '', `#${pageName}`);
    }
    
    // Scroll to top
    window.scrollTo(0, 0);
    
    // Emit page change event for lazy loading
    events.emit('page:change', { page: pageName });
    
    // Announce page change to screen readers
    const friendlyName = PAGE_NAMES[pageName] || pageName;
    announce(`Navigated to ${friendlyName}`);
    
    // Refresh icons
    icons.refresh();
}

/**
 * Switch between DM Tools tabs
 */
export function switchDMToolsTab(tabName) {
    document.querySelectorAll('.dmtools-tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.dmtab === tabName);
    });
    
    document.querySelectorAll('.dmtools-panel').forEach(panel => {
        panel.classList.toggle('active', panel.id === `${tabName}-panel`);
    });
}

/**
 * Switch between medicine page tabs
 */
export function switchTab(tabName) {
    store.set('currentTab', tabName);
    
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tabName);
    });
    
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.toggle('active', content.id === `${tabName}-tab`);
    });
}

/**
 * Scroll to a section on the current page
 */
export function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

/**
 * Bind navigation events
 */
export function bindNavigationEvents() {
    // Bind mobile drawer events
    bindDrawerEvents();
    
    // Sidebar navigation
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const page = link.dataset.page;
            switchPage(page);
            
            // Close drawer on mobile after navigation
            if (isMobileView()) {
                closeDrawer();
            }
        });
    });
    
    // DM Tools tabs
    document.querySelectorAll('.dmtools-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            const tabName = tab.dataset.dmtab;
            switchDMToolsTab(tabName);
        });
    });
    
    // Medicine page tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            switchTab(btn.dataset.tab);
        });
    });
    
    // Handle browser back/forward
    window.addEventListener('hashchange', handleHashChange);
}

// Listen for navigation requests
events.on('navigate:to', ({ page, section }) => {
    switchPage(page);
    if (page === 'dmtools' && section) {
        setTimeout(() => switchDMToolsTab(section), 100);
    } else if (section) {
        setTimeout(() => scrollToSection(`${section}-section`), 100);
    }
});

// Also listen for navigate:request (used by overview quick links)
events.on('navigate:request', ({ page, section }) => {
    switchPage(page);
    if (page === 'dmtools' && section) {
        setTimeout(() => switchDMToolsTab(section), 100);
    } else if (section) {
        setTimeout(() => scrollToSection(`${section}-section`), 100);
    }
});

