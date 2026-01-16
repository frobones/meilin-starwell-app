/**
 * Meilin's Apothecary - Ingredients System
 * Flora, creature parts, terrain tabs, and detail modals
 */
(function(App) {

    /**
     * Create clickable flora span
     */
    App.makeFloraClickable = function(floraName) {
        if (this.ingredients?.floraDetails?.[floraName]) {
            return `<span class="flora-clickable" data-flora="${floraName}">${floraName}</span>`;
        }
        return floraName;
    };

    /**
     * Create clickable creature part span
     */
    App.makeCreatureClickable = function(partName) {
        if (this.creaturePartsLookup?.[partName]) {
            return `<span class="creature-clickable" data-creature="${partName}">${partName}</span>`;
        }
        return partName;
    };

    /**
     * Make an ingredient clickable - checks both flora and creature parts
     */
    App.makeIngredientClickable = function(ingredientName) {
        if (this.ingredients?.floraDetails?.[ingredientName]) {
            return {
                html: `<span class="flora-clickable" data-flora="${ingredientName}">${ingredientName}</span>`,
                type: 'flora'
            };
        }
        if (this.creaturePartsLookup?.[ingredientName]) {
            return {
                html: `<span class="creature-clickable" data-creature="${ingredientName}">${ingredientName}</span>`,
                type: 'creature'
            };
        }
        return {
            html: ingredientName,
            type: 'unknown'
        };
    };

    /**
     * Render ingredients section
     */
    App.renderIngredients = function() {
        const section = document.getElementById('ingredients-section');
        
        section.innerHTML = `
            ${this.createFloraSection()}
            ${this.createCreaturePartsSection()}
        `;

        // Bind terrain tab events
        section.querySelectorAll('.terrain-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const terrain = e.target.dataset.terrain;
                this.selectTerrain(terrain);
            });
        });

        // Bind flora click events
        this.bindFloraClickEvents(section);
        
        this.refreshIcons();
    };

    /**
     * Bind click events for flora items, creature parts, and medicine links
     */
    App.bindFloraClickEvents = function(container) {
        container.querySelectorAll('.flora-clickable').forEach(el => {
            el.addEventListener('click', (e) => {
                const floraName = e.target.dataset.flora;
                this.showFloraDetails(floraName);
            });
        });
        
        container.querySelectorAll('.creature-clickable').forEach(el => {
            el.addEventListener('click', (e) => {
                const partName = e.target.dataset.creature;
                this.showCreatureDetails(partName);
            });
        });

        container.querySelectorAll('.medicine-link').forEach(el => {
            el.addEventListener('click', (e) => {
                const medicineName = e.target.dataset.medicine;
                this.openMedicineByName(medicineName);
            });
        });
    };

    /**
     * Look up DC for a flora by name
     */
    App.getFloraGatherDC = function(floraName) {
        const common = this.ingredients?.flora?.common?.find(f => f.name === floraName);
        if (common) return common.dc;
        
        const rare = this.ingredients?.flora?.rare;
        if (rare) {
            for (const terrain of Object.values(rare)) {
                const found = terrain.find(f => f.name === floraName);
                if (found) return found.dc;
            }
        }
        
        return null;
    };

    /**
     * Show flora details modal
     */
    App.showFloraDetails = function(floraName) {
        const details = this.ingredients.floraDetails?.[floraName];
        if (!details) {
            console.warn(`No details found for flora: ${floraName}`);
            return;
        }
        
        const dc = this.getFloraGatherDC(floraName);
        const dcHtml = dc ? `<span class="flora-dc"><i data-lucide="target"></i> DC ${dc}</span>` : '';

        const overlay = document.createElement('div');
        overlay.className = 'flora-modal-overlay';
        overlay.innerHTML = `
            <div class="flora-modal">
                <button class="flora-modal-close" aria-label="Close">&times;</button>
                <div class="flora-modal-header">
                    <span class="flora-modal-icon"><i data-lucide="leaf"></i></span>
                    <h3 class="flora-modal-title">${floraName}</h3>
                </div>
                <div class="flora-modal-meta">
                    <span class="flora-rarity">${details.rarity}</span>
                    <span class="flora-terrain"><i data-lucide="map-pin"></i> ${details.terrain}</span>
                    ${dcHtml}
                </div>
                <p class="flora-modal-description">${details.description}</p>
            </div>
        `;

        document.body.appendChild(overlay);
        this.refreshIcons();

        const closeModal = () => {
            overlay.classList.add('closing');
            setTimeout(() => overlay.remove(), 200);
        };

        overlay.querySelector('.flora-modal-close').addEventListener('click', closeModal);
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) closeModal();
        });

        const escHandler = (e) => {
            if (e.key === 'Escape') {
                closeModal();
                document.removeEventListener('keydown', escHandler);
            }
        };
        document.addEventListener('keydown', escHandler);

        requestAnimationFrame(() => overlay.classList.add('active'));
    };

    /**
     * Show creature part details modal
     */
    App.showCreatureDetails = function(partName) {
        const details = this.creaturePartsLookup?.[partName];
        if (!details) {
            console.warn(`No details found for creature part: ${partName}`);
            return;
        }

        let amountDisplay = details.amount;
        if (details.amount === 'Δ') {
            amountDisplay = '<abbr title="Amount depends on creature size: Medium or smaller = 1, Large = 2, Huge = 4, Gargantuan+ = 8">Δ (varies by size)</abbr>';
        }
        
        const typeBadges = details.creatureTypes.map(t => 
            `<span class="creature-type-badge">${t}</span>`
        ).join('');
        
        const cleanSource = (source) => source.replace(/\s*\(replaces[^)]*\)/gi, '').trim();
        
        let sourcesHtml;
        if (details.sources.length === 1) {
            sourcesHtml = cleanSource(details.sources[0].source);
        } else {
            sourcesHtml = details.sources.map(s => 
                `<div class="creature-source-item"><strong>${s.creatureType}:</strong> ${cleanSource(s.source)}</div>`
            ).join('');
        }

        const overlay = document.createElement('div');
        overlay.className = 'creature-modal-overlay';
        overlay.innerHTML = `
            <div class="creature-modal">
                <button class="creature-modal-close" aria-label="Close">&times;</button>
                <div class="creature-modal-header">
                    <span class="creature-modal-icon"><i data-lucide="bone"></i></span>
                    <h3 class="creature-modal-title">${partName}</h3>
                </div>
                <div class="creature-modal-meta">
                    ${typeBadges}
                    <span class="creature-dc"><i data-lucide="target"></i> DC ${details.dc}</span>
                </div>
                <div class="creature-modal-details">
                    <div class="creature-detail-row">
                        <span class="creature-detail-label">Source:</span>
                        <span class="creature-detail-value">${sourcesHtml}</span>
                    </div>
                    <div class="creature-detail-row">
                        <span class="creature-detail-label">Amount:</span>
                        <span class="creature-detail-value">${amountDisplay}</span>
                    </div>
                    <div class="creature-detail-row">
                        <span class="creature-detail-label">Used in:</span>
                        <span class="creature-detail-value">${details.use}</span>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);
        this.refreshIcons();

        const closeModal = () => {
            overlay.classList.add('closing');
            setTimeout(() => overlay.remove(), 200);
        };

        overlay.querySelector('.creature-modal-close').addEventListener('click', closeModal);
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) closeModal();
        });

        const escHandler = (e) => {
            if (e.key === 'Escape') {
                closeModal();
                document.removeEventListener('keydown', escHandler);
            }
        };
        document.addEventListener('keydown', escHandler);

        requestAnimationFrame(() => overlay.classList.add('active'));
    };

    /**
     * Create flora ingredients section
     */
    App.createFloraSection = function() {
        const terrains = this.ingredients.terrains;
        const common = this.ingredients.flora.common;
        const rare = this.ingredients.flora.rare;

        const terrainTabs = terrains.map(t => `
            <button class="terrain-tab${t === this.selectedTerrain ? ' active' : ''}" 
                    data-terrain="${t}">${t}</button>
        `).join('');

        const commonRows = common.map(item => `
            <tr>
                <td class="ingredient-name flora-clickable" data-flora="${item.name}">${item.name}</td>
                <td class="ingredient-dc">${item.dc}</td>
                <td>${item.terrain}</td>
                <td>${item.use}</td>
            </tr>
        `).join('');

        const rareFlora = rare[this.selectedTerrain] || [];
        const rareRows = rareFlora.map(item => `
            <tr>
                <td class="ingredient-name flora-clickable" data-flora="${item.name}">${item.name}</td>
                <td class="ingredient-dc">${item.dc}</td>
                <td class="medicine-link" data-medicine="${item.use}">${item.use}</td>
            </tr>
        `).join('');

        return `
            <div class="ingredient-group">
                <div class="ingredient-group-header">
                    <h3 class="ingredient-group-title">
                        <span class="ingredient-group-icon"><i data-lucide="leaf"></i></span>
                        Flora (Plants & Fungi)
                    </h3>
                </div>
                
                <div class="ingredient-table-container">
                    <table class="ingredient-table">
                        <thead>
                            <tr>
                                <th>Common Flora</th>
                                <th>DC</th>
                                <th>Found</th>
                                <th>Use</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${commonRows}
                        </tbody>
                    </table>
                </div>

                <div class="terrain-tabs" id="terrain-tabs">
                    ${terrainTabs}
                </div>

                <div class="ingredient-table-container">
                    <table class="ingredient-table">
                        <thead>
                            <tr>
                                <th>Rare Flora (${this.selectedTerrain})</th>
                                <th>DC</th>
                                <th>Used In</th>
                            </tr>
                        </thead>
                        <tbody id="rare-flora-body">
                            ${rareRows.length > 0 ? rareRows : '<tr><td colspan="3">No rare flora in this terrain</td></tr>'}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    };

    /**
     * Create creature parts section
     */
    App.createCreaturePartsSection = function() {
        const creatureParts = this.ingredients.creatureParts;
        const sizeAmounts = this.ingredients.sizeAmounts;
        
        let tablesHtml = '';
        
        for (const [creatureType, parts] of Object.entries(creatureParts)) {
            if (creatureType === 'All creatures') continue;
            
            const rows = parts.map(item => {
                let amountDisplay = item.amount;
                if (item.amount === 'Δ') {
                    amountDisplay = '<span class="amount-delta" title="Amount depends on creature size: Medium or smaller = 1, Large = 2, Huge = 4, Gargantuan+ = 8">Δ</span>';
                } else {
                    amountDisplay = `×${item.amount}`;
                }
                
                const sourceDisplay = item.source ? `<span class="creature-source">${item.source}</span>` : '';
                
                const usedInLinks = item.use.split(', ').map(medicine => 
                    `<span class="medicine-link" data-medicine="${medicine}">${medicine}</span>`
                ).join(', ');
                
                return `
                    <tr>
                        <td class="ingredient-name">
                            ${item.name}
                            ${sourceDisplay}
                        </td>
                        <td class="ingredient-amount">${amountDisplay}</td>
                        <td class="ingredient-dc">${item.dc}</td>
                        <td class="creature-used-in">${usedInLinks}</td>
                    </tr>
                `;
            }).join('');

            tablesHtml += `
                <details class="creature-type-details">
                    <summary>${creatureType}</summary>
                    <table class="ingredient-table creature-parts-table">
                        <thead>
                            <tr>
                                <th>Component</th>
                                <th>Amt</th>
                                <th>DC</th>
                                <th>Used In</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${rows}
                        </tbody>
                    </table>
                </details>
            `;
        }

        const sizeRef = sizeAmounts ? `
            <div class="size-amounts-ref">
                <strong>Δ amounts by size:</strong> 
                Medium or smaller = 1, Large = 2, Huge = 4, Gargantuan+ = 8
            </div>
        ` : '';

        return `
            <div class="ingredient-group">
                <div class="ingredient-group-header">
                    <h3 class="ingredient-group-title">
                        <span class="ingredient-group-icon"><i data-lucide="bone"></i></span>
                        Creature Parts (Harvesting)
                    </h3>
                </div>
                <div style="padding: var(--space-md);">
                    ${sizeRef}
                    ${tablesHtml}
                </div>
            </div>
        `;
    };

    /**
     * Select a terrain for rare flora display
     */
    App.selectTerrain = function(terrain) {
        this.selectedTerrain = terrain;
        
        // Update active tab
        document.querySelectorAll('.terrain-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.terrain === terrain);
        });
        
        // Update rare flora table
        const rareFlora = this.ingredients.flora.rare[terrain] || [];
        const rareRows = rareFlora.map(item => `
            <tr>
                <td class="ingredient-name flora-clickable" data-flora="${item.name}">${item.name}</td>
                <td class="ingredient-dc">${item.dc}</td>
                <td class="medicine-link" data-medicine="${item.use}">${item.use}</td>
            </tr>
        `).join('');

        const tbody = document.getElementById('rare-flora-body');
        if (tbody) {
            tbody.innerHTML = rareRows.length > 0 
                ? rareRows 
                : '<tr><td colspan="3">No rare flora in this terrain</td></tr>';
            
            this.bindFloraClickEvents(tbody);
        }

        // Update the header to show current terrain
        const tables = document.querySelectorAll('.ingredient-table thead th');
        tables.forEach(th => {
            if (th.textContent.includes('Rare Flora')) {
                th.textContent = `Rare Flora (${terrain})`;
            }
        });
    };

})(window.App = window.App || {});
