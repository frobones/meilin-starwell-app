/**
 * Overview Page Controller
 * "At a Glance" character overview rendering.
 */

import { dataLoader } from '../core/data-loader.js';
import { events } from '../core/events.js';
import { icons } from '../core/icons.js';

// Private state
let overviewData = null;

/**
 * Load At a Glance page data
 */
export async function loadOverview() {
    try {
        overviewData = await dataLoader.loadJSON('content/character/overview.json');
        renderOverview();
        events.emit('overview:loaded', overviewData);
    } catch (error) {
        console.error('Error loading At a Glance:', error);
    }
}

/**
 * Render the At a Glance page
 */
export function renderOverview() {
    if (!overviewData) return;

    const data = overviewData;

    // Hero section
    const tagline = `${data.background} | ${data.class} | ${data.species}`;
    setTextContent('aag-tagline', tagline);
    setTextContent('aag-quote', data.quote);

    // Core Concept
    setTextContent('aag-thesis', data.coreConcept.thesis);
    setNestedText('#aag-trouble .aag-detail-text', data.coreConcept.trouble);
    setNestedText('#aag-defining .aag-detail-text', data.coreConcept.definingDetail);

    // Summary
    setTextContent('aag-summary', data.summary);

    // Drives panel
    const drivesContainer = document.getElementById('aag-drives-list');
    if (drivesContainer) {
        drivesContainer.innerHTML = `
            ${createPsycheCard('target', 'Want', data.drives.want)}
            ${createPsycheCard('heart', 'Need', data.drives.need)}
            ${createPsycheCard('alert-triangle', 'Fear', data.drives.fear)}
            ${createPsycheCard('flame', 'Temptation', data.drives.temptation)}
            ${createPsycheCard('link', 'Duty', data.drives.responsibility)}
        `;
    }

    // Boundaries panel
    const boundariesContainer = document.getElementById('aag-boundaries-list');
    if (boundariesContainer) {
        boundariesContainer.innerHTML = `
            ${createPsycheCard('ban', 'Hard Line', data.boundaries.hardLine)}
            ${createPsycheCard('help-circle', 'Gray Area', data.boundaries.grayArea)}
            ${createPsycheCard('thumbs-up', 'Earns Trust', data.boundaries.earnsTrust)}
            ${createPsycheCard('thumbs-down', 'Breaks Trust', data.boundaries.breaksTrust)}
            ${createPsycheCard('zap', 'Instant Anger', data.boundaries.instantAnger)}
            ${createPsycheCard('heart-handshake', 'Melts Guard', data.boundaries.meltsGuard)}
        `;
    }

    // Shared Anchor panel
    const glueContainer = document.getElementById('aag-glue-list');
    if (glueContainer) {
        glueContainer.innerHTML = `
            ${createPsycheCard('hand-helping', 'I Need', data.partyGlue.whyINeed)}
            ${createPsycheCard('gift', 'I Offer', data.partyGlue.howIHelp)}
            ${createPsycheCard('user-check', 'My Role', data.partyGlue.myRole)}
            ${createPsycheCard('eye-off', 'Fear', data.partyGlue.secretFear)}
        `;
    }

    // Bind compass tab events
    bindPsycheTabEvents();

    // Secrets section
    const secretsContainer = document.getElementById('aag-secrets-grid');
    if (secretsContainer) {
        secretsContainer.innerHTML = `
            <div class="aag-secret-card">
                <div class="aag-secret-label">The Secret</div>
                <div class="aag-secret-text">${data.secrets.theSecret}</div>
            </div>
            <div class="aag-secret-card">
                <div class="aag-secret-label">Why I Hide It</div>
                <div class="aag-secret-text">${data.secrets.whyHidden}</div>
            </div>
            <div class="aag-secret-card">
                <div class="aag-secret-label">If Revealed</div>
                <div class="aag-secret-text">${data.secrets.ifRevealed}</div>
            </div>
        `;
    }

    // Update quick link counts
    setTextContent('aag-knives-count', `${data.quickStats.knivesCount} hooks for the DM`);
    setTextContent('aag-relationships-count', `${data.quickStats.relationshipsCount} connections`);
    setTextContent('aag-chapters-count', `${data.quickStats.chaptersCount} chapters`);

    // Bind quick link navigation
    bindQuickLinkEvents();
    icons.refresh();
}

/**
 * Bind events for quick link cards
 */
export function bindQuickLinkEvents() {
    document.querySelectorAll('.aag-link-card[data-navigate]').forEach(card => {
        card.addEventListener('click', (e) => {
            e.preventDefault();
            const targetPage = card.dataset.navigate;
            const targetSection = card.dataset.section;
            
            // Emit navigation event for the legacy App or new router to handle
            events.emit('navigate:request', { 
                page: targetPage, 
                section: targetSection 
            });
        });
    });
}

/**
 * Get current overview data
 */
export function getOverviewData() {
    return overviewData;
}

// Helper functions
function setTextContent(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
}

function setNestedText(selector, text) {
    const el = document.querySelector(selector);
    if (el) el.textContent = text;
}

/**
 * Create a compass card element
 */
function createPsycheCard(icon, label, text) {
    return `
        <div class="compass-card">
            <div class="compass-card-icon"><i data-lucide="${icon}"></i></div>
            <div class="compass-card-content">
                <h4 class="compass-card-label">${label}</h4>
                <p class="compass-card-text">${text}</p>
            </div>
        </div>
    `;
}

/**
 * Bind compass tab switching events
 */
function bindPsycheTabEvents() {
    const tabs = document.querySelectorAll('.compass-tab');
    const panels = document.querySelectorAll('.compass-panel');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetTab = tab.dataset.tab;
            
            // Update tabs
            tabs.forEach(t => {
                t.classList.remove('active');
                t.setAttribute('aria-selected', 'false');
            });
            tab.classList.add('active');
            tab.setAttribute('aria-selected', 'true');
            
            // Update panels
            panels.forEach(panel => {
                panel.classList.remove('active');
            });
            
            const targetPanel = document.getElementById(`panel-${targetTab}`);
            if (targetPanel) {
                targetPanel.classList.add('active');
            }
        });
    });
}

// Listen for page change events
events.on('page:change', ({ page }) => {
    if (page === 'overview' && !overviewData) {
        loadOverview();
    }
});
