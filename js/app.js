/**
 * Meilin's Apothecary - Main Application
 * Herbal Medicine Quick Reference for the Alchemy Almanac system
 */

const App = {
    // Data storage
    medicines: [],
    ingredients: null,
    rules: null,
    
    // At a Glance data (top-level page)
    ataglanceData: null,
    
    // Backstory data
    worksheetContent: null,
    backgroundContent: null,
    backstoryContent: null,
    vignettes: [],
    npcs: [],
    knives: [],
    relationships: null,
    mindersandData: null,
    
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
    currentPage: null, // Will be set after passkey check
    currentSubtab: 'background',
    appUnlocked: false,
    pendingPage: 'ataglance', // Page to navigate to after unlock

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
            
            // Check if unlocked, show passkey modal if not
            if (!this.appUnlocked) {
                this.pendingPage = 'ataglance';
                this.showPasskeyModal();
            } else {
                // Handle initial page based on URL hash
                this.handleHashChange();
            }
            
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
        this.appUnlocked = stored === 'true';
    },
    
    
    /**
     * Bind passkey modal events
     */
    bindPasskeyEvents() {
        const form = document.getElementById('passkey-form');
        const input = document.getElementById('passkey-input');
        
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.checkPasskey();
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
            this.appUnlocked = true;
            localStorage.setItem(this.STORAGE_KEY, 'true');
            this.closePasskeyModal();
            this.switchPage(this.pendingPage || 'medicine');
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

        // DM Tools tab navigation
        document.querySelectorAll('.dmtools-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                const tabName = tab.dataset.dmtab;
                this.switchDMToolsTab(tabName);
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

        // Knife modal close
        const knifeOverlay = document.getElementById('knife-modal-overlay');
        if (knifeOverlay) {
            knifeOverlay.addEventListener('click', (e) => {
                if (e.target.id === 'knife-modal-overlay') {
                    this.closeKnifeModal();
                }
            });
        }

        const knifeClose = document.getElementById('knife-modal-close');
        if (knifeClose) {
            knifeClose.addEventListener('click', () => {
                this.closeKnifeModal();
            });
        }

        // Background modal close
        const backgroundOverlay = document.getElementById('background-modal-overlay');
        if (backgroundOverlay) {
            backgroundOverlay.addEventListener('click', (e) => {
                if (e.target.id === 'background-modal-overlay') {
                    this.closeBackgroundModal();
                }
            });
        }

        const backgroundClose = document.getElementById('background-modal-close');
        if (backgroundClose) {
            backgroundClose.addEventListener('click', () => {
                this.closeBackgroundModal();
            });
        }

        // Show background action (from At a Glance page)
        document.querySelectorAll('[data-action="show-background"]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                this.showBackgroundModal();
            });
        });

        // Handle browser back/forward
        window.addEventListener('hashchange', () => {
            this.handleHashChange();
        });
    },

    /**
     * Handle URL hash changes for navigation
     */
    handleHashChange() {
        const hash = window.location.hash.slice(1) || 'ataglance';
        if (hash === 'ataglance' || hash === 'medicine' || hash === 'backstory' || hash === 'dmtools') {
            this.switchPage(hash, false);
        }
    },

    /**
     * Switch between main pages
     */
    switchPage(pageName, updateHash = true) {
        // Check if app is unlocked
        if (!this.appUnlocked) {
            this.pendingPage = pageName;
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

        // Load At a Glance content if switching to that page
        if (pageName === 'ataglance' && !this.ataglanceData) {
            this.loadAtAGlance();
        }
        
        // Load backstory content if switching to backstory page
        if (pageName === 'backstory' && !this.backstoryContent) {
            this.loadBackstoryContent();
        }
        
        // Load DM Tools content if switching to that page
        if (pageName === 'dmtools' && !this.relationships) {
            this.loadDMToolsContent();
        }
    },

    /**
     * Scroll to a specific section on the current page
     */
    scrollToSection(sectionId) {
        const section = document.getElementById(sectionId);
        if (section) {
            section.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    },

    /**
     * Switch between DM Tools tabs
     */
    switchDMToolsTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.dmtools-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.dmtab === tabName);
        });

        // Update tab panels
        document.querySelectorAll('.dmtools-panel').forEach(panel => {
            panel.classList.toggle('active', panel.id === `${tabName}-panel`);
        });
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
                    <div class="no-results-icon"><i class="fa-solid fa-leaf"></i></div>
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
                ${hasFlora ? `<span class="medicine-flora-badge" title="${floraBadgeTitle}"><i class="fa-solid fa-seedling"></i></span>` : ''}
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
                    ${this.hasFloraOption(medicine) ? `<span class="medicine-flora-badge" title="${medicine.floraOnly ? 'Flora only' : 'Has flora option'}"><i class="fa-solid fa-seedling"></i> ${medicine.floraOnly ? 'Flora Only' : 'Flora Option'}</span>` : ''}
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
                            <span class="component-label">Secondary <span class="component-type flora"><i class="fa-solid fa-seedling"></i> Flora</span>:</span>
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
                        <span class="ingredient-group-icon"><i class="fa-solid fa-leaf"></i></span>
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
                <div class="no-results-icon"><i class="fa-solid fa-triangle-exclamation"></i></div>
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
     * Load At a Glance page data
     */
    async loadAtAGlance() {
        try {
            const response = await fetch('content/character/ataglance.json');
            if (!response.ok) {
                throw new Error('Failed to fetch At a Glance data');
            }
            this.ataglanceData = await response.json();
            this.renderAtAGlance();
        } catch (error) {
            console.error('Error loading At a Glance:', error);
        }
    },

    /**
     * Render the At a Glance page
     */
    renderAtAGlance() {
        const data = this.ataglanceData;
        if (!data) return;

        // Hero section
        const tagline = `${data.background} | ${data.class} | ${data.species}`;
        document.getElementById('aag-tagline').textContent = tagline;
        document.getElementById('aag-quote').textContent = data.quote;

        // Core Concept
        document.getElementById('aag-thesis').textContent = data.coreConcept.thesis;
        document.querySelector('#aag-trouble .aag-detail-text').textContent = data.coreConcept.trouble;
        document.querySelector('#aag-defining .aag-detail-text').textContent = data.coreConcept.definingDetail;

        // Summary
        document.getElementById('aag-summary').textContent = data.summary;

        // Drives card
        const drivesContainer = document.getElementById('aag-drives-list');
        drivesContainer.innerHTML = `
            <li><span class="item-label">Want:</span><span class="item-value">${data.drives.want}</span></li>
            <li><span class="item-label">Need:</span><span class="item-value">${data.drives.need}</span></li>
            <li><span class="item-label">Fear:</span><span class="item-value">${data.drives.fear}</span></li>
            <li><span class="item-label">Temptation:</span><span class="item-value">${data.drives.temptation}</span></li>
            <li><span class="item-label">Duty:</span><span class="item-value">${data.drives.responsibility}</span></li>
        `;

        // Boundaries card
        const boundariesContainer = document.getElementById('aag-boundaries-list');
        boundariesContainer.innerHTML = `
            <li><span class="item-label">Hard Line:</span><span class="item-value">${data.boundaries.hardLine}</span></li>
            <li><span class="item-label">Gray Area:</span><span class="item-value">${data.boundaries.grayArea}</span></li>
            <li><span class="item-label">Earns Trust:</span><span class="item-value">${data.boundaries.earnsTrust}</span></li>
            <li><span class="item-label">Breaks Trust:</span><span class="item-value">${data.boundaries.breaksTrust}</span></li>
            <li><span class="item-label">Instant Anger:</span><span class="item-value">${data.boundaries.instantAnger}</span></li>
            <li><span class="item-label">Melts Guard:</span><span class="item-value">${data.boundaries.meltsGuard}</span></li>
        `;

        // Party Glue card
        const glueContainer = document.getElementById('aag-glue-list');
        glueContainer.innerHTML = `
            <li><span class="item-label">I Need:</span><span class="item-value">${data.partyGlue.whyINeed}</span></li>
            <li><span class="item-label">I Offer:</span><span class="item-value">${data.partyGlue.howIHelp}</span></li>
            <li><span class="item-label">My Role:</span><span class="item-value">${data.partyGlue.myRole}</span></li>
            <li><span class="item-label">Fear:</span><span class="item-value">${data.partyGlue.secretFear}</span></li>
        `;

        // Secrets section
        const secretsContainer = document.getElementById('aag-secrets-grid');
        secretsContainer.innerHTML = `
            <div class="aag-secret-card">
                <div class="aag-secret-label">Keeping Hidden</div>
                <div class="aag-secret-text">${data.secrets.keeping}</div>
            </div>
            <div class="aag-secret-card">
                <div class="aag-secret-label">Mystery</div>
                <div class="aag-secret-text">${data.secrets.mystery}</div>
            </div>
            <div class="aag-secret-card">
                <div class="aag-secret-label">Last Voyage</div>
                <div class="aag-secret-text">${data.secrets.lastVoyage}</div>
            </div>
        `;

        // Update quick link counts
        document.getElementById('aag-knives-count').textContent = `${data.quickStats.knivesCount} hooks for the DM`;
        document.getElementById('aag-relationships-count').textContent = `${data.quickStats.relationshipsCount} connections`;
        document.getElementById('aag-chapters-count').textContent = `${data.quickStats.chaptersCount} chapters`;

        // Bind quick link navigation
        this.bindQuickLinkEvents();
    },

    /**
     * Bind events for quick link cards on At a Glance page
     */
    bindQuickLinkEvents() {
        document.querySelectorAll('.aag-link-card[data-navigate]').forEach(card => {
            card.addEventListener('click', (e) => {
                e.preventDefault();
                const targetPage = card.dataset.navigate;
                const targetSection = card.dataset.section;
                
                // Switch to the target page
                this.switchPage(targetPage);
                
                // If there's a section to scroll to, wait for content to load then scroll
                if (targetSection) {
                    setTimeout(() => {
                        this.scrollToSection(`${targetSection}-section`);
                    }, 100);
                }
            });
        });
    },

    /**
     * Load all backstory content (backstory, vignettes, npcs)
     */
    async loadBackstoryContent() {
        await Promise.all([
            this.loadEnhancedBackstory(),
            this.loadVignettes(),
            this.loadNPCs()
        ]);
    },

    /**
     * Load all DM Tools content (relationships, knives)
     */
    async loadDMToolsContent() {
        await Promise.all([
            this.loadRelationships(),
            this.loadKnives(),
            this.loadMindersand()
        ]);
    },

    /**
     * Load and show the custom background in a modal
     */
    async showBackgroundModal() {
        const overlay = document.getElementById('background-modal-overlay');
        const container = document.getElementById('background-modal-content');
        if (!overlay || !container) return;

        // Show modal with loading state
        overlay.classList.add('active');
        container.innerHTML = '<div class="loading-spinner">Loading background...</div>';

        // Load content if not cached
        if (!this.backgroundContent) {
            try {
                const response = await fetch('content/background/apothecary.md');
                const markdown = await response.text();
                this.backgroundContent = marked.parse(markdown);
            } catch (error) {
                console.error('Failed to load background:', error);
                container.innerHTML = '<p>Failed to load background.</p>';
                return;
            }
        }

        container.innerHTML = this.backgroundContent;
    },

    /**
     * Close the background modal
     */
    closeBackgroundModal() {
        const overlay = document.getElementById('background-modal-overlay');
        if (overlay) {
            overlay.classList.remove('active');
        }
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
     * Load the enhanced backstory with styled sections and chapter links
     */
    async loadEnhancedBackstory() {
        const container = document.getElementById('backstory-enhanced');
        if (!container) return;

        container.innerHTML = '<div class="loading-spinner">Loading backstory...</div>';

        try {
            const response = await fetch('content/backstory/backstory.md');
            const markdown = await response.text();
            this.backstoryContent = markdown;
            
            // Render enhanced version
            const enhancedHtml = this.renderEnhancedBackstory(markdown);
            container.innerHTML = enhancedHtml;
            
            // Bind chapter link events
            this.bindChapterLinkEvents();
        } catch (error) {
            console.error('Failed to load backstory:', error);
            container.innerHTML = '<p class="error-message">Failed to load backstory.</p>';
        }
    },

    /**
     * Render the backstory with styled sections and inline chapter links
     */
    renderEnhancedBackstory(markdown) {
        // Split into paragraphs (skip the title)
        const lines = markdown.split('\n\n');
        const title = lines[0].replace('# ', '');
        const paragraphs = lines.slice(1).filter(p => p.trim());
        
        // Define sections with their chapter mappings
        const sections = [
            {
                title: 'The Docks',
                icon: 'fa-solid fa-anchor',
                chapterIndex: 0,
                chapterNumber: '01',
                chapterTitle: 'Dock-born',
                paragraphs: [0, 1, 2], // "On the Rock of Bral...", quote, and learning messages
                pullQuote: '"People lie," he told her. "Bodies don\'t."'
            },
            {
                title: 'Cassian',
                icon: 'fa-solid fa-star',
                chapterIndex: 1,
                chapterNumber: '02',
                chapterTitle: 'Cassian Leaves',
                paragraphs: [3], // Cassian paragraph
                pullQuote: null
            },
            {
                title: 'Politics of Medicine',
                icon: 'fa-solid fa-scale-balanced',
                chapterIndex: 2,
                chapterNumber: '03',
                chapterTitle: 'Apprenticeship',
                paragraphs: [4, 5, 6], // Medicine is politics, apprenticeship
                pullQuote: '"Your cure comes with a leash."'
            },
            {
                title: 'Near Death',
                icon: 'fa-solid fa-skull',
                chapterIndex: 3,
                chapterNumber: '04',
                chapterTitle: 'Near-death',
                paragraphs: [7, 8, 9, 10, 11, 12], // Tea stall incident, discovery of mindersand
                pullQuote: null
            },
            {
                title: 'The Pattern-Hunter',
                icon: 'fa-solid fa-magnifying-glass',
                chapterIndex: 4,
                chapterNumber: '05',
                chapterTitle: 'Pattern-hunter',
                paragraphs: [13, 14, 15], // Building the web
                pullQuote: '"Maps lead places. Some places don\'t like visitors."'
            },
            {
                title: 'Meredin\'s Patronage',
                icon: 'fa-solid fa-handshake',
                chapterIndex: 5,
                chapterNumber: '06',
                chapterTitle: 'Meredin',
                paragraphs: [16, 17, 18], // Meredin enters
                pullQuote: '"Being useful is a kind of target."'
            },
            {
                title: 'The Drift-Sparrow',
                icon: 'fa-solid fa-ship',
                chapterIndex: 6,
                chapterNumber: '07',
                chapterTitle: 'Shipboard Scare',
                paragraphs: [19, 20, 21, 22, 23, 24], // Ship contract and discovery
                pullQuote: '"Mindersand."'
            },
            {
                title: 'Sera\'s Trail',
                icon: 'fa-solid fa-clipboard-list',
                chapterIndex: 7,
                chapterNumber: '08',
                chapterTitle: 'Sera Trail',
                paragraphs: [25, 26, 27, 28], // Sera Quill, tracing to Smith's Coster
                pullQuote: null
            },
            {
                title: 'Smith\'s Coster',
                icon: 'fa-solid fa-landmark',
                chapterIndex: 8,
                chapterNumber: '09',
                chapterTitle: 'Smith\'s Coster',
                paragraphs: [29, 30, 31, 32, 33], // Confrontation
                pullQuote: '"Paper burns."'
            },
            {
                title: 'The Ledger Page',
                icon: 'fa-solid fa-scroll',
                chapterIndex: 9,
                chapterNumber: '10',
                chapterTitle: 'Ledger Page',
                paragraphs: [34, 35, 36, 37, 38, 39, 40], // The heist
                pullQuote: '"MS-13: mindersand"'
            },
            {
                title: 'Exit Strategy',
                icon: 'fa-solid fa-door-open',
                chapterIndex: 10,
                chapterNumber: '11',
                chapterTitle: 'Exit Strategy',
                paragraphs: [41, 42, 43, 44, 45, 46, 47, 48], // Leaving Bral - ends with "And now that warning had a heartbeat."
                pullQuote: null
            },
            {
                title: 'The Astral Bazaar',
                icon: 'fa-solid fa-wand-sparkles',
                chapterIndex: 11,
                chapterNumber: '12',
                chapterTitle: 'Astral Bazaar',
                paragraphs: [49], // Current state - "In the Astral Bazaar..."
                pullQuote: '"Where anything can be bought, everything is leverage."'
            }
        ];

        let html = '';

        sections.forEach((section, idx) => {
            const sectionParagraphs = section.paragraphs
                .map(i => paragraphs[i])
                .filter(p => p !== undefined)
                .map(p => {
                    // Parse markdown for bold text
                    let parsed = p.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
                    // Parse italic text
                    parsed = parsed.replace(/\*([^*]+)\*/g, '<em>$1</em>');
                    return `<p>${parsed}</p>`;
                })
                .join('');

            if (sectionParagraphs.length === 0) return;

            const isEven = idx % 2 === 0;
            
            html += `
                <section class="backstory-section ${isEven ? 'even' : 'odd'}" data-chapter-index="${section.chapterIndex}">
                    <div class="backstory-section-header" role="button" tabindex="0">
                        <span class="backstory-section-icon"><i class="${section.icon}"></i></span>
                        <h2 class="backstory-section-title">${section.title}</h2>
                        <span class="chapter-badge">Chapter ${section.chapterNumber}</span>
                        <span class="expand-indicator">▼</span>
                    </div>
                    ${section.pullQuote ? `<blockquote class="backstory-quote">${section.pullQuote}</blockquote>` : ''}
                    <div class="backstory-section-content">
                        ${sectionParagraphs}
                    </div>
                    <div class="chapter-content-expanded" data-chapter="${section.chapterIndex}">
                        <div class="chapter-loading">Loading chapter...</div>
                    </div>
                </section>
            `;
        });

        // Add closing flourish
        html += `
            <div class="backstory-epilogue">
                <div class="backstory-separator">✦ ✦ ✦</div>
                <p class="backstory-end-note">
                    And now that warning had a heartbeat.
                </p>
            </div>
        `;

        return html;
    },

    /**
     * Bind click events for section headers to expand/collapse chapters
     */
    bindChapterLinkEvents() {
        document.querySelectorAll('.backstory-section-header').forEach(header => {
            header.addEventListener('click', () => {
                const section = header.closest('.backstory-section');
                this.toggleChapterExpansion(section);
            });
            
            // Keyboard accessibility
            header.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    const section = header.closest('.backstory-section');
                    this.toggleChapterExpansion(section);
                }
            });
        });
    },

    /**
     * Toggle the expansion of a chapter section
     */
    async toggleChapterExpansion(section) {
        const isExpanded = section.classList.contains('expanded');
        const chapterIndex = parseInt(section.dataset.chapterIndex);
        const contentContainer = section.querySelector('.chapter-content-expanded');
        
        // Collapse if already expanded
        if (isExpanded) {
            section.classList.remove('expanded');
            return;
        }
        
        // Collapse any other expanded sections
        document.querySelectorAll('.backstory-section.expanded').forEach(s => {
            s.classList.remove('expanded');
        });
        
        // Expand this section
        section.classList.add('expanded');
        
        // Load chapter content if not already loaded
        if (!contentContainer.dataset.loaded) {
            await this.loadChapterContent(chapterIndex, contentContainer);
        }
        
        // Scroll the section into view with some offset
        setTimeout(() => {
            section.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    },

    /**
     * Load chapter content into the expanded container
     */
    async loadChapterContent(chapterIndex, container) {
        const chapterFiles = [
            { file: 'Meilin Starwell - Stage 01 - Dock-born.md', title: 'Dock-born' },
            { file: 'Meilin Starwell - Stage 02 - Cassian Leaves.md', title: 'Cassian Leaves' },
            { file: 'Meilin Starwell - Stage 03 - Apprenticeship.md', title: 'Apprenticeship' },
            { file: 'Meilin Starwell - Stage 04 - Near-death.md', title: 'Near-death' },
            { file: 'Meilin Starwell - Stage 05 - Pattern-hunter.md', title: 'Pattern-hunter' },
            { file: 'Meilin Starwell - Stage 06 - Meredin.md', title: 'Meredin' },
            { file: 'Meilin Starwell - Stage 07 - Shipboard Scare.md', title: 'Shipboard Scare' },
            { file: 'Meilin Starwell - Stage 08 - Sera Trail.md', title: 'Sera Trail' },
            { file: 'Meilin Starwell - Stage 09 - Smith\'s Coster.md', title: 'Smith\'s Coster' },
            { file: 'Meilin Starwell - Stage 10 - Ledger Page.md', title: 'Ledger Page' },
            { file: 'Meilin Starwell - Stage 11 - Exit Strategy.md', title: 'Exit Strategy' },
            { file: 'Meilin Starwell - Stage 12 - Astral Bazaar.md', title: 'Astral Bazaar' }
        ];

        const chapter = chapterFiles[chapterIndex];
        if (!chapter) {
            container.innerHTML = '<p class="error">Chapter not found.</p>';
            return;
        }

        try {
            const html = await this.fetchMarkdown(`content/backstory/stages/${chapter.file}`);
            container.innerHTML = `
                <div class="chapter-full-content">
                    <div class="chapter-divider">
                        <span class="chapter-divider-text">Full Chapter</span>
                    </div>
                    ${html}
                </div>
            `;
            container.dataset.loaded = 'true';
        } catch (error) {
            container.innerHTML = '<p class="error">Failed to load chapter content.</p>';
        }
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
            
            // Determine type: ally, complicated, or antagonist
            let type = 'complicated'; // default for most NPCs
            const lowerName = name.toLowerCase();
            // Allies: Oona and Meredin (active supporters)
            if (lowerName.includes('oona') || lowerName.includes('meredin')) {
                type = 'ally';
            }
            // Antagonist: Elowen Pryce (Smith's Coster)
            if (lowerName.includes('elowen') || lowerName.includes('pryce')) {
                type = 'antagonist';
            }
            // Complicated: Kaito, Cassian, Sera, Bram (family, witnesses, insiders)
            
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

    // ============================================
    // Knives (DM Tools)
    // ============================================

    /**
     * Load knives data
     */
    async loadKnives() {
        const container = document.getElementById('knives-grid');
        if (!container) return;

        container.innerHTML = '<div class="loading-spinner">Loading knives...</div>';

        try {
            const response = await fetch('content/dm/knives.json');
            this.knives = await response.json();
            this.renderKnives();
        } catch (error) {
            console.error('Failed to load knives:', error);
            container.innerHTML = '<p>Failed to load knives.</p>';
        }
    },

    /**
     * Render knife cards
     */
    renderKnives() {
        const container = document.getElementById('knives-grid');
        if (!container) return;

        if (this.knives.length === 0) {
            container.innerHTML = '<p>No knives found.</p>';
            return;
        }

        container.innerHTML = this.knives.map((knife, index) => `
            <div class="knife-card ${knife.type}" data-knife-index="${index}">
                <div class="knife-card-header">
                    <span class="knife-card-icon"><i class="${knife.icon}"></i></span>
                    <h3 class="knife-card-name">${knife.name}</h3>
                </div>
                <span class="knife-card-type">${knife.type}</span>
                <p class="knife-card-summary">${knife.summary}</p>
            </div>
        `).join('');

        // Bind click events
        container.querySelectorAll('.knife-card').forEach(card => {
            card.addEventListener('click', () => {
                const index = parseInt(card.dataset.knifeIndex);
                this.openKnifeModal(this.knives[index]);
            });
        });
    },

    /**
     * Open knife detail modal
     */
    openKnifeModal(knife) {
        const overlay = document.getElementById('knife-modal-overlay');
        const content = document.getElementById('knife-modal-content');
        
        if (overlay && content) {
            content.innerHTML = `
                <div class="knife-detail-header">
                    <span class="knife-detail-icon"><i class="${knife.icon}"></i></span>
                    <h2 class="knife-detail-title">${knife.name}</h2>
                </div>
                <div class="knife-detail-section">
                    <h4>What It Is</h4>
                    <p>${knife.details}</p>
                </div>
                <div class="knife-detail-section">
                    <h4>When to Pull It</h4>
                    <p>${knife.trigger}</p>
                </div>
                <div class="knife-detail-section">
                    <h4>Escalation</h4>
                    <p>${knife.escalation}</p>
                </div>
            `;
            overlay.classList.add('active');
        }
    },

    /**
     * Close knife modal
     */
    closeKnifeModal() {
        const overlay = document.getElementById('knife-modal-overlay');
        if (overlay) {
            overlay.classList.remove('active');
        }
    },

    // ============================================
    // Mindersand Reference
    // ============================================

    /**
     * Load mindersand data
     */
    async loadMindersand() {
        const container = document.getElementById('mindersand-content');
        if (!container) return;

        container.innerHTML = '<div class="loading-spinner">Loading mindersand data...</div>';

        try {
            const response = await fetch('content/dm/mindersand.json');
            this.mindersandData = await response.json();
            this.renderMindersand();
        } catch (error) {
            console.error('Failed to load mindersand data:', error);
            container.innerHTML = '<p>Failed to load mindersand reference.</p>';
        }
    },

    /**
     * Render mindersand reference content
     */
    renderMindersand() {
        const container = document.getElementById('mindersand-content');
        if (!container || !this.mindersandData) return;

        const data = this.mindersandData;

        container.innerHTML = `
            <!-- Header Card -->
            <div class="mindersand-header">
                <div class="mindersand-title-row">
                    <span class="mindersand-icon"><i class="${data.icon}"></i></span>
                    <div>
                        <h3 class="mindersand-name">${data.name}</h3>
                        <span class="mindersand-pronunciation">/${data.pronunciation}/</span>
                    </div>
                </div>
                <p class="mindersand-tagline">${data.tagline}</p>
                <p class="mindersand-overview">${data.overview}</p>
            </div>

            <!-- Appearance & Detection -->
            <div class="mindersand-card">
                <h4 class="mindersand-card-title"><i class="fa-solid fa-eye"></i> Identification</h4>
                <div class="mindersand-appearance">
                    <div class="mindersand-detail">
                        <span class="mindersand-label">Color:</span>
                        <span>${data.appearance.color}</span>
                    </div>
                    <div class="mindersand-detail">
                        <span class="mindersand-label">Texture:</span>
                        <span>${data.appearance.texture}</span>
                    </div>
                    <div class="mindersand-tell">
                        <span class="mindersand-label">The Tell:</span>
                        <span class="mindersand-tell-text">${data.appearance.tell}</span>
                    </div>
                </div>
            </div>

            <!-- Disguises -->
            <div class="mindersand-card">
                <h4 class="mindersand-card-title"><i class="fa-solid fa-masks-theater"></i> Common Disguises</h4>
                <div class="mindersand-disguises-grid">
                    ${data.disguises.map(d => `
                        <div class="mindersand-disguise">
                            <span class="mindersand-disguise-icon"><i class="${d.icon}"></i></span>
                            <div>
                                <strong>${d.name}</strong>
                                <p>${d.description}</p>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>

            <!-- Effects Progression -->
            <div class="mindersand-card">
                <h4 class="mindersand-card-title"><i class="fa-solid fa-exclamation-triangle"></i> Effects Progression</h4>
                <div class="mindersand-effects-timeline">
                    ${data.effects.map((e, i) => `
                        <div class="mindersand-effect-stage">
                            <div class="mindersand-effect-header">
                                <span class="mindersand-effect-icon"><i class="${e.icon}"></i></span>
                                <span class="mindersand-effect-stage-name">${e.stage}</span>
                            </div>
                            <p class="mindersand-effect-symptoms">${e.symptoms}</p>
                        </div>
                    `).join('')}
                </div>
            </div>

            <!-- Why It Works -->
            <div class="mindersand-card">
                <h4 class="mindersand-card-title"><i class="fa-solid fa-bullseye"></i> Why It Works</h4>
                <ul class="mindersand-why-list">
                    ${data.whyItWorks.map(w => `<li>${w}</li>`).join('')}
                </ul>
            </div>

            <!-- Smith's Coster Motives -->
            <div class="mindersand-card mindersand-coster-card">
                <h4 class="mindersand-card-title"><i class="fa-solid fa-building"></i> Why Smith's Coster Moves It</h4>
                ${data.targetingNote ? `<p class="mindersand-targeting-note">${data.targetingNote}</p>` : ''}
                <div class="mindersand-motives-grid">
                    ${data.whySmithsCoster.map(m => `
                        <div class="mindersand-motive">
                            <strong>${m.reason}</strong>
                            <p>${m.detail}</p>
                        </div>
                    `).join('')}
                </div>
            </div>

            <!-- Distribution -->
            <div class="mindersand-card">
                <h4 class="mindersand-card-title"><i class="fa-solid fa-box"></i> Distribution Patterns</h4>
                <ul class="mindersand-distribution-list">
                    ${data.distribution.map(d => `<li>${d}</li>`).join('')}
                </ul>
            </div>

            <!-- Detection Guide -->
            <div class="mindersand-card mindersand-detection-card">
                <h4 class="mindersand-card-title"><i class="fa-solid fa-magnifying-glass"></i> Detection & Prevention</h4>
                <div class="mindersand-detection-grid">
                    <div class="mindersand-detection-item">
                        <span class="mindersand-detection-label"><i class="fa-solid fa-check"></i> Prevention</span>
                        <p>${data.detection.prevention}</p>
                    </div>
                    <div class="mindersand-detection-item">
                        <span class="mindersand-detection-label"><i class="fa-solid fa-check"></i> Confirmation</span>
                        <p>${data.detection.confirmation}</p>
                    </div>
                    <div class="mindersand-detection-item mindersand-detection-warning">
                        <span class="mindersand-detection-label"><i class="fa-solid fa-xmark"></i> Worst Mistake</span>
                        <p>${data.detection.mistake}</p>
                    </div>
                </div>
            </div>

            <!-- Adventure Hooks -->
            <div class="mindersand-card mindersand-hooks-card">
                <h4 class="mindersand-card-title"><i class="fa-solid fa-dice-d20"></i> Adventure Hooks</h4>
                <div class="mindersand-hooks-grid">
                    ${data.adventureHooks.map(h => `
                        <div class="mindersand-hook">
                            <div class="mindersand-hook-header">
                                <span class="mindersand-hook-icon"><i class="${h.icon}"></i></span>
                                <strong>${h.name}</strong>
                            </div>
                            <p>${h.hook}</p>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    },

    // ============================================
    // Relationships Map
    // ============================================

    /**
     * Load relationships data (and NPCs for detail modals)
     */
    async loadRelationships() {
        const container = document.getElementById('relationships-map');
        if (!container) return;

        container.innerHTML = '<div class="loading-spinner">Loading relationships...</div>';

        try {
            // Load both relationships and NPCs
            const [relResponse, npcResponse] = await Promise.all([
                fetch('content/dm/relationships.json'),
                fetch('content/npcs/roster.md')
            ]);
            
            this.relationships = await relResponse.json();
            
            // Parse NPCs if not already loaded
            if (this.npcs.length === 0) {
                const npcMarkdown = await npcResponse.text();
                this.npcs = this.parseNPCs(npcMarkdown);
            }
            
            this.renderRelationships();
        } catch (error) {
            console.error('Failed to load relationships:', error);
            container.innerHTML = '<p>Failed to load relationships.</p>';
        }
    },

    /**
     * Render relationships map
     */
    renderRelationships() {
        const container = document.getElementById('relationships-map');
        if (!container || !this.relationships) return;

        const data = this.relationships;
        
        // Group connections by type
        const allies = data.connections.filter(c => c.type === 'ally');
        const complicated = data.connections.filter(c => c.type === 'complicated');
        const antagonists = data.connections.filter(c => c.type === 'antagonist');

        container.innerHTML = `
            <!-- Allies -->
            ${allies.length > 0 ? `
            <div class="relationship-group allies">
                <h3 class="relationship-group-title">🟢 Allies</h3>
                <div class="relationship-cards">
                    ${allies.map(c => this.renderRelationshipCard(c)).join('')}
                </div>
            </div>
            ` : ''}

            <!-- Complicated -->
            ${complicated.length > 0 ? `
            <div class="relationship-group complicated">
                <h3 class="relationship-group-title">🟡 Complicated Ties</h3>
                <div class="relationship-cards">
                    ${complicated.map(c => this.renderRelationshipCard(c)).join('')}
                </div>
            </div>
            ` : ''}

            <!-- Antagonists -->
            ${antagonists.length > 0 ? `
            <div class="relationship-group antagonists">
                <h3 class="relationship-group-title">🔴 Antagonists</h3>
                <div class="relationship-cards">
                    ${antagonists.map(c => this.renderRelationshipCard(c)).join('')}
                </div>
            </div>
            ` : ''}

            <!-- Indirect Connections -->
            ${data.indirect && data.indirect.length > 0 ? `
            <div class="relationship-indirect">
                <h4 class="relationship-indirect-title">Hidden Connections</h4>
                <ul class="relationship-indirect-list">
                    ${data.indirect.map(i => `
                        <li class="relationship-indirect-item">
                            <strong>${i.from}</strong> → <strong>${i.to}</strong>: ${i.description}
                        </li>
                    `).join('')}
                </ul>
            </div>
            ` : ''}
        `;
        
        // Bind click events to cards with NPC details
        this.bindRelationshipCardEvents();
    },

    /**
     * Render a single relationship card
     */
    renderRelationshipCard(connection) {
        // All connections with details are clickable
        const hasDetails = connection.details !== undefined;
        
        return `
            <div class="relationship-card ${connection.type} ${hasDetails ? 'clickable' : ''}" 
                 data-connection-name="${connection.name}"
                 ${hasDetails ? 'title="Click for details"' : ''}>
                <h4 class="relationship-card-name">${connection.name}</h4>
                <p class="relationship-card-role">${connection.role}</p>
                <p class="relationship-card-tension">${connection.tension}</p>
                <p class="relationship-card-location">📍 ${connection.location}</p>
            </div>
        `;
    },

    /**
     * Bind click events to relationship cards
     */
    bindRelationshipCardEvents() {
        const container = document.getElementById('relationships-map');
        if (!container) return;

        container.querySelectorAll('.relationship-card.clickable').forEach(card => {
            card.addEventListener('click', () => {
                const connectionName = card.dataset.connectionName;
                const connection = this.relationships.connections.find(c => c.name === connectionName);
                if (connection) {
                    this.openRelationshipModal(connection);
                }
            });
        });
    },

    /**
     * Open relationship detail modal with worksheet-style info
     */
    openRelationshipModal(connection) {
        const overlay = document.getElementById('npc-modal-overlay');
        const content = document.getElementById('npc-modal-content');
        
        if (!overlay || !content) return;

        // Build the modal content based on relationship type
        let detailsHTML = '';
        const d = connection.details;
        
        if (connection.type === 'ally') {
            detailsHTML = `
                <p><strong>Met:</strong> ${d.met}</p>
                <p><strong>Bond:</strong> ${d.bond}</p>
                <p><strong>I ask for:</strong> ${d.iAskFor}</p>
                <p><strong>They ask for:</strong> ${d.theyAskFor}</p>
            `;
        } else if (connection.type === 'complicated') {
            // Handle different pronoun structures
            const wants = d.heWants || d.sheWants || '';
            const wantsLabel = d.heWants ? 'He wants' : 'She wants';
            detailsHTML = `
                <p><strong>The knot:</strong> ${d.theKnot}</p>
                <p><strong>${wantsLabel}:</strong> ${wants}</p>
                <p><strong>I want:</strong> ${d.iWant}</p>
                <p><strong>Danger:</strong> ${d.danger}</p>
            `;
        } else if (connection.type === 'antagonist') {
            detailsHTML = `
                <p><strong>She believes:</strong> ${d.sheBelieves}</p>
                <p><strong>She wants:</strong> ${d.sheWants}</p>
                <p><strong>How she operates:</strong> ${d.howSheOperates}</p>
            `;
        }

        // Determine the type label and color
        const typeLabels = {
            'ally': '🟢 Ally',
            'complicated': '🟡 Complicated Tie',
            'antagonist': '🔴 Antagonist'
        };

        content.innerHTML = `
            <div class="narrative-container">
                <h2>${connection.name}</h2>
                <p class="relationship-type-label">${typeLabels[connection.type] || connection.type}</p>
                <p class="relationship-modal-role"><em>${connection.role}</em></p>
                <p class="relationship-modal-location">📍 ${connection.location}</p>
                <hr>
                ${detailsHTML}
            </div>
        `;
        overlay.classList.add('active');
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
