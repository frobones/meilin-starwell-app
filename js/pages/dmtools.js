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

// Type icons for visual clarity
const TYPE_ICONS = {
    'ally': 'shield',
    'complicated': 'alert-triangle',
    'antagonist': 'sword'
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
                <span class="click-hint"><i data-lucide="info"></i></span>
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
 * Render relationships map with tiered layout
 */
export function renderRelationships() {
    const container = document.getElementById('relationships-map');
    if (!container || !relationshipsData) return;

    const data = relationshipsData;
    
    // Group connections by type
    const antagonists = data.connections.filter(c => c.type === 'antagonist');
    const complicated = data.connections.filter(c => c.type === 'complicated');
    const allies = data.connections.filter(c => c.type === 'ally');

    container.innerHTML = `
        <!-- Antagonists Section - Top Priority -->
        ${antagonists.length > 0 ? `
        <div class="relationship-tier relationship-tier-antagonist">
            <div class="tier-label">
                <span class="tier-label-icon"><i data-lucide="alert-octagon"></i></span>
                <span class="tier-label-text">Active Threats</span>
            </div>
            <div class="relationship-cards relationship-cards-antagonist">
                ${antagonists.map(c => renderAntagonistCard(c)).join('')}
            </div>
        </div>
        ` : ''}

        <!-- Complicated Section - Pressure Points -->
        ${complicated.length > 0 ? `
        <div class="relationship-tier relationship-tier-complicated">
            <div class="tier-label">
                <span class="tier-label-icon"><i data-lucide="alert-triangle"></i></span>
                <span class="tier-label-text">Pressure Points</span>
            </div>
            <div class="relationship-cards relationship-cards-complicated">
                ${complicated.map(c => renderRelationshipCard(c)).join('')}
            </div>
        </div>
        ` : ''}

        <!-- Allies Section - Safe Harbors -->
        ${allies.length > 0 ? `
        <div class="relationship-tier relationship-tier-ally">
            <div class="tier-label">
                <span class="tier-label-icon"><i data-lucide="shield"></i></span>
                <span class="tier-label-text">Safe Harbors</span>
            </div>
            <div class="relationship-cards relationship-cards-ally">
                ${allies.map(c => renderRelationshipCard(c)).join('')}
            </div>
        </div>
        ` : ''}

        <!-- Hidden Connections Web -->
        ${data.indirect && data.indirect.length > 0 ? `
        <div class="relationship-connections-web">
            <div class="tier-label">
                <span class="tier-label-icon"><i data-lucide="git-branch"></i></span>
                <span class="tier-label-text">Hidden Connections</span>
            </div>
            <div class="connections-grid">
                ${data.indirect.map(i => renderConnectionLine(i)).join('')}
            </div>
        </div>
        ` : ''}
    `;
    
    bindRelationshipCardEvents();
    icons.refresh();
}

/**
 * Render a connection line for the hidden connections web
 */
function renderConnectionLine(indirect) {
    // Determine threat level based on who's involved
    const isThreat = indirect.from.includes('Pryce') || indirect.description.toLowerCase().includes('pressure');
    const threatClass = isThreat ? 'connection-threat' : 'connection-neutral';
    
    return `
        <div class="connection-line ${threatClass}">
            <span class="connection-from">${indirect.from}</span>
            <span class="connection-arrow"><i data-lucide="arrow-right"></i></span>
            <span class="connection-to">${indirect.to}</span>
            <span class="connection-desc">${indirect.description}</span>
        </div>
    `;
}

/**
 * Render antagonist card with special treatment
 */
function renderAntagonistCard(connection) {
    const hasDetails = connection.details !== undefined;
    
    return `
        <div class="relationship-card antagonist antagonist-featured ${hasDetails ? 'clickable' : ''}" 
             data-connection-name="${connection.name}"
             ${hasDetails ? 'title="Click for details"' : ''}>
            <div class="relationship-card-header">
                <span class="relationship-card-icon"><i data-lucide="sword"></i></span>
                <div class="relationship-card-title-group">
                    <h4 class="relationship-card-name">${connection.name}</h4>
                    <span class="relationship-card-subtitle">Active Threat</span>
                </div>
                ${hasDetails ? `<span class="click-hint"><i data-lucide="info"></i></span>` : ''}
            </div>
            <p class="relationship-card-role">${connection.role}</p>
            <p class="relationship-card-tension">${connection.tension}</p>
            <p class="relationship-card-location">
                <span class="location-icon"><i data-lucide="map-pin"></i></span>
                ${connection.location}
            </p>
        </div>
    `;
}

/**
 * Render a single relationship card
 */
function renderRelationshipCard(connection) {
    const hasDetails = connection.details !== undefined;
    const icon = TYPE_ICONS[connection.type] || 'user';
    
    return `
        <div class="relationship-card ${connection.type} ${hasDetails ? 'clickable' : ''}" 
             data-connection-name="${connection.name}"
             ${hasDetails ? 'title="Click for details"' : ''}>
            <div class="relationship-card-header">
                <h4 class="relationship-card-name">${connection.name}</h4>
                ${hasDetails ? `<span class="click-hint"><i data-lucide="info"></i></span>` : ''}
            </div>
            <p class="relationship-card-role">${connection.role}</p>
            <p class="relationship-card-tension">${connection.tension}</p>
            <p class="relationship-card-location">
                <span class="location-icon"><i data-lucide="map-pin"></i></span>
                ${connection.location}
            </p>
        </div>
    `;
}

/**
 * Bind click events to relationship cards to open modal
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
            <p class="relationship-modal-location"><span class="location-icon"><i data-lucide="map-pin"></i></span><span>${connection.location}</span></p>
            <hr>
            ${detailsHTML}
        </div>
    `;
    icons.refresh();
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
 * Render medica reference content
 */
export function renderMedica() {
    const container = document.getElementById('medica-content');
    if (!container || !medicaData) return;

    const data = medicaData;

    container.innerHTML = `
        <div class="medica-header">
            <div class="medica-title-row">
                <span class="medica-icon"><i data-lucide="${data.icon}"></i></span>
                <div>
                    <h3 class="medica-name">${data.name}</h3>
                    <span class="medica-tagline">${data.tagline}</span>
                </div>
            </div>
            <p class="medica-overview">${data.overview}</p>
        </div>

        <div class="medica-card medica-joining">
            <h4 class="medica-card-title"><i data-lucide="${data.joining.icon}"></i> ${data.joining.title}</h4>
            <ul class="medica-requirements-list">
                ${data.joining.requirements.map(req => `<li>${req}</li>`).join('')}
            </ul>
            <p class="medica-note">${data.joining.note}</p>
        </div>

        <div class="medica-card">
            <h4 class="medica-card-title"><i data-lucide="trending-up"></i> Rank Progression</h4>
            <p class="medica-card-intro">Click a rank to see benefits, tuition, and exam requirements.</p>
            <div class="medica-ranks-grid">
                ${data.ranks.map((rank, i) => `
                    <div class="medica-rank-card ${i === 0 ? 'active' : ''}" data-rank-index="${i}">
                        <span class="medica-rank-icon"><i data-lucide="${rank.icon}"></i></span>
                        <span class="medica-rank-name">${rank.name}</span>
                    </div>
                `).join('')}
            </div>
            <div class="medica-rank-details" id="medica-rank-details">
                ${renderMedicaRankDetails(data.ranks[0])}
            </div>
        </div>

        <div class="medica-card">
            <h4 class="medica-card-title"><i data-lucide="${data.exams.icon}"></i> ${data.exams.title}</h4>
            <p class="medica-exam-description">${data.exams.description}</p>
            <ol class="medica-exam-process">
                ${data.exams.process.map(step => `<li>${step}</li>`).join('')}
            </ol>
            <p class="medica-note"><i data-lucide="info"></i> ${data.exams.note}</p>
        </div>

        <div class="medica-card">
            <h4 class="medica-card-title"><i data-lucide="${data.guildMerchant.icon}"></i> ${data.guildMerchant.title}</h4>
            <p class="medica-merchant-banner"><i data-lucide="info"></i> ${data.guildMerchant.overview}</p>
            
            <div class="medica-merchant-grid">
                <div class="medica-merchant-section">
                    <h5><i data-lucide="package"></i> Buying Components</h5>
                    <p>${data.guildMerchant.components.description}</p>
                    <p><strong>Mechanic:</strong> ${data.guildMerchant.components.mechanic}</p>
                </div>
                <div class="medica-merchant-section">
                    <h5><i data-lucide="shopping-bag"></i> Buying Finished Items</h5>
                    <p>${data.guildMerchant.finishedItems.description}</p>
                    <p><strong>Limit:</strong> ${data.guildMerchant.finishedItems.limit}</p>
                </div>
                <div class="medica-merchant-section">
                    <h5><i data-lucide="coins"></i> Selling</h5>
                    <p>Merchants purchase at <strong>${data.guildMerchant.selling.rate}</strong> of sale price.</p>
                </div>
            </div>

            <hr class="medica-divider">

            <h5 class="medica-section-title"><i data-lucide="package-open"></i> Craft Component Stocks</h5>
            <p class="medica-note"><i data-lucide="refresh-cw"></i> ${data.guildMerchant.components.replenish}</p>
            <h6 class="medica-stock-title">Stock Dice by Rank</h6>
            <div class="medica-stock-grid">
                ${data.ranks.map(rank => `
                    <div class="medica-stock-item">
                        <span class="medica-stock-rank">${rank.name}</span>
                        <span class="medica-stock-die">${rank.stockDie}</span>
                    </div>
                `).join('')}
            </div>

            <details class="medica-stocks-details">
                <summary><i data-lucide="leaf"></i> ${data.guildMerchant.stocks.plants.title}</summary>
                <div class="medica-stocks-content">
                    ${data.guildMerchant.stocks.plants.categories.map(cat => `
                        <h6 class="medica-stocks-category">${cat.name}</h6>
                        <table class="medica-stocks-table">
                            <thead>
                                <tr><th>Name</th><th>Stock</th><th>Cost</th></tr>
                            </thead>
                            <tbody>
                                ${cat.items.map(item => `
                                    <tr>
                                        <td>${item.name}</td>
                                        <td class="medica-stock-score">${item.stockScore}</td>
                                        <td class="medica-stock-cost">${item.cost}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    `).join('')}
                </div>
            </details>

            <details class="medica-stocks-details">
                <summary><i data-lucide="skull"></i> ${data.guildMerchant.stocks.creatureParts.title}</summary>
                <div class="medica-stocks-content">
                    <table class="medica-stocks-table">
                        <thead>
                            <tr><th>Name</th><th>Stock</th><th>Cost</th></tr>
                        </thead>
                        <tbody>
                            ${data.guildMerchant.stocks.creatureParts.items.map(item => `
                                <tr>
                                    <td>${item.name}</td>
                                    <td class="medica-stock-score">${item.stockScore}</td>
                                    <td class="medica-stock-cost">${item.cost}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </details>

            <hr class="medica-divider">

            <h5 class="medica-section-title"><i data-lucide="shopping-cart"></i> ${data.guildMerchant.stocks.finishedItems.title}</h5>
            <p class="medica-merchant-banner"><i data-lucide="info"></i> ${data.guildMerchant.stocks.finishedItems.note}</p>

            <details class="medica-stocks-details">
                <summary><i data-lucide="flask-round"></i> ${data.guildMerchant.stocks.finishedItems.herbalMedicines.title}</summary>
                <div class="medica-stocks-content">
                    <table class="medica-stocks-table medica-finished-table">
                        <thead>
                            <tr><th>Name</th><th>Strength</th><th>Cost</th></tr>
                        </thead>
                        <tbody>
                            ${data.guildMerchant.stocks.finishedItems.herbalMedicines.items.map(item =>
                                item.variants.map((v, i) => `
                                    <tr class="${i > 0 ? 'variant-row' : ''}">
                                        <td>${i === 0 ? item.name : ''}</td>
                                        <td class="medica-strength">${v.strength}</td>
                                        <td class="medica-stock-cost">${v.cost}</td>
                                    </tr>
                                `).join('')
                            ).join('')}
                        </tbody>
                    </table>
                </div>
            </details>

            <details class="medica-stocks-details">
                <summary><i data-lucide="beaker"></i> ${data.guildMerchant.stocks.finishedItems.alchemicalItems.title}</summary>
                <div class="medica-stocks-content">
                    <table class="medica-stocks-table medica-finished-table">
                        <thead>
                            <tr><th>Name</th><th>Strength</th><th>Cost</th></tr>
                        </thead>
                        <tbody>
                            ${data.guildMerchant.stocks.finishedItems.alchemicalItems.items.map(item =>
                                item.variants.map((v, i) => `
                                    <tr class="${i > 0 ? 'variant-row' : ''}">
                                        <td>${i === 0 ? item.name : ''}${v.note ? `<span class="variant-note">${i === 0 ? ' ' : ''}${v.note}</span>` : ''}</td>
                                        <td class="medica-strength">${v.strength}</td>
                                        <td class="medica-stock-cost">${v.cost}</td>
                                    </tr>
                                `).join('')
                            ).join('')}
                        </tbody>
                    </table>
                </div>
            </details>
        </div>

        <div class="medica-card">
            <h4 class="medica-card-title"><i data-lucide="${data.downtime.icon}"></i> ${data.downtime.title}</h4>
            <div class="medica-downtime-grid">
                ${data.downtime.activities.map(activity => `
                    <div class="medica-activity-card">
                        <div class="medica-activity-header">
                            <span class="medica-activity-icon"><i data-lucide="${activity.icon}"></i></span>
                            <h5>${activity.name}</h5>
                        </div>
                        ${activity.requirement ? `<p class="medica-activity-req"><i data-lucide="lock"></i> ${activity.requirement}</p>` : ''}
                        <p class="medica-activity-desc">${activity.description}</p>
                        <p class="medica-activity-benefit"><strong>Benefit:</strong> ${activity.benefit}</p>
                        ${activity.duration ? `<p class="medica-activity-duration"><i data-lucide="clock"></i> ${activity.duration}</p>` : ''}
                    </div>
                `).join('')}
            </div>

            <div class="medica-guild-work-section">
                <h5 class="medica-guild-work-title"><i data-lucide="${data.downtime.guildWork.icon}"></i> ${data.downtime.guildWork.title}</h5>
                <p class="medica-activity-req"><i data-lucide="lock"></i> ${data.downtime.guildWork.requirement}</p>
                <p class="medica-guild-work-intro">${data.downtime.guildWork.intro}</p>
                
                <div class="medica-guild-work-details">
                    <p><strong>Resources.</strong> ${data.downtime.guildWork.resources}</p>
                    <p><strong>Resolution.</strong> ${data.downtime.guildWork.resolution}</p>
                    
                    <table class="medica-guild-work-table">
                        <thead><tr><th>Guild Rank</th><th>Earnings</th></tr></thead>
                        <tbody>
                            ${data.downtime.guildWork.earnings.map(e => `
                                <tr><td>${e.rank}</td><td>${e.earnings}</td></tr>
                            `).join('')}
                        </tbody>
                    </table>
                    
                    <p><strong>Complications.</strong> ${data.downtime.guildWork.complicationsIntro}</p>
                    
                    <table class="medica-complications-table">
                        <thead><tr><th>d6</th><th>Complication</th></tr></thead>
                        <tbody>
                            ${data.downtime.guildWork.complications.map(c => `
                                <tr><td>${c.roll}</td><td>${c.result}</td></tr>
                            `).join('')}
                        </tbody>
                    </table>
                    <p class="medica-complications-note">${data.downtime.guildWork.complicationsNote}</p>
                </div>
            </div>
        </div>

        <div class="medica-card">
            <h4 class="medica-card-title"><i data-lucide="${data.medicineCategories.icon}"></i> ${data.medicineCategories.title}</h4>
            <div class="medica-categories-grid">
                ${data.medicineCategories.categories.map(cat => `
                    <div class="medica-category-card" style="border-left-color: ${cat.color}">
                        <h5>${cat.name}</h5>
                        <p class="medica-category-primary"><strong>Primary:</strong> ${cat.primary}</p>
                        <p class="medica-category-desc">${cat.description}</p>
                    </div>
                `).join('')}
            </div>

            <h5 class="medica-dc-title">Crafting DCs</h5>
            <div class="medica-dc-grid">
                ${data.medicineCategories.craftingDCs.map(dc => `
                    <div class="medica-dc-item">
                        <span class="medica-dc-strength">${dc.strength}</span>
                        <span class="medica-dc-value">DC ${dc.dc}</span>
                    </div>
                `).join('')}
            </div>
            <p class="medica-note">${data.medicineCategories.craftingNote}</p>
        </div>

        <div class="medica-card">
            <h4 class="medica-card-title"><i data-lucide="${data.dmTips.icon}"></i> ${data.dmTips.title}</h4>
            <div class="medica-tips-grid">
                ${data.dmTips.tips.map(tip => `
                    <div class="medica-tip">
                        <h5>${tip.title}</h5>
                        <p>${tip.text}</p>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
    
    bindMedicaRankCards();
    icons.refresh();
}

/**
 * Render rank details section
 */
function renderMedicaRankDetails(rank) {
    return `
        <div class="medica-rank-detail-content">
            <h5>${rank.title}</h5>
            <div class="medica-rank-info-grid">
                <div class="medica-rank-benefits">
                    <h6>Benefits</h6>
                    <ul>
                        ${rank.benefits.map(b => `<li>${b}</li>`).join('')}
                    </ul>
                </div>
                <div class="medica-rank-requirements">
                    <h6>Advancement</h6>
                    <p><strong>Tuition:</strong> ${rank.tuition.weeks} workweeks, ${rank.tuition.cost} gp</p>
                    <p><strong>Exam:</strong> ${rank.exam}</p>
                    ${rank.earnings ? `<p><strong>Guild Work:</strong> ${rank.earnings}</p>` : ''}
                    ${rank.note ? `<p class="medica-rank-note"><i data-lucide="info"></i> ${rank.note}</p>` : ''}
                </div>
            </div>
        </div>
    `;
}

/**
 * Bind click events for rank cards
 */
function bindMedicaRankCards() {
    const container = document.getElementById('medica-content');
    if (!container) return;
    
    container.querySelectorAll('.medica-rank-card').forEach(card => {
        card.addEventListener('click', () => {
            container.querySelectorAll('.medica-rank-card').forEach(c => c.classList.remove('active'));
            card.classList.add('active');
            
            const rankIndex = parseInt(card.dataset.rankIndex);
            const rankDetails = document.getElementById('medica-rank-details');
            if (rankDetails && medicaData?.ranks?.[rankIndex]) {
                rankDetails.innerHTML = renderMedicaRankDetails(medicaData.ranks[rankIndex]);
                icons.refresh();
            }
        });
    });
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
