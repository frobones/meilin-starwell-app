/**
 * Ingredients Page Controller
 * Handles flora, creature parts, terrain tabs, and detail modals.
 */

import { dataLoader } from '../core/data-loader.js';
import { store } from '../core/state.js';
import { events } from '../core/events.js';
import { icons } from '../core/icons.js';

// Private state
let ingredients = null;
let creaturePartsLookup = {};
let selectedTerrain = 'Arctic';

/**
 * Initialize ingredients from store or load
 */
export function initIngredients() {
    ingredients = store.get('ingredients');
    if (ingredients) {
        creaturePartsLookup = buildCreaturePartsLookup();
    }
}

/**
 * Build lookup map for creature parts
 */
function buildCreaturePartsLookup() {
    const lookup = {};
    const creatureParts = ingredients?.creatureParts;
    if (!creatureParts) return lookup;
    
    for (const [creatureType, parts] of Object.entries(creatureParts)) {
        for (const part of parts) {
            if (lookup[part.name]) {
                lookup[part.name].creatureTypes.push(creatureType);
                lookup[part.name].sources.push({ creatureType, source: part.source });
            } else {
                lookup[part.name] = {
                    name: part.name,
                    creatureTypes: [creatureType],
                    dc: part.dc,
                    amount: part.amount,
                    sources: [{ creatureType, source: part.source }],
                    use: part.use
                };
            }
        }
    }
    return lookup;
}

/**
 * Make flora name clickable
 */
export function makeFloraClickable(floraName) {
    if (ingredients?.floraDetails?.[floraName]) {
        return `<span class="flora-clickable" data-flora="${floraName}">${floraName}</span>`;
    }
    return floraName;
}

/**
 * Make creature part clickable
 */
export function makeCreatureClickable(partName) {
    if (creaturePartsLookup?.[partName]) {
        return `<span class="creature-clickable" data-creature="${partName}">${partName}</span>`;
    }
    return partName;
}

/**
 * Render ingredients section
 */
export function renderIngredients() {
    initIngredients();
    const section = document.getElementById('ingredients-section');
    if (!section || !ingredients) return;
    
    section.innerHTML = `
        ${createFloraSection()}
        ${createCreaturePartsSection()}
    `;
    
    bindTerrainTabs(section);
    bindFloraClickEvents(section);
    icons.refresh();
}

/**
 * Create flora section HTML
 */
function createFloraSection() {
    const terrains = ingredients.terrains || [];
    const common = ingredients.flora?.common || [];
    const rare = ingredients.flora?.rare || {};
    
    const terrainTabs = terrains.map(t => `
        <button class="terrain-tab${t === selectedTerrain ? ' active' : ''}" data-terrain="${t}">${t}</button>
    `).join('');
    
    const commonRows = common.map(item => `
        <tr>
            <td class="ingredient-name flora-clickable" data-flora="${item.name}">${item.name}</td>
            <td class="ingredient-dc">${item.dc}</td>
            <td>${item.terrain}</td>
            <td>${item.use}</td>
        </tr>
    `).join('');
    
    const rareFlora = rare[selectedTerrain] || [];
    const rareRows = rareFlora.map(item => `
        <tr>
            <td class="ingredient-name flora-clickable" data-flora="${item.name}">${item.name}</td>
            <td class="ingredient-dc">${item.dc}</td>
            <td class="medicine-link" data-medicine="${item.use}">${item.use}</td>
        </tr>
    `).join('');
    
    return `
        <div class="ingredient-group">
            <div class="ingredient-group-header">
                <h3 class="ingredient-group-title">
                    <span class="ingredient-group-icon"><i data-lucide="leaf"></i></span>
                    Flora (Plants & Fungi)
                </h3>
            </div>
            <div class="ingredient-table-container">
                <table class="ingredient-table">
                    <thead><tr><th>Common Flora</th><th>DC</th><th>Found</th><th>Use</th></tr></thead>
                    <tbody>${commonRows}</tbody>
                </table>
            </div>
            <div class="terrain-tabs" id="terrain-tabs">${terrainTabs}</div>
            <div class="ingredient-table-container">
                <table class="ingredient-table">
                    <thead><tr><th>Rare Flora (${selectedTerrain})</th><th>DC</th><th>Used In</th></tr></thead>
                    <tbody id="rare-flora-body">${rareRows.length > 0 ? rareRows : '<tr><td colspan="3">No rare flora in this terrain</td></tr>'}</tbody>
                </table>
            </div>
        </div>
    `;
}

/**
 * Create creature parts section HTML
 */
function createCreaturePartsSection() {
    const creatureParts = ingredients?.creatureParts || {};
    const sizeAmounts = ingredients?.sizeAmounts;
    
    let tablesHtml = '';
    for (const [creatureType, parts] of Object.entries(creatureParts)) {
        if (creatureType === 'All creatures') continue;
        
        const rows = parts.map(item => {
            const amountDisplay = item.amount === 'Δ' 
                ? '<span class="amount-delta" title="Amount depends on creature size">Δ</span>' 
                : `×${item.amount}`;
            const sourceDisplay = item.source ? `<span class="creature-source">${item.source}</span>` : '';
            const usedInLinks = item.use.split(', ').map(m => 
                `<span class="medicine-link" data-medicine="${m}">${m}</span>`
            ).join(', ');
            
            return `<tr>
                <td class="ingredient-name">${item.name}${sourceDisplay}</td>
                <td class="ingredient-amount">${amountDisplay}</td>
                <td class="ingredient-dc">${item.dc}</td>
                <td class="creature-used-in">${usedInLinks}</td>
            </tr>`;
        }).join('');
        
        tablesHtml += `
            <details class="creature-type-details">
                <summary>${creatureType}</summary>
                <table class="ingredient-table creature-parts-table">
                    <thead><tr><th>Component</th><th>Amt</th><th>DC</th><th>Used In</th></tr></thead>
                    <tbody>${rows}</tbody>
                </table>
            </details>
        `;
    }
    
    const sizeRef = sizeAmounts ? `
        <div class="size-amounts-ref">
            <strong>Δ amounts by size:</strong> Medium or smaller = 1, Large = 2, Huge = 4, Gargantuan+ = 8
        </div>
    ` : '';
    
    return `
        <div class="ingredient-group">
            <div class="ingredient-group-header">
                <h3 class="ingredient-group-title">
                    <span class="ingredient-group-icon"><i data-lucide="bone"></i></span>
                    Creature Parts (Harvesting)
                </h3>
            </div>
            <div style="padding: var(--space-md);">${sizeRef}${tablesHtml}</div>
        </div>
    `;
}

/**
 * Bind terrain tab events
 */
function bindTerrainTabs(container) {
    container.querySelectorAll('.terrain-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            selectTerrain(tab.dataset.terrain);
        });
    });
}

/**
 * Select terrain for rare flora
 */
export function selectTerrain(terrain) {
    selectedTerrain = terrain;
    
    document.querySelectorAll('.terrain-tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.terrain === terrain);
    });
    
    const rareFlora = ingredients?.flora?.rare?.[terrain] || [];
    const rareRows = rareFlora.map(item => `
        <tr>
            <td class="ingredient-name flora-clickable" data-flora="${item.name}">${item.name}</td>
            <td class="ingredient-dc">${item.dc}</td>
            <td class="medicine-link" data-medicine="${item.use}">${item.use}</td>
        </tr>
    `).join('');
    
    const tbody = document.getElementById('rare-flora-body');
    if (tbody) {
        tbody.innerHTML = rareRows.length > 0 ? rareRows : '<tr><td colspan="3">No rare flora in this terrain</td></tr>';
        bindFloraClickEvents(tbody);
    }
}

/**
 * Bind click events for flora and creature parts
 */
export function bindFloraClickEvents(container) {
    container.querySelectorAll('.flora-clickable').forEach(el => {
        el.addEventListener('click', () => showFloraDetails(el.dataset.flora));
    });
    
    container.querySelectorAll('.creature-clickable').forEach(el => {
        el.addEventListener('click', () => showCreatureDetails(el.dataset.creature));
    });
    
    container.querySelectorAll('.medicine-link').forEach(el => {
        el.addEventListener('click', () => {
            events.emit('medicine:openByName', el.dataset.medicine);
        });
    });
}

/**
 * Look up flora DC from the flora arrays
 */
function getFloraDetails(floraName) {
    if (!ingredients?.flora) return null;
    
    // Check common flora
    const commonFlora = ingredients.flora.common?.find(f => f.name === floraName);
    if (commonFlora) {
        return { dc: commonFlora.dc, use: commonFlora.use };
    }
    
    // Check rare flora across all terrains
    if (ingredients.flora.rare) {
        for (const terrain in ingredients.flora.rare) {
            const rareFlora = ingredients.flora.rare[terrain].find(f => f.name === floraName);
            if (rareFlora) {
                return { dc: rareFlora.dc, use: rareFlora.use };
            }
        }
    }
    
    return null;
}

/**
 * Show flora details modal
 */
export function showFloraDetails(floraName) {
    const details = ingredients?.floraDetails?.[floraName];
    if (!details) return;
    
    // Get DC and use info from flora arrays
    const floraInfo = getFloraDetails(floraName);
    const dcDisplay = floraInfo?.dc ? `DC ${floraInfo.dc}` : '';
    const useDisplay = floraInfo?.use || '';
    
    const overlay = document.createElement('div');
    overlay.className = 'flora-modal-overlay';
    overlay.innerHTML = `
        <div class="flora-modal">
            <button class="flora-modal-close" aria-label="Close">&times;</button>
            <div class="flora-modal-header">
                <span class="flora-modal-icon"><i data-lucide="leaf"></i></span>
                <h3 class="flora-modal-title">${floraName}</h3>
            </div>
            <div class="flora-modal-meta">
                <span class="flora-rarity">${details.rarity}</span>
                ${dcDisplay ? `<span class="flora-dc"><i data-lucide="target"></i> ${dcDisplay}</span>` : ''}
                <span class="flora-terrain"><i data-lucide="map-pin"></i> ${details.terrain}</span>
            </div>
            ${useDisplay ? `<div class="flora-use"><strong>Used for:</strong> ${useDisplay}</div>` : ''}
            <p class="flora-modal-description">${details.description}</p>
        </div>
    `;
    
    document.body.appendChild(overlay);
    icons.refresh();
    
    const closeModal = () => {
        overlay.classList.add('closing');
        setTimeout(() => overlay.remove(), 200);
    };
    
    overlay.querySelector('.flora-modal-close').addEventListener('click', closeModal);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) closeModal(); });
    document.addEventListener('keydown', function escHandler(e) {
        if (e.key === 'Escape') { closeModal(); document.removeEventListener('keydown', escHandler); }
    });
    
    requestAnimationFrame(() => overlay.classList.add('active'));
}

/**
 * Show creature details modal
 */
export function showCreatureDetails(partName) {
    const details = creaturePartsLookup?.[partName];
    if (!details) return;
    
    const typeBadges = details.creatureTypes.map(t => `<span class="creature-type-badge">${t}</span>`).join('');
    
    const overlay = document.createElement('div');
    overlay.className = 'creature-modal-overlay';
    overlay.innerHTML = `
        <div class="creature-modal">
            <button class="creature-modal-close" aria-label="Close">&times;</button>
            <div class="creature-modal-header">
                <span class="creature-modal-icon"><i data-lucide="bone"></i></span>
                <h3 class="creature-modal-title">${partName}</h3>
            </div>
            <div class="creature-modal-meta">${typeBadges}<span class="creature-dc"><i data-lucide="target"></i> DC ${details.dc}</span></div>
            <div class="creature-modal-details">
                <div class="creature-detail-row"><span class="creature-detail-label">Amount:</span><span class="creature-detail-value">${details.amount}</span></div>
                <div class="creature-detail-row"><span class="creature-detail-label">Used in:</span><span class="creature-detail-value">${details.use}</span></div>
            </div>
        </div>
    `;
    
    document.body.appendChild(overlay);
    icons.refresh();
    
    const closeModal = () => {
        overlay.classList.add('closing');
        setTimeout(() => overlay.remove(), 200);
    };
    
    overlay.querySelector('.creature-modal-close').addEventListener('click', closeModal);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) closeModal(); });
    
    requestAnimationFrame(() => overlay.classList.add('active'));
}

// Getters
export function getIngredients() { return ingredients; }
export function getCreaturePartsLookup() { return creaturePartsLookup; }

// Listen for store updates
store.subscribe('ingredients', () => {
    ingredients = store.get('ingredients');
    if (ingredients) creaturePartsLookup = buildCreaturePartsLookup();
});

// Listen for flora/creature show events
events.on('flora:show', (floraName) => {
    initIngredients();
    showFloraDetails(floraName);
});

events.on('creature:show', (partName) => {
    initIngredients();
    showCreatureDetails(partName);
});
