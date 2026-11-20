/**
 * Craft Inventory
 * The player's ingredient inventory: state, localStorage persistence,
 * import/export, and the inventory panel. Announces every change as
 * `inventory:changed` ({ immediate }) so the craft page can re-render
 * without this module importing it.
 */

import { store } from '../core/state.js';
import { events } from '../core/events.js';
import { icons } from '../core/icons.js';
import { debug } from '../core/debug.js';
import { showNotification } from '../core/ui.js';
import { MAX_INGREDIENT_COUNT, validateInventoryImport } from './craft-rules.js';

const INVENTORY_STORAGE_KEY = 'meilin-inventory';

// Private state
let ingredientInventory = {};
let ingredientsList = null;
let creaturePartsLookup = {};

/**
 * Current inventory (name to count). Treat as read-only; change it through this module.
 */
export function getInventory() {
    return ingredientInventory;
}

/**
 * Creature part details by name, for the craft dialog's creature styling
 */
export function getCreaturePartsLookup() {
    return creaturePartsLookup;
}

/**
 * Replace the whole inventory (import, clear, or after a craft), save it, and redraw
 */
export function setInventory(next) {
    ingredientInventory = next;
    saveInventory();
    renderCraftInventory();
    events.emit('inventory:changed', { immediate: true });
}

/**
 * Build a structured list of all ingredients from the data
 */
export function buildIngredientsList() {
    const ingredients = store.get('ingredients');
    if (!ingredients) return;

    ingredientsList = {
        commonFlora: [],
        rareFlora: {},
        creatureParts: {}
    };

    if (ingredients.flora?.common) {
        ingredientsList.commonFlora = ingredients.flora.common.map(f => f.name);
    }

    if (ingredients.flora?.rare) {
        for (const terrain in ingredients.flora.rare) {
            ingredientsList.rareFlora[terrain] = ingredients.flora.rare[terrain].map(f => f.name);
        }
    }

    if (ingredients.creatureParts) {
        for (const creatureType in ingredients.creatureParts) {
            ingredientsList.creatureParts[creatureType] =
                ingredients.creatureParts[creatureType].map(c => c.name);
        }

        // Build creature parts lookup
        creaturePartsLookup = {};
        for (const [creatureType, parts] of Object.entries(ingredients.creatureParts)) {
            for (const part of parts) {
                if (creaturePartsLookup[part.name]) {
                    creaturePartsLookup[part.name].creatureTypes.push(creatureType);
                } else {
                    creaturePartsLookup[part.name] = {
                        name: part.name,
                        creatureTypes: [creatureType],
                        dc: part.dc
                    };
                }
            }
        }
    }
}

/**
 * Every ingredient name the app knows, for validating imports
 */
function getKnownIngredientNames() {
    if (!ingredientsList) return new Set();
    return new Set([
        ...ingredientsList.commonFlora,
        ...Object.values(ingredientsList.rareFlora).flat(),
        ...Object.values(ingredientsList.creatureParts).flat()
    ]);
}

/**
 * Load inventory from localStorage
 */
export function loadInventory() {
    try {
        const stored = localStorage.getItem(INVENTORY_STORAGE_KEY);
        if (stored) {
            ingredientInventory = JSON.parse(stored);
        }
    } catch (e) {
        debug.warn('Failed to load inventory from localStorage:', e);
        ingredientInventory = {};
    }
}

/**
 * Save inventory to localStorage
 */
function saveInventory() {
    try {
        localStorage.setItem(INVENTORY_STORAGE_KEY, JSON.stringify(ingredientInventory));
    } catch (e) {
        debug.warn('Failed to save inventory to localStorage:', e);
    }
}

/**
 * Get the ingredient type class for color-coding
 */
function getIngredientTypeClass(name, sectionType) {
    if (sectionType === 'creature') {
        return 'ingredient-creature';
    }
    if (sectionType === 'rare') {
        return 'ingredient-rare';
    }
    const commonFloraTypes = {
        'Deadly nightshade': 'ingredient-augmenting',
        'Juniper berries': 'ingredient-curative',
        'Willow bark': 'ingredient-fortifying',
        'Fleshwort': 'ingredient-restorative',
        'Alchemilla': 'ingredient-enhancing',
        'Ephedra': 'ingredient-enhancing'
    };
    return commonFloraTypes[name] || 'ingredient-common';
}

/**
 * Create HTML for an ingredient row with number spinner
 */
function createIngredientRow(name, sectionType = 'common') {
    const count = ingredientInventory[name] || 0;
    const hasCount = count > 0;
    const typeClass = getIngredientTypeClass(name, sectionType);

    return `
        <div class="ingredient-row ${typeClass} ${hasCount ? 'has-count' : ''}" data-ingredient="${name}">
            <span class="ingredient-name" title="${name}">${name}</span>
            <div class="number-spinner">
                <button class="spinner-dec" data-ingredient="${name}" ${count === 0 ? 'disabled' : ''}>−</button>
                <input type="number" class="spinner-value" data-ingredient="${name}" value="${count}" min="0" max="${MAX_INGREDIENT_COUNT}">
                <button class="spinner-inc" data-ingredient="${name}">+</button>
            </div>
        </div>
    `;
}

/**
 * Create HTML for an inventory section
 */
function createInventorySection(title, ingredients, collapsed = true, sectionType = 'common') {
    const uniqueIngredients = [...new Set(ingredients)];
    const rows = uniqueIngredients.map(name => createIngredientRow(name, sectionType)).join('');

    return `
        <div class="inventory-section ${collapsed ? 'collapsed' : ''}">
            <div class="inventory-section-header" role="button" tabindex="0">
                <h4 class="inventory-section-title">${title}</h4>
                <span class="inventory-section-toggle">▼</span>
            </div>
            <div class="inventory-section-content">
                ${rows}
            </div>
        </div>
    `;
}

/**
 * Render the craft inventory panel
 */
export function renderCraftInventory() {
    const container = document.getElementById('inventory-sections');
    if (!container || !ingredientsList) return;

    const expandedSections = new Set();
    container.querySelectorAll('.inventory-section, .inventory-group').forEach(section => {
        if (!section.classList.contains('collapsed')) {
            const title = section.querySelector('.inventory-section-title, .inventory-group-title')?.textContent?.trim();
            if (title) expandedSections.add(title);
        }
    });

    const isFirstRender = expandedSections.size === 0 &&
        container.querySelectorAll('.inventory-section, .inventory-group').length === 0;

    let floraHtml = '';
    const commonFloraExpanded = isFirstRender ? true : expandedSections.has('Common');
    floraHtml += createInventorySection('Common', ingredientsList.commonFlora, !commonFloraExpanded, 'common');

    for (const terrain in ingredientsList.rareFlora) {
        const isExpanded = expandedSections.has(terrain);
        floraHtml += createInventorySection(terrain, ingredientsList.rareFlora[terrain], !isExpanded, 'rare');
    }

    let creatureHtml = '';
    for (const creatureType in ingredientsList.creatureParts) {
        const isExpanded = expandedSections.has(creatureType);
        creatureHtml += createInventorySection(creatureType, ingredientsList.creatureParts[creatureType], !isExpanded, 'creature');
    }

    const floraGroupExpanded = isFirstRender ? true : expandedSections.has('Flora');
    const creatureGroupExpanded = expandedSections.has('Creature Parts');

    const html = `
        <div class="inventory-group ${floraGroupExpanded ? '' : 'collapsed'}">
            <div class="inventory-group-header" role="button" tabindex="0">
                <h3 class="inventory-group-title"><i data-lucide="leaf"></i> Flora</h3>
                <span class="inventory-group-toggle">▼</span>
            </div>
            <div class="inventory-group-content">
                ${floraHtml}
            </div>
        </div>
        <div class="inventory-group ${creatureGroupExpanded ? '' : 'collapsed'}">
            <div class="inventory-group-header" role="button" tabindex="0">
                <h3 class="inventory-group-title"><i data-lucide="skull"></i> Creature Parts</h3>
                <span class="inventory-group-toggle">▼</span>
            </div>
            <div class="inventory-group-content">
                ${creatureHtml}
            </div>
        </div>
    `;

    container.innerHTML = html;
    // Only refresh icons within the container, not the entire page
    icons.refresh(container);
}

/**
 * Show a new count on every row for this ingredient, without a full re-render
 */
function updateIngredientRows(name, value, flash) {
    document.querySelectorAll(`.ingredient-row[data-ingredient="${name}"]`).forEach(row => {
        const input = row.querySelector('.spinner-value');
        const decBtn = row.querySelector('.spinner-dec');
        if (input) input.value = value;
        if (decBtn) decBtn.disabled = value === 0;
        row.classList.toggle('has-count', value > 0);
        if (flash) {
            row.classList.add('updated');
            setTimeout(() => row.classList.remove('updated'), 500);
        }
    });
}

/**
 * Update ingredient count by delta (spinner buttons)
 */
export function updateIngredientCount(name, delta) {
    const current = ingredientInventory[name] || 0;
    const newValue = Math.max(0, Math.min(MAX_INGREDIENT_COUNT, current + delta));
    ingredientInventory[name] = newValue;
    updateIngredientRows(name, newValue, true);
    saveInventory();
    events.emit('inventory:changed', { immediate: false });
}

/**
 * Set ingredient count from a typed value (spinner input)
 */
export function setIngredientCount(name, rawValue) {
    const value = Math.max(0, Math.min(MAX_INGREDIENT_COUNT, parseInt(rawValue) || 0));
    ingredientInventory[name] = value;
    updateIngredientRows(name, value, false);
    saveInventory();
    events.emit('inventory:changed', { immediate: false });
}

/**
 * Export inventory to JSON file
 */
export function exportInventory() {
    const data = {
        version: 1,
        exportedAt: new Date().toISOString(),
        inventory: ingredientInventory
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `meilin-inventory-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

/**
 * Import inventory from a JSON file the player chose. The file is untrusted:
 * it must pass validateInventoryImport before it replaces anything.
 */
export function importInventory(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        let data;
        try {
            data = JSON.parse(e.target.result);
        } catch (err) {
            debug.error('Import error:', err);
            showNotification("Couldn't import that file: it isn't valid JSON.", { type: 'error' });
            return;
        }
        const result = validateInventoryImport(data, getKnownIngredientNames());
        if (!result.ok) {
            showNotification(`Couldn't import that inventory. ${result.error}`, { type: 'error' });
            return;
        }
        setInventory(result.inventory);
        showNotification('Inventory imported', { type: 'success' });
    };
    reader.readAsText(file);
}
