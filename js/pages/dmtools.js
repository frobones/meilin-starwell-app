/**
 * DM Tools Page Controller
 * Handles Knives, Relationships, Mindersand, and Medica sections.
 */

import { dataLoader } from '../core/data-loader.js';
import { events } from '../core/events.js';
import { icons } from '../core/icons.js';

// Private state
let knivesData = null;
let relationshipsData = null;
let mindersandData = null;
let medicaData = null;

// Type labels for display
const TYPE_LABELS = {
    'ally': 'Ally',
    'complicated': 'Complicated',
    'antagonist': 'Antagonist'
};

/**
 * Load all DM Tools content
 */
export async function loadDMToolsContent() {
    await Promise.all([
        loadRelationships(),
        loadKnives(),
        loadMindersand(),
        loadMedica()
    ]);
    events.emit('dmtools:loaded');
}

// ============================================
// Knives
// ============================================

/**
 * Load knives data
 */
export async function loadKnives() {
    const container = document.getElementById('knives-grid');
    if (!container) return;

    container.innerHTML = '<div class="loading-spinner">Loading knives...</div>';

    try {
        knivesData = await dataLoader.loadJSON('content/dm/knives.json');
        renderKnives();
    } catch (error) {
        console.error('Failed to load knives:', error);
        container.innerHTML = '<p>Failed to load knives.</p>';
    }
}

/**
 * Render knife cards
 */
export function renderKnives() {
    const container = document.getElementById('knives-grid');
    if (!container || !knivesData) return;

    if (knivesData.length === 0) {
        container.innerHTML = '<p>No knives found.</p>';
        return;
    }

    container.innerHTML = knivesData.map((knife, index) => `
        <div class="knife-card ${knife.type}" data-knife-index="${index}">
            <div class="knife-card-header">
                <span class="knife-card-icon"><i data-lucide="${knife.icon}"></i></span>
                <h3 class="knife-card-name">${knife.name}</h3>
            </div>
            <span class="knife-card-type">${knife.type}</span>
            <p class="knife-card-summary">${knife.summary}</p>
        </div>
    `).join('');

    container.querySelectorAll('.knife-card').forEach(card => {
        card.addEventListener('click', () => {
            const index = parseInt(card.dataset.knifeIndex);
            openKnifeModal(knivesData[index]);
        });
    });
    
    icons.refresh();
}

/**
 * Open knife detail modal
 */
export function openKnifeModal(knife) {
    const overlay = document.getElementById('knife-modal-overlay');
    const content = document.getElementById('knife-modal-content');
    
    if (overlay && content) {
        content.innerHTML = `
            <div class="knife-detail-header">
                <span class="knife-detail-icon"><i data-lucide="${knife.icon}"></i></span>
                <h2 class="knife-detail-title">${knife.name}</h2>
            </div>
            <span class="knife-modal-type ${knife.type}">${knife.type}</span>
            <div class="knife-detail-section">
                <h4>What It Is</h4>
                <p>${knife.details}</p>
            </div>
            <div class="knife-detail-section">
                <h4>When to Pull It</h4>
                <p>${knife.trigger}</p>
            </div>
            <div class="knife-detail-section">
                <h4>Escalation</h4>
                <p>${knife.escalation}</p>
            </div>
        `;
        overlay.classList.add('active');
        icons.refresh();
    }
}

/**
 * Close knife modal
 */
export function closeKnifeModal() {
    const overlay = document.getElementById('knife-modal-overlay');
    if (overlay) {
        overlay.classList.remove('active');
    }
}

// ============================================
// Relationships
// ============================================

/**
 * Load relationships data
 */
export async function loadRelationships() {
    const container = document.getElementById('relationships-map');
    if (!container) return;

    container.innerHTML = '<div class="loading-spinner">Loading relationships...</div>';

    try {
        relationshipsData = await dataLoader.loadJSON('content/dm/relationships.json');
        renderRelationships();
    } catch (error) {
        console.error('Failed to load relationships:', error);
        container.innerHTML = '<p>Failed to load relationships.</p>';
    }
}

/**
 * Render relationships map
 */
export function renderRelationships() {
    const container = document.getElementById('relationships-map');
    if (!container || !relationshipsData) return;

    const data = relationshipsData;

    container.innerHTML = `
        <div class="relationship-cards">
            ${data.connections.map(c => renderRelationshipCard(c)).join('')}
        </div>

        ${data.indirect && data.indirect.length > 0 ? `
        <div class="relationship-indirect">
            <h4 class="relationship-indirect-title">Hidden Connections</h4>
            <ul class="relationship-indirect-list">
                ${data.indirect.map(i => `
                    <li class="relationship-indirect-item">
                        <strong>${i.from}</strong> → <strong>${i.to}</strong>: ${i.description}
                    </li>
                `).join('')}
            </ul>
        </div>
        ` : ''}
    `;
    
    bindRelationshipCardEvents();
    icons.refresh();
}

/**
 * Render a single relationship card
 */
function renderRelationshipCard(connection) {
    const hasDetails = connection.details !== undefined;
    
    return `
        <div class="relationship-card ${connection.type} ${hasDetails ? 'clickable' : ''}" 
             data-connection-name="${connection.name}"
             ${hasDetails ? 'title="Click for details"' : ''}>
            <h4 class="relationship-card-name">${connection.name}</h4>
            <span class="relationship-card-type">${TYPE_LABELS[connection.type] || connection.type}</span>
            <p class="relationship-card-role">${connection.role}</p>
            <p class="relationship-card-tension">${connection.tension}</p>
            <p class="relationship-card-location">📍 ${connection.location}</p>
        </div>
    `;
}

/**
 * Bind click events to relationship cards
 */
function bindRelationshipCardEvents() {
    const container = document.getElementById('relationships-map');
    if (!container) return;

    container.querySelectorAll('.relationship-card.clickable').forEach(card => {
        card.addEventListener('click', () => {
            const connectionName = card.dataset.connectionName;
            const connection = relationshipsData.connections.find(c => c.name === connectionName);
            if (connection) {
                openRelationshipModal(connection);
            }
        });
    });
}

/**
 * Open relationship detail modal
 */
export function openRelationshipModal(connection) {
    const overlay = document.getElementById('npc-modal-overlay');
    const content = document.getElementById('npc-modal-content');
    
    if (!overlay || !content) return;

    let detailsHTML = '';
    const d = connection.details;
    
    if (connection.type === 'ally') {
        detailsHTML = `
            <div class="relationship-detail-section"><h4>Met</h4><p>${d.met}</p></div>
            <div class="relationship-detail-section"><h4>Bond</h4><p>${d.bond}</p></div>
            <div class="relationship-detail-section"><h4>I ask for</h4><p>${d.iAskFor}</p></div>
            <div class="relationship-detail-section"><h4>They ask for</h4><p>${d.theyAskFor}</p></div>
        `;
    } else if (connection.type === 'complicated') {
        const wants = d.heWants || d.sheWants || '';
        const wantsLabel = d.heWants ? 'He wants' : 'She wants';
        detailsHTML = `
            <div class="relationship-detail-section"><h4>The knot</h4><p>${d.theKnot}</p></div>
            <div class="relationship-detail-section"><h4>${wantsLabel}</h4><p>${wants}</p></div>
            <div class="relationship-detail-section"><h4>I want</h4><p>${d.iWant}</p></div>
            <div class="relationship-detail-section"><h4>Danger</h4><p>${d.danger}</p></div>
        `;
    } else if (connection.type === 'antagonist') {
        detailsHTML = `
            <div class="relationship-detail-section"><h4>She believes</h4><p>${d.sheBelieves}</p></div>
            <div class="relationship-detail-section"><h4>She wants</h4><p>${d.sheWants}</p></div>
            <div class="relationship-detail-section"><h4>How she operates</h4><p>${d.howSheOperates}</p></div>
        `;
    }

    content.innerHTML = `
        <div class="narrative-container">
            <h2>${connection.name}</h2>
            <span class="relationship-modal-type ${connection.type}">${TYPE_LABELS[connection.type] || connection.type}</span>
            <p class="relationship-modal-role"><em>${connection.role}</em></p>
            <p class="relationship-modal-location">📍 ${connection.location}</p>
            <hr>
            ${detailsHTML}
        </div>
    `;
    overlay.classList.add('active');
}

// ============================================
// Mindersand
// ============================================

/**
 * Load mindersand data
 */
export async function loadMindersand() {
    const container = document.getElementById('mindersand-content');
    if (!container) return;

    container.innerHTML = '<div class="loading-spinner">Loading mindersand data...</div>';

    try {
        mindersandData = await dataLoader.loadJSON('content/dm/mindersand.json');
        renderMindersand();
    } catch (error) {
        console.error('Failed to load mindersand data:', error);
        container.innerHTML = '<p>Failed to load mindersand reference.</p>';
    }
}

/**
 * Render mindersand reference content
 */
export function renderMindersand() {
    const container = document.getElementById('mindersand-content');
    if (!container || !mindersandData) return;

    const data = mindersandData;

    container.innerHTML = `
        <div class="mindersand-header">
            <div class="mindersand-title-row">
                <span class="mindersand-icon"><i data-lucide="${data.icon}"></i></span>
                <div>
                    <h3 class="mindersand-name">${data.name}</h3>
                    <span class="mindersand-pronunciation">/${data.pronunciation}/</span>
                </div>
            </div>
            <p class="mindersand-tagline">${data.tagline}</p>
            <p class="mindersand-overview">${data.overview}</p>
        </div>

        <div class="mindersand-card">
            <h4 class="mindersand-card-title"><i data-lucide="eye"></i> Identification</h4>
            <div class="mindersand-appearance">
                <div class="mindersand-detail"><span class="mindersand-label">Color:</span><span>${data.appearance.color}</span></div>
                <div class="mindersand-detail"><span class="mindersand-label">Texture:</span><span>${data.appearance.texture}</span></div>
                <div class="mindersand-tell"><span class="mindersand-label">The Tell:</span><span class="mindersand-tell-text">${data.appearance.tell}</span></div>
            </div>
        </div>

        <div class="mindersand-card">
            <h4 class="mindersand-card-title"><i data-lucide="drama"></i> Common Disguises</h4>
            <div class="mindersand-disguises-grid">
                ${data.disguises.map(d => `
                    <div class="mindersand-disguise">
                        <span class="mindersand-disguise-icon"><i data-lucide="${d.icon}"></i></span>
                        <div><strong>${d.name}</strong><p>${d.description}</p></div>
                    </div>
                `).join('')}
            </div>
        </div>

        <div class="mindersand-card">
            <h4 class="mindersand-card-title"><i data-lucide="triangle-alert"></i> Effects Progression</h4>
            <div class="mindersand-effects-timeline">
                ${data.effects.map(e => `
                    <div class="mindersand-effect-stage">
                        <div class="mindersand-effect-header">
                            <span class="mindersand-effect-icon"><i data-lucide="${e.icon}"></i></span>
                            <span class="mindersand-effect-stage-name">${e.stage}</span>
                        </div>
                        <p class="mindersand-effect-symptoms">${e.symptoms}</p>
                    </div>
                `).join('')}
            </div>
        </div>

        <div class="mindersand-card">
            <h4 class="mindersand-card-title"><i data-lucide="target"></i> Why It Works</h4>
            <ul class="mindersand-why-list">${data.whyItWorks.map(w => `<li>${w}</li>`).join('')}</ul>
        </div>

        <div class="mindersand-card mindersand-coster-card">
            <h4 class="mindersand-card-title"><i data-lucide="building-2"></i> Why Smith's Coster Moves It</h4>
            ${data.targetingNote ? `<p class="mindersand-targeting-note">${data.targetingNote}</p>` : ''}
            <div class="mindersand-motives-grid">
                ${data.whySmithsCoster.map(m => `<div class="mindersand-motive"><strong>${m.reason}</strong><p>${m.detail}</p></div>`).join('')}
            </div>
        </div>

        <div class="mindersand-card">
            <h4 class="mindersand-card-title"><i data-lucide="package"></i> Distribution Patterns</h4>
            <ul class="mindersand-distribution-list">${data.distribution.map(d => `<li>${d}</li>`).join('')}</ul>
        </div>

        <div class="mindersand-card mindersand-detection-card">
            <h4 class="mindersand-card-title"><i data-lucide="search"></i> Detection & Prevention</h4>
            <div class="mindersand-detection-grid">
                <div class="mindersand-detection-item"><span class="mindersand-detection-label"><i data-lucide="check"></i> Prevention</span><p>${data.detection.prevention}</p></div>
                <div class="mindersand-detection-item"><span class="mindersand-detection-label"><i data-lucide="check"></i> Confirmation</span><p>${data.detection.confirmation}</p></div>
                <div class="mindersand-detection-item mindersand-detection-warning"><span class="mindersand-detection-label"><i data-lucide="x"></i> Worst Mistake</span><p>${data.detection.mistake}</p></div>
            </div>
        </div>

        <div class="mindersand-card mindersand-hooks-card">
            <h4 class="mindersand-card-title"><i data-lucide="dices"></i> Adventure Hooks</h4>
            <div class="mindersand-hooks-grid">
                ${data.adventureHooks.map(h => `
                    <div class="mindersand-hook">
                        <div class="mindersand-hook-header"><span class="mindersand-hook-icon"><i data-lucide="${h.icon}"></i></span><strong>${h.name}</strong></div>
                        <p>${h.hook}</p>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
    
    icons.refresh();
}

// ============================================
// Medica (simplified - full version is large)
// ============================================

/**
 * Load medica data
 */
export async function loadMedica() {
    const container = document.getElementById('medica-content');
    if (!container) return;

    container.innerHTML = '<div class="loading-spinner">Loading Medica data...</div>';

    try {
        medicaData = await dataLoader.loadJSON('content/dm/medica.json');
        renderMedica();
    } catch (error) {
        console.error('Failed to load Medica data:', error);
        container.innerHTML = '<p>Failed to load Medica reference.</p>';
    }
}

/**
 * Render medica reference content (delegating to legacy for now)
 * Full implementation in legacy app.dmtools.js
 */
export function renderMedica() {
    // The full Medica render is complex - emit event for legacy handler
    events.emit('medica:render', medicaData);
}

// ============================================
// Getters
// ============================================

export function getKnivesData() { return knivesData; }
export function getRelationshipsData() { return relationshipsData; }
export function getMindersandData() { return mindersandData; }
export function getMedicaData() { return medicaData; }

// Listen for page change events
events.on('page:change', ({ page }) => {
    if (page === 'dmtools' && !knivesData) {
        loadDMToolsContent();
    }
});

// Listen for modal close events
events.on('modal:close', () => {
    closeKnifeModal();
});
