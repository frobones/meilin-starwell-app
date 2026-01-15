/**
 * Meilin's Apothecary - Main Application
 * Herbal Medicine Quick Reference for the Alchemy Almanac system
 */

const App = {
    // Data storage
    medicines: [],
    ingredients: null,
    rules: null,
    
    // Backstory data
    worksheetContent: null,
    backstoryContent: null,
    chapters: [],
    vignettes: [],
    npcs: [],
    
    // Passkey configuration
    // Change this passkey to whatever you want!
    PASSKEY: 'ms-13',
    STORAGE_KEY: 'meilin-backstory-unlocked',
    
    // Current state
    currentFilters: {
        search: '',
        category: 'all',
        difficulty: 'all',
        floraOnly: false
    },
    currentTab: 'medicines',
    selectedTerrain: 'Arctic',
    currentPage: 'medicine',
    currentSubtab: 'ataglance',
    backstoryUnlocked: false,

    /**
     * Initialize the application
     */
    async init() {
        try {
            await this.loadData();
            this.bindEvents();
            this.bindPageEvents();
            this.bindPasskeyEvents();
            this.checkStoredUnlock();
            this.renderMedicines();
            this.renderIngredients();
            this.renderQuickRules();
            
            // Handle initial page based on URL hash
            this.handleHashChange();
            
            console.log('Meilin Starwell Companion initialized successfully');
        } catch (error) {
            console.error('Failed to initialize app:', error);
            this.showError('Failed to load data. Please refresh the page.');
        }
    },
    
    /**
     * Check if backstory was previously unlocked
     */
    checkStoredUnlock() {
        const stored = localStorage.getItem(this.STORAGE_KEY);
        this.backstoryUnlocked = stored === 'true';
        this.updateLockIndicator();
    },
    
    /**
     * Update the lock indicator on the nav link
     */
    updateLockIndicator() {
        const backstoryLink = document.querySelector('.nav-link[data-page="backstory"]');
        if (backstoryLink) {
            backstoryLink.classList.toggle('locked', !this.backstoryUnlocked);
            backstoryLink.classList.toggle('unlocked', this.backstoryUnlocked);
        }
    },
    
    /**
     * Bind passkey modal events
     */
    bindPasskeyEvents() {
        const overlay = document.getElementById('passkey-modal-overlay');
        const form = document.getElementById('passkey-form');
        const cancelBtn = document.getElementById('passkey-cancel');
        const input = document.getElementById('passkey-input');
        
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.checkPasskey();
            });
        }
        
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                this.closePasskeyModal();
            });
        }
        
        if (overlay) {
            overlay.addEventListener('click', (e) => {
                if (e.target.id === 'passkey-modal-overlay') {
                    this.closePasskeyModal();
                }
            });
        }
        
        // Clear error when typing
        if (input) {
            input.addEventListener('input', () => {
                input.classList.remove('error');
                document.getElementById('passkey-error').textContent = '';
            });
        }
    },
    
    /**
     * Show the passkey modal
     */
    showPasskeyModal() {
        const overlay = document.getElementById('passkey-modal-overlay');
        const input = document.getElementById('passkey-input');
        if (overlay) {
            overlay.classList.add('active');
            if (input) {
                input.value = '';
                input.classList.remove('error');
                input.focus();
            }
            document.getElementById('passkey-error').textContent = '';
        }
    },
    
    /**
     * Close the passkey modal
     */
    closePasskeyModal() {
        const overlay = document.getElementById('passkey-modal-overlay');
        if (overlay) {
            overlay.classList.remove('active');
        }
    },
    
    /**
     * Check the entered passkey
     */
    checkPasskey() {
        const input = document.getElementById('passkey-input');
        const errorEl = document.getElementById('passkey-error');
        const entered = input.value.toLowerCase().trim();
        
        if (entered === this.PASSKEY.toLowerCase()) {
            // Correct passkey
            this.backstoryUnlocked = true;
            localStorage.setItem(this.STORAGE_KEY, 'true');
            this.updateLockIndicator();
            this.closePasskeyModal();
            this.switchPage('backstory');
        } else {
            // Wrong passkey
            input.classList.add('error');
            errorEl.textContent = 'Incorrect passkey. Try again.';
        }
    },

    /**
     * Load JSON data files
     */
    async loadData() {
        const [medicinesResponse, ingredientsResponse] = await Promise.all([
            fetch('js/data/medicines.json'),
            fetch('js/data/ingredients.json')
        ]);

        if (!medicinesResponse.ok || !ingredientsResponse.ok) {
            throw new Error('Failed to fetch data files');
        }

        const medicinesData = await medicinesResponse.json();
        const ingredientsData = await ingredientsResponse.json();

        this.medicines = medicinesData.medicines;
        this.rules = medicinesData.rules;
        this.primaryComponents = medicinesData.primaryComponents;
        this.ingredients = ingredientsData;
    },

    /**
     * Bind all event listeners
     */
    bindEvents() {
        // Search
        const searchInput = document.getElementById('search-input');
        const clearSearch = document.getElementById('clear-search');
        
        searchInput.addEventListener('input', (e) => {
            this.currentFilters.search = e.target.value.toLowerCase();
            this.renderMedicines();
        });

        clearSearch.addEventListener('click', () => {
            searchInput.value = '';
            this.currentFilters.search = '';
            this.renderMedicines();
        });

        // Filters
        document.getElementById('category-filter').addEventListener('change', (e) => {
            this.currentFilters.category = e.target.value;
            this.renderMedicines();
        });

        document.getElementById('difficulty-filter').addEventListener('change', (e) => {
            this.currentFilters.difficulty = e.target.value;
            this.renderMedicines();
        });

        document.getElementById('flora-only-filter').addEventListener('change', (e) => {
            this.currentFilters.floraOnly = e.target.checked;
            this.renderMedicines();
        });

        // Tabs
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });

        // Modal
        document.getElementById('modal-overlay').addEventListener('click', (e) => {
            if (e.target.id === 'modal-overlay') {
                this.closeModal();
            }
        });

        document.getElementById('modal-close').addEventListener('click', () => {
            this.closeModal();
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeModal();
                this.closeVignetteModal();
            }
        });
    },

    /**
     * Bind page navigation events
     */
    bindPageEvents() {
        // Sidebar navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = link.dataset.page;
                this.switchPage(page);
            });
        });

        // Sub-tab navigation (backstory page)
        document.querySelectorAll('.sub-tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const subtab = btn.dataset.subtab;
                this.switchSubtab(subtab);
            });
        });

        // Vignette modal close
        const vignetteOverlay = document.getElementById('vignette-modal-overlay');
        if (vignetteOverlay) {
            vignetteOverlay.addEventListener('click', (e) => {
                if (e.target.id === 'vignette-modal-overlay') {
                    this.closeVignetteModal();
                }
            });
        }

        const vignetteClose = document.getElementById('vignette-modal-close');
        if (vignetteClose) {
            vignetteClose.addEventListener('click', () => {
                this.closeVignetteModal();
            });
        }

        // NPC modal close
        const npcOverlay = document.getElementById('npc-modal-overlay');
        if (npcOverlay) {
            npcOverlay.addEventListener('click', (e) => {
                if (e.target.id === 'npc-modal-overlay') {
                    this.closeNPCModal();
                }
            });
        }

        const npcClose = document.getElementById('npc-modal-close');
        if (npcClose) {
            npcClose.addEventListener('click', () => {
                this.closeNPCModal();
            });
        }

        // Handle browser back/forward
        window.addEventListener('hashchange', () => {
            this.handleHashChange();
        });
    },

    /**
     * Handle URL hash changes for navigation
     */
    handleHashChange() {
        const hash = window.location.hash.slice(1) || 'medicine';
        if (hash === 'medicine' || hash === 'backstory') {
            this.switchPage(hash, false);
        }
    },

    /**
     * Switch between main pages
     */
    switchPage(pageName, updateHash = true) {
        // Check if trying to access backstory without unlocking
        if (pageName === 'backstory' && !this.backstoryUnlocked) {
            this.showPasskeyModal();
            return;
        }
        
        this.currentPage = pageName;

        // Update sidebar nav
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.toggle('active', link.dataset.page === pageName);
        });

        // Update page visibility
        document.querySelectorAll('.page').forEach(page => {
            page.classList.toggle('active', page.id === `${pageName}-page`);
        });

        // Update URL hash
        if (updateHash) {
            window.location.hash = pageName;
        }

        // Load backstory content if switching to backstory page
        if (pageName === 'backstory' && !this.worksheetContent) {
            this.loadBackstoryContent();
        }
    },

    /**
     * Switch between backstory sub-tabs
     */
    switchSubtab(subtabName) {
        this.currentSubtab = subtabName;

        // Update sub-tab buttons
        document.querySelectorAll('.sub-tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.subtab === subtabName);
        });

        // Update sub-tab content visibility
        document.querySelectorAll('.sub-tab-content').forEach(content => {
            content.classList.toggle('active', content.id === `${subtabName}-subtab`);
        });

        // Load content if needed
        if (subtabName === 'ataglance' && !this.worksheetContent) {
            this.loadWorksheet();
        } else if (subtabName === 'overview' && !this.backstoryContent) {
            this.loadBackstoryOverview();
        } else if (subtabName === 'chapters' && this.chapters.length === 0) {
            this.loadChapters();
        } else if (subtabName === 'vignettes' && this.vignettes.length === 0) {
            this.loadVignettes();
        } else if (subtabName === 'npcs' && this.npcs.length === 0) {
            this.loadNPCs();
        }
    },

    /**
     * Get star display for difficulty level
     */
    getStars(difficulty) {
        const filled = '★'.repeat(difficulty);
        const empty = '☆'.repeat(5 - difficulty);
        return filled + empty;
    },

    /**
     * Get difficulty label
     */
    getDifficultyLabel(difficulty) {
        const labels = {
            1: 'Low',
            2: 'Moderate',
            3: 'High',
            4: 'Very High',
            5: 'Maximum'
        };
        return labels[difficulty] || 'Unknown';
    },

    /**
     * Check if a medicine has a flora-based option for crafting
     */
    hasFloraOption(medicine) {
        // If floraOnly is true, it's definitely flora-based
        if (medicine.floraOnly) {
            return true;
        }
        // Check if any secondary ingredient is flora type (new object format)
        if (medicine.secondary && medicine.secondary.length > 0) {
            const isObjectFormat = typeof medicine.secondary[0] === 'object';
            if (isObjectFormat) {
                return medicine.secondary.some(s => s.type === 'flora');
            }
        }
        return false;
    },

    /**
     * Get the name of a secondary ingredient (handles both string and object formats)
     */
    getSecondaryName(secondary) {
        return typeof secondary === 'object' ? secondary.name : secondary;
    },

    /**
     * Filter medicines based on current filters
     */
    getFilteredMedicines() {
        return this.medicines.filter(medicine => {
            // Search filter
            if (this.currentFilters.search) {
                const searchTerm = this.currentFilters.search;
                const matchesName = medicine.name.toLowerCase().includes(searchTerm);
                const matchesEffect = medicine.effect.toLowerCase().includes(searchTerm);
                const matchesPrimary = medicine.primary?.toLowerCase().includes(searchTerm);
                const matchesSecondary = medicine.secondary.some(s => 
                    this.getSecondaryName(s).toLowerCase().includes(searchTerm)
                );
                
                if (!matchesName && !matchesEffect && !matchesPrimary && !matchesSecondary) {
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

            // Flora only filter - show medicines that can be made with flora
            if (this.currentFilters.floraOnly) {
                if (!this.hasFloraOption(medicine)) {
                    return false;
                }
            }

            return true;
        });
    },

    /**
     * Render medicine cards
     */
    renderMedicines() {
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
                    <div class="no-results-icon">🌿</div>
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
    },

    /**
     * Create HTML for a medicine card
     */
    createMedicineCard(medicine) {
        const stars = this.getStars(medicine.difficulty);
        const previewText = medicine.effect.length > 100 
            ? medicine.effect.substring(0, 100) + '...'
            : medicine.effect;

        const hasFlora = this.hasFloraOption(medicine);
        const floraBadgeTitle = medicine.floraOnly ? 'Flora only (no creature parts)' : 'Has flora option';

        return `
            <article class="medicine-card" data-id="${medicine.id}" data-category="${medicine.category}">
                ${hasFlora ? `<span class="medicine-flora-badge" title="${floraBadgeTitle}">🌿</span>` : ''}
                <div class="medicine-card-header">
                    <h3 class="medicine-name">${medicine.name}</h3>
                    <span class="medicine-stars" title="${this.getDifficultyLabel(medicine.difficulty)}">${stars}</span>
                </div>
                <div class="medicine-meta">
                    <span class="medicine-category ${medicine.category}">${medicine.category}</span>
                    <span class="medicine-dc">DC ${medicine.dc}</span>
                </div>
                <p class="medicine-preview">${previewText}</p>
            </article>
        `;
    },

    /**
     * Open medicine detail modal
     */
    openModal(medicine) {
        const modal = document.getElementById('modal-overlay');
        const content = document.getElementById('modal-content');
        
        const stars = this.getStars(medicine.difficulty);
        const componentsHtml = this.createComponentsHtml(medicine);
        
        content.innerHTML = `
            <div class="modal-header">
                <h2 class="modal-title">${medicine.name}</h2>
                <div class="modal-meta">
                    <span class="modal-stars" title="${this.getDifficultyLabel(medicine.difficulty)}">${stars}</span>
                    <span class="modal-dc">DC ${medicine.dc}</span>
                    <span class="modal-category medicine-category ${medicine.category}">${medicine.category}</span>
                    ${this.hasFloraOption(medicine) ? `<span class="medicine-flora-badge" title="${medicine.floraOnly ? 'Flora only' : 'Has flora option'}">🌿 ${medicine.floraOnly ? 'Flora Only' : 'Flora Option'}</span>` : ''}
                </div>
            </div>
            
            <div class="modal-section">
                <h3 class="modal-section-title">Effect</h3>
                <p class="modal-effect">${medicine.effect}</p>
            </div>
            
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
    },

    /**
     * Create HTML for medicine components
     */
    createComponentsHtml(medicine) {
        let html = '';
        
        if (medicine.primary) {
            html += `
                <div class="component-item">
                    <span class="component-label">Primary:</span>
                    <span class="component-value">${medicine.primary}</span>
                </div>
            `;
        }
        
        if (medicine.secondary && medicine.secondary.length > 0) {
            // Check if secondary uses new object format or old string format
            const isObjectFormat = typeof medicine.secondary[0] === 'object';
            
            if (isObjectFormat) {
                // New format: group by type and display with labels
                const floraOptions = medicine.secondary.filter(s => s.type === 'flora').map(s => s.name);
                const creatureOptions = medicine.secondary.filter(s => s.type === 'creature').map(s => s.name);
                
                if (floraOptions.length > 0) {
                    html += `
                        <div class="component-item">
                            <span class="component-label">Secondary <span class="component-type flora">🌿 Flora</span>:</span>
                            <span class="component-value">${floraOptions.join(' or ')}</span>
                        </div>
                    `;
                }
                if (creatureOptions.length > 0) {
                    html += `
                        <div class="component-item">
                            <span class="component-label">Secondary <span class="component-type creature">🦴 Creature</span>:</span>
                            <span class="component-value">${creatureOptions.join(' or ')}</span>
                        </div>
                    `;
                }
            } else {
                // Old format: simple string array
            const secondaryList = medicine.secondary.length > 1 
                ? medicine.secondary.join(' or ')
                : medicine.secondary[0];
            html += `
                <div class="component-item">
                    <span class="component-label">Secondary:</span>
                    <span class="component-value">${secondaryList}</span>
                </div>
            `;
            }
        }
        
        html += `
            <div class="component-item">
                <span class="component-label">Also needs:</span>
                <span class="component-value">5 gp rare herbs (from herbalism kit)</span>
            </div>
        `;
        
        return html;
    },

    /**
     * Close modal
     */
    closeModal() {
        const modal = document.getElementById('modal-overlay');
        modal.classList.remove('active');
        document.body.style.overflow = '';
    },

    /**
     * Switch between tabs
     */
    switchTab(tabName) {
        this.currentTab = tabName;
        
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabName);
        });
        
        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.toggle('active', content.id === `${tabName}-tab`);
        });
    },

    /**
     * Render ingredients section
     */
    renderIngredients() {
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
    },

    /**
     * Create flora ingredients section
     */
    createFloraSection() {
        const terrains = this.ingredients.terrains;
        const common = this.ingredients.flora.common;
        const rare = this.ingredients.flora.rare;

        const terrainTabs = terrains.map(t => `
            <button class="terrain-tab${t === this.selectedTerrain ? ' active' : ''}" 
                    data-terrain="${t}">${t}</button>
        `).join('');

        const commonRows = common.map(item => `
            <tr>
                <td class="ingredient-name">${item.name}</td>
                <td class="ingredient-dc">${item.dc}</td>
                <td>${item.terrain}</td>
                <td>${item.use}</td>
            </tr>
        `).join('');

        const rareFlora = rare[this.selectedTerrain] || [];
        const rareRows = rareFlora.map(item => `
            <tr>
                <td class="ingredient-name">${item.name}</td>
                <td class="ingredient-dc">DC ${item.dc}</td>
                <td>${item.use}</td>
            </tr>
        `).join('');

        return `
            <div class="ingredient-group">
                <div class="ingredient-group-header">
                    <h3 class="ingredient-group-title">
                        <span class="ingredient-group-icon">🌿</span>
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
    },

    /**
     * Create creature parts section
     */
    createCreaturePartsSection() {
        const creatureParts = this.ingredients.creatureParts;
        
        let tablesHtml = '';
        
        for (const [creatureType, parts] of Object.entries(creatureParts)) {
            if (creatureType === 'All creatures') continue;
            
            const rows = parts.map(item => `
                <tr>
                    <td class="ingredient-name">${item.name}</td>
                    <td class="ingredient-dc">${typeof item.dc === 'number' ? 'DC ' + item.dc : item.dc}</td>
                    <td>${item.use}</td>
                </tr>
            `).join('');

            tablesHtml += `
                <details class="creature-type-details">
                    <summary>${creatureType}</summary>
                    <table class="ingredient-table">
                        <thead>
                            <tr>
                                <th>Component</th>
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

        return `
            <div class="ingredient-group">
                <div class="ingredient-group-header">
                    <h3 class="ingredient-group-title">
                        <span class="ingredient-group-icon">🦴</span>
                        Creature Parts (Harvesting)
                    </h3>
                </div>
                <div style="padding: var(--space-md);">
                    <p style="font-size: 0.9rem; color: var(--ink-faded); margin-bottom: var(--space-md);">
                        <strong>Harvesting:</strong> Requires a harvesting kit. Takes 5+ minutes. 
                        DC X/+5 means DC X for first unit, +5 per additional.
                    </p>
                    ${tablesHtml}
                </div>
            </div>
        `;
    },

    /**
     * Select a terrain for rare flora display
     */
    selectTerrain(terrain) {
        this.selectedTerrain = terrain;
        
        // Update active tab
        document.querySelectorAll('.terrain-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.terrain === terrain);
        });
        
        // Update rare flora table
        const rareFlora = this.ingredients.flora.rare[terrain] || [];
        const rareRows = rareFlora.map(item => `
            <tr>
                <td class="ingredient-name">${item.name}</td>
                <td class="ingredient-dc">DC ${item.dc}</td>
                <td>${item.use}</td>
            </tr>
        `).join('');

        const tbody = document.getElementById('rare-flora-body');
        if (tbody) {
            tbody.innerHTML = rareRows.length > 0 
                ? rareRows 
                : '<tr><td colspan="3">No rare flora in this terrain</td></tr>';
        }

        // Update the header to show current terrain
        const tables = document.querySelectorAll('.ingredient-table thead th');
        tables.forEach(th => {
            if (th.textContent.includes('Rare Flora')) {
                th.textContent = `Rare Flora (${terrain})`;
            }
        });
    },

    /**
     * Render quick rules reference
     */
    renderQuickRules() {
        const rulesContent = document.getElementById('rules-content');
        
        if (!this.rules) {
            rulesContent.innerHTML = '<p>Rules data not available.</p>';
            return;
        }

        const difficultyRows = this.rules.difficultyScale.map(d => `
            <tr>
                <td>${this.getStars(d.stars)}</td>
                <td>${d.label}</td>
                <td>DC ${d.dc}</td>
            </tr>
        `).join('');

        rulesContent.innerHTML = `
            <div class="rules-grid">
                <div class="rules-card">
                    <h4>Making a Medicine</h4>
                    <ul>
                        <li><strong>Time:</strong> ${this.rules.crafting.time}</li>
                        <li><strong>Tool:</strong> ${this.rules.crafting.tool}</li>
                        <li><strong>Rest:</strong> ${this.rules.crafting.restCompatible}</li>
                        <li><strong>On failure:</strong> ${this.rules.crafting.failure}</li>
                    </ul>
                </div>
                
                <div class="rules-card">
                    <h4>Gathering Plants</h4>
                    <ul>
                        <li><strong>Time:</strong> ${this.rules.gathering.time}</li>
                        <li><strong>Check:</strong> Intelligence (Nature)</li>
                        <li><strong>Advantage:</strong> ${this.rules.gathering.advantage}</li>
                        <li><strong>Spoilage:</strong> 8 hours without kit storage</li>
                    </ul>
                </div>
                
                <div class="rules-card">
                    <h4>Difficulty Scale</h4>
                    <table class="ingredient-table" style="font-size: 0.85rem;">
                        <tbody>
                            ${difficultyRows}
                        </tbody>
                    </table>
                </div>
                
                <div class="rules-card">
                    <h4>Enhancing Agents</h4>
                    <ul>
                        ${this.rules.enhancingAgents.map(agent => `
                            <li><strong>${agent.name}:</strong> ${agent.effect} (${agent.dcIncrease})</li>
                        `).join('')}
                    </ul>
                </div>
            </div>
            
            <h3>Important Gotchas</h3>
            <ul>
                ${this.rules.crafting.gotchas.map(g => `<li>${g}</li>`).join('')}
            </ul>
        `;
    },

    /**
     * Show error message
     */
    showError(message) {
        const grid = document.getElementById('medicine-grid');
        grid.innerHTML = `
            <div class="no-results">
                <div class="no-results-icon">⚠️</div>
                <p>${message}</p>
            </div>
        `;
    },

    // ============================================
    // Markdown Loading and Rendering
    // ============================================

    /**
     * Fetch and parse a markdown file
     */
    async fetchMarkdown(path) {
        try {
            const response = await fetch(path);
            if (!response.ok) {
                throw new Error(`Failed to fetch ${path}`);
            }
            const markdown = await response.text();
            return marked.parse(markdown);
        } catch (error) {
            console.error('Error loading markdown:', error);
            return `<p class="error-message">Failed to load content.</p>`;
        }
    },

    /**
     * Load all backstory content (worksheet, overview, chapters, vignettes, npcs)
     */
    async loadBackstoryContent() {
        await Promise.all([
            this.loadWorksheet(),
            this.loadBackstoryOverview(),
            this.loadChapters(),
            this.loadVignettes(),
            this.loadNPCs()
        ]);
    },

    /**
     * Load the character worksheet (At a Glance tab)
     */
    async loadWorksheet() {
        const container = document.getElementById('character-worksheet');
        if (!container) return;

        container.innerHTML = '<div class="loading-spinner">Loading...</div>';

        const html = await this.fetchMarkdown('content/character/worksheet.md');
        this.worksheetContent = html;
        container.innerHTML = html;
    },

    /**
     * Load the backstory overview (consolidated.md)
     */
    async loadBackstoryOverview() {
        const container = document.getElementById('backstory-overview');
        if (!container) return;

        container.innerHTML = '<div class="loading-spinner">Loading backstory...</div>';

        const html = await this.fetchMarkdown('content/backstory/consolidated.md');
        this.backstoryContent = html;
        container.innerHTML = html;
    },

    /**
     * Load and parse the NPCs roster
     */
    async loadNPCs() {
        const container = document.getElementById('npcs-grid');
        if (!container) return;

        container.innerHTML = '<div class="loading-spinner">Loading NPCs...</div>';

        try {
            const response = await fetch('content/npcs/roster.md');
            const markdown = await response.text();
            this.npcs = this.parseNPCs(markdown);
            this.renderNPCs();
        } catch (error) {
            console.error('Failed to load NPCs:', error);
            container.innerHTML = '<p>Failed to load NPCs.</p>';
        }
    },

    /**
     * Parse NPC markdown into structured data
     */
    parseNPCs(markdown) {
        const npcs = [];
        // Split by H2 headers (## Name)
        const sections = markdown.split(/^## /m).slice(1);
        
        for (const section of sections) {
            const lines = section.trim().split('\n');
            const name = lines[0].trim();
            
            // Skip the intro section and group headers
            if (name.startsWith('NPC Roster') || name.startsWith('Smith\'s Coster representatives') || name.startsWith('The Medica')) {
                continue;
            }
            
            // Find role and vibe from the content
            const content = lines.slice(1).join('\n');
            
            // Extract role
            const roleMatch = content.match(/\*\*Role\*\*:?\s*([^\n]+)/i);
            const role = roleMatch ? roleMatch[1].trim() : '';
            
            // Extract vibe
            const vibeMatch = content.match(/\*\*Vibe\*\*:?\s*([^\n]+)/i);
            const vibe = vibeMatch ? vibeMatch[1].trim() : '';
            
            // Determine type based on content or section
            let type = 'contact';
            const lowerContent = content.toLowerCase();
            if (name.includes('Antagonist') || lowerContent.includes('antagonist')) {
                type = 'antagonist';
            } else if (name.includes('Ally') || lowerContent.includes('ally')) {
                type = 'ally';
            } else if (name.includes('Complicated') || lowerContent.includes('complicated tie')) {
                type = 'complicated';
            }
            
            // Parse the full content as HTML
            const fullHtml = marked.parse('## ' + section);
            
            npcs.push({
                name: name.replace(/\(.*?\)/g, '').trim(),
                role,
                vibe,
                type,
                content: fullHtml
            });
        }
        
        return npcs;
    },

    /**
     * Render NPC cards
     */
    renderNPCs() {
        const container = document.getElementById('npcs-grid');
        if (!container) return;

        if (this.npcs.length === 0) {
            container.innerHTML = '<p>No NPCs found.</p>';
            return;
        }

        container.innerHTML = this.npcs.map((npc, index) => `
            <div class="npc-card ${npc.type}" data-npc-index="${index}">
                <div class="npc-card-header">
                    <h3 class="npc-card-name">${npc.name}</h3>
                    <p class="npc-card-role">${npc.role}</p>
                    <span class="npc-card-type">${npc.type}</span>
                </div>
                ${npc.vibe ? `<p class="npc-card-vibe">"${npc.vibe}"</p>` : ''}
            </div>
        `).join('');

        // Bind click events
        container.querySelectorAll('.npc-card').forEach(card => {
            card.addEventListener('click', () => {
                const index = parseInt(card.dataset.npcIndex);
                this.openNPCModal(this.npcs[index]);
            });
        });
    },

    /**
     * Open NPC detail modal
     */
    openNPCModal(npc) {
        const overlay = document.getElementById('npc-modal-overlay');
        const content = document.getElementById('npc-modal-content');
        
        if (overlay && content) {
            content.innerHTML = `
                <div class="narrative-container">
                    ${npc.content}
                </div>
            `;
            overlay.classList.add('active');
        }
    },

    /**
     * Close NPC modal
     */
    closeNPCModal() {
        const overlay = document.getElementById('npc-modal-overlay');
        if (overlay) {
            overlay.classList.remove('active');
        }
    },

    /**
     * Load all chapter files into the accordion
     */
    async loadChapters() {
        const container = document.getElementById('chapters-accordion');
        if (!container) return;

        container.innerHTML = '<div class="loading-spinner">Loading chapters...</div>';

        // Chapter file mappings
        const chapterFiles = [
            { file: 'Meilin Starwell - Stage 00 - Cassian Leaves.md', number: '00', title: 'Cassian Leaves' },
            { file: 'Meilin Starwell - Stage 01 - Dock-born.md', number: '01', title: 'Dock-born' },
            { file: 'Meilin Starwell - Stage 02 - Apprenticeship.md', number: '02', title: 'Apprenticeship' },
            { file: 'Meilin Starwell - Stage 03 - Near-death.md', number: '03', title: 'Near-death' },
            { file: 'Meilin Starwell - Stage 04 - Pattern-hunter.md', number: '04', title: 'Pattern-hunter' },
            { file: 'Meilin Starwell - Stage 05 - Meredin.md', number: '05', title: 'Meredin' },
            { file: 'Meilin Starwell - Stage 06 - Shipboard Scare.md', number: '06', title: 'Shipboard Scare' },
            { file: 'Meilin Starwell - Stage 07 - Sera Trail.md', number: '07', title: 'Sera Trail' },
            { file: 'Meilin Starwell - Stage 08 - Smith\'s Coster.md', number: '08', title: 'Smith\'s Coster' },
            { file: 'Meilin Starwell - Stage 09 - Ledger Page.md', number: '09', title: 'Ledger Page' },
            { file: 'Meilin Starwell - Stage 10 - Exit Strategy.md', number: '10', title: 'Exit Strategy' },
            { file: 'Meilin Starwell - Stage 11 - Astral Bazaar.md', number: '11', title: 'Astral Bazaar' }
        ];

        // Load all chapters
        const chapterPromises = chapterFiles.map(async (chapter) => {
            const html = await this.fetchMarkdown(`content/backstory/stages/${chapter.file}`);
            return {
                ...chapter,
                content: html
            };
        });

        this.chapters = await Promise.all(chapterPromises);
        this.renderChapters();
    },

    /**
     * Render chapters accordion
     */
    renderChapters() {
        const container = document.getElementById('chapters-accordion');
        if (!container) return;

        container.innerHTML = this.chapters.map((chapter, index) => `
            <div class="chapter-item" data-chapter="${index}">
                <button class="chapter-header">
                    <span class="chapter-number">${chapter.number}</span>
                    <span class="chapter-title">${chapter.title}</span>
                    <span class="chapter-toggle">▼</span>
                </button>
                <div class="chapter-content narrative-container">
                    ${chapter.content}
                </div>
            </div>
        `).join('');

        // Add click handlers for accordion
        container.querySelectorAll('.chapter-header').forEach(header => {
            header.addEventListener('click', () => {
                const item = header.closest('.chapter-item');
                item.classList.toggle('expanded');
            });
        });
    },

    /**
     * Load all vignette files
     */
    async loadVignettes() {
        const container = document.getElementById('vignettes-grid');
        if (!container) return;

        container.innerHTML = '<div class="loading-spinner">Loading vignettes...</div>';

        // Vignette file mappings
        const vignetteFiles = [
            { file: 'Meilin Starwell - Vignette 00 - First bolt.md', number: '01', title: 'First Bolt' },
            { file: 'Meilin Starwell - Vignette 01 - Vex lesson.md', number: '02', title: 'Vex Lesson' },
            { file: 'Meilin Starwell - Vignette 02 - Cant notes.md', number: '03', title: 'Cant Notes' },
            { file: 'Meilin Starwell - Vignette 03 - Theo Lockwell, quiet preparation.md', number: '04', title: 'Theo Lockwell' },
            { file: 'Meilin Starwell - Vignette 04 - The tell, the pause.md', number: '05', title: 'The Tell, the Pause' },
            { file: 'Meilin Starwell - Vignette 05 - A polite lie in Undercommon.md', number: '06', title: 'A Polite Lie in Undercommon' },
            { file: 'Meilin Starwell - Vignette 06 - Persuasion is triage.md', number: '07', title: 'Persuasion is Triage' },
            { file: 'Meilin Starwell - Vignette 07 - Quiet feet, open eyes.md', number: '08', title: 'Quiet Feet, Open Eyes' },
            { file: 'Meilin Starwell - Vignette 08 - Fingers, coin, and shame.md', number: '09', title: 'Fingers, Coin, and Shame' },
            { file: 'Meilin Starwell - Vignette 09 - The Case Ledger.md', number: '10', title: 'The Case Ledger' },
            { file: 'Meilin Starwell - Vignette 10 - The window with three seals.md', number: '11', title: 'The Window with Three Seals' }
        ];

        // Load all vignettes
        const vignettePromises = vignetteFiles.map(async (vignette) => {
            const html = await this.fetchMarkdown(`content/vignettes/${vignette.file}`);
            // Extract first paragraph as preview
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = html;
            const firstP = tempDiv.querySelector('p');
            const preview = firstP ? firstP.textContent.substring(0, 150) + '...' : '';
            
            return {
                ...vignette,
                content: html,
                preview: preview
            };
        });

        this.vignettes = await Promise.all(vignettePromises);
        this.renderVignettes();
    },

    /**
     * Render vignettes grid
     */
    renderVignettes() {
        const container = document.getElementById('vignettes-grid');
        if (!container) return;

        container.innerHTML = this.vignettes.map((vignette, index) => `
            <div class="vignette-card" data-vignette="${index}">
                <div class="vignette-number">Vignette ${vignette.number}</div>
                <h3 class="vignette-title">${vignette.title}</h3>
                <p class="vignette-preview">${vignette.preview}</p>
                <span class="vignette-read-more">Read more →</span>
            </div>
        `).join('');

        // Add click handlers for vignette cards
        container.querySelectorAll('.vignette-card').forEach(card => {
            card.addEventListener('click', () => {
                const index = parseInt(card.dataset.vignette);
                this.openVignetteModal(this.vignettes[index]);
            });
        });
    },

    /**
     * Open vignette modal with full content
     */
    openVignetteModal(vignette) {
        const overlay = document.getElementById('vignette-modal-overlay');
        const content = document.getElementById('vignette-modal-content');
        
        if (!overlay || !content) return;

        content.innerHTML = `
            <div class="narrative-container">
                <div class="vignette-number">Vignette ${vignette.number}</div>
                <h2 class="vignette-modal-title">${vignette.title}</h2>
                ${vignette.content}
            </div>
        `;

        overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    },

    /**
     * Close vignette modal
     */
    closeVignetteModal() {
        const overlay = document.getElementById('vignette-modal-overlay');
        if (overlay) {
            overlay.classList.remove('active');
            document.body.style.overflow = '';
        }
    }
};

// Additional CSS for creature parts details
const additionalStyles = document.createElement('style');
additionalStyles.textContent = `
    .creature-type-details {
        border: 1px solid var(--parchment-dark);
        border-radius: var(--radius-sm);
        margin-bottom: var(--space-sm);
        background: var(--parchment);
    }
    
    .creature-type-details summary {
        padding: var(--space-sm) var(--space-md);
        font-family: var(--font-heading);
        font-weight: 600;
        color: var(--herb-green-dark);
        cursor: pointer;
        list-style: none;
    }
    
    .creature-type-details summary::-webkit-details-marker {
        display: none;
    }
    
    .creature-type-details summary::before {
        content: '▸ ';
        transition: transform 0.2s ease;
        display: inline-block;
    }
    
    .creature-type-details[open] summary::before {
        transform: rotate(90deg);
    }
    
    .creature-type-details summary:hover {
        background: var(--parchment-light);
    }
    
    .creature-type-details .ingredient-table {
        margin: 0;
    }
`;
document.head.appendChild(additionalStyles);

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
