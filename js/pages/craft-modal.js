/**
 * Craft Modal
 * The craft dialog: recipe, alternatives, enhancement spinners, and the
 * confirm action. Crafting math lives in craft-rules.js; the inventory in
 * craft-inventory.js.
 */

import { icons } from '../core/icons.js';
import { openModal, closeModal } from '../core/ui.js';
import {
    canUseAlchemilla,
    canUseEphedra,
    deductCraftIngredients,
    getAvailableAlternatives,
    getAvailablePrimaryAlternatives,
    getDCForDifficulty,
    getEnhancedDice,
    getEnhancedDuration,
    getEnhancedStars,
    getSecondaryName,
    getVariableStars,
    hasAlternativeSecondaries
} from './craft-rules.js';
import { getCreaturePartsLookup, getInventory, setInventory } from './craft-inventory.js';

// Dialog state while open; null when closed
let craftModalState = null;

/**
 * Format fullEffect text for HTML display
 * Converts newlines to proper HTML and handles bullet formatting
 */
function formatFullEffect(text) {
    if (!text) return '';
    
    // Split by double newlines to separate paragraphs
    const paragraphs = text.split(/\n\n+/);
    
    return paragraphs.map(para => {
        // Check if this paragraph contains bullet points
        if (para.includes('•')) {
            // Split into lines and process
            const lines = para.split('\n');
            let html = '';
            let inList = false;
            
            for (const line of lines) {
                const trimmedLine = line.trim();
                if (trimmedLine.startsWith('•')) {
                    if (!inList) {
                        html += '<ul class="effect-bullets">';
                        inList = true;
                    }
                    html += `<li>${trimmedLine.substring(1).trim()}</li>`;
                } else if (trimmedLine) {
                    if (inList) {
                        html += '</ul>';
                        inList = false;
                    }
                    html += `<p>${trimmedLine}</p>`;
                }
            }
            
            if (inList) {
                html += '</ul>';
            }
            
            return html;
        } else {
            // Regular paragraph, just convert single newlines to <br>
            return `<p>${para.replace(/\n/g, '<br>')}</p>`;
        }
    }).join('');
}

/**
 * Render a details table for medicines that have one
 */
function renderDetailsTable(detailsTable) {
    if (!detailsTable) return '';
    
    const headerCells = detailsTable.headers.map(h => `<th>${h}</th>`).join('');
    const bodyRows = detailsTable.rows.map(row => 
        `<tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>`
    ).join('');
    
    return `
        <div class="effect-details-table">
            <h5 class="effect-table-title">${detailsTable.title}</h5>
            <table>
                <thead><tr>${headerCells}</tr></thead>
                <tbody>${bodyRows}</tbody>
            </table>
        </div>
    `;
}

/**
 * Open craft modal for a medicine
 */
export function openCraftModal(medicine) {
    const overlay = document.getElementById('craft-modal-overlay');
    const content = document.getElementById('craft-modal-content');
    if (!overlay || !content) return;
    
    const maxEnhancements = (medicine.maxStars || 5) - medicine.difficulty;
    const inventory = getInventory();
    const alternatives = getAvailableAlternatives(medicine, inventory);
    const primaryAlternatives = getAvailablePrimaryAlternatives(medicine, inventory);
    
    // For variable-strength medicines, calculate max multiplier based on inventory
    let maxSecondaryMultiplier = 1;
    if (medicine.variableStars && medicine.secondary && medicine.secondary.length === 1) {
        const secondaryName = getSecondaryName(medicine.secondary[0]);
        const available = inventory[secondaryName] || 0;
        maxSecondaryMultiplier = Math.min(4, Math.max(1, available));
    }
    
    craftModalState = {
        medicine: medicine,
        alchemillaCount: 0,
        ephedraCount: 0,
        secondaryMultiplier: 1,
        maxSecondaryMultiplier: maxSecondaryMultiplier,
        chosenAlternative: alternatives.length > 0 ? alternatives[0].name : null,
        chosenPrimary: primaryAlternatives.length > 0 ? primaryAlternatives[0].name : null,
        alternatives: alternatives,
        primaryAlternatives: primaryAlternatives,
        maxEnhancements: maxEnhancements
    };
    
    renderCraftModalContent();
    openModal('craft-modal-overlay', closeCraftModal);
}

/**
 * Render craft modal content
 */
function renderCraftModalContent() {
    const content = document.getElementById('craft-modal-content');
    if (!content || !craftModalState) return;
    
    const { medicine, alchemillaCount, ephedraCount, secondaryMultiplier, maxSecondaryMultiplier, chosenAlternative, alternatives, chosenPrimary, primaryAlternatives, maxEnhancements } = craftModalState;
    
    const totalEnhancementsUsed = alchemillaCount + ephedraCount;
    
    // For variable-stars medicines, calculate effective difficulty from the selected variant
    let effectiveDifficulty;
    let stars;
    if (medicine.variableStars && medicine.starVariants) {
        const variant = medicine.starVariants.find(v => v.multiplier === secondaryMultiplier) || medicine.starVariants[0];
        effectiveDifficulty = variant.stars + totalEnhancementsUsed;
        stars = getVariableStars(medicine, secondaryMultiplier, totalEnhancementsUsed);
    } else {
        effectiveDifficulty = medicine.difficulty + totalEnhancementsUsed;
        stars = getEnhancedStars(medicine, totalEnhancementsUsed);
    }
    const effectiveDC = getDCForDifficulty(effectiveDifficulty);
    
    // Build the unified recipe section with stars and DC
    const recipeHtml = buildRecipeSection(medicine, alchemillaCount, ephedraCount, maxEnhancements, 
        chosenAlternative, alternatives, chosenPrimary, primaryAlternatives, stars, effectiveDC,
        secondaryMultiplier, maxSecondaryMultiplier);
    
    content.innerHTML = `
        <div class="craft-modal-header" data-category="${medicine.category}">
            <div class="craft-modal-title-row">
                <span class="craft-category-badge ${medicine.category}">${medicine.category}</span>
                <h2>${medicine.name}</h2>
            </div>
            <div class="effect-full">${formatFullEffect(medicine.fullEffect || medicine.effect)}</div>
            ${renderDetailsTable(medicine.detailsTable)}
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
    // Only refresh icons within the modal content
    icons.refresh(content);
}

/**
 * Build the unified Recipe section
 */
function buildRecipeSection(medicine, alchemillaCount, ephedraCount, maxEnhancements, 
    chosenAlternative, alternatives, chosenPrimary, primaryAlternatives, stars, effectiveDC,
    secondaryMultiplier = 1, maxSecondaryMultiplier = 1) {
    
    const ingredientInventory = getInventory();
    const creaturePartsLookup = getCreaturePartsLookup();
    const totalUsed = alchemillaCount + ephedraCount;
    const isVariableStrength = medicine.variableStars && medicine.starVariants;
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
    
    // Build result display
    let resultHtml = '';
    let resultCards = '';
    
    // Show duration for medicines that have one (enhanceable or fixed)
    const hasDuration = medicine.duration && medicine.duration.toLowerCase() !== 'instant';
    if (hasDuration) {
        const durationDisplay = showAlchemilla ? currentDuration : medicine.duration;
        resultCards += `
            <div class="recipe-result-card duration ${alchemillaCount > 0 ? 'active' : ''} ${isIndefinite ? 'indefinite' : ''}">
                <i data-lucide="clock"></i>
                <span class="recipe-result-value">${durationDisplay}</span>
                <span class="recipe-result-label">Duration</span>
            </div>
        `;
    }
    
    // Show potency for medicines with Ephedra enhancement
    if (hasEnhancements && maxEnhancements > 0 && showEphedra && medicine.ephedra) {
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
    
    // Build ingredient rows
    let ingredientRows = '';
    
    // Primary ingredient
    if (medicine.primary) {
        const hasPrimaryAlts = primaryAlternatives && primaryAlternatives.length > 1;
        // Handle both string and array primaries, and when only one alternative is available
        let primaryName;
        if (hasPrimaryAlts) {
            primaryName = chosenPrimary;
        } else if (primaryAlternatives && primaryAlternatives.length === 1) {
            primaryName = primaryAlternatives[0].name;
        } else if (Array.isArray(medicine.primary)) {
            primaryName = medicine.primary[0];
        } else {
            primaryName = medicine.primary;
        }
        
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
        } else if (isVariableStrength && medicine.secondary.length === 1) {
            // Variable-strength medicine with single secondary (e.g., Dragon Tea, Draught of Giant Strength)
            const name = getSecondaryName(medicine.secondary[0]);
            const isCreature = creaturePartsLookup?.[name];
            const available = ingredientInventory[name] || 0;
            const remaining = available - secondaryMultiplier;
            
            ingredientRows += `
                <div class="recipe-ingredient-row secondary variable-strength ${isCreature ? 'creature' : ''}">
                    <div class="recipe-ingredient-info">
                        <i data-lucide="${isCreature ? 'skull' : 'leaf'}"></i>
                        <span class="recipe-ingredient-name">${name}</span>
                        <span class="recipe-ingredient-available">${available} in stock</span>
                    </div>
                    <div class="recipe-ingredient-spinner">
                        <button class="secondary-dec" data-type="secondary" ${secondaryMultiplier <= 1 ? 'disabled' : ''}>−</button>
                        <span class="secondary-count">×${secondaryMultiplier}</span>
                        <button class="secondary-inc" data-type="secondary" ${secondaryMultiplier >= maxSecondaryMultiplier ? 'disabled' : ''}>+</button>
                    </div>
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
                        <span class="recipe-ingredient-available">${alchemillaAvailable} in stock</span>
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
                        <span class="recipe-ingredient-available">${ephedraAvailable} in stock</span>
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
 * Update max enhancements based on current variant (for variable-strength medicines)
 */
function updateMaxEnhancements() {
    if (!craftModalState) return;
    
    const { medicine, secondaryMultiplier } = craftModalState;
    
    if (medicine.variableStars && medicine.starVariants) {
        const variant = medicine.starVariants.find(v => v.multiplier === secondaryMultiplier) || medicine.starVariants[0];
        const maxEnhancements = variant.maxStars - variant.stars;
        craftModalState.maxEnhancements = maxEnhancements;
        
        // Clamp current enhancements to new max
        const totalUsed = craftModalState.alchemillaCount + craftModalState.ephedraCount;
        if (totalUsed > maxEnhancements) {
            // Reduce proportionally, preferring to keep alchemilla
            const excess = totalUsed - maxEnhancements;
            craftModalState.ephedraCount = Math.max(0, craftModalState.ephedraCount - excess);
            if (craftModalState.alchemillaCount + craftModalState.ephedraCount > maxEnhancements) {
                craftModalState.alchemillaCount = maxEnhancements - craftModalState.ephedraCount;
            }
        }
    }
}

/**
 * Bind events within the craft modal
 */
function bindCraftModalEvents() {
    const ingredientInventory = getInventory();
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
    
    // Secondary multiplier controls (for variable-strength medicines like Dragon Tea)
    document.querySelectorAll('.secondary-inc').forEach(btn => {
        btn.addEventListener('click', () => {
            craftModalState.secondaryMultiplier = Math.min(
                craftModalState.secondaryMultiplier + 1,
                craftModalState.maxSecondaryMultiplier
            );
            // Update max enhancements based on new variant
            updateMaxEnhancements();
            renderCraftModalContent();
        });
    });
    
    document.querySelectorAll('.secondary-dec').forEach(btn => {
        btn.addEventListener('click', () => {
            craftModalState.secondaryMultiplier = Math.max(1, craftModalState.secondaryMultiplier - 1);
            // Update max enhancements based on new variant
            updateMaxEnhancements();
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
 * Execute the craft action: spend the ingredients and close the dialog
 */
function executeCraft() {
    if (!craftModalState) return;
    const remaining = deductCraftIngredients(getInventory(), craftModalState);
    closeCraftModal();
    setInventory(remaining);
}

/**
 * Close the craft modal
 */
export function closeCraftModal() {
    closeModal('craft-modal-overlay');
    craftModalState = null;
}
