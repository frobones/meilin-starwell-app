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
 * Sort medicines based on the specified sort option
 * @param {Array} medicineList - Array of medicines to sort
 * @param {string} sortBy - Sort option: 'name', 'category', or 'difficulty'
 * @returns {Array} - Sorted array of medicines
 */
function sortMedicines(medicineList, sortBy = 'name') {
    return [...medicineList].sort((a, b) => {
        switch (sortBy) {
            case 'category':
                // Sort by category first, then by name
                const categoryCompare = a.category.localeCompare(b.category);
                if (categoryCompare !== 0) return categoryCompare;
                return a.name.localeCompare(b.name);
            
            case 'difficulty':
                // Sort by difficulty (ascending), then by name
                const diffCompare = a.difficulty - b.difficulty;
                if (diffCompare !== 0) return diffCompare;
                return a.name.localeCompare(b.name);
            
            case 'name':
            default:
                return a.name.localeCompare(b.name);
        }
    });
}

/**
 * Get filtered medicines based on current filters
 */
export function getFilteredMedicines() {
    const filters = store.get('currentFilters') || {};
    // Use store to get medicines - the local variable may have been reassigned
    const allMedicines = store.get('medicines') || medicines;
    
    const filtered = allMedicines.filter(medicine => {
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
    
    // Apply sorting (default to 'name' if no sort specified)
    const sortBy = filters.sort || 'name';
    return sortMedicines(filtered, sortBy);
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
            <p class="medicine-preview">${medicine.effect || medicine.brief}</p>
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
            const id = card.dataset.id;
            // Use store to get medicines - the local variable may have been reassigned
            const allMedicines = store.get('medicines') || medicines;
            const medicine = allMedicines.find(m => String(m.id) === id);
            if (medicine) {
                events.emit('medicine:open', medicine);
            }
        });
    });
    
    // Update count - use store to get total count
    const allMedicines = store.get('medicines') || medicines;
    const countEl = document.getElementById('medicine-count');
    if (countEl) {
        countEl.textContent = `Showing ${filtered.length} of ${allMedicines.length} medicines`;
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

/**
 * Get difficulty label for display
 */
function getDifficultyLabel(difficulty) {
    const labels = { 1: 'Simple', 2: 'Standard', 3: 'Advanced', 4: 'Expert', 5: 'Master' };
    return labels[difficulty] || 'Unknown';
}

/**
 * Make flora clickable
 */
function makeFloraClickable(floraName) {
    const ingredientsData = store.get('ingredients');
    if (ingredientsData?.floraDetails?.[floraName]) {
        return `<span class="flora-clickable" data-flora="${floraName}">${floraName}</span>`;
    }
    return floraName;
}

/**
 * Make creature part clickable
 */
function makeCreatureClickable(partName) {
    return `<span class="creature-clickable" data-creature="${partName}">${partName}</span>`;
}

/**
 * Get secondary ingredient name
 */
function getSecondaryName(secondary) {
    return typeof secondary === 'object' ? secondary.name : secondary;
}

/**
 * Get variable stars display for a medicine
 */
function getVariableStars(medicine) {
    if (!medicine.variableStars || !medicine.starVariants) {
        return null;
    }
    
    return medicine.starVariants.map(variant => {
        const filledCount = variant.stars;
        const variantMax = variant.maxStars || medicine.maxStars || 5;
        const emptyCount = variantMax - filledCount;
        
        const filled = '★'.repeat(filledCount);
        const empty = '☆'.repeat(Math.max(0, emptyCount));
        
        return {
            ...variant,
            starDisplay: filled + empty
        };
    });
}

/**
 * Create HTML for variable star table
 */
function createVariableStarsHtml(medicine) {
    const variants = getVariableStars(medicine);
    if (!variants) return '';
    
    const hasDamage = variants.some(v => v.damage);
    const hasRange = variants.some(v => v.range);
    const hasStrength = variants.some(v => v.strengthScore);
    
    let headerCols = '<th>Amount</th><th>Strength</th>';
    if (hasDamage) headerCols += '<th>Damage</th>';
    if (hasRange) headerCols += '<th>Range</th>';
    if (hasStrength) headerCols += '<th>Str Score</th>';
    
    const rows = variants.map(v => {
        let cols = `<td>×${v.multiplier}</td><td class="variant-stars">${v.starDisplay}</td>`;
        if (hasDamage) cols += `<td>${v.damage || '-'}</td>`;
        if (hasRange) cols += `<td>${v.range || '-'}</td>`;
        if (hasStrength) cols += `<td>${v.strengthScore || '-'}</td>`;
        return `<tr>${cols}</tr>`;
    }).join('');
    
    return `
        <div class="modal-section">
            <h3 class="modal-section-title">Variable Strength</h3>
            <table class="variable-stars-table">
                <thead><tr>${headerCols}</tr></thead>
                <tbody>${rows}</tbody>
            </table>
        </div>
    `;
}

/**
 * Create HTML for details table
 */
function createDetailsTableHtml(medicine) {
    const table = medicine.detailsTable;
    if (!table) return '';
    
    const headerCols = table.headers.map(h => `<th>${h}</th>`).join('');
    const rows = table.rows.map(row => {
        const cols = row.map(cell => `<td>${cell}</td>`).join('');
        return `<tr>${cols}</tr>`;
    }).join('');
    
    return `
        <div class="modal-section">
            <h3 class="modal-section-title">${table.title}</h3>
            <table class="variable-stars-table">
                <thead><tr>${headerCols}</tr></thead>
                <tbody>${rows}</tbody>
            </table>
        </div>
    `;
}

/**
 * Create HTML for medicine components
 */
function createComponentsHtml(medicine) {
    let html = '';
    
    if (medicine.primary) {
        // Handle array of primary alternatives
        if (Array.isArray(medicine.primary)) {
            const primaries = medicine.primary.map(p => makeFloraClickable(p)).join(' or ');
            html += `
                <div class="component-item">
                    <span class="component-label">Primary:</span>
                    <span class="component-value">${primaries}</span>
                </div>
            `;
        } else {
            const primaryClickable = makeFloraClickable(medicine.primary);
            html += `
                <div class="component-item">
                    <span class="component-label">Primary:</span>
                    <span class="component-value">${primaryClickable}</span>
                </div>
            `;
        }
    }
    
    if (medicine.secondary && medicine.secondary.length > 0) {
        const isObjectFormat = typeof medicine.secondary[0] === 'object';
        
        if (isObjectFormat) {
            const floraOptions = medicine.secondary.filter(s => s.type === 'flora').map(s => s.name);
            const creatureOptions = medicine.secondary.filter(s => s.type === 'creature').map(s => s.name);
            
            if (floraOptions.length > 0) {
                const floraClickables = floraOptions.map(f => makeFloraClickable(f)).join(' or ');
                html += `
                    <div class="component-item">
                        <span class="component-label">Secondary:</span>
                        <span class="component-value component-flora">${floraClickables}</span>
                    </div>
                `;
            }
            if (creatureOptions.length > 0) {
                const creatureClickables = creatureOptions.map(c => makeCreatureClickable(c)).join(' or ');
                html += `
                    <div class="component-item">
                        <span class="component-label">Secondary:</span>
                        <span class="component-value component-creature">${creatureClickables}</span>
                    </div>
                `;
            }
        } else {
            // String array format - check floraOnly to determine type
            if (medicine.floraOnly) {
                // Flora-only medicine - treat string secondaries as flora
                const floraClickables = medicine.secondary.map(s => makeFloraClickable(s)).join(' or ');
                html += `
                    <div class="component-item">
                        <span class="component-label">Secondary:</span>
                        <span class="component-value component-flora">${floraClickables}</span>
                    </div>
                `;
            } else {
                // Default: treat string secondaries as creature parts
                const secondaryClickables = medicine.secondary.map(s => makeCreatureClickable(s)).join(' or ');
                html += `
                    <div class="component-item">
                        <span class="component-label">Secondary:</span>
                        <span class="component-value component-creature">${secondaryClickables}</span>
                    </div>
                `;
            }
        }
    }
    
    html += `
        <div class="component-item">
            <span class="component-label">Also needs:</span>
            <span class="component-value">5 gp rare herbs</span>
        </div>
    `;
    
    return html;
}

/**
 * Open medicine detail modal
 */
export function openMedicineModal(medicine) {
    const modal = document.getElementById('modal-overlay');
    const content = document.getElementById('modal-content');
    if (!modal || !content) return;
    
    const stars = getMedicineStars(medicine);
    const componentsHtml = createComponentsHtml(medicine);
    const variableStarsHtml = createVariableStarsHtml(medicine);
    const detailsTableHtml = createDetailsTableHtml(medicine);
    
    content.innerHTML = `
        <div class="modal-header">
            <h2 class="modal-title">${medicine.name}</h2>
            <div class="modal-meta">
                <span class="modal-stars" title="${getDifficultyLabel(medicine.difficulty)}">${stars}</span>
                <span class="modal-dc">DC ${medicine.dc}${medicine.variableStars ? '+' : ''}</span>
                <span class="modal-category medicine-category ${medicine.category}">${medicine.category}</span>
                ${getIngredientBadges(medicine, true)}
            </div>
        </div>
        
        <div class="modal-section">
            <h3 class="modal-section-title">Effect</h3>
            <p class="modal-effect">${(medicine.fullEffect || medicine.effect).replace(/\n/g, '<br>')}</p>
        </div>
        
        ${variableStarsHtml}
        ${detailsTableHtml}
        
        <div class="modal-section">
            <h3 class="modal-section-title">Duration</h3>
            <p class="modal-duration"><strong>${medicine.duration}</strong></p>
        </div>
        
        <div class="modal-section">
            <h3 class="modal-section-title">Components</h3>
            <div class="modal-components">
                ${componentsHtml}
            </div>
        </div>
        
        ${medicine.notes ? `
            <div class="modal-section">
                <p class="modal-notes">${medicine.notes}</p>
            </div>
        ` : ''}
    `;
    
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    icons.refresh();
    
    // Bind click events for flora/creature in the modal
    bindModalClickEvents(content);
}

/**
 * Bind click events for flora/creature links in the modal
 */
function bindModalClickEvents(container) {
    container.querySelectorAll('.flora-clickable').forEach(el => {
        el.addEventListener('click', (e) => {
            e.stopPropagation();
            events.emit('flora:show', el.dataset.flora);
        });
    });
    
    container.querySelectorAll('.creature-clickable').forEach(el => {
        el.addEventListener('click', (e) => {
            e.stopPropagation();
            events.emit('creature:show', el.dataset.creature);
        });
    });
}

/**
 * Open medicine by name
 */
export function openMedicineByName(name) {
    const cleanName = name.replace(/\s*\([^)]*\)\s*/g, '').trim();
    
    // Use store to get medicines - the local variable may have been reassigned
    const allMedicines = store.get('medicines') || medicines;
    
    const medicine = allMedicines.find(m => 
        m.name.toLowerCase() === cleanName.toLowerCase() ||
        m.name.toLowerCase().includes(cleanName.toLowerCase()) ||
        cleanName.toLowerCase().includes(m.name.toLowerCase())
    );
    
    if (medicine) {
        openMedicineModal(medicine);
    } else {
        console.warn(`Medicine not found: ${name} (searched: ${cleanName})`);
    }
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

// Listen for medicine open events
events.on('medicine:open', (medicine) => {
    openMedicineModal(medicine);
});

events.on('medicine:openByName', (name) => {
    openMedicineByName(name);
});
