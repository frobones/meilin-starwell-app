import assert from 'node:assert/strict';
import fs from 'node:fs';
import { test } from 'node:test';

import {
    canCraftMedicine,
    deductCraftIngredients,
    getDCForDifficulty,
    getEnhancedDice,
    getEnhancedDuration,
    getEnhancedStars,
    getMedicineStars,
    getSecondaryName,
    getVariableStars,
    validateInventoryImport
} from '../js/pages/craft-rules.js';

// Trimmed copies of real records from js/data/medicines.json
const whiteWillow = {
    id: 'white-willow', primary: 'Willow bark', secondary: [], difficulty: 1, maxStars: 4,
    duration: 'Until depleted', ephedra: { diceCount: 1, diceType: 8, modifier: 0 }
};
const mastermind = {
    id: 'mastermind', primary: 'Deadly nightshade', difficulty: 3, maxStars: 4, duration: '1 hour',
    secondary: [{ name: 'Alil', type: 'flora' }, { name: 'Awakened brain', type: 'creature' }],
    alchemilla: { baseDurationMinutes: 60, durationIndex: 2 }
};
const dragonTea = {
    id: 'dragon-tea', primary: 'Deadly nightshade', secondary: ['Dragon dust'], difficulty: 2, maxStars: 5,
    variableStars: true,
    starVariants: [
        { multiplier: 1, stars: 2, maxStars: 2 },
        { multiplier: 2, stars: 3, maxStars: 3 },
        { multiplier: 3, stars: 4, maxStars: 4 }
    ]
};
const healingTonic = {
    id: 'healing-tonic', primary: ['Fleshwort', 'Juniper berries'], secondary: [], difficulty: 1, maxStars: 4,
    duration: 'Instant'
};
const animalScentLotion = {
    id: 'animal-scent-lotion', primary: 'Deadly nightshade', secondary: ['Lunar holly berries'],
    difficulty: 2, maxStars: 5, indefiniteStar: true, duration: '1 hour',
    alchemilla: { baseDurationMinutes: 60, durationIndex: 2 }
};

const craft = (medicine, extra = {}) => ({
    medicine, alchemillaCount: 0, ephedraCount: 0, secondaryMultiplier: 1,
    chosenAlternative: null, chosenPrimary: null, ...extra
});

test('canCraftMedicine needs the primary and every required secondary', () => {
    const inventory = { 'Deadly nightshade': 1, 'Lunar holly berries': 1 };
    assert.equal(canCraftMedicine(animalScentLotion, inventory), true);
    assert.equal(canCraftMedicine(animalScentLotion, { 'Deadly nightshade': 1 }), false);
    assert.equal(canCraftMedicine(animalScentLotion, {}), false);
});

test('canCraftMedicine accepts any one OR alternative and any one primary', () => {
    assert.equal(canCraftMedicine(mastermind, { 'Deadly nightshade': 1, 'Awakened brain': 1 }), true);
    assert.equal(canCraftMedicine(mastermind, { 'Deadly nightshade': 1 }), false);
    assert.equal(canCraftMedicine(healingTonic, { 'Juniper berries': 1 }), true);
    assert.equal(canCraftMedicine(healingTonic, {}), false);
});

test('stars show difficulty, enhancements, and the indefinite slot', () => {
    assert.equal(getMedicineStars(mastermind), '★★★☆');
    assert.equal(getMedicineStars(animalScentLotion), '★★☆☆✧');
    assert.equal(getEnhancedStars(animalScentLotion, 1), '★★★☆✧');
    assert.equal(getEnhancedStars(animalScentLotion, 3), '★★★★✦');
    assert.equal(getVariableStars(dragonTea, 2, 0), '★★★');
});

test('Alchemilla climbs the duration ladder; a filled indefinite star wins', () => {
    assert.equal(getEnhancedDuration(mastermind, 0), '1 hour');
    assert.equal(getEnhancedDuration(mastermind, 1), '8 hours');
    assert.equal(getEnhancedDuration(mastermind, 5), '24 hours');
    assert.equal(getEnhancedDuration(animalScentLotion, 1, 3), 'Indefinite');
});

test('each Ephedra doubles the dice', () => {
    assert.equal(getEnhancedDice(whiteWillow, 0), null);
    assert.equal(getEnhancedDice(whiteWillow, 1), '2d8');
    assert.equal(getEnhancedDice(whiteWillow, 2), '4d8');
});

test('getDCForDifficulty follows the table and caps at 28', () => {
    assert.deepEqual([1, 2, 3, 4, 5, 9].map(getDCForDifficulty), [10, 15, 20, 25, 28, 28]);
});

test('deductCraftIngredients spends what the craft used and drops empty entries', () => {
    const before = { 'Deadly nightshade': 1, 'Alil': 2, 'Awakened brain': 1, 'Alchemilla': 1 };
    const after = deductCraftIngredients(before, craft(mastermind, { chosenAlternative: 'Alil', alchemillaCount: 1 }));
    assert.deepEqual(after, { 'Alil': 1, 'Awakened brain': 1 });
    assert.equal(before['Deadly nightshade'], 1, 'the input inventory must not change');
});

test('deductCraftIngredients takes the multiplier for variable-strength medicines', () => {
    const after = deductCraftIngredients(
        { 'Deadly nightshade': 2, 'Dragon dust': 3 },
        craft(dragonTea, { secondaryMultiplier: 2 })
    );
    assert.deepEqual(after, { 'Deadly nightshade': 1, 'Dragon dust': 1 });
});

test('validateInventoryImport accepts known ingredients with whole counts', () => {
    const known = new Set(['Alil', 'Fleshwort']);
    assert.deepEqual(
        validateInventoryImport({ version: 1, inventory: { Alil: 3, Fleshwort: 0 } }, known),
        { ok: true, inventory: { Alil: 3 } }
    );
});

test('validateInventoryImport rejects unknown names without echoing them', () => {
    const hostile = '<img src=x onerror=alert(1)>';
    const result = validateInventoryImport({ inventory: { [hostile]: 1 } }, new Set(['Alil']));
    assert.equal(result.ok, false);
    assert.ok(!result.error.includes('<'), 'the error must not repeat file text');
});

test('validateInventoryImport rejects bad counts and missing sections', () => {
    const known = new Set(['Alil']);
    for (const count of [-1, 100, 1.5, '3', null]) {
        assert.equal(validateInventoryImport({ inventory: { Alil: count } }, known).ok, false, `count ${count}`);
    }
    assert.equal(validateInventoryImport({}, known).ok, false);
    assert.equal(validateInventoryImport({ inventory: [] }, known).ok, false);
    assert.equal(validateInventoryImport(null, known).ok, false);
});

test('every real medicine is craftable once its listed ingredients are in stock', () => {
    const { medicines } = JSON.parse(fs.readFileSync(new URL('../js/data/medicines.json', import.meta.url), 'utf8'));
    assert.ok(medicines.length > 0);
    for (const medicine of medicines) {
        const inventory = {};
        for (const name of [medicine.primary].flat().filter(Boolean)) inventory[name] = 9;
        for (const s of medicine.secondary || []) inventory[getSecondaryName(s)] = 9;
        assert.equal(canCraftMedicine(medicine, inventory), true, medicine.name);
    }
});
