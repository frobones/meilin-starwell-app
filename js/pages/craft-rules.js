/**
 * Craft Rules
 * Pure crafting math for the herbal medicine system: what can be crafted,
 * stars, DC, duration, dice, and what a craft consumes. No DOM, storage, or
 * module state, so it runs under `node --test` (see tests/).
 *
 * An inventory is a plain object mapping ingredient name to count.
 */

/** Alchemilla moves a duration one step up this ladder per use. */
export const DURATION_LADDER = ['1 minute', '10 minutes', '1 hour', '8 hours', '24 hours'];

/** Highest count the inventory spinner allows for one ingredient. */
export const MAX_INGREDIENT_COUNT = 99;

/**
 * Get secondary ingredient name (handles both string and object formats)
 */
export function getSecondaryName(secondary) {
    return typeof secondary === 'object' ? secondary.name : secondary;
}

/**
 * Check if a medicine has alternative secondary ingredients
 */
export function hasAlternativeSecondaries(medicine) {
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
export function hasAlternativePrimaries(medicine) {
    return Array.isArray(medicine.primary) && medicine.primary.length > 1;
}

/**
 * Check if a medicine can be crafted with the given inventory
 */
export function canCraftMedicine(medicine, inventory) {
    // Check primary ingredient(s)
    if (medicine.primary) {
        if (hasAlternativePrimaries(medicine)) {
            const hasAnyPrimary = medicine.primary.some(p =>
                (inventory[p] || 0) >= 1
            );
            if (!hasAnyPrimary) return false;
        } else {
            if ((inventory[medicine.primary] || 0) < 1) {
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
            return (inventory[name] || 0) >= 1;
        });
    } else {
        return secondaries.every(s => {
            const name = getSecondaryName(s);
            return (inventory[name] || 0) >= 1;
        });
    }
}

/**
 * Get star display for a medicine (base configuration for cards)
 */
export function getMedicineStars(medicine) {
    // For variable-stars medicines, show the base (×1) configuration
    if (medicine.variableStars && medicine.starVariants && medicine.starVariants.length > 0) {
        const baseVariant = medicine.starVariants[0];
        const filled = '★'.repeat(baseVariant.stars);
        const empty = '☆'.repeat(Math.max(0, baseVariant.maxStars - baseVariant.stars));
        return filled + empty;
    }

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
 * Get stars for variable-strength medicines based on selected multiplier
 * @param {Object} medicine - The medicine object
 * @param {number} multiplier - The multiplier (1-4)
 * @param {number} enhancementCount - Number of enhancement slots used
 */
export function getVariableStars(medicine, multiplier, enhancementCount = 0) {
    if (!medicine.variableStars || !medicine.starVariants) {
        return getEnhancedStars(medicine, enhancementCount);
    }

    const variant = medicine.starVariants.find(v => v.multiplier === multiplier) || medicine.starVariants[0];
    const baseStars = variant.stars;
    const maxStars = variant.maxStars;

    // Apply enhancements up to available slots
    const effectiveStars = Math.min(baseStars + enhancementCount, maxStars);
    const emptySlots = maxStars - effectiveStars;

    return '★'.repeat(effectiveStars) + '☆'.repeat(Math.max(0, emptySlots));
}

/**
 * Get enhanced star display for a medicine with enhancements
 * The ✧ (4-point star) represents the last fillable slot - when filled, duration becomes indefinite
 */
export function getEnhancedStars(medicine, enhancementCount) {
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
export function canUseAlchemilla(medicine) {
    // Variable-strength medicines only use Alchemilla if explicitly configured
    if (medicine.variableStars) {
        return !!medicine.alchemilla;
    }

    // Check if medicine has alchemilla data or has a valid duration
    if (medicine.alchemilla) return true;

    const duration = (medicine.duration || '').toLowerCase();
    // Exclude instant effects and spell-based durations
    if (!duration || duration === 'instant' || duration.includes('spell')) return false;

    // Check if duration matches one of the ladder values
    const normalizedDuration = duration.replace('hours', 'hrs').replace('minutes', 'min');
    return DURATION_LADDER.some(d => normalizedDuration.includes(d.toLowerCase()));
}

/**
 * Check if medicine can use Ephedra (has dice for HP restoration)
 */
export function canUseEphedra(medicine) {
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
export function getEnhancedDuration(medicine, alchemillaCount, totalEnhancements = null) {
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
        const foundIndex = DURATION_LADDER.findIndex(d => duration.includes(d.toLowerCase()));
        if (foundIndex !== -1) baseIndex = foundIndex;
    }

    const newIndex = Math.min(baseIndex + alchemillaCount, DURATION_LADDER.length - 1);
    return DURATION_LADDER[newIndex];
}

/**
 * Get enhanced effect dice based on Ephedra count (each use doubles the dice)
 */
export function getEnhancedDice(medicine, ephedraCount) {
    if (ephedraCount === 0 || !medicine.ephedra) return null;

    const multiplier = Math.pow(2, ephedraCount);
    const newDiceCount = medicine.ephedra.diceCount * multiplier;
    const diceType = medicine.ephedra.diceType;
    const modifier = medicine.ephedra.modifier || 0;

    return `${newDiceCount}d${diceType}${modifier > 0 ? '+' + modifier : ''}`;
}

/**
 * Get DC for a difficulty level
 */
export function getDCForDifficulty(difficulty) {
    const dcMap = { 1: 10, 2: 15, 3: 20, 4: 25, 5: 28 };
    return dcMap[Math.min(5, difficulty)] || 28;
}

/**
 * Get the OR-type secondary alternatives the inventory can supply
 */
export function getAvailableAlternatives(medicine, inventory) {
    if (!hasAlternativeSecondaries(medicine)) return [];

    const secondaries = medicine.secondary || [];
    return secondaries
        .filter(s => {
            const name = getSecondaryName(s);
            return (inventory[name] || 0) >= 1;
        })
        .map(s => ({
            name: getSecondaryName(s),
            type: typeof s === 'object' && s.type ? s.type : 'flora'
        }));
}

/**
 * Get the primary alternatives the inventory can supply
 */
export function getAvailablePrimaryAlternatives(medicine, inventory) {
    if (!hasAlternativePrimaries(medicine)) return [];

    return medicine.primary
        .filter(name => (inventory[name] || 0) >= 1)
        .map(name => ({ name, type: 'flora' }));
}

/**
 * Work out the inventory left after a craft. Zero counts are dropped.
 * @param {Object} inventory - Counts before crafting (not modified)
 * @param {Object} craft - medicine, alchemillaCount, ephedraCount, secondaryMultiplier,
 *     chosenAlternative, chosenPrimary from the craft dialog
 * @returns {Object} A new inventory object
 */
export function deductCraftIngredients(inventory, craft) {
    const { medicine, alchemillaCount, ephedraCount, secondaryMultiplier, chosenAlternative, chosenPrimary } = craft;
    const next = { ...inventory };
    const take = (name, amount) => {
        next[name] = (next[name] || 0) - amount;
    };

    // Deduct primary ingredient
    if (medicine.primary) {
        if (hasAlternativePrimaries(medicine) && chosenPrimary) {
            take(chosenPrimary, 1);
        } else if (!hasAlternativePrimaries(medicine)) {
            take(medicine.primary, 1);
        }
    }

    const isOrAlternative = hasAlternativeSecondaries(medicine);
    const isVariableStrength = medicine.variableStars && medicine.starVariants;

    if (isOrAlternative && chosenAlternative) {
        take(chosenAlternative, 1);
    } else if (isVariableStrength && medicine.secondary && medicine.secondary.length === 1) {
        // Variable-strength medicine: deduct based on multiplier
        take(getSecondaryName(medicine.secondary[0]), secondaryMultiplier);
    } else if (!isOrAlternative) {
        (medicine.secondary || []).forEach(s => take(getSecondaryName(s), 1));
    }

    if (alchemillaCount > 0) take('Alchemilla', alchemillaCount);
    if (ephedraCount > 0) take('Ephedra', ephedraCount);

    for (const key in next) {
        if (next[key] <= 0) delete next[key];
    }
    return next;
}

/**
 * Check an imported inventory file before trusting it. The file comes from
 * outside the app, so only known ingredient names and whole counts in range
 * are accepted, and nothing from it is ever rendered as HTML.
 * @param {*} data - Parsed JSON from the file
 * @param {Set<string>} knownNames - Every ingredient name the app knows
 * @returns {{ ok: true, inventory: Object } | { ok: false, error: string }}
 */
export function validateInventoryImport(data, knownNames) {
    const inventory = data?.inventory;
    if (!inventory || typeof inventory !== 'object' || Array.isArray(inventory)) {
        return { ok: false, error: 'The file has no inventory section.' };
    }

    const clean = {};
    for (const [name, count] of Object.entries(inventory)) {
        if (!knownNames.has(name)) {
            // Never echo the file's text: notifications render as HTML
            return { ok: false, error: "The file lists an ingredient this app doesn't know." };
        }
        if (!Number.isInteger(count) || count < 0 || count > MAX_INGREDIENT_COUNT) {
            return { ok: false, error: `${name} needs a whole number from 0 to ${MAX_INGREDIENT_COUNT}.` };
        }
        if (count > 0) clean[name] = count;
    }
    return { ok: true, inventory: clean };
}
