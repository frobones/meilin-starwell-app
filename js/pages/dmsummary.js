/**
 * DM Summary Page Controller
 * Loads and renders a condensed backstory for DMs.
 * 
 * Data is loaded from:
 * - content/character/dm-summary.json
 */

import { dataLoader } from '../core/data-loader.js';
import { events } from '../core/events.js';
import { icons } from '../core/icons.js';

// Private state
let dmSummaryData = null;

/**
 * Load DM Summary content
 */
export async function loadDMSummary() {
    const container = document.getElementById('dmsummary-content');
    if (!container) return;

    container.innerHTML = '<div class="loading-spinner">Loading summary...</div>';

    try {
        dmSummaryData = await dataLoader.loadJSON('content/character/dm-summary.json');
        const html = renderDMSummary(dmSummaryData);
        container.innerHTML = html;
        icons.refresh();
        events.emit('dmsummary:loaded');
    } catch (error) {
        console.error('Failed to load DM summary:', error);
        container.innerHTML = '<p class="error-message">Failed to load DM summary.</p>';
    }
}

/**
 * Render the DM Summary page content
 * @param {Object} data - The dm-summary.json data
 * @returns {string} HTML string
 */
function renderDMSummary(data) {
    return `
        <!-- Basic Stats Bar -->
        <div class="dmsummary-basics">
            <span class="dmsummary-basic">${data.basics.species}</span>
            <span class="dmsummary-basic">${data.basics.gender}, ${data.basics.age}</span>
            <span class="dmsummary-basic">${data.basics.height}, ${data.basics.weight}</span>
            <span class="dmsummary-basic">${data.basics.class}</span>
            <span class="dmsummary-basic">${data.basics.background}</span>
            <span class="dmsummary-basic">${data.basics.alignment}</span>
        </div>

        <!-- Read Time Badge -->
        <div class="dmsummary-meta">
            <span class="dmsummary-readtime">
                <i data-lucide="clock"></i>
                ${data.readTime} read
            </span>
        </div>

        <!-- Narrative Sections -->
        <div class="dmsummary-narrative">
            ${data.sections.map(section => `
                <section class="dmsummary-section">
                    <h2 class="dmsummary-section-heading">
                        <span class="dmsummary-section-icon"><i data-lucide="${section.icon}"></i></span>
                        ${section.heading}
                    </h2>
                    <p class="dmsummary-section-text">${section.text}</p>
                </section>
            `).join('')}
        </div>

        <!-- At a Glance -->
        <aside class="dmsummary-glance">
            <h3 class="dmsummary-glance-title">
                <i data-lucide="list"></i>
                At a Glance
            </h3>
            <dl class="dmsummary-glance-list">
                <div class="dmsummary-glance-item">
                    <dt>Origin</dt>
                    <dd>${data.atAGlance.origin}</dd>
                </div>
                <div class="dmsummary-glance-item">
                    <dt>Current Location</dt>
                    <dd>${data.atAGlance.currentLocation}</dd>
                </div>
                <div class="dmsummary-glance-item">
                    <dt>Occupation</dt>
                    <dd>${data.atAGlance.occupation}</dd>
                </div>
                <div class="dmsummary-glance-item">
                    <dt>Carrying Proof</dt>
                    <dd>${data.atAGlance.carryingProof}</dd>
                </div>
                <div class="dmsummary-glance-item">
                    <dt>Weakness</dt>
                    <dd>${data.atAGlance.weakness}</dd>
                </div>
                <div class="dmsummary-glance-item">
                    <dt>Anchor</dt>
                    <dd>${data.atAGlance.anchor}</dd>
                </div>
            </dl>
        </aside>
    `;
}

/**
 * Get DM Summary data
 */
export function getDMSummaryData() {
    return dmSummaryData;
}

// Listen for page change events
events.on('page:change', ({ page }) => {
    if (page === 'dmsummary' && !dmSummaryData) {
        loadDMSummary();
    }
});
