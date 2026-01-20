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
        <!-- Character Stats Grid -->
        <div class="dmsummary-stats">
            <div class="dmsummary-stat">
                <span class="dmsummary-stat-icon"><i data-lucide="user"></i></span>
                <span class="dmsummary-stat-label">Species</span>
                <span class="dmsummary-stat-value">${data.basics.species}</span>
            </div>
            <div class="dmsummary-stat">
                <span class="dmsummary-stat-icon"><i data-lucide="heart"></i></span>
                <span class="dmsummary-stat-label">Age</span>
                <span class="dmsummary-stat-value">${data.basics.gender}, ${data.basics.age}</span>
            </div>
            <div class="dmsummary-stat">
                <span class="dmsummary-stat-icon"><i data-lucide="biceps-flexed"></i></span>
                <span class="dmsummary-stat-label">Build</span>
                <span class="dmsummary-stat-value">${data.basics.height}, ${data.basics.weight}</span>
            </div>
            <div class="dmsummary-stat">
                <span class="dmsummary-stat-icon"><i data-lucide="swords"></i></span>
                <span class="dmsummary-stat-label">Class</span>
                <span class="dmsummary-stat-value">${data.basics.class}</span>
            </div>
            <div class="dmsummary-stat">
                <span class="dmsummary-stat-icon"><i data-lucide="leaf"></i></span>
                <span class="dmsummary-stat-label">Background</span>
                <span class="dmsummary-stat-value">${data.basics.background}</span>
            </div>
            <div class="dmsummary-stat">
                <span class="dmsummary-stat-icon"><i data-lucide="scale"></i></span>
                <span class="dmsummary-stat-label">Alignment</span>
                <span class="dmsummary-stat-value">${data.basics.alignment}</span>
            </div>
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
