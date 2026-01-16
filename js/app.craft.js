/**
 * Meilin's Apothecary - Craft System
 * Inventory management, craftable medicines, and craft modal with enhancements
 */
(function(App) {

    // Duration ladder for Alchemilla enhancement
    App.durationLadder = ['1 minute', '10 minutes', '1 hour', '8 hours', '24 hours'];

    /**
     * Build a structured list of all ingredients from the data
     */
    App.buildIngredientsList = function() {
        if (!this.ingredients) return;
        
        this.ingredientsList = {
            commonFlora: [],
            rareFlora: {},
            creatureParts: {}
        };
        
        if (this.ingredients.flora && this.ingredients.flora.common) {
            this.ingredientsList.commonFlora = this.ingredients.flora.common.map(f => f.name);
        }
        
        if (this.ingredients.flora && this.ingredients.flora.rare) {
            for (const terrain in this.ingredients.flora.rare) {
                this.ingredientsList.rareFlora[terrain] = this.ingredients.flora.rare[terrain].map(f => f.name);
            }
        }
        
        if (this.ingredients.creatureParts) {
            for (const creatureType in this.ingredients.creatureParts) {
                this.ingredientsList.creatureParts[creatureType] = 
                    this.ingredients.creatureParts[creatureType].map(c => c.name);
            }
        }
    };

    /**
     * Load inventory from localStorage
     */
    App.loadInventory = function() {
        try {
            const stored = localStorage.getItem(this.INVENTORY_STORAGE_KEY);
            if (stored) {
                this.ingredientInventory = JSON.parse(stored);
            }
        } catch (e) {
            console.warn('Failed to load inventory from localStorage:', e);
            this.ingredientInventory = {};
        }
    };

    /**
     * Save inventory to localStorage
     */
    App.saveInventory = function() {
        try {
            localStorage.setItem(this.INVENTORY_STORAGE_KEY, JSON.stringify(this.ingredientInventory));
        } catch (e) {
            console.warn('Failed to save inventory to localStorage:', e);
        }
    };

    /**
     * Render the craft inventory panel
     */
    App.renderCraftInventory = function() {
        const container = document.getElementById('inventory-sections');
        if (!container || !this.ingredientsList) return;
        
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
        
        const commonFloraExpanded = isFirstRender ? true : expandedSections.has('Common Flora');
        floraHtml += this.createInventorySection('Common Flora', this.ingredientsList.commonFlora, !commonFloraExpanded, 'common');
        
        for (const terrain in this.ingredientsList.rareFlora) {
            const title = `${terrain} Flora`;
            const isExpanded = expandedSections.has(title);
            floraHtml += this.createInventorySection(
                title, 
                this.ingredientsList.rareFlora[terrain], 
                !isExpanded,
                'rare'
            );
        }
        
        let creatureHtml = '';
        for (const creatureType in this.ingredientsList.creatureParts) {
            const isExpanded = expandedSections.has(creatureType);
            creatureHtml += this.createInventorySection(
                creatureType, 
                this.ingredientsList.creatureParts[creatureType], 
                !isExpanded,
                'creature'
            );
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
        this.refreshIcons();
    };

    /**
     * Create HTML for an inventory section
     */
    App.createInventorySection = function(title, ingredients, collapsed = true, sectionType = 'common') {
        const uniqueIngredients = [...new Set(ingredients)];
        const rows = uniqueIngredients.map(name => this.createIngredientRow(name, sectionType)).join('');
        
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
    };

    /**
     * Get the ingredient type class for color-coding
     */
    App.getIngredientTypeClass = function(name, sectionType) {
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
    };

    /**
     * Create HTML for an ingredient row with number spinner
     */
    App.createIngredientRow = function(name, sectionType = 'common') {
        const count = this.ingredientInventory[name] || 0;
        const hasCount = count > 0;
        const typeClass = this.getIngredientTypeClass(name, sectionType);
        
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
    };

    /**
     * Bind craft event listeners
     */
    App.bindCraftEvents = function() {
        if (this.craftEventsBound) return;
        this.craftEventsBound = true;
        
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
                    this.updateIngredientCount(e.target.dataset.ingredient, -1);
                }
                if (e.target.classList.contains('spinner-inc')) {
                    this.updateIngredientCount(e.target.dataset.ingredient, 1);
                }
            });
            
            inventoryContainer.addEventListener('change', (e) => {
                if (e.target.classList.contains('spinner-value')) {
                    const name = e.target.dataset.ingredient;
                    const value = Math.max(0, Math.min(99, parseInt(e.target.value) || 0));
                    this.ingredientInventory[name] = value;
                    
                    const allInputs = document.querySelectorAll(`.spinner-value[data-ingredient="${name}"]`);
                    allInputs.forEach(input => {
                        input.value = value;
                    });
                    
                    this.updateIngredientRowState(name);
                    this.saveInventory();
                    this.renderCraftableMedicines();
                }
            });
        }
        
        const clearBtn = document.getElementById('clear-inventory');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                if (confirm('Clear all ingredients from your inventory?')) {
                    this.ingredientInventory = {};
                    this.saveInventory();
                    this.renderCraftInventory();
                    this.renderCraftableMedicines();
                }
            });
        }
        
        const exportBtn = document.getElementById('export-inventory');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportInventory());
        }
        
        const importInput = document.getElementById('import-inventory');
        if (importInput) {
            importInput.addEventListener('change', (e) => {
                if (e.target.files && e.target.files[0]) {
                    this.importInventory(e.target.files[0]);
                    e.target.value = '';
                }
            });
        }
        
        const craftModalOverlay = document.getElementById('craft-modal-overlay');
        if (craftModalOverlay) {
            craftModalOverlay.addEventListener('click', (e) => {
                if (e.target.id === 'craft-modal-overlay') {
                    this.closeCraftModal();
                }
            });
        }
        
        const craftModalClose = document.getElementById('craft-modal-close');
        if (craftModalClose) {
            craftModalClose.addEventListener('click', () => this.closeCraftModal());
        }
    };

    /**
     * Update ingredient count by delta
     */
    App.updateIngredientCount = function(name, delta) {
        const current = this.ingredientInventory[name] || 0;
        const newValue = Math.max(0, Math.min(99, current + delta));
        this.ingredientInventory[name] = newValue;
        
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
        
        this.saveInventory();
        this.renderCraftableMedicines();
    };

    /**
     * Update ingredient row visual state
     */
    App.updateIngredientRowState = function(name) {
        const rows = document.querySelectorAll(`.ingredient-row[data-ingredient="${name}"]`);
        rows.forEach(row => {
            const count = this.ingredientInventory[name] || 0;
            const decBtn = row.querySelector('.spinner-dec');
            if (decBtn) decBtn.disabled = count === 0;
            row.classList.toggle('has-count', count > 0);
        });
    };

    /**
     * Export inventory to JSON file
     */
    App.exportInventory = function() {
        const data = {
            version: 1,
            exportedAt: new Date().toISOString(),
            inventory: this.ingredientInventory
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
    };

    /**
     * Import inventory from JSON file
     */
    App.importInventory = function(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                if (data.inventory && typeof data.inventory === 'object') {
                    this.ingredientInventory = data.inventory;
                    this.saveInventory();
                    this.renderCraftInventory();
                    this.renderCraftableMedicines();
                    this.bindCraftEvents();
                } else {
                    throw new Error('Invalid inventory format');
                }
            } catch (err) {
                alert('Failed to import inventory: Invalid file format');
                console.error('Import error:', err);
            }
        };
        reader.readAsText(file);
    };

    /**
     * Check if a medicine has alternative secondary ingredients
     */
    App.hasAlternativeSecondaries = function(medicine) {
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
    };

    /**
     * Check if a medicine can be crafted with current inventory
     */
    App.canCraftMedicine = function(medicine) {
        if (medicine.primary && (this.ingredientInventory[medicine.primary] || 0) < 1) {
            return false;
        }
        
        const secondaries = medicine.secondary || [];
        if (secondaries.length === 0) return true;
        
        const isOrAlternative = this.hasAlternativeSecondaries(medicine);
        
        if (isOrAlternative) {
            return secondaries.some(s => {
                const name = this.getSecondaryName(s);
                return (this.ingredientInventory[name] || 0) >= 1;
            });
        } else {
            return secondaries.every(s => {
                const name = this.getSecondaryName(s);
                return (this.ingredientInventory[name] || 0) >= 1;
            });
        }
    };

    /**
     * Get available alternatives for OR-type medicines
     */
    App.getAvailableAlternatives = function(medicine) {
        if (!this.hasAlternativeSecondaries(medicine)) return [];
        
        const secondaries = medicine.secondary || [];
        return secondaries
            .filter(s => {
                const name = this.getSecondaryName(s);
                return (this.ingredientInventory[name] || 0) >= 1;
            })
            .map(s => ({
                name: this.getSecondaryName(s),
                type: typeof s === 'object' && s.type ? s.type : 'flora'
            }));
    };

    /**
     * Get available alternative names only
     */
    App.getAvailableAlternativeNames = function(medicine) {
        return this.getAvailableAlternatives(medicine).map(a => a.name);
    };

    /**
     * Get all craftable medicines based on current inventory
     */
    App.getCraftableMedicines = function() {
        return this.medicines.filter(medicine => this.canCraftMedicine(medicine));
    };

    /**
     * Render craftable medicine cards
     */
    App.renderCraftableMedicines = function() {
        const grid = document.getElementById('craftable-grid');
        const countEl = document.getElementById('craftable-count');
        if (!grid) return;
        
        const craftable = this.getCraftableMedicines();
        
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
            const isNew = !previousIds.includes(medicine.id);
            return this.createCraftableCard(medicine, isNew);
        }).join('');
        
        this.bindCraftableCardEvents(grid);
        this.refreshIcons();
    };

    /**
     * Create HTML for a compact craftable medicine card
     */
    App.createCraftableCard = function(medicine, isNew = false) {
        const stars = this.getMedicineStars(medicine);
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
    };

    /**
     * Bind events for craftable cards
     */
    App.bindCraftableCardEvents = function(container) {
        container.querySelectorAll('.craftable-card').forEach(card => {
            card.addEventListener('click', () => {
                const medicineId = card.dataset.medicine;
                const medicine = this.medicines.find(m => m.id === medicineId);
                if (medicine) {
                    this.openCraftModal(medicine);
                }
            });
        });
    };

    /**
     * Check if a medicine can use Alchemilla
     */
    App.canMedicineUseAlchemilla = function(medicine) {
        const nonExtendableDurations = [
            'instant', 'permanent', 'until used', 'until triggered', 
            'until depleted', 'until long rest'
        ];
        const duration = (medicine.duration || '').toLowerCase();
        return !nonExtendableDurations.some(d => duration === d);
    };

    /**
     * Check if a medicine can use Ephedra
     */
    App.canMedicineUseEphedra = function(medicine) {
        const dicePattern = /\d+d\d+/i;
        return dicePattern.test(medicine.fullEffect || medicine.effect || '');
    };

    /**
     * Get max Alchemilla slots for a medicine
     */
    App.getMaxAlchemillaSlots = function(medicine) {
        return medicine.maxStars - medicine.difficulty;
    };

    /**
     * Get max Ephedra slots for a medicine
     */
    App.getMaxEphedraSlots = function(medicine) {
        let slots = medicine.maxStars - medicine.difficulty;
        if (medicine.indefiniteStar) {
            slots -= 1;
        }
        return Math.max(0, slots);
    };

    /**
     * Open craft modal for a medicine
     */
    App.openCraftModal = function(medicine, preselectedAlternative = null) {
        const overlay = document.getElementById('craft-modal-overlay');
        const content = document.getElementById('craft-modal-content');
        if (!overlay || !content) return;
        
        const maxEnhancements = medicine.maxStars - medicine.difficulty;
        const canUseAlchemilla = this.canMedicineUseAlchemilla(medicine);
        const canUseEphedra = this.canMedicineUseEphedra(medicine);
        const maxAlchemillaSlots = this.getMaxAlchemillaSlots(medicine);
        const maxEphedraSlots = this.getMaxEphedraSlots(medicine);
        const alternatives = this.getAvailableAlternatives(medicine);
        
        const defaultAlt = alternatives.length > 0 ? alternatives[0].name : null;
        
        this.craftModalState = {
            medicine: medicine,
            alchemillaCount: 0,
            ephedraCount: 0,
            chosenAlternative: preselectedAlternative || defaultAlt,
            alternatives: alternatives,
            maxEnhancements: maxEnhancements,
            maxAlchemillaSlots: maxAlchemillaSlots,
            maxEphedraSlots: maxEphedraSlots,
            canUseAlchemilla: canUseAlchemilla,
            canUseEphedra: canUseEphedra
        };
        
        this.renderCraftModalContent();
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    };

    /**
     * Build the ingredients list HTML for the craft modal
     */
    App.buildIngredientsListHtml = function(medicine, chosenAlternative, alchemillaCount, ephedraCount) {
        const ingredients = [];
        
        // Primary ingredient
        if (medicine.primary) {
            ingredients.push({
                name: medicine.primary,
                type: 'primary',
                count: 1
            });
        }
        
        // Secondary ingredients
        const isOrAlternative = this.hasAlternativeSecondaries(medicine);
        if (isOrAlternative && chosenAlternative) {
            ingredients.push({
                name: chosenAlternative,
                type: 'secondary',
                count: 1
            });
        } else if (!isOrAlternative && medicine.secondary) {
            medicine.secondary.forEach(s => {
                const name = this.getSecondaryName(s);
                ingredients.push({
                    name: name,
                    type: 'secondary',
                    count: 1
                });
            });
        }
        
        // Enhancement ingredients
        if (alchemillaCount > 0) {
            ingredients.push({
                name: 'Alchemilla',
                type: 'enhancement',
                count: alchemillaCount
            });
        }
        if (ephedraCount > 0) {
            ingredients.push({
                name: 'Ephedra',
                type: 'enhancement',
                count: ephedraCount
            });
        }
        
        return ingredients.map(ing => `
            <div class="ingredient-chip ${ing.type}">
                <i data-lucide="${ing.type === 'primary' ? 'flower-2' : ing.type === 'enhancement' ? 'sparkles' : 'leaf'}"></i>
                <span class="ingredient-chip-name">${ing.name}</span>
                ${ing.count > 1 ? `<span class="ingredient-chip-count">×${ing.count}</span>` : ''}
            </div>
        `).join('');
    };

    /**
     * Render craft modal content based on current state
     */
    App.renderCraftModalContent = function() {
        const content = document.getElementById('craft-modal-content');
        if (!content || !this.craftModalState) return;
        
        const { 
            medicine, alchemillaCount, ephedraCount, chosenAlternative, alternatives,
            maxEnhancements, maxAlchemillaSlots, maxEphedraSlots, canUseAlchemilla, canUseEphedra 
        } = this.craftModalState;
        
        const totalEnhancementsUsed = alchemillaCount + ephedraCount;
        const remainingSlots = maxEnhancements - totalEnhancementsUsed;
        const effectiveDifficulty = medicine.difficulty + totalEnhancementsUsed;
        const effectiveDC = this.getDCForDifficulty(effectiveDifficulty);
        
        const hasAlchemillaInventory = (this.ingredientInventory['Alchemilla'] || 0) > 0;
        const hasEphedraInventory = (this.ingredientInventory['Ephedra'] || 0) > 0;
        
        const maxAlchemillaForSpinner = Math.min(
            this.ingredientInventory['Alchemilla'] || 0,
            maxEnhancements - ephedraCount
        );
        
        const maxEphedraForSpinner = Math.min(
            this.ingredientInventory['Ephedra'] || 0,
            Math.max(0, maxEphedraSlots - alchemillaCount)
        );
        
        const starDisplay = this.generateEnhancedStarDisplay(
            medicine.difficulty, 
            totalEnhancementsUsed, 
            Math.max(0, remainingSlots),
            medicine.indefiniteStar
        );
        
        // Build ingredients required section
        const ingredientsHtml = this.buildIngredientsListHtml(medicine, chosenAlternative, alchemillaCount, ephedraCount);
        
        let alternativeHtml = '';
        if (alternatives && alternatives.length > 1) {
            alternativeHtml = `
                <div class="craft-modal-section craft-modal-alternatives">
                    <div class="section-header">
                        <i data-lucide="git-branch"></i>
                        <h4>Choose Ingredient</h4>
                    </div>
                    <div class="alternative-options">
                        ${alternatives.map(alt => `
                            <label class="alternative-option ingredient-${alt.type} ${chosenAlternative === alt.name ? 'selected' : ''}">
                                <input type="radio" name="alternative" value="${alt.name}" 
                                    ${chosenAlternative === alt.name ? 'checked' : ''}>
                                <span>${alt.name}</span>
                            </label>
                        `).join('')}
                    </div>
                </div>
            `;
        }
        
        let enhancementRows = '';
        const hasEnhancementSlots = maxEnhancements > 0;
        
        if (hasEnhancementSlots && canUseAlchemilla && hasAlchemillaInventory) {
            const alchemillaDisabled = maxAlchemillaForSpinner === 0 && alchemillaCount === 0;
            enhancementRows += `
                <div class="enhancement-row ${alchemillaDisabled ? 'disabled' : ''}">
                    <div class="enhancement-label">
                        <i data-lucide="clock"></i>
                        <div class="enhancement-text">
                            <span class="enhancement-name">Alchemilla</span>
                            <span class="enhancement-effect">Extends duration</span>
                        </div>
                    </div>
                    <div class="enhancement-control">
                        <div class="number-spinner">
                            <button class="spinner-dec" id="alchemilla-dec" ${alchemillaCount === 0 ? 'disabled' : ''}>−</button>
                            <input type="number" class="spinner-value" id="alchemilla-value" value="${alchemillaCount}" min="0" max="${maxAlchemillaForSpinner}" readonly>
                            <button class="spinner-inc" id="alchemilla-inc" ${alchemillaCount >= maxAlchemillaForSpinner ? 'disabled' : ''}>+</button>
                        </div>
                    </div>
                </div>
            `;
        }
        
        if (hasEnhancementSlots && maxEphedraSlots > 0 && canUseEphedra && hasEphedraInventory) {
            const ephedraDisabled = maxEphedraForSpinner === 0 && ephedraCount === 0;
            enhancementRows += `
                <div class="enhancement-row ${ephedraDisabled ? 'disabled' : ''}">
                    <div class="enhancement-label">
                        <i data-lucide="zap"></i>
                        <div class="enhancement-text">
                            <span class="enhancement-name">Ephedra</span>
                            <span class="enhancement-effect">Doubles dice (×${Math.pow(2, ephedraCount)})</span>
                        </div>
                    </div>
                    <div class="enhancement-control">
                        <div class="number-spinner">
                            <button class="spinner-dec" id="ephedra-dec" ${ephedraCount === 0 ? 'disabled' : ''}>−</button>
                            <input type="number" class="spinner-value" id="ephedra-value" value="${ephedraCount}" min="0" max="${maxEphedraForSpinner}" readonly>
                            <button class="spinner-inc" id="ephedra-inc" ${ephedraCount >= maxEphedraForSpinner ? 'disabled' : ''}>+</button>
                        </div>
                    </div>
                </div>
            `;
        }
        
        let enhancementHtml = '';
        if (enhancementRows) {
            enhancementHtml = `
                <div class="craft-modal-section craft-modal-enhancements">
                    <div class="section-header">
                        <i data-lucide="sparkles"></i>
                        <h4>Enhancements</h4>
                        <span class="slots-badge">${remainingSlots} slot${remainingSlots !== 1 ? 's' : ''} remaining</span>
                    </div>
                    ${enhancementRows}
                </div>
            `;
        }
        
        let effectItems = [];
        
        const canEnhanceDuration = medicine.alchemilla && hasEnhancementSlots && canUseAlchemilla;
        if (canEnhanceDuration) {
            const baseDuration = this.durationLadder[medicine.alchemilla.durationIndex];
            if (alchemillaCount > 0) {
                const enhancedDuration = this.getEnhancedDuration(
                    medicine, 
                    alchemillaCount, 
                    medicine.indefiniteStar, 
                    remainingSlots
                );
                effectItems.push(`
                    <div class="effect-item">
                        <i data-lucide="hourglass"></i>
                        <span class="effect-label">Duration:</span>
                        <span class="effect-value enhanced">
                            <span class="base-value">${baseDuration}</span>
                            <span class="arrow">→</span>
                            <span class="enhanced-value">${enhancedDuration}</span>
                        </span>
                    </div>
                `);
            } else {
                effectItems.push(`
                    <div class="effect-item">
                        <i data-lucide="hourglass"></i>
                        <span class="effect-label">Duration:</span>
                        <span class="effect-value">${baseDuration}</span>
                    </div>
                `);
            }
        }
        
        const canEnhancePotency = medicine.ephedra && hasEnhancementSlots && maxEphedraSlots > 0 && canUseEphedra;
        if (canEnhancePotency) {
            const { diceCount, diceType, modifier } = medicine.ephedra;
            let baseDice = `${diceCount}d${diceType}`;
            if (modifier > 0) baseDice += ` + ${modifier}`;
            else if (modifier < 0) baseDice += ` - ${Math.abs(modifier)}`;
            
            if (ephedraCount > 0) {
                const enhancedDice = this.getEnhancedDice(medicine, ephedraCount);
                effectItems.push(`
                    <div class="effect-item">
                        <i data-lucide="dices"></i>
                        <span class="effect-label">Potency:</span>
                        <span class="effect-value enhanced">
                            <span class="base-value">${baseDice}</span>
                            <span class="arrow">→</span>
                            <span class="enhanced-value">${enhancedDice}</span>
                        </span>
                    </div>
                `);
            } else {
                effectItems.push(`
                    <div class="effect-item">
                        <i data-lucide="dices"></i>
                        <span class="effect-label">Potency:</span>
                        <span class="effect-value">${baseDice}</span>
                    </div>
                `);
            }
        }
        
        let effectSectionHtml = '';
        if (effectItems.length > 0) {
            const isEnhanced = alchemillaCount > 0 || ephedraCount > 0;
            effectSectionHtml = `
                <div class="craft-modal-section effect-section ${isEnhanced ? 'has-enhancements' : ''}">
                    <div class="section-header">
                        <i data-lucide="activity"></i>
                        <h4>Effect Preview</h4>
                    </div>
                    <div class="effect-preview-details">
                        ${effectItems.join('')}
                    </div>
                </div>
            `;
        }
        
        content.innerHTML = `
            <div class="craft-modal-header" data-category="${medicine.category}">
                <div class="craft-modal-title-row">
                    <span class="craft-category-badge ${medicine.category}">${medicine.category}</span>
                    <h2>${medicine.name}</h2>
                </div>
                <p class="effect-preview">${medicine.effect}</p>
            </div>
            
            <div class="craft-dc-display">
                <div class="dc-stars-wrapper">
                    <span class="dc-stars">${starDisplay}</span>
                </div>
                <div class="dc-info">
                    <span class="dc-label">Crafting DC</span>
                    <span class="dc-value">${effectiveDC}</span>
                </div>
            </div>
            
            <div class="craft-modal-section craft-modal-ingredients">
                <div class="section-header">
                    <i data-lucide="flask-conical"></i>
                    <h4>Ingredients Required</h4>
                </div>
                <div class="ingredients-chips">
                    ${ingredientsHtml}
                </div>
            </div>
            
            ${alternativeHtml}
            ${enhancementHtml}
            ${effectSectionHtml}
            
            <div class="craft-modal-actions">
                <button class="confirm-craft-btn" id="confirm-craft">
                    <i data-lucide="flask-conical"></i>
                    Confirm Craft
                </button>
                <button class="details-craft-btn" id="view-details">View Details</button>
                <button class="cancel-craft-btn" id="cancel-craft">Cancel</button>
            </div>
        `;
        
        this.bindCraftModalEvents();
        this.refreshIcons();
    };

    /**
     * Generate star display with enhancement highlighting
     */
    App.generateEnhancedStarDisplay = function(baseDifficulty, enhancementsUsed, slotsRemaining, hasIndefinite) {
        let display = '';
        display += '★'.repeat(baseDifficulty);
        
        if (enhancementsUsed > 0) {
            if (hasIndefinite && slotsRemaining === 0) {
                if (enhancementsUsed > 1) {
                    display += `<span class="enhancement-stars">${'★'.repeat(enhancementsUsed - 1)}✦</span>`;
                } else {
                    display += `<span class="enhancement-stars">✦</span>`;
                }
            } else {
                display += `<span class="enhancement-stars">${'★'.repeat(enhancementsUsed)}</span>`;
            }
        }
        
        if (hasIndefinite && slotsRemaining > 0) {
            display += '☆'.repeat(slotsRemaining - 1);
            display += '✧';
        } else {
            display += '☆'.repeat(slotsRemaining);
        }
        return display;
    };

    /**
     * Get DC for a difficulty level
     */
    App.getDCForDifficulty = function(difficulty) {
        const dcMap = { 1: 10, 2: 15, 3: 20, 4: 25, 5: 28 };
        return dcMap[Math.min(5, difficulty)] || 28;
    };

    /**
     * Get enhanced duration string based on Alchemilla count
     */
    App.getEnhancedDuration = function(medicine, alchemillaCount, hasIndefinite, slotsRemaining) {
        if (!medicine.alchemilla) return null;
        
        const baseIndex = medicine.alchemilla.durationIndex;
        let newIndex = baseIndex + alchemillaCount;
        
        if (hasIndefinite && slotsRemaining === 0 && alchemillaCount > 0) {
            return 'Indefinite';
        }
        
        newIndex = Math.min(newIndex, this.durationLadder.length - 1);
        return this.durationLadder[newIndex];
    };

    /**
     * Get enhanced dice string based on Ephedra count
     */
    App.getEnhancedDice = function(medicine, ephedraCount) {
        if (!medicine.ephedra) return null;
        
        const { diceCount, diceType, modifier } = medicine.ephedra;
        const multiplier = Math.pow(2, ephedraCount);
        const enhancedCount = diceCount * multiplier;
        
        let result = `${enhancedCount}d${diceType}`;
        if (modifier > 0) {
            result += ` + ${modifier}`;
        } else if (modifier < 0) {
            result += ` - ${Math.abs(modifier)}`;
        }
        
        return result;
    };

    /**
     * Bind events within the craft modal
     */
    App.bindCraftModalEvents = function() {
        document.querySelectorAll('input[name="alternative"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.craftModalState.chosenAlternative = e.target.value;
                this.renderCraftModalContent();
            });
        });
        
        const alchemillaDec = document.getElementById('alchemilla-dec');
        const alchemillaInc = document.getElementById('alchemilla-inc');
        
        if (alchemillaDec) {
            alchemillaDec.addEventListener('click', () => {
                if (this.craftModalState.alchemillaCount > 0) {
                    this.craftModalState.alchemillaCount--;
                    this.renderCraftModalContent();
                }
            });
        }
        
        if (alchemillaInc) {
            alchemillaInc.addEventListener('click', () => {
                const { maxEnhancements, ephedraCount } = this.craftModalState;
                const max = maxEnhancements - ephedraCount;
                const inventoryMax = this.ingredientInventory['Alchemilla'] || 0;
                if (this.craftModalState.alchemillaCount < Math.min(max, inventoryMax)) {
                    this.craftModalState.alchemillaCount++;
                    this.renderCraftModalContent();
                }
            });
        }
        
        const ephedraDec = document.getElementById('ephedra-dec');
        const ephedraInc = document.getElementById('ephedra-inc');
        
        if (ephedraDec) {
            ephedraDec.addEventListener('click', () => {
                if (this.craftModalState.ephedraCount > 0) {
                    this.craftModalState.ephedraCount--;
                    this.renderCraftModalContent();
                }
            });
        }
        
        if (ephedraInc) {
            ephedraInc.addEventListener('click', () => {
                const { maxEphedraSlots, alchemillaCount } = this.craftModalState;
                const max = Math.max(0, maxEphedraSlots - alchemillaCount);
                const inventoryMax = this.ingredientInventory['Ephedra'] || 0;
                if (this.craftModalState.ephedraCount < Math.min(max, inventoryMax)) {
                    this.craftModalState.ephedraCount++;
                    this.renderCraftModalContent();
                }
            });
        }
        
        const confirmBtn = document.getElementById('confirm-craft');
        if (confirmBtn) {
            confirmBtn.addEventListener('click', () => this.executeCraft());
        }
        
        const detailsBtn = document.getElementById('view-details');
        if (detailsBtn) {
            detailsBtn.addEventListener('click', () => {
                const medicine = this.craftModalState?.medicine;
                if (medicine) {
                    this.openModal(medicine);
                }
            });
        }
        
        const cancelBtn = document.getElementById('cancel-craft');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => this.closeCraftModal());
        }
    };

    /**
     * Execute the craft action
     */
    App.executeCraft = function() {
        if (!this.craftModalState) return;
        
        const { medicine, alchemillaCount, ephedraCount, chosenAlternative } = this.craftModalState;
        
        if (medicine.primary) {
            this.ingredientInventory[medicine.primary] = 
                (this.ingredientInventory[medicine.primary] || 0) - 1;
        }
        
        const isOrAlternative = this.hasAlternativeSecondaries(medicine);
        
        if (isOrAlternative && chosenAlternative) {
            this.ingredientInventory[chosenAlternative] = 
                (this.ingredientInventory[chosenAlternative] || 0) - 1;
        } else if (!isOrAlternative) {
            (medicine.secondary || []).forEach(s => {
                const name = this.getSecondaryName(s);
                this.ingredientInventory[name] = (this.ingredientInventory[name] || 0) - 1;
            });
        }
        
        if (alchemillaCount > 0) {
            this.ingredientInventory['Alchemilla'] = 
                (this.ingredientInventory['Alchemilla'] || 0) - alchemillaCount;
        }
        if (ephedraCount > 0) {
            this.ingredientInventory['Ephedra'] = 
                (this.ingredientInventory['Ephedra'] || 0) - ephedraCount;
        }
        
        for (const key in this.ingredientInventory) {
            if (this.ingredientInventory[key] <= 0) {
                delete this.ingredientInventory[key];
            }
        }
        
        this.saveInventory();
        this.closeCraftModal();
        this.renderCraftInventory();
        this.renderCraftableMedicines();
        this.bindCraftEvents();
    };

    /**
     * Close the craft modal
     */
    App.closeCraftModal = function() {
        const overlay = document.getElementById('craft-modal-overlay');
        if (overlay) {
            overlay.classList.remove('active');
            document.body.style.overflow = '';
        }
        this.craftModalState = null;
    };

})(window.App = window.App || {});
