/**
 * Craft Page Controller
 * Handles inventory management, craftable medicines, and craft modal.
 */

import { store } from '../core/state.js';
import { events } from '../core/events.js';
import { icons } from '../core/icons.js';

// Private state
const INVENTORY_STORAGE_KEY = 'meilin-inventory';
let ingredientInventory = {};
let ingredientsList = null;
let creaturePartsLookup = {};
let craftEventsBound = false;
let craftModalState = null;

// Duration ladder for Alchemilla enhancement
const durationLadder = ['1 minute', '10 minutes', '1 hour', '8 hours', '24 hours'];

/**
 * Initialize the craft module
 */
export function initCraft() {
    loadInventory();
    buildIngredientsList();
    renderCraftInventory();
    renderCraftableMedicines();
    bindCraftEvents();
}

/**
 * Build a structured list of all ingredients from the data
 */
function buildIngredientsList() {
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
 * Load inventory from localStorage
 */
function loadInventory() {
    try {
        const stored = localStorage.getItem(INVENTORY_STORAGE_KEY);
        if (stored) {
            ingredientInventory = JSON.parse(stored);
        }
    } catch (e) {
        console.warn('Failed to load inventory from localStorage:', e);
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
        console.warn('Failed to save inventory to localStorage:', e);
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
                <input type="number" class="spinner-value" data-ingredient="${name}" value="${count}" min="0" max="99">
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
            <div class="inventory-section-header">
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
            <div class="inventory-group-header">
                <h3 class="inventory-group-title"><i data-lucide="leaf"></i> Flora</h3>
                <span class="inventory-group-toggle">▼</span>
            </div>
            <div class="inventory-group-content">
                ${floraHtml}
            </div>
        </div>
        <div class="inventory-group ${creatureGroupExpanded ? '' : 'collapsed'}">
            <div class="inventory-group-header">
                <h3 class="inventory-group-title"><i data-lucide="skull"></i> Creature Parts</h3>
                <span class="inventory-group-toggle">▼</span>
            </div>
            <div class="inventory-group-content">
                ${creatureHtml}
            </div>
        </div>
    `;
    
    container.innerHTML = html;
    icons.refresh();
}

/**
 * Update ingredient count by delta
 */
function updateIngredientCount(name, delta) {
    const current = ingredientInventory[name] || 0;
    const newValue = Math.max(0, Math.min(99, current + delta));
    ingredientInventory[name] = newValue;
    
    const rows = document.querySelectorAll(`.ingredient-row[data-ingredient="${name}"]`);
    rows.forEach(row => {
        const input = row.querySelector('.spinner-value');
        const decBtn = row.querySelector('.spinner-dec');
        if (input) input.value = newValue;
        if (decBtn) decBtn.disabled = newValue === 0;
        
        row.classList.toggle('has-count', newValue > 0);
        row.classList.add('updated');
        setTimeout(() => row.classList.remove('updated'), 500);
    });
    
    saveInventory();
    renderCraftableMedicines();
}

/**
 * Get secondary ingredient name (handles both string and object formats)
 */
function getSecondaryName(secondary) {
    return typeof secondary === 'object' ? secondary.name : secondary;
}

/**
 * Check if a medicine has alternative secondary ingredients
 */
function hasAlternativeSecondaries(medicine) {
    if (medicine.notes?.toLowerCase().includes(' or ')) {
        return true;
    }
    
    const secondaries = medicine.secondary || [];
    if (secondaries.length < 2) return false;
    
    const types = new Set();
    for (const s of secondaries) {
        if (typeof s === 'object' && s.type) {
            types.add(s.type);
        }
    }
    
    return types.size > 1;
}

/**
 * Check if a medicine has alternative primary ingredients
 */
function hasAlternativePrimaries(medicine) {
    return Array.isArray(medicine.primary) && medicine.primary.length > 1;
}

/**
 * Check if a medicine can be crafted with current inventory
 */
function canCraftMedicine(medicine) {
    // Check primary ingredient(s)
    if (medicine.primary) {
        if (hasAlternativePrimaries(medicine)) {
            const hasAnyPrimary = medicine.primary.some(p => 
                (ingredientInventory[p] || 0) >= 1
            );
            if (!hasAnyPrimary) return false;
        } else {
            if ((ingredientInventory[medicine.primary] || 0) < 1) {
                return false;
            }
        }
    }
    
    const secondaries = medicine.secondary || [];
    if (secondaries.length === 0) return true;
    
    const isOrAlternative = hasAlternativeSecondaries(medicine);
    
    if (isOrAlternative) {
        return secondaries.some(s => {
            const name = getSecondaryName(s);
            return (ingredientInventory[name] || 0) >= 1;
        });
    } else {
        return secondaries.every(s => {
            const name = getSecondaryName(s);
            return (ingredientInventory[name] || 0) >= 1;
        });
    }
}

/**
 * Get all craftable medicines based on current inventory, sorted by name
 */
function getCraftableMedicines() {
    const medicines = store.get('medicines') || [];
    const craftable = medicines.filter(medicine => canCraftMedicine(medicine));
    // Sort strictly by name
    return craftable.sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Get star display for a medicine
 */
function getMedicineStars(medicine) {
    const difficulty = medicine.difficulty;
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
 * Get enhanced star display for a medicine with enhancements
 * The ✧ (4-point star) represents the last fillable slot - when filled, duration becomes indefinite
 */
function getEnhancedStars(medicine, enhancementCount) {
    const baseDifficulty = medicine.difficulty;
    const maxStars = medicine.maxStars || 5;
    const hasIndefiniteStar = medicine.indefiniteStar || false;
    
    // Effective difficulty is capped at maxStars
    const effectiveDifficulty = Math.min(baseDifficulty + enhancementCount, maxStars);
    
    if (hasIndefiniteStar) {
        // The last slot is the "indefinite" slot (shown as ✧ when empty, ✦ when filled)
        const regularSlots = maxStars - 1;
        
        if (effectiveDifficulty >= maxStars) {
            // All slots filled including the indefinite slot - indefinite becomes ✦ (filled 4-point star)
            return '★'.repeat(regularSlots) + '✦';
        } else {
            // Some slots still empty
            const filledRegular = Math.min(effectiveDifficulty, regularSlots);
            const emptyRegular = regularSlots - filledRegular;
            return '★'.repeat(filledRegular) + '☆'.repeat(emptyRegular) + '✧';
        }
    } else {
        // No indefinite star - simple fill
        const emptyCount = maxStars - effectiveDifficulty;
        return '★'.repeat(effectiveDifficulty) + '☆'.repeat(Math.max(0, emptyCount));
    }
}

/**
 * Check if medicine can use Alchemilla (has extendable duration)
 */
function canUseAlchemilla(medicine) {
    // Check if medicine has alchemilla data or has a valid duration
    if (medicine.alchemilla) return true;
    
    const duration = (medicine.duration || '').toLowerCase();
    // Exclude instant effects and spell-based durations
    if (!duration || duration === 'instant' || duration.includes('spell')) return false;
    
    // Check if duration matches one of the ladder values
    const normalizedDuration = duration.replace('hours', 'hrs').replace('minutes', 'min');
    return durationLadder.some(d => normalizedDuration.includes(d.toLowerCase()));
}

/**
 * Check if medicine can use Ephedra (has dice for HP restoration)
 */
function canUseEphedra(medicine) {
    // Check if medicine has ephedra data
    if (medicine.ephedra) return true;
    
    // Check effect text for dice patterns like "2d6 hit points"
    const effect = (medicine.effect || '').toLowerCase();
    const hasDice = /\d+d\d+/.test(effect);
    const hasHealingKeyword = effect.includes('hit point') || effect.includes('regain') || effect.includes('heal');
    
    return hasDice && hasHealingKeyword;
}

/**
 * Get enhanced duration based on Alchemilla count
 * If totalEnhancements fills the indefinite star, duration becomes Indefinite
 */
function getEnhancedDuration(medicine, alchemillaCount, totalEnhancements = null) {
    // Check if indefinite star is filled (total enhancements fills all slots)
    const total = totalEnhancements !== null ? totalEnhancements : alchemillaCount;
    const hasIndefiniteStar = medicine.indefiniteStar || false;
    const maxStars = medicine.maxStars || 5;
    
    if (hasIndefiniteStar && medicine.difficulty + total >= maxStars) {
        return 'Indefinite';
    }
    
    if (alchemillaCount === 0) return medicine.duration || '1 hour';
    
    // Find base duration index in ladder
    let baseIndex = 2; // Default to "1 hour" (index 2)
    if (medicine.alchemilla?.durationIndex !== undefined) {
        baseIndex = medicine.alchemilla.durationIndex;
    } else {
        const duration = (medicine.duration || '').toLowerCase().replace('hours', 'hrs').replace('minutes', 'min');
        const foundIndex = durationLadder.findIndex(d => duration.includes(d.toLowerCase()));
        if (foundIndex !== -1) baseIndex = foundIndex;
    }
    
    const newIndex = Math.min(baseIndex + alchemillaCount, durationLadder.length - 1);
    return durationLadder[newIndex];
}

/**
 * Get enhanced effect text based on Ephedra count
 */
function getEnhancedDice(medicine, ephedraCount) {
    if (ephedraCount === 0 || !medicine.ephedra) return null;
    
    const multiplier = Math.pow(2, ephedraCount);
    const newDiceCount = medicine.ephedra.diceCount * multiplier;
    const diceType = medicine.ephedra.diceType;
    const modifier = medicine.ephedra.modifier || 0;
    
    return `${newDiceCount}d${diceType}${modifier > 0 ? '+' + modifier : ''}`;
}

/**
 * Create HTML for a compact craftable medicine card
 */
function createCraftableCard(medicine, isNew = false) {
    const stars = getMedicineStars(medicine);
    const briefText = medicine.brief || (medicine.effect.length > 50 
        ? medicine.effect.substring(0, 50) + '...'
        : medicine.effect);
    
    return `
        <article class="craftable-card ${isNew ? 'fade-in' : ''}" data-id="${medicine.id}" data-medicine="${medicine.id}" data-category="${medicine.category}">
            <h3 class="medicine-name">${medicine.name}</h3>
            <span class="medicine-stars">${stars}</span>
            <div class="medicine-meta">
                <span class="medicine-category ${medicine.category}">${medicine.category}</span>
                <span class="medicine-dc">DC ${medicine.dc}</span>
            </div>
            <p class="medicine-preview">${briefText}</p>
        </article>
    `;
}

/**
 * Render craftable medicine cards
 */
export function renderCraftableMedicines() {
    const grid = document.getElementById('craftable-grid');
    const countEl = document.getElementById('craftable-count');
    if (!grid) return;
    
    const craftable = getCraftableMedicines();
    
    if (countEl) {
        countEl.textContent = `${craftable.length} medicine${craftable.length !== 1 ? 's' : ''}`;
    }
    
    if (craftable.length === 0) {
        grid.innerHTML = '<p class="empty-state">Add ingredients to see what you can craft...</p>';
        return;
    }
    
    const previousIds = Array.from(grid.querySelectorAll('.craftable-card'))
        .map(card => card.dataset.id);
    
    grid.innerHTML = craftable.map(medicine => {
        const isNew = !previousIds.includes(String(medicine.id));
        return createCraftableCard(medicine, isNew);
    }).join('');
    
    bindCraftableCardEvents(grid);
    icons.refresh();
}

/**
 * Bind events for craftable cards
 */
function bindCraftableCardEvents(container) {
    container.querySelectorAll('.craftable-card').forEach(card => {
        card.addEventListener('click', () => {
            const medicineId = card.dataset.medicine;
            const medicines = store.get('medicines') || [];
            const medicine = medicines.find(m => String(m.id) === medicineId);
            if (medicine) {
                openCraftModal(medicine);
            }
        });
    });
}

/**
 * Get DC for a difficulty level
 */
function getDCForDifficulty(difficulty) {
    const dcMap = { 1: 10, 2: 15, 3: 20, 4: 25, 5: 28 };
    return dcMap[Math.min(5, difficulty)] || 28;
}

/**
 * Open craft modal for a medicine
 */
export function openCraftModal(medicine) {
    const overlay = document.getElementById('craft-modal-overlay');
    const content = document.getElementById('craft-modal-content');
    if (!overlay || !content) return;
    
    const maxEnhancements = (medicine.maxStars || 5) - medicine.difficulty;
    const alternatives = getAvailableAlternatives(medicine);
    const primaryAlternatives = getAvailablePrimaryAlternatives(medicine);
    
    craftModalState = {
        medicine: medicine,
        alchemillaCount: 0,
        ephedraCount: 0,
        chosenAlternative: alternatives.length > 0 ? alternatives[0].name : null,
        chosenPrimary: primaryAlternatives.length > 0 ? primaryAlternatives[0].name : null,
        alternatives: alternatives,
        primaryAlternatives: primaryAlternatives,
        maxEnhancements: maxEnhancements
    };
    
    renderCraftModalContent();
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
}

/**
 * Get available alternatives for OR-type medicines
 */
function getAvailableAlternatives(medicine) {
    if (!hasAlternativeSecondaries(medicine)) return [];
    
    const secondaries = medicine.secondary || [];
    return secondaries
        .filter(s => {
            const name = getSecondaryName(s);
            return (ingredientInventory[name] || 0) >= 1;
        })
        .map(s => ({
            name: getSecondaryName(s),
            type: typeof s === 'object' && s.type ? s.type : 'flora'
        }));
}

/**
 * Get available primary alternatives for the medicine
 */
function getAvailablePrimaryAlternatives(medicine) {
    if (!hasAlternativePrimaries(medicine)) return [];
    
    return medicine.primary
        .filter(name => (ingredientInventory[name] || 0) >= 1)
        .map(name => ({ name, type: 'flora' }));
}

/**
 * Render craft modal content
 */
function renderCraftModalContent() {
    const content = document.getElementById('craft-modal-content');
    if (!content || !craftModalState) return;
    
    const { medicine, alchemillaCount, ephedraCount, chosenAlternative, alternatives, chosenPrimary, primaryAlternatives, maxEnhancements } = craftModalState;
    
    const totalEnhancementsUsed = alchemillaCount + ephedraCount;
    const effectiveDifficulty = medicine.difficulty + totalEnhancementsUsed;
    const effectiveDC = getDCForDifficulty(effectiveDifficulty);
    
    // Get enhanced stars that reflect current enhancements
    const stars = getEnhancedStars(medicine, totalEnhancementsUsed);
    
    // Build the unified recipe section with stars and DC
    const recipeHtml = buildRecipeSection(medicine, alchemillaCount, ephedraCount, maxEnhancements, 
        chosenAlternative, alternatives, chosenPrimary, primaryAlternatives, stars, effectiveDC);
    
    content.innerHTML = `
        <div class="craft-modal-header" data-category="${medicine.category}">
            <div class="craft-modal-title-row">
                <span class="craft-category-badge ${medicine.category}">${medicine.category}</span>
                <h2>${medicine.name}</h2>
            </div>
            <p class="effect-full">${medicine.fullEffect || medicine.effect}</p>
        </div>
        
        ${recipeHtml}
        
        <div class="craft-modal-actions">
            <button class="confirm-craft-btn" id="confirm-craft">
                <i data-lucide="flask-conical"></i>
                Confirm Craft
            </button>
            <button class="cancel-craft-btn" id="cancel-craft">Cancel</button>
        </div>
    `;
    
    bindCraftModalEvents();
    icons.refresh();
}

/**
 * Build the unified Recipe section
 */
function buildRecipeSection(medicine, alchemillaCount, ephedraCount, maxEnhancements, 
    chosenAlternative, alternatives, chosenPrimary, primaryAlternatives, stars, effectiveDC) {
    
    const totalUsed = alchemillaCount + ephedraCount;
    const canAddMore = totalUsed < maxEnhancements;
    const alchemillaAvailable = ingredientInventory['Alchemilla'] || 0;
    const ephedraAvailable = ingredientInventory['Ephedra'] || 0;
    
    const showAlchemilla = canUseAlchemilla(medicine);
    const showEphedra = canUseEphedra(medicine);
    const hasEnhancements = showAlchemilla || showEphedra;
    
    // Get current values for result display
    const currentDuration = getEnhancedDuration(medicine, alchemillaCount, totalUsed);
    const isIndefinite = currentDuration === 'Indefinite';
    
    const getBaseDice = () => {
        if (!medicine.ephedra) return '';
        const { diceCount, diceType, modifier } = medicine.ephedra;
        return `${diceCount}d${diceType}${modifier > 0 ? '+' + modifier : ''}`;
    };
    const baseDice = getBaseDice();
    const currentDice = ephedraCount > 0 ? getEnhancedDice(medicine, ephedraCount) : baseDice;
    
    // Build result display (only if medicine has enhanceable properties)
    let resultHtml = '';
    if (hasEnhancements && maxEnhancements > 0) {
        let resultCards = '';
        
        if (showAlchemilla) {
            resultCards += `
                <div class="recipe-result-card duration ${alchemillaCount > 0 ? 'active' : ''} ${isIndefinite ? 'indefinite' : ''}">
                    <i data-lucide="clock"></i>
                    <span class="recipe-result-value">${currentDuration}</span>
                    <span class="recipe-result-label">Duration</span>
                </div>
            `;
        }
        
        if (showEphedra && medicine.ephedra) {
            resultCards += `
                <div class="recipe-result-card potency ${ephedraCount > 0 ? 'active' : ''}">
                    <i data-lucide="heart"></i>
                    <span class="recipe-result-value">${currentDice}</span>
                    <span class="recipe-result-label">Potency</span>
                </div>
            `;
        }
        
        if (resultCards) {
            resultHtml = `<div class="recipe-results">${resultCards}</div>`;
        }
    }
    
    // Build ingredient rows
    let ingredientRows = '';
    
    // Primary ingredient
    if (medicine.primary) {
        const hasPrimaryAlts = primaryAlternatives && primaryAlternatives.length > 1;
        const primaryName = hasPrimaryAlts ? chosenPrimary : medicine.primary;
        
        ingredientRows += `
            <div class="recipe-ingredient-row primary">
                <div class="recipe-ingredient-info">
                    <i data-lucide="flower-2"></i>
                    <span class="recipe-ingredient-name">${primaryName}</span>
                </div>
                ${hasPrimaryAlts ? `
                    <div class="recipe-ingredient-alternatives">
                        ${primaryAlternatives.map(alt => `
                            <label class="recipe-alt-option ${chosenPrimary === alt.name ? 'selected' : ''}">
                                <input type="radio" name="primary-alternative" value="${alt.name}" 
                                    ${chosenPrimary === alt.name ? 'checked' : ''}>
                                <span>${alt.name}</span>
                            </label>
                        `).join('')}
                    </div>
                ` : ''}
            </div>
        `;
    }
    
    // Secondary ingredients
    const isOrAlternative = hasAlternativeSecondaries(medicine);
    const hasSecondaryAlts = alternatives && alternatives.length > 1;
    
    if (medicine.secondary && medicine.secondary.length > 0) {
        if (isOrAlternative) {
            // OR alternatives - show chosen one with options
            const secondaryName = chosenAlternative || getSecondaryName(medicine.secondary[0]);
            const isCreature = creaturePartsLookup?.[secondaryName];
            
            ingredientRows += `
                <div class="recipe-ingredient-row secondary ${isCreature ? 'creature' : ''}">
                    <div class="recipe-ingredient-info">
                        <i data-lucide="${isCreature ? 'skull' : 'leaf'}"></i>
                        <span class="recipe-ingredient-name">${secondaryName}</span>
                    </div>
                    ${hasSecondaryAlts ? `
                        <div class="recipe-ingredient-alternatives">
                            ${alternatives.map(alt => `
                                <label class="recipe-alt-option ${alt.type === 'creature' ? 'creature' : ''} ${chosenAlternative === alt.name ? 'selected' : ''}">
                                    <input type="radio" name="alternative" value="${alt.name}" 
                                        ${chosenAlternative === alt.name ? 'checked' : ''}>
                                    <span>${alt.name}</span>
                                </label>
                            `).join('')}
                        </div>
                    ` : ''}
                </div>
            `;
        } else {
            // AND - all required
            medicine.secondary.forEach(s => {
                const name = getSecondaryName(s);
                const isCreature = creaturePartsLookup?.[name];
                
                ingredientRows += `
                    <div class="recipe-ingredient-row secondary ${isCreature ? 'creature' : ''}">
                        <div class="recipe-ingredient-info">
                            <i data-lucide="${isCreature ? 'skull' : 'leaf'}"></i>
                            <span class="recipe-ingredient-name">${name}</span>
                        </div>
                    </div>
                `;
            });
        }
    }
    
    // Enhancement ingredients (Alchemilla / Ephedra)
    if (hasEnhancements && maxEnhancements > 0) {
        if (showAlchemilla) {
            const alchemillaRemaining = alchemillaAvailable - alchemillaCount;
            ingredientRows += `
                <div class="recipe-ingredient-row enhancement ${alchemillaCount > 0 ? 'active' : ''}">
                    <div class="recipe-ingredient-info">
                        <i data-lucide="sparkles"></i>
                        <span class="recipe-ingredient-name">Alchemilla</span>
                        <span class="recipe-ingredient-available">${alchemillaRemaining} avail</span>
                    </div>
                    <div class="recipe-ingredient-spinner">
                        <button class="enhancement-dec" data-type="alchemilla" ${alchemillaCount === 0 ? 'disabled' : ''}>−</button>
                        <span class="enhancement-count">${alchemillaCount}</span>
                        <button class="enhancement-inc" data-type="alchemilla" ${!canAddMore || alchemillaRemaining <= 0 ? 'disabled' : ''}>+</button>
                    </div>
                </div>
            `;
        }
        
        if (showEphedra) {
            const ephedraRemaining = ephedraAvailable - ephedraCount;
            ingredientRows += `
                <div class="recipe-ingredient-row enhancement ${ephedraCount > 0 ? 'active' : ''}">
                    <div class="recipe-ingredient-info">
                        <i data-lucide="sparkles"></i>
                        <span class="recipe-ingredient-name">Ephedra</span>
                        <span class="recipe-ingredient-available">${ephedraRemaining} avail</span>
                    </div>
                    <div class="recipe-ingredient-spinner">
                        <button class="enhancement-dec" data-type="ephedra" ${ephedraCount === 0 ? 'disabled' : ''}>−</button>
                        <span class="enhancement-count">${ephedraCount}</span>
                        <button class="enhancement-inc" data-type="ephedra" ${!canAddMore || ephedraRemaining <= 0 ? 'disabled' : ''}>+</button>
                    </div>
                </div>
            `;
        }
    }
    
    return `
        <div class="craft-modal-section craft-recipe">
            <div class="section-header">
                <i data-lucide="flask-conical"></i>
                <h4>Recipe</h4>
                <div class="recipe-header-stats">
                    <span class="recipe-stars">${stars}</span>
                    <span class="recipe-dc">DC ${effectiveDC}</span>
                </div>
            </div>
            ${resultHtml}
            <div class="recipe-ingredients">
                ${ingredientRows}
            </div>
        </div>
    `;
}

/**
 * Bind events within the craft modal
 */
function bindCraftModalEvents() {
    // Primary ingredient alternative selection
    document.querySelectorAll('input[name="primary-alternative"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            craftModalState.chosenPrimary = e.target.value;
            renderCraftModalContent();
        });
    });
    
    // Secondary ingredient alternative selection
    document.querySelectorAll('input[name="alternative"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            craftModalState.chosenAlternative = e.target.value;
            renderCraftModalContent();
        });
    });
    
    // Enhancement controls
    document.querySelectorAll('.enhancement-inc').forEach(btn => {
        btn.addEventListener('click', () => {
            const type = btn.dataset.type;
            if (type === 'alchemilla') {
                craftModalState.alchemillaCount = Math.min(
                    craftModalState.alchemillaCount + 1,
                    craftModalState.maxEnhancements - craftModalState.ephedraCount,
                    ingredientInventory['Alchemilla'] || 0
                );
            } else if (type === 'ephedra') {
                craftModalState.ephedraCount = Math.min(
                    craftModalState.ephedraCount + 1,
                    craftModalState.maxEnhancements - craftModalState.alchemillaCount,
                    ingredientInventory['Ephedra'] || 0
                );
            }
            renderCraftModalContent();
        });
    });
    
    document.querySelectorAll('.enhancement-dec').forEach(btn => {
        btn.addEventListener('click', () => {
            const type = btn.dataset.type;
            if (type === 'alchemilla') {
                craftModalState.alchemillaCount = Math.max(0, craftModalState.alchemillaCount - 1);
            } else if (type === 'ephedra') {
                craftModalState.ephedraCount = Math.max(0, craftModalState.ephedraCount - 1);
            }
            renderCraftModalContent();
        });
    });
    
    const confirmBtn = document.getElementById('confirm-craft');
    if (confirmBtn) {
        confirmBtn.addEventListener('click', () => executeCraft());
    }
    
    const cancelBtn = document.getElementById('cancel-craft');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => closeCraftModal());
    }
}

/**
 * Execute the craft action
 */
function executeCraft() {
    if (!craftModalState) return;
    
    const { medicine, alchemillaCount, ephedraCount, chosenAlternative, chosenPrimary } = craftModalState;
    
    // Deduct primary ingredient
    if (medicine.primary) {
        if (hasAlternativePrimaries(medicine) && chosenPrimary) {
            ingredientInventory[chosenPrimary] = (ingredientInventory[chosenPrimary] || 0) - 1;
        } else if (!hasAlternativePrimaries(medicine)) {
            ingredientInventory[medicine.primary] = (ingredientInventory[medicine.primary] || 0) - 1;
        }
    }
    
    const isOrAlternative = hasAlternativeSecondaries(medicine);
    
    if (isOrAlternative && chosenAlternative) {
        ingredientInventory[chosenAlternative] = (ingredientInventory[chosenAlternative] || 0) - 1;
    } else if (!isOrAlternative) {
        (medicine.secondary || []).forEach(s => {
            const name = getSecondaryName(s);
            ingredientInventory[name] = (ingredientInventory[name] || 0) - 1;
        });
    }
    
    if (alchemillaCount > 0) {
        ingredientInventory['Alchemilla'] = (ingredientInventory['Alchemilla'] || 0) - alchemillaCount;
    }
    if (ephedraCount > 0) {
        ingredientInventory['Ephedra'] = (ingredientInventory['Ephedra'] || 0) - ephedraCount;
    }
    
    // Clean up zero counts
    for (const key in ingredientInventory) {
        if (ingredientInventory[key] <= 0) {
            delete ingredientInventory[key];
        }
    }
    
    saveInventory();
    closeCraftModal();
    renderCraftInventory();
    renderCraftableMedicines();
    bindCraftEvents();
}

/**
 * Close the craft modal
 */
export function closeCraftModal() {
    const overlay = document.getElementById('craft-modal-overlay');
    if (overlay) {
        overlay.classList.remove('active');
        document.body.style.overflow = '';
    }
    craftModalState = null;
}

/**
 * Export inventory to JSON file
 */
function exportInventory() {
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
 * Import inventory from JSON file
 */
function importInventory(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = JSON.parse(e.target.result);
            if (data.inventory && typeof data.inventory === 'object') {
                ingredientInventory = data.inventory;
                saveInventory();
                renderCraftInventory();
                renderCraftableMedicines();
            } else {
                throw new Error('Invalid inventory format');
            }
        } catch (err) {
            alert('Failed to import inventory: Invalid file format');
            console.error('Import error:', err);
        }
    };
    reader.readAsText(file);
}

/**
 * Bind craft event listeners
 */
export function bindCraftEvents() {
    if (craftEventsBound) return;
    craftEventsBound = true;
    
    const inventoryContainer = document.getElementById('inventory-sections');
    if (inventoryContainer) {
        inventoryContainer.addEventListener('click', (e) => {
            const groupHeader = e.target.closest('.inventory-group-header');
            if (groupHeader) {
                const group = groupHeader.closest('.inventory-group');
                group.classList.toggle('collapsed');
                return;
            }
            
            const header = e.target.closest('.inventory-section-header');
            if (header) {
                const section = header.closest('.inventory-section');
                section.classList.toggle('collapsed');
                return;
            }
            
            if (e.target.classList.contains('spinner-dec')) {
                updateIngredientCount(e.target.dataset.ingredient, -1);
            }
            if (e.target.classList.contains('spinner-inc')) {
                updateIngredientCount(e.target.dataset.ingredient, 1);
            }
        });
        
        inventoryContainer.addEventListener('change', (e) => {
            if (e.target.classList.contains('spinner-value')) {
                const name = e.target.dataset.ingredient;
                const value = Math.max(0, Math.min(99, parseInt(e.target.value) || 0));
                ingredientInventory[name] = value;
                
                const allInputs = document.querySelectorAll(`.spinner-value[data-ingredient="${name}"]`);
                allInputs.forEach(input => {
                    input.value = value;
                });
                
                const rows = document.querySelectorAll(`.ingredient-row[data-ingredient="${name}"]`);
                rows.forEach(row => {
                    const decBtn = row.querySelector('.spinner-dec');
                    if (decBtn) decBtn.disabled = value === 0;
                    row.classList.toggle('has-count', value > 0);
                });
                
                saveInventory();
                renderCraftableMedicines();
            }
        });
    }
    
    const clearBtn = document.getElementById('clear-inventory');
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            if (confirm('Clear all ingredients from your inventory?')) {
                ingredientInventory = {};
                saveInventory();
                renderCraftInventory();
                renderCraftableMedicines();
            }
        });
    }
    
    const exportBtn = document.getElementById('export-inventory');
    if (exportBtn) {
        exportBtn.addEventListener('click', () => exportInventory());
    }
    
    const importInput = document.getElementById('import-inventory');
    if (importInput) {
        importInput.addEventListener('change', (e) => {
            if (e.target.files && e.target.files[0]) {
                importInventory(e.target.files[0]);
                e.target.value = '';
            }
        });
    }
    
    const craftModalOverlay = document.getElementById('craft-modal-overlay');
    if (craftModalOverlay) {
        craftModalOverlay.addEventListener('click', (e) => {
            if (e.target.id === 'craft-modal-overlay') {
                closeCraftModal();
            }
        });
    }
    
    const craftModalClose = document.getElementById('craft-modal-close');
    if (craftModalClose) {
        craftModalClose.addEventListener('click', () => closeCraftModal());
    }
}

// Listen for modal close events
events.on('modal:close', () => {
    closeCraftModal();
});
