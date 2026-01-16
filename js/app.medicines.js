/**
 * Meilin's Apothecary - Medicine System
 * Medicine list, filtering, cards, and detail modals
 */
(function(App) {

    /**
     * Get star display for a medicine using maxStars and indefiniteStar
     */
    App.getMedicineStars = function(medicine) {
        const difficulty = medicine.difficulty;
        
        // Variable-star medicines: check if first variant has maxStars
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
    };

    /**
     * Get star display for variable-star medicines
     */
    App.getVariableStars = function(medicine) {
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
    };

    /**
     * Check if a medicine has a flora-based option for crafting
     */
    App.hasFloraOption = function(medicine) {
        if (medicine.floraOnly) {
            return true;
        }
        if (medicine.secondary && medicine.secondary.length > 0) {
            const isObjectFormat = typeof medicine.secondary[0] === 'object';
            if (isObjectFormat) {
                return medicine.secondary.some(s => s.type === 'flora');
            }
        }
        return false;
    };

    /**
     * Check if a medicine requires creature parts
     */
    App.hasCreatureOption = function(medicine) {
        if (medicine.floraOnly) {
            return false;
        }
        if (medicine.secondary && medicine.secondary.length > 0) {
            const isObjectFormat = typeof medicine.secondary[0] === 'object';
            if (isObjectFormat) {
                return medicine.secondary.some(s => s.type === 'creature');
            }
            return true;
        }
        return false;
    };

    /**
     * Get ingredient badges HTML for a medicine
     */
    App.getIngredientBadges = function(medicine, forModal = false) {
        const hasFlora = this.hasFloraOption(medicine);
        const hasCreature = this.hasCreatureOption(medicine);
        
        let badges = '';
        
        if (hasFlora && hasCreature) {
            if (forModal) {
                badges = `<span class="modal-badges-group"><span class="medicine-flora-badge" title="Has flora option"><i data-lucide="sprout"></i> Flora</span><span class="medicine-creature-badge" title="Has creature option"><i data-lucide="bone"></i> Creature</span></span>`;
            } else {
                badges = `<span class="medicine-flora-badge" title="Has flora option"><i data-lucide="sprout"></i></span>`;
                badges += `<span class="medicine-creature-badge" title="Has creature option"><i data-lucide="bone"></i></span>`;
            }
        } else if (hasFlora) {
            if (forModal) {
                badges = `<span class="medicine-flora-badge" title="Flora option available"><i data-lucide="sprout"></i> Flora</span>`;
            } else {
                badges = `<span class="medicine-flora-badge" title="Flora option available"><i data-lucide="sprout"></i></span>`;
            }
        } else if (hasCreature) {
            if (forModal) {
                badges = `<span class="medicine-creature-badge" title="Requires creature parts"><i data-lucide="bone"></i> Creature</span>`;
            } else {
                badges = `<span class="medicine-creature-badge" title="Requires creature parts"><i data-lucide="bone"></i></span>`;
            }
        }
        
        return badges;
    };

    /**
     * Filter medicines based on current filters
     */
    App.getFilteredMedicines = function() {
        return this.medicines.filter(medicine => {
            // Search filter
            if (this.currentFilters.search) {
                const searchTerm = this.currentFilters.search;
                const matchesName = medicine.name.toLowerCase().includes(searchTerm);
                const matchesBrief = medicine.brief?.toLowerCase().includes(searchTerm);
                const matchesEffect = medicine.effect?.toLowerCase().includes(searchTerm);
                const matchesFullEffect = medicine.fullEffect?.toLowerCase().includes(searchTerm);
                const matchesPrimary = medicine.primary?.toLowerCase().includes(searchTerm);
                const matchesSecondary = medicine.secondary.some(s => 
                    this.getSecondaryName(s).toLowerCase().includes(searchTerm)
                );
                
                if (!matchesName && !matchesBrief && !matchesEffect && !matchesFullEffect && 
                    !matchesPrimary && !matchesSecondary) {
                    return false;
                }
            }

            // Category filter
            if (this.currentFilters.category !== 'all') {
                if (medicine.category !== this.currentFilters.category) {
                    return false;
                }
            }

            // Difficulty filter
            if (this.currentFilters.difficulty !== 'all') {
                if (medicine.difficulty !== parseInt(this.currentFilters.difficulty)) {
                    return false;
                }
            }

            // Ingredient type filter
            if (this.currentFilters.ingredientType === 'flora') {
                if (!this.hasFloraOption(medicine)) {
                    return false;
                }
            } else if (this.currentFilters.ingredientType === 'creature') {
                if (!this.hasCreatureOption(medicine)) {
                    return false;
                }
            }

            return true;
        });
    };

    /**
     * Render medicine cards
     */
    App.renderMedicines = function() {
        const grid = document.getElementById('medicine-grid');
        const countEl = document.getElementById('medicine-count');
        const filtered = this.getFilteredMedicines();

        // Update count
        const totalCount = this.medicines.length;
        if (filtered.length === totalCount) {
            countEl.textContent = `Showing all ${totalCount} medicines`;
        } else {
            countEl.textContent = `Showing ${filtered.length} of ${totalCount} medicines`;
        }

        // Render cards
        if (filtered.length === 0) {
            grid.innerHTML = `
                <div class="no-results">
                    <div class="no-results-icon"><i data-lucide="leaf"></i></div>
                    <p>No medicines found matching your criteria.</p>
                    <p>Try adjusting your search or filters.</p>
                </div>
            `;
            return;
        }

        grid.innerHTML = filtered.map(medicine => this.createMedicineCard(medicine)).join('');

        // Add click handlers to cards
        grid.querySelectorAll('.medicine-card').forEach(card => {
            card.addEventListener('click', () => {
                const medicineId = card.dataset.id;
                const medicine = this.medicines.find(m => m.id === medicineId);
                if (medicine) {
                    this.openModal(medicine);
                }
            });
        });
        
        this.refreshIcons();
    };

    /**
     * Create HTML for a medicine card
     */
    App.createMedicineCard = function(medicine) {
        const stars = this.getMedicineStars(medicine);
        const previewText = medicine.effect.length > 100 
            ? medicine.effect.substring(0, 100) + '...'
            : medicine.effect;

        const ingredientBadges = this.getIngredientBadges(medicine, false);
        const variableIndicator = medicine.variableStars ? '<span class="variable-star-indicator" title="Variable strength">△</span>' : '';

        return `
            <article class="medicine-card" data-id="${medicine.id}" data-category="${medicine.category}">
                <div class="medicine-ingredient-badges">${ingredientBadges}</div>
                <div class="medicine-card-header">
                    <h3 class="medicine-name">${medicine.name}</h3>
                    <span class="medicine-stars" title="${this.getDifficultyLabel(medicine.difficulty)}">${stars}${variableIndicator}</span>
                </div>
                <div class="medicine-meta">
                    <span class="medicine-category ${medicine.category}">${medicine.category}</span>
                    <span class="medicine-dc">DC ${medicine.dc}</span>
                </div>
                <p class="medicine-preview">${previewText}</p>
            </article>
        `;
    };

    /**
     * Open medicine detail modal
     */
    App.openModal = function(medicine) {
        const modal = document.getElementById('modal-overlay');
        const content = document.getElementById('modal-content');
        
        const stars = this.getMedicineStars(medicine);
        const componentsHtml = this.createComponentsHtml(medicine);
        const variableStarsHtml = this.createVariableStarsHtml(medicine);
        const detailsTableHtml = this.createDetailsTableHtml(medicine);
        
        content.innerHTML = `
            <div class="modal-header">
                <h2 class="modal-title">${medicine.name}</h2>
                <div class="modal-meta">
                    <span class="modal-stars" title="${this.getDifficultyLabel(medicine.difficulty)}">${stars}</span>
                    <span class="modal-dc">DC ${medicine.dc}${medicine.variableStars ? '+' : ''}</span>
                    <span class="modal-category medicine-category ${medicine.category}">${medicine.category}</span>
                    ${this.getIngredientBadges(medicine, true)}
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
        this.refreshIcons();
        
        // Bind flora click events in the modal
        this.bindFloraClickEvents(content);
    };

    /**
     * Create HTML for variable star table
     */
    App.createVariableStarsHtml = function(medicine) {
        const variants = this.getVariableStars(medicine);
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
    };

    /**
     * Create HTML for details table
     */
    App.createDetailsTableHtml = function(medicine) {
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
    };

    /**
     * Create HTML for medicine components
     */
    App.createComponentsHtml = function(medicine) {
        let html = '';
        
        if (medicine.primary) {
            const primaryClickable = this.makeFloraClickable(medicine.primary);
            html += `
                <div class="component-item">
                    <span class="component-label">Primary:</span>
                    <span class="component-value">${primaryClickable}</span>
                </div>
            `;
        }
        
        if (medicine.secondary && medicine.secondary.length > 0) {
            const isObjectFormat = typeof medicine.secondary[0] === 'object';
            
            if (isObjectFormat) {
                const floraOptions = medicine.secondary.filter(s => s.type === 'flora').map(s => s.name);
                const creatureOptions = medicine.secondary.filter(s => s.type === 'creature').map(s => s.name);
                
                if (floraOptions.length > 0) {
                    const floraClickables = floraOptions.map(f => this.makeFloraClickable(f)).join(' or ');
                    html += `
                        <div class="component-item">
                            <span class="component-label">Secondary:</span>
                            <span class="component-value component-flora">${floraClickables}</span>
                        </div>
                    `;
                }
                if (creatureOptions.length > 0) {
                    const creatureClickables = creatureOptions.map(c => this.makeCreatureClickable(c)).join(' or ');
                    html += `
                        <div class="component-item">
                            <span class="component-label">Secondary:</span>
                            <span class="component-value component-creature">${creatureClickables}</span>
                        </div>
                    `;
                }
            } else {
                const ingredients = medicine.secondary.map(s => this.makeIngredientClickable(s));
                const secondaryClickables = ingredients.map(i => i.html).join(' or ');
                
                const hasCreature = ingredients.some(i => i.type === 'creature');
                const hasFlora = ingredients.some(i => i.type === 'flora');
                let valueClass = '';
                if (hasCreature && !hasFlora) {
                    valueClass = ' component-creature';
                } else if (hasFlora && !hasCreature) {
                    valueClass = ' component-flora';
                }
                
                html += `
                    <div class="component-item">
                        <span class="component-label">Secondary:</span>
                        <span class="component-value${valueClass}">${secondaryClickables}</span>
                    </div>
                `;
            }
        }
        
        html += `
            <div class="component-item">
                <span class="component-label">Also needs:</span>
                <span class="component-value">5 gp rare herbs</span>
            </div>
        `;
        
        return html;
    };

    /**
     * Open medicine modal by name
     */
    App.openMedicineByName = function(name) {
        const cleanName = name.replace(/\s*\([^)]*\)\s*/g, '').trim();
        
        const medicine = this.medicines.find(m => 
            m.name.toLowerCase() === cleanName.toLowerCase() ||
            m.name.toLowerCase().includes(cleanName.toLowerCase()) ||
            cleanName.toLowerCase().includes(m.name.toLowerCase())
        );
        
        if (medicine) {
            this.openModal(medicine);
        } else {
            console.warn(`Medicine not found: ${name} (searched: ${cleanName})`);
        }
    };

})(window.App = window.App || {});
