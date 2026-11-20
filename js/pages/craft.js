/**
 * Craft Page Controller
 * Wires the Craft tab together: the inventory panel (craft-inventory.js),
 * the list of craftable medicines, and the craft dialog (craft-modal.js).
 */

import { store } from '../core/state.js';
import { events } from '../core/events.js';
import { icons } from '../core/icons.js';
import { closeModal, openModal, showNotification } from '../core/ui.js';
import { canCraftMedicine, getMedicineStars } from './craft-rules.js';
import {
    buildIngredientsList,
    exportInventory,
    getInventory,
    importInventory,
    loadInventory,
    renderCraftInventory,
    setIngredientCount,
    setInventory,
    updateIngredientCount
} from './craft-inventory.js';
import { closeCraftModal, openCraftModal } from './craft-modal.js';

let craftEventsBound = false;

// Debounce timer for expensive operations
let craftableRenderTimer = null;
const DEBOUNCE_DELAY = 100; // ms - fast enough for responsiveness while still batching rapid taps

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
 * Get all craftable medicines based on current inventory, sorted by name
 */
function getCraftableMedicines() {
    const medicines = store.get('medicines') || [];
    const inventory = getInventory();
    const craftable = medicines.filter(medicine => canCraftMedicine(medicine, inventory));
    // Sort strictly by name
    return craftable.sort((a, b) => a.name.localeCompare(b.name));
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
        <article class="craftable-card ${isNew ? 'fade-in' : ''}" data-id="${medicine.id}" data-medicine="${medicine.id}" data-category="${medicine.category}" role="button" tabindex="0">
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
    // Only refresh icons within the grid, not the entire page
    icons.refresh(grid);
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
                setIngredientCount(e.target.dataset.ingredient, e.target.value);
            }
        });
    }

    // Clearing is destructive, so it goes through a confirmation dialog
    // (focus starts on "Keep inventory"; Escape or a click outside cancels)
    const clearBtn = document.getElementById('clear-inventory');
    const clearOverlay = document.getElementById('clear-inventory-overlay');
    if (clearBtn && clearOverlay) {
        clearBtn.addEventListener('click', () => openModal('clear-inventory-overlay'));
        document.getElementById('clear-inventory-cancel')
            .addEventListener('click', () => closeModal('clear-inventory-overlay'));
        document.getElementById('clear-inventory-confirm').addEventListener('click', () => {
            closeModal('clear-inventory-overlay');
            setInventory({});
            showNotification('Inventory cleared', { type: 'success' });
        });
        clearOverlay.addEventListener('click', (e) => {
            if (e.target === clearOverlay) closeModal('clear-inventory-overlay');
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

// Re-render the craftable list when the inventory changes: right away for
// whole-inventory changes, debounced for rapid spinner taps
events.on('inventory:changed', ({ immediate }) => {
    if (craftableRenderTimer) {
        clearTimeout(craftableRenderTimer);
        craftableRenderTimer = null;
    }
    if (immediate) {
        renderCraftableMedicines();
        return;
    }
    craftableRenderTimer = setTimeout(() => {
        renderCraftableMedicines();
        craftableRenderTimer = null;
    }, DEBOUNCE_DELAY);
});
