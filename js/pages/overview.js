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

    // Drives card
    const drivesContainer = document.getElementById('aag-drives-list');
    if (drivesContainer) {
        drivesContainer.innerHTML = `
            <li><span class="item-label">Want:</span><span class="item-value">${data.drives.want}</span></li>
            <li><span class="item-label">Need:</span><span class="item-value">${data.drives.need}</span></li>
            <li><span class="item-label">Fear:</span><span class="item-value">${data.drives.fear}</span></li>
            <li><span class="item-label">Temptation:</span><span class="item-value">${data.drives.temptation}</span></li>
            <li><span class="item-label">Duty:</span><span class="item-value">${data.drives.responsibility}</span></li>
        `;
    }

    // Boundaries card
    const boundariesContainer = document.getElementById('aag-boundaries-list');
    if (boundariesContainer) {
        boundariesContainer.innerHTML = `
            <li><span class="item-label">Hard Line:</span><span class="item-value">${data.boundaries.hardLine}</span></li>
            <li><span class="item-label">Gray Area:</span><span class="item-value">${data.boundaries.grayArea}</span></li>
            <li><span class="item-label">Earns Trust:</span><span class="item-value">${data.boundaries.earnsTrust}</span></li>
            <li><span class="item-label">Breaks Trust:</span><span class="item-value">${data.boundaries.breaksTrust}</span></li>
            <li><span class="item-label">Instant Anger:</span><span class="item-value">${data.boundaries.instantAnger}</span></li>
            <li><span class="item-label">Melts Guard:</span><span class="item-value">${data.boundaries.meltsGuard}</span></li>
        `;
    }

    // Shared Anchor card
    const glueContainer = document.getElementById('aag-glue-list');
    if (glueContainer) {
        glueContainer.innerHTML = `
            <li><span class="item-label">I Need:</span><span class="item-value">${data.partyGlue.whyINeed}</span></li>
            <li><span class="item-label">I Offer:</span><span class="item-value">${data.partyGlue.howIHelp}</span></li>
            <li><span class="item-label">My Role:</span><span class="item-value">${data.partyGlue.myRole}</span></li>
            <li><span class="item-label">Fear:</span><span class="item-value">${data.partyGlue.secretFear}</span></li>
        `;
    }

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

// Listen for page change events
events.on('page:change', ({ page }) => {
    if (page === 'overview' && !overviewData) {
        loadOverview();
    }
});
