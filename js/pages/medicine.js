/**
 * Medicine Page Controller
 * Handles medicine list, filtering, cards, and detail modals.
 */

import { dataLoader } from '../core/data-loader.js';
import { store } from '../core/state.js';
import { events } from '../core/events.js';
import { icons } from '../core/icons.js';

// Private state
let medicines = [];
let ingredients = null;
let rules = null;

/**
 * Load medicine and ingredient data
 */
export async function loadMedicineData() {
    try {
        const [medicinesData, ingredientsData] = await Promise.all([
            dataLoader.loadJSON('js/data/medicines.json'),
            dataLoader.loadJSON('js/data/ingredients.json')
        ]);
        
        medicines = medicinesData.medicines || [];
        rules = medicinesData.rules || {};
        ingredients = ingredientsData;
        
        // Update store
        store.set('medicines', medicines);
        store.set('ingredients', ingredients);
        store.set('rules', rules);
        
        events.emit('medicine:loaded', { medicines, ingredients, rules });
    } catch (error) {
        console.error('Failed to load medicine data:', error);
    }
}

/**
 * Get star display for a medicine
 */
export function getMedicineStars(medicine) {
    const difficulty = medicine.difficulty;
    
    if (medicine.variableStars && medicine.starVariants && medicine.starVariants.length > 0) {
        const firstVariant = medicine.starVariants[0];
        if (firstVariant.maxStars) {
            const filled = '★'.repeat(firstVariant.stars);
            const empty = '☆'.repeat(firstVariant.maxStars - firstVariant.stars);
            return filled + empty;
        }
        return '★'.repeat(difficulty);
    }
    
    const maxStars = medicine.maxStars || 5;
    const indefiniteStar = medicine.indefiniteStar || false;
    
    const filledCount = difficulty;
    const indefiniteCount = indefiniteStar ? 1 : 0;
    const emptyCount = maxStars - filledCount - indefiniteCount;
    
    const filled = '★'.repeat(filledCount);
    const empty = '☆'.repeat(Math.max(0, emptyCount));
    const indefinite = indefiniteStar ? '✧' : '';
    
    return filled + empty + indefinite;
}

/**
 * Check if a medicine has a flora-based option
 */
export function hasFloraOption(medicine) {
    if (medicine.floraOnly) return true;
    if (medicine.secondary && medicine.secondary.length > 0) {
        const isObjectFormat = typeof medicine.secondary[0] === 'object';
        if (isObjectFormat) {
            return medicine.secondary.some(s => s.type === 'flora');
        }
    }
    return false;
}

/**
 * Check if a medicine requires creature parts
 */
export function hasCreatureOption(medicine) {
    if (medicine.floraOnly) return false;
    if (medicine.secondary && medicine.secondary.length > 0) {
        const isObjectFormat = typeof medicine.secondary[0] === 'object';
        if (isObjectFormat) {
            return medicine.secondary.some(s => s.type === 'creature');
        }
        return true;
    }
    return false;
}

/**
 * Get ingredient badges HTML
 */
export function getIngredientBadges(medicine, forModal = false) {
    const hasFlora = hasFloraOption(medicine);
    const hasCreature = hasCreatureOption(medicine);
    
    let badges = '';
    
    if (hasFlora && hasCreature) {
        if (forModal) {
            badges = `<span class="modal-badges-group"><span class="medicine-flora-badge" title="Has flora option"><i data-lucide="sprout"></i> Flora</span><span class="medicine-creature-badge" title="Has creature option"><i data-lucide="bone"></i> Creature</span></span>`;
        } else {
            badges = `<span class="medicine-flora-badge" title="Has flora option"><i data-lucide="sprout"></i></span>`;
            badges += `<span class="medicine-creature-badge" title="Has creature option"><i data-lucide="bone"></i></span>`;
        }
    } else if (hasFlora) {
        badges = forModal 
            ? `<span class="medicine-flora-badge" title="Flora option available"><i data-lucide="sprout"></i> Flora</span>`
            : `<span class="medicine-flora-badge" title="Flora option available"><i data-lucide="sprout"></i></span>`;
    } else if (hasCreature) {
        badges = forModal
            ? `<span class="medicine-creature-badge" title="Requires creature parts"><i data-lucide="bone"></i> Creature</span>`
            : `<span class="medicine-creature-badge" title="Requires creature parts"><i data-lucide="bone"></i></span>`;
    }
    
    return badges;
}

/**
 * Get filtered medicines based on current filters
 */
export function getFilteredMedicines() {
    const filters = store.get('currentFilters') || {};
    
    return medicines.filter(medicine => {
        // Search filter
        if (filters.search) {
            const searchTerm = filters.search.toLowerCase();
            const matchesName = medicine.name.toLowerCase().includes(searchTerm);
            const matchesBrief = medicine.brief?.toLowerCase().includes(searchTerm);
            const matchesEffect = medicine.effect?.toLowerCase().includes(searchTerm);
            
            if (!matchesName && !matchesBrief && !matchesEffect) {
                return false;
            }
        }

        // Category filter
        if (filters.category && filters.category !== 'all') {
            if (medicine.category !== filters.category) {
                return false;
            }
        }

        // Difficulty filter
        if (filters.difficulty && filters.difficulty !== 'all') {
            if (medicine.difficulty !== parseInt(filters.difficulty)) {
                return false;
            }
        }

        // Ingredient type filter
        if (filters.ingredientType && filters.ingredientType !== 'all') {
            if (filters.ingredientType === 'flora' && !hasFloraOption(medicine)) {
                return false;
            }
            if (filters.ingredientType === 'creature' && !hasCreatureOption(medicine)) {
                return false;
            }
        }

        return true;
    });
}

/**
 * Create medicine card HTML
 */
export function createMedicineCard(medicine) {
    const stars = getMedicineStars(medicine);
    const badges = getIngredientBadges(medicine);
    const variableIndicator = medicine.variableStars ? '<span class="variable-star-indicator">⚡</span>' : '';
    
    return `
        <div class="medicine-card" data-id="${medicine.id}" data-category="${medicine.category}">
            <div class="medicine-ingredient-badges">${badges}</div>
            <div class="medicine-card-header">
                <h3 class="medicine-name">${medicine.name}</h3>
                <span class="medicine-stars">${stars}${variableIndicator}</span>
            </div>
            <div class="medicine-meta">
                <span class="medicine-category ${medicine.category}">${medicine.category}</span>
                <span class="medicine-dc">DC ${medicine.dc}</span>
            </div>
            <p class="medicine-preview">${medicine.brief || medicine.effect}</p>
        </div>
    `;
}

/**
 * Render the medicine grid
 */
export function renderMedicines() {
    const container = document.getElementById('medicine-grid');
    if (!container) return;
    
    const filtered = getFilteredMedicines();
    
    if (filtered.length === 0) {
        container.innerHTML = `
            <div class="no-results">
                <div class="no-results-icon">🌿</div>
                <p>No medicines found matching your criteria.</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = filtered.map(m => createMedicineCard(m)).join('');
    
    // Bind click events
    container.querySelectorAll('.medicine-card').forEach(card => {
        card.addEventListener('click', () => {
            const id = parseInt(card.dataset.id);
            const medicine = medicines.find(m => m.id === id);
            if (medicine) {
                events.emit('medicine:open', medicine);
            }
        });
    });
    
    // Update count
    const countEl = document.getElementById('medicine-count');
    if (countEl) {
        countEl.textContent = `Showing ${filtered.length} of ${medicines.length} medicines`;
    }
    
    icons.refresh();
}

/**
 * Update filters and re-render
 */
export function updateFilters(newFilters) {
    const currentFilters = store.get('currentFilters') || {};
    store.set('currentFilters', { ...currentFilters, ...newFilters });
    renderMedicines();
}

// Getters
export function getMedicines() { return medicines; }
export function getIngredients() { return ingredients; }
export function getRules() { return rules; }

// Listen for filter changes
store.subscribe('currentFilters', () => {
    renderMedicines();
});

// Listen for page change events
events.on('page:change', ({ page }) => {
    if (page === 'medicine' && medicines.length === 0) {
        loadMedicineData().then(() => renderMedicines());
    }
});
