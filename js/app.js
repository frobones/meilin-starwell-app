/**
 * Meilin's Apothecary - Main Application
 * Herbal Medicine Quick Reference for the Alchemy Almanac system
 */

const App = {
    // Data storage
    medicines: [],
    ingredients: null,
    rules: null,
    
    // Craft data
    ingredientInventory: {},
    ingredientsList: null,
    craftModalState: null,
    craftEventsBound: false,
    INVENTORY_STORAGE_KEY: 'meilin-inventory',
    
    // At a Glance data (top-level page)
    overviewData: null,
    
    /**
     * Refresh Lucide icons after dynamic content render
     */
    refreshIcons() {
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    },
    
    // Backstory data
    backstoryContent: null,
    vignettes: [],
    knives: [],
    relationships: null,
    mindersandData: null,
    medicaData: null,
    rumorsData: null,
    
    // Passkey configuration
    // Change this passkey to whatever you want!
    PASSKEY: 'ms-13',
    STORAGE_KEY: 'meilin-backstory-unlocked',
    // Pages that require passkey to access
    PROTECTED_PAGES: ['overview', 'backstory', 'dmtools'],
    
    // Current state
    currentFilters: {
        search: '',
        category: 'all',
        difficulty: 'all',
        ingredientType: 'all'
    },
    currentTab: 'medicines',
    selectedTerrain: 'Arctic',
    currentPage: null, // Will be set after passkey check
    currentSubtab: 'background',
    appUnlocked: false,
    pendingPage: 'overview', // Page to navigate to after unlock

    /**
     * Initialize the application
     */
    async init() {
        try {
            await this.loadData();
            this.bindEvents();
            this.bindPageEvents();
            this.bindPasskeyEvents();
            this.bindGlobalLightbox();
            this.checkStoredUnlock();
            this.renderMedicines();
            this.renderIngredients();
            this.renderQuickRules();
            this.renderHarvestingRules();
            this.renderPotionRules();
            
            // Initialize craft tab
            this.buildIngredientsList();
            this.loadInventory();
            this.renderCraftInventory();
            this.renderCraftableMedicines();
            this.bindCraftEvents();
            
            // Handle initial page based on URL hash
            // Passkey modal will show if trying to access a protected page
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
        this.harvesting = medicinesData.harvesting;
        this.primaryComponents = medicinesData.primaryComponents;
        this.ingredients = ingredientsData;
        
        // Build creature parts lookup by name for quick access
        this.creaturePartsLookup = this.buildCreaturePartsLookup();
    },
    
    /**
     * Build a lookup map for creature parts by name
     * Returns an object where keys are part names and values contain details
     * Combines sources when the same part appears in multiple creature types
     */
    buildCreaturePartsLookup() {
        const lookup = {};
        const creatureParts = this.ingredients?.creatureParts;
        
        if (!creatureParts) return lookup;
        
        for (const [creatureType, parts] of Object.entries(creatureParts)) {
            for (const part of parts) {
                if (lookup[part.name]) {
                    // Part already exists - combine the sources
                    lookup[part.name].creatureTypes.push(creatureType);
                    lookup[part.name].sources.push({
                        creatureType: creatureType,
                        source: part.source
                    });
                } else {
                    // New part - create entry with arrays for multiple sources
                    lookup[part.name] = {
                        name: part.name,
                        creatureTypes: [creatureType],
                        dc: part.dc,
                        amount: part.amount,
                        sources: [{
                            creatureType: creatureType,
                            source: part.source
                        }],
                        use: part.use
                    };
                }
            }
        }
        
        return lookup;
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

        document.getElementById('ingredient-type-filter').addEventListener('change', (e) => {
            this.currentFilters.ingredientType = e.target.value;
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

        // Relationship modal close (uses npc-modal elements)
        const npcOverlay = document.getElementById('npc-modal-overlay');
        if (npcOverlay) {
            npcOverlay.addEventListener('click', (e) => {
                if (e.target.id === 'npc-modal-overlay') {
                    this.closeRelationshipModal();
                }
            });
        }

        const npcClose = document.getElementById('npc-modal-close');
        if (npcClose) {
            npcClose.addEventListener('click', () => {
                this.closeRelationshipModal();
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

        // Handle browser back/forward
        window.addEventListener('hashchange', () => {
            this.handleHashChange();
        });
    },

    /**
     * Handle URL hash changes for navigation
     */
    handleHashChange() {
        // Default to 'rumors' (a non-protected page) if no hash
        const hash = window.location.hash.slice(1) || 'rumors';
        if (hash === 'overview' || hash === 'medicine' || hash === 'backstory' || hash === 'dmtools' || hash === 'rumors') {
            this.switchPage(hash, false);
        }
    },

    /**
     * Switch between main pages
     */
    switchPage(pageName, updateHash = true) {
        // Check if passkey is required for this page
        const isProtected = this.PROTECTED_PAGES.includes(pageName);
        if (isProtected && !this.appUnlocked) {
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
            history.replaceState(null, '', `#${pageName}`);
        }

        // Scroll to top of page
        window.scrollTo(0, 0);

        // Load At a Glance content if switching to that page
        if (pageName === 'overview' && !this.overviewData) {
            this.loadOverview();
        }
        
        // Load backstory content if switching to backstory page
        if (pageName === 'backstory' && !this.backstoryContent) {
            this.loadBackstoryContent();
        }
        
        // Load DM Tools content if switching to that page
        if (pageName === 'dmtools' && !this.relationships) {
            this.loadDMToolsContent();
        }
        
        // Load Rumors content if switching to that page
        if (pageName === 'rumors' && !this.rumorsData) {
            this.loadRumors();
        }
    },
    
    /**
     * Load rumors content
     */
    async loadRumors() {
        try {
            const response = await fetch('content/rumors.json');
            if (!response.ok) throw new Error('Failed to load rumors');
            
            this.rumorsData = await response.json();
            this.renderRumors();
        } catch (error) {
            console.error('Failed to load rumors:', error);
        }
    },
    
    /**
     * Render rumors list
     */
    renderRumors() {
        const container = document.getElementById('rumors-list');
        if (!container || !this.rumorsData) return;
        
        container.innerHTML = this.rumorsData.rumors.map(rumor => `
            <div class="rumor-item" data-image="img/${rumor.image}">
                <span class="rumor-text">
                    <span class="rumor-readable">${rumor.text}</span>
                    <span class="rumor-cipher" aria-hidden="true">${rumor.text}</span>
                </span>
            </div>
        `).join('');
        
        // Add hover listeners for image swapping
        this.setupRumorHoverEffects();
        
        this.refreshIcons();
    },
    
    /**
     * Setup hover effects for rumors to swap gallery image
     */
    setupRumorHoverEffects() {
        const rumorItems = document.querySelectorAll('.rumor-item');
        const galleryImage = document.getElementById('rumors-gallery-image');
        const galleryContainer = document.getElementById('rumors-gallery-container');
        const defaultImage = 'img/scene.png';
        
        if (!galleryImage || !galleryContainer) return;
        
        rumorItems.forEach(item => {
            item.addEventListener('mouseenter', () => {
                const newImage = item.dataset.image;
                if (newImage && galleryImage.src !== newImage) {
                    // Add fade transition
                    galleryImage.style.opacity = '0';
                    setTimeout(() => {
                        galleryImage.src = newImage;
                        galleryContainer.dataset.lightbox = newImage;
                        galleryImage.style.opacity = '1';
                    }, 150);
                }
            });
            
            item.addEventListener('mouseleave', () => {
                // Optional: return to default on mouse leave
                // Uncomment below to enable return-to-default behavior
                // galleryImage.style.opacity = '0';
                // setTimeout(() => {
                //     galleryImage.src = defaultImage;
                //     galleryContainer.dataset.lightbox = defaultImage;
                //     galleryImage.style.opacity = '1';
                // }, 150);
            });
        });
    },
    
    /**
     * Bind global lightbox events for all images with data-lightbox attribute
     */
    bindGlobalLightbox() {
        const lightbox = document.getElementById('global-lightbox');
        const lightboxImage = document.getElementById('lightbox-image');
        const lightboxClose = document.getElementById('lightbox-close');
        
        if (!lightbox || !lightboxImage) return;
        
        // Use event delegation on document for data-lightbox clicks
        document.addEventListener('click', (e) => {
            const lightboxTrigger = e.target.closest('[data-lightbox]');
            if (lightboxTrigger) {
                const imageSrc = lightboxTrigger.dataset.lightbox;
                lightboxImage.src = imageSrc;
                lightbox.classList.add('active');
            }
        });
        
        // Close lightbox on button click
        if (lightboxClose) {
            lightboxClose.addEventListener('click', () => {
                lightbox.classList.remove('active');
            });
        }
        
        // Close lightbox on overlay click
        lightbox.addEventListener('click', (e) => {
            if (e.target === lightbox) {
                lightbox.classList.remove('active');
            }
        });
        
        // Close lightbox on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && lightbox.classList.contains('active')) {
                lightbox.classList.remove('active');
            }
        });
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
     * Get star display for difficulty level (legacy, used for rules display)
     */
    getStars(difficulty) {
        const filled = '★'.repeat(difficulty);
        const empty = '☆'.repeat(5 - difficulty);
        return filled + empty;
    },

    /**
     * Get star display for a medicine using maxStars and indefiniteStar
     * For variable-star medicines, shows the first tier's star configuration
     */
    getMedicineStars(medicine) {
        const difficulty = medicine.difficulty;
        
        // Variable-star medicines: check if first variant has maxStars
        if (medicine.variableStars && medicine.starVariants && medicine.starVariants.length > 0) {
            const firstVariant = medicine.starVariants[0];
            if (firstVariant.maxStars) {
                // Show filled + empty stars based on first variant
                const filled = '★'.repeat(firstVariant.stars);
                const empty = '☆'.repeat(firstVariant.maxStars - firstVariant.stars);
                return filled + empty;
            }
            // No maxStars in variant, just show filled stars
            return '★'.repeat(difficulty);
        }
        
        const maxStars = medicine.maxStars || 5;
        const indefiniteStar = medicine.indefiniteStar || false;
        
        // Calculate components
        const filledCount = difficulty;
        const indefiniteCount = indefiniteStar ? 1 : 0;
        const emptyCount = maxStars - filledCount - indefiniteCount;
        
        const filled = '★'.repeat(filledCount);
        const empty = '☆'.repeat(Math.max(0, emptyCount));
        const indefinite = indefiniteStar ? '✧' : '';
        
        return filled + empty + indefinite;
    },

    /**
     * Get star display for variable-star medicines (Dragon Tea, Draught of Giant's Strength)
     * Returns an array of star strings for each variant, or null if not variable
     */
    getVariableStars(medicine) {
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
     * Check if a medicine requires creature parts
     */
    hasCreatureOption(medicine) {
        // If floraOnly is true, no creature parts needed
        if (medicine.floraOnly) {
            return false;
        }
        // Check if any secondary ingredient is creature type (object format)
        if (medicine.secondary && medicine.secondary.length > 0) {
            const isObjectFormat = typeof medicine.secondary[0] === 'object';
            if (isObjectFormat) {
                // Has creature option if any secondary is creature type
                return medicine.secondary.some(s => s.type === 'creature');
            }
            // String format means creature-only (no flora option marked)
            return true;
        }
        return false;
    },

    /**
     * Get ingredient badges HTML for a medicine
     */
    getIngredientBadges(medicine, forModal = false) {
        const hasFlora = this.hasFloraOption(medicine);
        const hasCreature = this.hasCreatureOption(medicine);
        
        let badges = '';
        
        if (hasFlora && hasCreature) {
            // Both options available
            if (forModal) {
                badges = `<span class="modal-badges-group"><span class="medicine-flora-badge" title="Has flora option"><i data-lucide="sprout"></i> Flora</span><span class="medicine-creature-badge" title="Has creature option"><i data-lucide="bone"></i> Creature</span></span>`;
            } else {
                badges = `<span class="medicine-flora-badge" title="Has flora option"><i data-lucide="sprout"></i></span>`;
                badges += `<span class="medicine-creature-badge" title="Has creature option"><i data-lucide="bone"></i></span>`;
            }
        } else if (hasFlora) {
            // Flora only
            if (forModal) {
                badges = `<span class="medicine-flora-badge" title="Flora option available"><i data-lucide="sprout"></i> Flora</span>`;
            } else {
                badges = `<span class="medicine-flora-badge" title="Flora option available"><i data-lucide="sprout"></i></span>`;
            }
        } else if (hasCreature) {
            // Creature only
            if (forModal) {
                badges = `<span class="medicine-creature-badge" title="Requires creature parts"><i data-lucide="bone"></i> Creature</span>`;
            } else {
                badges = `<span class="medicine-creature-badge" title="Requires creature parts"><i data-lucide="bone"></i></span>`;
            }
        }
        
        return badges;
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
    },

    /**
     * Create HTML for a medicine card
     */
    createMedicineCard(medicine) {
        const stars = this.getMedicineStars(medicine);
        const previewText = medicine.effect.length > 100 
            ? medicine.effect.substring(0, 100) + '...'
            : medicine.effect;

        const ingredientBadges = this.getIngredientBadges(medicine, false);
        
        // Add variable indicator if medicine has variable stars
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
    },

    /**
     * Open medicine detail modal
     */
    openModal(medicine) {
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
    },

    /**
     * Create HTML for variable star table (Dragon Tea, Draught of Giant's Strength)
     */
    createVariableStarsHtml(medicine) {
        const variants = this.getVariableStars(medicine);
        if (!variants) return '';
        
        // Determine column headers based on what data is available
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
    },

    /**
     * Create HTML for details table (Mastermind, Prismatic Balm, etc.)
     */
    createDetailsTableHtml(medicine) {
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
    },

    /**
     * Create clickable flora span
     */
    makeFloraClickable(floraName) {
        // Check if we have details for this flora
        if (this.ingredients?.floraDetails?.[floraName]) {
            return `<span class="flora-clickable" data-flora="${floraName}">${floraName}</span>`;
        }
        return floraName;
    },
    
    /**
     * Create clickable creature part span
     */
    makeCreatureClickable(partName) {
        // Check if we have details for this creature part
        if (this.creaturePartsLookup?.[partName]) {
            return `<span class="creature-clickable" data-creature="${partName}">${partName}</span>`;
        }
        return partName;
    },
    
    /**
     * Make an ingredient clickable - checks both flora and creature parts
     * Returns object with html and type for styling purposes
     */
    makeIngredientClickable(ingredientName) {
        // Check if it's a flora
        if (this.ingredients?.floraDetails?.[ingredientName]) {
            return {
                html: `<span class="flora-clickable" data-flora="${ingredientName}">${ingredientName}</span>`,
                type: 'flora'
            };
        }
        // Check if it's a creature part
        if (this.creaturePartsLookup?.[ingredientName]) {
            return {
                html: `<span class="creature-clickable" data-creature="${ingredientName}">${ingredientName}</span>`,
                type: 'creature'
            };
        }
        // Neither - return plain text
        return {
            html: ingredientName,
            type: 'unknown'
        };
    },

    /**
     * Create HTML for medicine components
     */
    createComponentsHtml(medicine) {
        let html = '';
        
        if (medicine.primary) {
            // Primary is always flora - make it clickable
            const primaryClickable = this.makeFloraClickable(medicine.primary);
            html += `
                <div class="component-item">
                    <span class="component-label">Primary:</span>
                    <span class="component-value">${primaryClickable}</span>
                </div>
            `;
        }
        
        if (medicine.secondary && medicine.secondary.length > 0) {
            // Check if secondary uses new object format or old string format
            const isObjectFormat = typeof medicine.secondary[0] === 'object';
            
            if (isObjectFormat) {
                // New format: group by type and display with colored text
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
                // Old format: simple string array - check each one for flora or creature
                const ingredients = medicine.secondary.map(s => this.makeIngredientClickable(s));
                const secondaryClickables = ingredients.map(i => i.html).join(' or ');
                
                // Determine styling class based on ingredient types
                // If all are creature parts, use creature styling; if all flora, use flora styling
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

        // Bind flora click events
        this.bindFloraClickEvents(section);
        
        // Refresh Lucide icons for dynamically rendered content
        this.refreshIcons();
    },

    /**
     * Bind click events for flora items, creature parts, and medicine links
     */
    bindFloraClickEvents(container) {
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
    },

    /**
     * Open medicine modal by name
     */
    openMedicineByName(name) {
        // Clean up the name (remove parenthetical notes like "(flora version)")
        const cleanName = name.replace(/\s*\([^)]*\)\s*/g, '').trim();
        
        // Find the medicine by name (case-insensitive partial match)
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
    },

    /**
     * Look up DC for a flora by name
     */
    getFloraGatherDC(floraName) {
        // Check common flora first
        const common = this.ingredients?.flora?.common?.find(f => f.name === floraName);
        if (common) return common.dc;
        
        // Check rare flora across all terrains
        const rare = this.ingredients?.flora?.rare;
        if (rare) {
            for (const terrain of Object.values(rare)) {
                const found = terrain.find(f => f.name === floraName);
                if (found) return found.dc;
            }
        }
        
        return null;
    },
    
    /**
     * Show flora details modal
     */
    showFloraDetails(floraName) {
        const details = this.ingredients.floraDetails?.[floraName];
        if (!details) {
            console.warn(`No details found for flora: ${floraName}`);
            return;
        }
        
        // Look up the DC for gathering this flora
        const dc = this.getFloraGatherDC(floraName);
        const dcHtml = dc ? `<span class="flora-dc"><i data-lucide="target"></i> DC ${dc}</span>` : '';

        // Create modal overlay
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

        // Close handlers
        const closeModal = () => {
            overlay.classList.add('closing');
            setTimeout(() => overlay.remove(), 200);
        };

        overlay.querySelector('.flora-modal-close').addEventListener('click', closeModal);
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) closeModal();
        });

        // Escape key to close
        const escHandler = (e) => {
            if (e.key === 'Escape') {
                closeModal();
                document.removeEventListener('keydown', escHandler);
            }
        };
        document.addEventListener('keydown', escHandler);

        // Animate in
        requestAnimationFrame(() => overlay.classList.add('active'));
    },
    
    /**
     * Show creature part details modal
     */
    showCreatureDetails(partName) {
        const details = this.creaturePartsLookup?.[partName];
        if (!details) {
            console.warn(`No details found for creature part: ${partName}`);
            return;
        }

        // Format amount display
        let amountDisplay = details.amount;
        if (details.amount === 'Δ') {
            amountDisplay = '<abbr title="Amount depends on creature size: Medium or smaller = 1, Large = 2, Huge = 4, Gargantuan+ = 8">Δ (varies by size)</abbr>';
        }
        
        // Format creature type badges (may have multiple)
        const typeBadges = details.creatureTypes.map(t => 
            `<span class="creature-type-badge">${t}</span>`
        ).join('');
        
        // Format sources - group by creature type if multiple
        // Strip out "(replaces X)" notes as they're not needed for display
        const cleanSource = (source) => source.replace(/\s*\(replaces[^)]*\)/gi, '').trim();
        
        let sourcesHtml;
        if (details.sources.length === 1) {
            // Single source - simple display
            sourcesHtml = cleanSource(details.sources[0].source);
        } else {
            // Multiple sources - show creature type with each source
            sourcesHtml = details.sources.map(s => 
                `<div class="creature-source-item"><strong>${s.creatureType}:</strong> ${cleanSource(s.source)}</div>`
            ).join('');
        }

        // Create modal overlay
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

        // Close handlers
        const closeModal = () => {
            overlay.classList.add('closing');
            setTimeout(() => overlay.remove(), 200);
        };

        overlay.querySelector('.creature-modal-close').addEventListener('click', closeModal);
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) closeModal();
        });

        // Escape key to close
        const escHandler = (e) => {
            if (e.key === 'Escape') {
                closeModal();
                document.removeEventListener('keydown', escHandler);
            }
        };
        document.addEventListener('keydown', escHandler);

        // Animate in
        requestAnimationFrame(() => overlay.classList.add('active'));
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
    },

    /**
     * Create creature parts section
     */
    createCreaturePartsSection() {
        const creatureParts = this.ingredients.creatureParts;
        const sizeAmounts = this.ingredients.sizeAmounts;
        
        let tablesHtml = '';
        
        for (const [creatureType, parts] of Object.entries(creatureParts)) {
            if (creatureType === 'All creatures') continue;
            
            const rows = parts.map(item => {
                // Format amount display
                let amountDisplay = item.amount;
                if (item.amount === 'Δ') {
                    amountDisplay = '<span class="amount-delta" title="Amount depends on creature size: Medium or smaller = 1, Large = 2, Huge = 4, Gargantuan+ = 8">Δ</span>';
                } else {
                    amountDisplay = `×${item.amount}`;
                }
                
                // Format source display
                const sourceDisplay = item.source ? `<span class="creature-source">${item.source}</span>` : '';
                
                // Format used in - make each medicine clickable
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

        // Build size amounts reference
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
            
            // Rebind flora click events for the new rows
            this.bindFloraClickEvents(tbody);
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
                <td>${d.dc}</td>
            </tr>
        `).join('');

        const gatheringOptionsRows = this.rules.gatheringOptions?.options?.map(opt => `
            <tr>
                <td><strong>${opt.threshold}+</strong></td>
                <td><strong>${opt.name}</strong></td>
                <td>${opt.description}</td>
            </tr>
        `).join('') || '';

        const commonFloraRows = this.rules.commonFloraTable?.map(f => `
            <tr>
                <td>${f.roll}</td>
                <td>${f.component}</td>
                <td>${f.category}</td>
            </tr>
        `).join('') || '';

        const alchemillaAgent = this.rules.enhancingAgents?.find(a => a.name === 'Alchemilla');
        const durationLadder = alchemillaAgent?.durationLadder?.join(' → ') || '';
        const ephedraAgent = this.rules.enhancingAgents?.find(a => a.name === 'Ephedra');

        rulesContent.innerHTML = `
            ${this.rules.downtimeLimit ? `
            <div class="rules-callout">
                <strong>Daily Limit:</strong> ${this.rules.downtimeLimit}
            </div>
            ` : ''}
            <div class="rules-grid">
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
                    <h4>Making a Medicine</h4>
                    <ul>
                        <li><strong>Time:</strong> ${this.rules.crafting.time}</li>
                        <li><strong>Tool:</strong> ${this.rules.crafting.tool}</li>
                        <li><strong>Rest:</strong> ${this.rules.crafting.restCompatible}</li>
                        <li><strong>On failure:</strong> ${this.rules.crafting.failure}</li>
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
                
            </div>

            ${this.rules.gatheringOptions ? `
            <h3>Gathering Results (Choose One)</h3>
            <p style="margin-bottom: 0.5rem; font-style: italic;">${this.rules.gatheringOptions.intro}</p>
            <table class="ingredient-table" style="font-size: 0.85rem; margin-bottom: 1.5rem;">
                <thead>
                    <tr>
                        <th>Result</th>
                        <th>Option</th>
                        <th>Details</th>
                    </tr>
                </thead>
                <tbody>
                    ${gatheringOptionsRows}
                </tbody>
            </table>
            ` : ''}

            ${this.rules.commonFloraTable ? `
            <h3>Common Flora Table (d6)</h3>
            <table class="ingredient-table" style="font-size: 0.85rem; margin-bottom: 1.5rem;">
                <thead>
                    <tr>
                        <th>d6</th>
                        <th>Component</th>
                        <th>Category</th>
                    </tr>
                </thead>
                <tbody>
                    ${commonFloraRows}
                </tbody>
            </table>
            ` : ''}

            ${durationLadder ? `
            <h3>Alchemilla (Duration Extension)</h3>
            <p style="margin-bottom: 0.5rem;"><strong>${durationLadder}</strong></p>
            <p style="margin-bottom: 1.5rem; font-size: 0.85rem;">Each unit steps duration up one tier. ${alchemillaAgent?.dcIncrease || '+1 difficulty level per unit'}.</p>
            ` : ''}

            ${ephedraAgent ? `
            <h3>Ephedra (Potency Boost)</h3>
            <p style="margin-bottom: 0.5rem;"><strong>×1 → ×2 → ×4 → ×8</strong></p>
            <p style="margin-bottom: 1.5rem; font-size: 0.85rem;">Doubles dice that restore or grant hit points or other resources. ${ephedraAgent.dcIncrease}.</p>
            ` : ''}

            ${this.rules.enhancementLimits ? `
            <h3>Enhancement Limits</h3>
            <ul style="margin-bottom: 1.5rem;">
                <li><strong>Max enhancements:</strong> ${this.rules.enhancementLimits.maxEnhancements}</li>
                <li><strong>Indefinite duration:</strong> ${this.rules.enhancementLimits.indefiniteDuration}</li>
                <li><strong>Limit:</strong> ${this.rules.enhancementLimits.indefiniteLimit}</li>
            </ul>
            ` : ''}

            ${this.rules.spellAssist ? `
            <h3>Spell-Assisted Gathering</h3>
            <ul style="margin-bottom: 1.5rem;">
                ${this.rules.spellAssist.map(s => `
                    <li><strong>${s.spell}:</strong> ${s.effect}</li>
                `).join('')}
            </ul>
            ` : ''}
            
            <h3>Important Gotchas</h3>
            <ul>
                ${this.rules.crafting.gotchas.map(g => `<li>${g}</li>`).join('')}
            </ul>
        `;
    },

    /**
     * Render harvesting rules reference
     */
    renderHarvestingRules() {
        const harvestingContent = document.getElementById('harvesting-content');
        
        if (!this.harvesting) {
            harvestingContent.innerHTML = '<p>Harvesting data not available.</p>';
            return;
        }

        const creatureSkillRows = this.harvesting.creatureTypeSkills?.map(cs => `
            <tr>
                <td><strong>${cs.skill}</strong></td>
                <td>${cs.types}</td>
            </tr>
        `).join('') || '';

        const kitActivityRows = this.harvesting.kitActivities?.map(ka => `
            <tr>
                <td>${ka.activity}</td>
                <td>${ka.dc}</td>
            </tr>
        `).join('') || '';

        harvestingContent.innerHTML = `
            <p style="margin-bottom: 1rem; font-style: italic;">${this.harvesting.overview}</p>
            
            <div class="rules-grid">
                <div class="rules-card">
                    <h4>Harvesting Creatures</h4>
                    <ul>
                        <li><strong>Time:</strong> ${this.harvesting.process.time}</li>
                        <li><strong>Rest:</strong> ${this.harvesting.process.restCompatible}</li>
                        <li><strong>Requirement:</strong> ${this.harvesting.process.requirement}</li>
                        <li><strong>Check:</strong> Proficiency + Strength or Dexterity</li>
                        <li><strong>Spoilage:</strong> ${this.harvesting.storage?.spoilage}</li>
                    </ul>
                </div>
                
                <div class="rules-card">
                    <h4>Harvesting Kit</h4>
                    <ul>
                        <li><strong>Cost:</strong> ${this.harvesting.tool.cost} (${this.harvesting.tool.weight})</li>
                        <li><strong>Advantage:</strong> ${this.harvesting.modifiers.advantage}</li>
                        <li><strong>Favored Enemy:</strong> ${this.harvesting.modifiers.favoredEnemy}</li>
                    </ul>
                </div>
                
                <div class="rules-card">
                    <h4>Harvesting Results</h4>
                    <ul>
                        <li><strong>On success:</strong> ${this.harvesting.results.success}</li>
                        <li><strong>Component DC:</strong> ${this.harvesting.results.componentDC}</li>
                        <li><strong>On failure:</strong> ${this.harvesting.results.failure}</li>
                    </ul>
                </div>
            </div>

            <h3>Creature Type Skills</h3>
            <p style="margin-bottom: 0.5rem; font-style: italic;">Proficiency in the associated skill grants advantage on the harvesting check.</p>
            <table class="ingredient-table" style="font-size: 0.85rem; margin-bottom: 1.5rem;">
                <thead>
                    <tr>
                        <th>Skill</th>
                        <th>Creature Types</th>
                    </tr>
                </thead>
                <tbody>
                    ${creatureSkillRows}
                </tbody>
            </table>

            ${this.harvesting.groupHarvesting ? `
            <div class="rules-callout">
                <strong>Group Harvesting:</strong> ${this.harvesting.groupHarvesting.description}. ${this.harvesting.groupHarvesting.benefit}.
            </div>
            ` : ''}

            ${this.harvesting.modifiers?.temporaryEffects ? `
            <div class="rules-callout" style="border-left-color: var(--herb-green-dark, #2d6a4f);">
                <strong>Important:</strong> ${this.harvesting.modifiers.temporaryEffects}
            </div>
            ` : ''}

            ${this.harvesting.kitActivities ? `
            <h3>Kit Activities</h3>
            <table class="ingredient-table" style="font-size: 0.85rem; margin-bottom: 1.5rem;">
                <thead>
                    <tr>
                        <th>Activity</th>
                        <th>DC</th>
                    </tr>
                </thead>
                <tbody>
                    ${kitActivityRows}
                </tbody>
            </table>
            ` : ''}

            <h3>Kit Contents</h3>
            <p style="font-size: 0.85rem;">${this.harvesting.tool.components}</p>
        `;
    },

    /**
     * Render potion rules reference tab
     */
    renderPotionRules() {
        const section = document.getElementById('potion-rules-section');
        
        section.innerHTML = `
            <div class="potion-rules-content">
                <div class="rules-intro">
                    <h2>Alchemy Almanac Rules Reference</h2>
                    <p class="rules-intro-text">A recap of rules in the three core rulebooks that pertain to the use of potions. For the purposes of this section, "potion" refers to any item presented in the Alchemy Almanac or created using the rules herein.</p>
                </div>

                <div class="rules-grid">
                    <div class="rules-card">
                        <h4><i data-lucide="flask-round"></i> Using a Potion</h4>
                        <ul>
                            <li>Potions are <strong>consumable items</strong>. Drinking a potion or administering it to another creature requires a <strong>Bonus Action</strong>.</li>
                            <li>Applying an <strong>oil</strong> might take longer, as specified in its description.</li>
                            <li>Once used, a potion takes effect <strong>immediately</strong>, and it is used up.</li>
                        </ul>
                    </div>

                    <div class="rules-card">
                        <h4><i data-lucide="beaker"></i> Mixing Potions</h4>
                        <ul>
                            <li>A character might drink one potion while still under the effects of another, or pour several potions into a single container.</li>
                            <li>The strange ingredients used in creating potions can result in <strong>unpredictable interactions</strong>.</li>
                            <li>When a character mixes two potions together, roll on the <strong>Potion Miscibility</strong> table below.</li>
                            <li>If more than two are combined, roll again for each subsequent potion, combining the results.</li>
                        </ul>
                    </div>

                    <div class="rules-card">
                        <h4><i data-lucide="sparkles"></i> Potions as Magic Items</h4>
                        <ul>
                            <li>Most potions are <strong>magic items</strong> and their effects count as magical for the purposes of an <em>antimagic field</em> and other effects.</li>
                            <li>However, adventuring equipment, as well as some herbal medicines, are <strong>nonmagical</strong>, and the effects they produce are also nonmagical.</li>
                            <li>The GM decides which, if any, herbal medicines are nonmagical.</li>
                        </ul>
                    </div>
                </div>

                <div class="section-divider">
                    <span class="divider-text">Potion Miscibility</span>
                </div>

                <div class="miscibility-section">
                    <p class="miscibility-intro">When mixing potions, roll <strong>1d100</strong> and consult this table. Unless the effects are immediately obvious, reveal them only when they become evident.</p>
                    <table class="miscibility-table">
                        <thead>
                            <tr>
                                <th>d100</th>
                                <th>Result</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr class="miscibility-catastrophic">
                                <td>01</td>
                                <td>Both potions lose their effects, and the mixture creates a magical explosion in a 5-foot-radius Sphere centered on itself. Each creature in that area takes <strong>4d10 Force damage</strong>.</td>
                            </tr>
                            <tr class="miscibility-bad">
                                <td>02–08</td>
                                <td>Both potions lose their effects, and the mixture becomes an <strong>ingested poison</strong> of your choice.</td>
                            </tr>
                            <tr class="miscibility-bad">
                                <td>09–15</td>
                                <td>Both potions <strong>lose their effects</strong>.</td>
                            </tr>
                            <tr class="miscibility-reduced">
                                <td>16–25</td>
                                <td><strong>One potion</strong> loses its effect.</td>
                            </tr>
                            <tr class="miscibility-reduced">
                                <td>26–35</td>
                                <td>Both potions work, but with their numerical effects and durations <strong>halved</strong>. If a potion has no numerical effect and no duration, it instead loses its effect.</td>
                            </tr>
                            <tr class="miscibility-normal">
                                <td>36–90</td>
                                <td>Both potions <strong>work normally</strong>.</td>
                            </tr>
                            <tr class="miscibility-good">
                                <td>91–99</td>
                                <td>Both potions work, but the numerical effects and duration of one potion are <strong>doubled</strong>. If neither potion has anything to double, they work normally.</td>
                            </tr>
                            <tr class="miscibility-amazing">
                                <td>00</td>
                                <td>Only one potion works, but its effects are <strong>permanent</strong>. Choose the simplest effect to make permanent, or the one that seems the most fun. <em>Dispel Magic</em> or similar magic might end this lasting effect.</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div class="section-divider">
                    <span class="divider-text">New Terminology</span>
                </div>

                <div class="terminology-section">
                    <div class="terminology-card burning">
                        <h3><i data-lucide="flame"></i> Burning</h3>
                        <p class="terminology-intro">Some items in the Alchemy Almanac cause or inflict the <strong>burning</strong> condition:</p>
                        <ul>
                            <li>A burning creature takes <strong>fire damage</strong> at the start of each of its turns. The amount of damage is shown in the triggering effect in parentheses.</li>
                            <li>The creature sheds <strong>bright light</strong> in a 20-foot radius and <strong>dim light</strong> for an additional 20 feet.</li>
                            <li>If a creature is subjected to burning from multiple sources, only the <strong>highest</strong> source of damage applies; they aren't added together. For example, a creature subjected to burning (1d6) and burning (2d6) takes 2d6 fire damage at the start of each of its turns.</li>
                            <li>The condition ends if the creature or another creature within 5 feet of it uses an <strong>action</strong> to put out the flames, or some other effect douses it, such as being fully immersed in water.</li>
                        </ul>
                        <div class="terminology-notes">
                            <h5>Notes:</h5>
                            <ul>
                                <li>Spells and other magical effects that can cure disease or poison can also <strong>end</strong> the burning condition.</li>
                                <li>Creatures with <strong>immunity to fire damage</strong> also have immunity to the burning condition.</li>
                            </ul>
                        </div>
                    </div>

                    <div class="terminology-card extended-rest">
                        <h3><i data-lucide="bed"></i> Extended Rest</h3>
                        <p>An extended rest is a period of <strong>downtime</strong> between adventures, at least <strong>1 week</strong> long, during which a character attends to other affairs.</p>
                        <p>Some potions in the Alchemy Almanac require the drinker to finish an extended rest before it can benefit from the effects of that potion again.</p>
                    </div>
                </div>
            </div>
        `;

        // Refresh icons for the dynamically added content
        this.refreshIcons();
    },

    /**
     * Show error message
     */
    showError(message) {
        const grid = document.getElementById('medicine-grid');
        grid.innerHTML = `
            <div class="no-results">
                <div class="no-results-icon"><i data-lucide="triangle-alert"></i></div>
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
    async loadOverview() {
        try {
            const response = await fetch('content/character/overview.json');
            if (!response.ok) {
                throw new Error('Failed to fetch overview data');
            }
            this.overviewData = await response.json();
            this.renderOverview();
        } catch (error) {
            console.error('Error loading At a Glance:', error);
        }
    },

    /**
     * Render the At a Glance page
     */
    renderOverview() {
        const data = this.overviewData;
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

        // Shared Anchor card
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
                
                // If navigating to DM Tools with a section, switch to that tab
                if (targetPage === 'dmtools' && targetSection) {
                    setTimeout(() => {
                        this.switchDMToolsTab(targetSection);
                    }, 100);
                } else if (targetSection) {
                    // For other pages, scroll to section
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
            this.loadVignettes()
        ]);
    },

    /**
     * Load all DM Tools content (relationships, knives, mindersand, medica)
     */
    async loadDMToolsContent() {
        await Promise.all([
            this.loadRelationships(),
            this.loadKnives(),
            this.loadMindersand(),
            this.loadMedica()
        ]);
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
            this.refreshIcons();
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
                icon: 'anchor',
                chapterIndex: 0,
                chapterNumber: '01',
                chapterTitle: 'Dock-born',
                paragraphs: [0, 1, 2], // "On the Rock of Bral...", quote, and learning messages
                pullQuote: '"People lie," he told her. "Bodies don\'t."'
            },
            {
                title: 'Cassian',
                icon: 'star',
                chapterIndex: 1,
                chapterNumber: '02',
                chapterTitle: 'Cassian Leaves',
                paragraphs: [3], // Cassian paragraph
                pullQuote: 'She kept it because paper didn\'t change shape when people did.'
            },
            {
                title: 'Politics of Medicine',
                icon: 'scale',
                chapterIndex: 2,
                chapterNumber: '03',
                chapterTitle: 'Apprenticeship',
                paragraphs: [4, 5, 6], // Medicine is politics, apprenticeship
                pullQuote: '"Your cure comes with a leash."'
            },
            {
                title: 'Near Death',
                icon: 'skull',
                chapterIndex: 3,
                chapterNumber: '04',
                chapterTitle: 'Near-death',
                paragraphs: [7, 8, 9, 10, 11, 12], // Tea stall incident, discovery of mindersand
                pullQuote: 'Pain is data. Fear is data. Curiosity outranks comfort.'
            },
            {
                title: 'The Pattern-Hunter',
                icon: 'search',
                chapterIndex: 4,
                chapterNumber: '05',
                chapterTitle: 'Pattern-hunter',
                paragraphs: [13, 14, 15], // Building the web
                pullQuote: '"Maps lead places. Some places don\'t like visitors."'
            },
            {
                title: 'Meredin\'s Patronage',
                icon: 'handshake',
                chapterIndex: 5,
                chapterNumber: '06',
                chapterTitle: 'Meredin',
                paragraphs: [16, 17, 18], // Meredin enters
                pullQuote: '"Being useful is a kind of target."'
            },
            {
                title: 'The Drift-Sparrow',
                icon: 'ship',
                chapterIndex: 6,
                chapterNumber: '07',
                chapterTitle: 'Shipboard Scare',
                paragraphs: [19, 20, 21, 22, 23, 24], // Ship contract and discovery
                pullQuote: 'The easiest way to control people wasn\'t a blade. It was what you fed them.'
            },
            {
                title: 'Sera\'s Trail',
                icon: 'clipboard-list',
                chapterIndex: 7,
                chapterNumber: '08',
                chapterTitle: 'Sera Trail',
                paragraphs: [25, 26, 27, 28], // Sera Quill, tracing to Smith's Coster
                pullQuote: 'It\'s control shaped like help.'
            },
            {
                title: 'Smith\'s Coster',
                icon: 'landmark',
                chapterIndex: 8,
                chapterNumber: '09',
                chapterTitle: 'Smith\'s Coster',
                paragraphs: [29, 30, 31, 32, 33], // Confrontation
                pullQuote: '"Paper burns."'
            },
            {
                title: 'The Ledger Page',
                icon: 'scroll',
                chapterIndex: 9,
                chapterNumber: '10',
                chapterTitle: 'Ledger Page',
                paragraphs: [34, 35, 36, 37, 38, 39, 40], // The heist
                pullQuote: '"MS-13: mindersand"'
            },
            {
                title: 'Exit Strategy',
                icon: 'door-open',
                chapterIndex: 10,
                chapterNumber: '11',
                chapterTitle: 'Exit Strategy',
                paragraphs: [41, 42, 43, 44, 45, 46, 47, 48], // Leaving Bral - ends with "And now that warning had a heartbeat."
                pullQuote: 'You\'re not the reason. You\'re the symptom. This is the disease.'
            },
            {
                title: 'The Astral Bazaar',
                icon: 'sparkles',
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
                        <span class="backstory-section-icon"><i data-lucide="${section.icon}"></i></span>
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
                    <span class="knife-card-icon"><i data-lucide="${knife.icon}"></i></span>
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
        
        this.refreshIcons();
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
                    <span class="knife-detail-icon"><i data-lucide="${knife.icon}"></i></span>
                    <h2 class="knife-detail-title">${knife.name}</h2>
                </div>
                <span class="knife-modal-type ${knife.type}">${knife.type}</span>
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
            this.refreshIcons();
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
                    <span class="mindersand-icon"><i data-lucide="${data.icon}"></i></span>
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
                <h4 class="mindersand-card-title"><i data-lucide="eye"></i> Identification</h4>
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
                <h4 class="mindersand-card-title"><i data-lucide="drama"></i> Common Disguises</h4>
                <div class="mindersand-disguises-grid">
                    ${data.disguises.map(d => `
                        <div class="mindersand-disguise">
                            <span class="mindersand-disguise-icon"><i data-lucide="${d.icon}"></i></span>
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
                <h4 class="mindersand-card-title"><i data-lucide="triangle-alert"></i> Effects Progression</h4>
                <div class="mindersand-effects-timeline">
                    ${data.effects.map((e, i) => `
                        <div class="mindersand-effect-stage">
                            <div class="mindersand-effect-header">
                                <span class="mindersand-effect-icon"><i data-lucide="${e.icon}"></i></span>
                                <span class="mindersand-effect-stage-name">${e.stage}</span>
                            </div>
                            <p class="mindersand-effect-symptoms">${e.symptoms}</p>
                        </div>
                    `).join('')}
                </div>
            </div>

            <!-- Why It Works -->
            <div class="mindersand-card">
                <h4 class="mindersand-card-title"><i data-lucide="target"></i> Why It Works</h4>
                <ul class="mindersand-why-list">
                    ${data.whyItWorks.map(w => `<li>${w}</li>`).join('')}
                </ul>
            </div>

            <!-- Smith's Coster Motives -->
            <div class="mindersand-card mindersand-coster-card">
                <h4 class="mindersand-card-title"><i data-lucide="building-2"></i> Why Smith's Coster Moves It</h4>
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
                <h4 class="mindersand-card-title"><i data-lucide="package"></i> Distribution Patterns</h4>
                <ul class="mindersand-distribution-list">
                    ${data.distribution.map(d => `<li>${d}</li>`).join('')}
                </ul>
            </div>

            <!-- Detection Guide -->
            <div class="mindersand-card mindersand-detection-card">
                <h4 class="mindersand-card-title"><i data-lucide="search"></i> Detection & Prevention</h4>
                <div class="mindersand-detection-grid">
                    <div class="mindersand-detection-item">
                        <span class="mindersand-detection-label"><i data-lucide="check"></i> Prevention</span>
                        <p>${data.detection.prevention}</p>
                    </div>
                    <div class="mindersand-detection-item">
                        <span class="mindersand-detection-label"><i data-lucide="check"></i> Confirmation</span>
                        <p>${data.detection.confirmation}</p>
                    </div>
                    <div class="mindersand-detection-item mindersand-detection-warning">
                        <span class="mindersand-detection-label"><i data-lucide="x"></i> Worst Mistake</span>
                        <p>${data.detection.mistake}</p>
                    </div>
                </div>
            </div>

            <!-- Adventure Hooks -->
            <div class="mindersand-card mindersand-hooks-card">
                <h4 class="mindersand-card-title"><i data-lucide="dices"></i> Adventure Hooks</h4>
                <div class="mindersand-hooks-grid">
                    ${data.adventureHooks.map(h => `
                        <div class="mindersand-hook">
                            <div class="mindersand-hook-header">
                                <span class="mindersand-hook-icon"><i data-lucide="${h.icon}"></i></span>
                                <strong>${h.name}</strong>
                            </div>
                            <p>${h.hook}</p>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        
        this.refreshIcons();
    },

    // ============================================
    // Medica Reference
    // ============================================

    /**
     * Load medica data
     */
    async loadMedica() {
        const container = document.getElementById('medica-content');
        if (!container) return;

        container.innerHTML = '<div class="loading-spinner">Loading Medica data...</div>';

        try {
            const response = await fetch('content/dm/medica.json');
            this.medicaData = await response.json();
            this.renderMedica();
        } catch (error) {
            console.error('Failed to load Medica data:', error);
            container.innerHTML = '<p>Failed to load Medica reference.</p>';
        }
    },

    /**
     * Render medica reference content
     */
    renderMedica() {
        const container = document.getElementById('medica-content');
        if (!container || !this.medicaData) return;

        const data = this.medicaData;

        container.innerHTML = `
            <!-- Header Card -->
            <div class="medica-header">
                <div class="medica-title-row">
                    <span class="medica-icon"><i data-lucide="${data.icon}"></i></span>
                    <div>
                        <h3 class="medica-name">${data.name}</h3>
                        <span class="medica-tagline">${data.tagline}</span>
                    </div>
                </div>
                <p class="medica-overview">${data.overview}</p>
            </div>

            <!-- Joining Section -->
            <div class="medica-card medica-joining">
                <h4 class="medica-card-title"><i data-lucide="${data.joining.icon}"></i> ${data.joining.title}</h4>
                <ul class="medica-requirements-list">
                    ${data.joining.requirements.map(req => `<li>${req}</li>`).join('')}
                </ul>
                <p class="medica-note">${data.joining.note}</p>
            </div>

            <!-- Rank Progression -->
            <div class="medica-card">
                <h4 class="medica-card-title"><i data-lucide="trending-up"></i> Rank Progression</h4>
                <p class="medica-card-intro">Click a rank to see benefits, tuition, and exam requirements.</p>
                <div class="medica-ranks-grid">
                    ${data.ranks.map((rank, i) => `
                        <div class="medica-rank-card ${i === 0 ? 'active' : ''}" data-rank-index="${i}">
                            <span class="medica-rank-icon"><i data-lucide="${rank.icon}"></i></span>
                            <span class="medica-rank-name">${rank.name}</span>
                        </div>
                    `).join('')}
                </div>
                <div class="medica-rank-details" id="medica-rank-details">
                    ${this.renderMedicaRankDetails(data.ranks[0])}
                </div>
            </div>

            <!-- Guild Exams -->
            <div class="medica-card">
                <h4 class="medica-card-title"><i data-lucide="${data.exams.icon}"></i> ${data.exams.title}</h4>
                <p class="medica-exam-description">${data.exams.description}</p>
                <ol class="medica-exam-process">
                    ${data.exams.process.map(step => `<li>${step}</li>`).join('')}
                </ol>
                <p class="medica-note"><i data-lucide="info"></i> ${data.exams.note}</p>
            </div>

            <!-- Guild Merchant -->
            <div class="medica-card">
                <h4 class="medica-card-title"><i data-lucide="${data.guildMerchant.icon}"></i> ${data.guildMerchant.title}</h4>
                <p class="medica-merchant-banner"><i data-lucide="info"></i> ${data.guildMerchant.overview}</p>
                
                <div class="medica-merchant-grid">
                    <div class="medica-merchant-section">
                        <h5><i data-lucide="package"></i> Buying Components</h5>
                        <p>${data.guildMerchant.components.description}</p>
                        <p><strong>Mechanic:</strong> ${data.guildMerchant.components.mechanic}</p>
                    </div>
                    <div class="medica-merchant-section">
                        <h5><i data-lucide="shopping-bag"></i> Buying Finished Items</h5>
                        <p>${data.guildMerchant.finishedItems.description}</p>
                        <p><strong>Limit:</strong> ${data.guildMerchant.finishedItems.limit}</p>
                    </div>
                    <div class="medica-merchant-section">
                        <h5><i data-lucide="coins"></i> Selling</h5>
                        <p>Merchants purchase at <strong>${data.guildMerchant.selling.rate}</strong> of sale price.</p>
                    </div>
                </div>

                <hr class="medica-divider">

                <h5 class="medica-section-title"><i data-lucide="package-open"></i> Craft Component Stocks</h5>
                <p class="medica-note"><i data-lucide="refresh-cw"></i> ${data.guildMerchant.components.replenish}</p>
                <h6 class="medica-stock-title">Stock Dice by Rank</h6>
                <div class="medica-stock-grid">
                    ${data.ranks.map(rank => `
                        <div class="medica-stock-item">
                            <span class="medica-stock-rank">${rank.name}</span>
                            <span class="medica-stock-die">${rank.stockDie}</span>
                        </div>
                    `).join('')}
                </div>

                <!-- Craft Component Stocks -->
                <details class="medica-stocks-details">
                    <summary><i data-lucide="leaf"></i> ${data.guildMerchant.stocks.plants.title}</summary>
                    <div class="medica-stocks-content">
                        ${data.guildMerchant.stocks.plants.categories.map(cat => `
                            <h6 class="medica-stocks-category">${cat.name}</h6>
                            <table class="medica-stocks-table">
                                <thead>
                                    <tr><th>Name</th><th>Stock</th><th>Cost</th></tr>
                                </thead>
                                <tbody>
                                    ${cat.items.map(item => `
                                        <tr>
                                            <td>${item.name}</td>
                                            <td class="medica-stock-score">${item.stockScore}</td>
                                            <td class="medica-stock-cost">${item.cost}</td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        `).join('')}
                    </div>
                </details>

                <details class="medica-stocks-details">
                    <summary><i data-lucide="skull"></i> ${data.guildMerchant.stocks.creatureParts.title}</summary>
                    <div class="medica-stocks-content">
                        <table class="medica-stocks-table">
                            <thead>
                                <tr><th>Name</th><th>Stock</th><th>Cost</th></tr>
                            </thead>
                            <tbody>
                                ${data.guildMerchant.stocks.creatureParts.items.map(item => `
                                    <tr>
                                        <td>${item.name}</td>
                                        <td class="medica-stock-score">${item.stockScore}</td>
                                        <td class="medica-stock-cost">${item.cost}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </details>

                <hr class="medica-divider">

                <!-- Finished Item Stocks -->
                <h5 class="medica-section-title"><i data-lucide="shopping-cart"></i> ${data.guildMerchant.stocks.finishedItems.title}</h5>
                <p class="medica-merchant-banner"><i data-lucide="info"></i> ${data.guildMerchant.stocks.finishedItems.note}</p>

                <details class="medica-stocks-details">
                    <summary><i data-lucide="flask-round"></i> ${data.guildMerchant.stocks.finishedItems.herbalMedicines.title}</summary>
                    <div class="medica-stocks-content">
                        <table class="medica-stocks-table medica-finished-table">
                            <thead>
                                <tr><th>Name</th><th>Strength</th><th>Cost</th></tr>
                            </thead>
                            <tbody>
                                ${data.guildMerchant.stocks.finishedItems.herbalMedicines.items.map(item => 
                                    item.variants.map((v, i) => `
                                        <tr class="${i > 0 ? 'variant-row' : ''}">
                                            <td>${i === 0 ? item.name : ''}</td>
                                            <td class="medica-strength">${v.strength}</td>
                                            <td class="medica-stock-cost">${v.cost}</td>
                                        </tr>
                                    `).join('')
                                ).join('')}
                            </tbody>
                        </table>
                    </div>
                </details>

                <details class="medica-stocks-details">
                    <summary><i data-lucide="beaker"></i> ${data.guildMerchant.stocks.finishedItems.alchemicalItems.title}</summary>
                    <div class="medica-stocks-content">
                        <table class="medica-stocks-table medica-finished-table">
                            <thead>
                                <tr><th>Name</th><th>Strength</th><th>Cost</th></tr>
                            </thead>
                            <tbody>
                                ${data.guildMerchant.stocks.finishedItems.alchemicalItems.items.map(item => 
                                    item.variants.map((v, i) => `
                                        <tr class="${i > 0 ? 'variant-row' : ''}">
                                            <td>${i === 0 ? item.name : ''}${v.note ? `<span class="variant-note">${i === 0 ? ' ' : ''}${v.note}</span>` : ''}</td>
                                            <td class="medica-strength">${v.strength}</td>
                                            <td class="medica-stock-cost">${v.cost}</td>
                                        </tr>
                                    `).join('')
                                ).join('')}
                            </tbody>
                        </table>
                    </div>
                </details>
            </div>

            <!-- Downtime Activities -->
            <div class="medica-card">
                <h4 class="medica-card-title"><i data-lucide="${data.downtime.icon}"></i> ${data.downtime.title}</h4>
                <div class="medica-downtime-grid">
                    ${data.downtime.activities.map(activity => `
                        <div class="medica-activity-card">
                            <div class="medica-activity-header">
                                <span class="medica-activity-icon"><i data-lucide="${activity.icon}"></i></span>
                                <h5>${activity.name}</h5>
                            </div>
                            ${activity.requirement ? `<p class="medica-activity-req"><i data-lucide="lock"></i> ${activity.requirement}</p>` : ''}
                            <p class="medica-activity-desc">${activity.description}</p>
                            <p class="medica-activity-benefit"><strong>Benefit:</strong> ${activity.benefit}</p>
                            ${activity.duration ? `<p class="medica-activity-duration"><i data-lucide="clock"></i> ${activity.duration}</p>` : ''}
                        </div>
                    `).join('')}
                </div>

                <!-- Guild Work Section -->
                <div class="medica-guild-work-section">
                    <h5 class="medica-guild-work-title"><i data-lucide="${data.downtime.guildWork.icon}"></i> ${data.downtime.guildWork.title}</h5>
                    <p class="medica-activity-req"><i data-lucide="lock"></i> ${data.downtime.guildWork.requirement}</p>
                    <p class="medica-guild-work-intro">${data.downtime.guildWork.intro}</p>
                    
                    <div class="medica-guild-work-details">
                        <p><strong>Resources.</strong> ${data.downtime.guildWork.resources}</p>
                        <p><strong>Resolution.</strong> ${data.downtime.guildWork.resolution}</p>
                        
                        <table class="medica-guild-work-table">
                            <thead><tr><th>Guild Rank</th><th>Earnings</th></tr></thead>
                            <tbody>
                                ${data.downtime.guildWork.earnings.map(e => `
                                    <tr><td>${e.rank}</td><td>${e.earnings}</td></tr>
                                `).join('')}
                            </tbody>
                        </table>
                        
                        <p><strong>Complications.</strong> ${data.downtime.guildWork.complicationsIntro}</p>
                        
                        <table class="medica-complications-table">
                            <thead><tr><th>d6</th><th>Complication</th></tr></thead>
                            <tbody>
                                ${data.downtime.guildWork.complications.map(c => `
                                    <tr><td>${c.roll}</td><td>${c.result}</td></tr>
                                `).join('')}
                            </tbody>
                        </table>
                        <p class="medica-complications-note">${data.downtime.guildWork.complicationsNote}</p>
                    </div>
                </div>
            </div>

            <!-- Medicine Categories -->
            <div class="medica-card">
                <h4 class="medica-card-title"><i data-lucide="${data.medicineCategories.icon}"></i> ${data.medicineCategories.title}</h4>
                <div class="medica-categories-grid">
                    ${data.medicineCategories.categories.map(cat => `
                        <div class="medica-category-card" style="border-left-color: ${cat.color}">
                            <h5>${cat.name}</h5>
                            <p class="medica-category-primary"><strong>Primary:</strong> ${cat.primary}</p>
                            <p class="medica-category-desc">${cat.description}</p>
                        </div>
                    `).join('')}
                </div>

                <h5 class="medica-dc-title">Crafting DCs</h5>
                <div class="medica-dc-grid">
                    ${data.medicineCategories.craftingDCs.map(dc => `
                        <div class="medica-dc-item">
                            <span class="medica-dc-strength">${dc.strength}</span>
                            <span class="medica-dc-value">DC ${dc.dc}</span>
                        </div>
                    `).join('')}
                </div>
                <p class="medica-note">${data.medicineCategories.craftingNote}</p>
            </div>

            <!-- DM Tips -->
            <div class="medica-card medica-tips-card">
                <h4 class="medica-card-title"><i data-lucide="${data.dmTips.icon}"></i> ${data.dmTips.title}</h4>
                <div class="medica-tips-grid">
                    ${data.dmTips.tips.map(tip => `
                        <div class="medica-tip">
                            <h5>${tip.title}</h5>
                            <p>${tip.text}</p>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        
        // Bind rank card click events
        this.bindMedicaRankEvents();
        this.refreshIcons();
    },

    /**
     * Render details for a specific Medica rank
     */
    renderMedicaRankDetails(rank) {
        return `
            <div class="medica-rank-detail-content">
                <h5>${rank.title}</h5>
                <div class="medica-rank-info-grid">
                    <div class="medica-rank-benefits">
                        <h6>Benefits</h6>
                        <ul>
                            ${rank.benefits.map(b => `<li>${b}</li>`).join('')}
                        </ul>
                    </div>
                    <div class="medica-rank-requirements">
                        <h6>Advancement</h6>
                        <p><strong>Tuition:</strong> ${rank.tuition.weeks} workweeks, ${rank.tuition.cost} gp</p>
                        <p><strong>Exam:</strong> ${rank.exam}</p>
                        ${rank.earnings ? `<p><strong>Guild Work:</strong> ${rank.earnings}</p>` : ''}
                        ${rank.note ? `<p class="medica-rank-note"><i data-lucide="info"></i> ${rank.note}</p>` : ''}
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * Bind click events for Medica rank cards
     */
    bindMedicaRankEvents() {
        const container = document.getElementById('medica-content');
        if (!container) return;

        container.querySelectorAll('.medica-rank-card').forEach(card => {
            card.addEventListener('click', () => {
                const index = parseInt(card.dataset.rankIndex);
                const rank = this.medicaData.ranks[index];
                
                // Update active state
                container.querySelectorAll('.medica-rank-card').forEach(c => c.classList.remove('active'));
                card.classList.add('active');
                
                // Update details
                const detailsContainer = document.getElementById('medica-rank-details');
                if (detailsContainer) {
                    detailsContainer.innerHTML = this.renderMedicaRankDetails(rank);
                    this.refreshIcons();
                }
            });
        });
    },

    // ============================================
    // Relationships Map
    // ============================================

    /**
     * Load relationships data
     */
    async loadRelationships() {
        const container = document.getElementById('relationships-map');
        if (!container) return;

        container.innerHTML = '<div class="loading-spinner">Loading relationships...</div>';

        try {
            const response = await fetch('content/dm/relationships.json');
            this.relationships = await response.json();
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

        container.innerHTML = `
            <!-- All Relationships -->
            <div class="relationship-cards">
                ${data.connections.map(c => this.renderRelationshipCard(c)).join('')}
            </div>

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
        
        // Initialize Lucide icons for dynamically added content
        lucide.createIcons();
    },

    /**
     * Render a single relationship card
     */
    renderRelationshipCard(connection) {
        // All connections with details are clickable
        const hasDetails = connection.details !== undefined;
        
        // Type labels for display
        const typeLabels = {
            'ally': 'Ally',
            'complicated': 'Complicated',
            'antagonist': 'Antagonist'
        };
        
        return `
            <div class="relationship-card ${connection.type} ${hasDetails ? 'clickable' : ''}" 
                 data-connection-name="${connection.name}"
                 ${hasDetails ? 'title="Click for details"' : ''}>
                <h4 class="relationship-card-name">${connection.name}</h4>
                <span class="relationship-card-type">${typeLabels[connection.type] || connection.type}</span>
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
                <div class="relationship-detail-section">
                    <h4>Met</h4>
                    <p>${d.met}</p>
                </div>
                <div class="relationship-detail-section">
                    <h4>Bond</h4>
                    <p>${d.bond}</p>
                </div>
                <div class="relationship-detail-section">
                    <h4>I ask for</h4>
                    <p>${d.iAskFor}</p>
                </div>
                <div class="relationship-detail-section">
                    <h4>They ask for</h4>
                    <p>${d.theyAskFor}</p>
                </div>
            `;
        } else if (connection.type === 'complicated') {
            // Handle different pronoun structures
            const wants = d.heWants || d.sheWants || '';
            const wantsLabel = d.heWants ? 'He wants' : 'She wants';
            detailsHTML = `
                <div class="relationship-detail-section">
                    <h4>The knot</h4>
                    <p>${d.theKnot}</p>
                </div>
                <div class="relationship-detail-section">
                    <h4>${wantsLabel}</h4>
                    <p>${wants}</p>
                </div>
                <div class="relationship-detail-section">
                    <h4>I want</h4>
                    <p>${d.iWant}</p>
                </div>
                <div class="relationship-detail-section">
                    <h4>Danger</h4>
                    <p>${d.danger}</p>
                </div>
            `;
        } else if (connection.type === 'antagonist') {
            detailsHTML = `
                <div class="relationship-detail-section">
                    <h4>She believes</h4>
                    <p>${d.sheBelieves}</p>
                </div>
                <div class="relationship-detail-section">
                    <h4>She wants</h4>
                    <p>${d.sheWants}</p>
                </div>
                <div class="relationship-detail-section">
                    <h4>How she operates</h4>
                    <p>${d.howSheOperates}</p>
                </div>
            `;
        }

        // Determine the type label
        const typeLabels = {
            'ally': 'Ally',
            'complicated': 'Complicated',
            'antagonist': 'Antagonist'
        };

        content.innerHTML = `
            <div class="narrative-container">
                <h2>${connection.name}</h2>
                <span class="relationship-modal-type ${connection.type}">${typeLabels[connection.type] || connection.type}</span>
                <p class="relationship-modal-role"><em>${connection.role}</em></p>
                <p class="relationship-modal-location">📍 ${connection.location}</p>
                <hr>
                ${detailsHTML}
            </div>
        `;
        overlay.classList.add('active');
    },

    /**
     * Close relationship modal
     */
    closeRelationshipModal() {
        const overlay = document.getElementById('npc-modal-overlay');
        if (overlay) {
            overlay.classList.remove('active');
        }
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
            { file: 'Meilin Starwell - Vignette 01 - First bolt.md', number: '01', title: 'First Bolt' },
            { file: 'Meilin Starwell - Vignette 02 - Vex lesson.md', number: '02', title: 'Vex Lesson' },
            { file: 'Meilin Starwell - Vignette 03 - Cant notes.md', number: '03', title: 'Cant Notes' },
            { file: 'Meilin Starwell - Vignette 04 - Theo Lockwell, quiet preparation.md', number: '04', title: 'Theo Lockwell' },
            { file: 'Meilin Starwell - Vignette 05 - The tell, the pause.md', number: '05', title: 'The Tell, the Pause' },
            { file: 'Meilin Starwell - Vignette 06 - A polite lie in Undercommon.md', number: '06', title: 'A Polite Lie in Undercommon' },
            { file: 'Meilin Starwell - Vignette 07 - Persuasion is triage.md', number: '07', title: 'Persuasion is Triage' },
            { file: 'Meilin Starwell - Vignette 08 - Quiet feet, open eyes.md', number: '08', title: 'Quiet Feet, Open Eyes' },
            { file: 'Meilin Starwell - Vignette 09 - Fingers, coin, and shame.md', number: '09', title: 'Fingers, Coin, and Shame' },
            { file: 'Meilin Starwell - Vignette 10 - The window with three seals.md', number: '10', title: 'The Window with Three Seals' }
        ];

        // Load all vignettes
        const vignettePromises = vignetteFiles.map(async (vignette) => {
            const html = await this.fetchMarkdown(`content/vignettes/${vignette.file}`);
            // Extract first paragraph as preview and strip leading h1 (already shown in modal title)
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = html;
            const firstH1 = tempDiv.querySelector('h1');
            if (firstH1) firstH1.remove();
            
            // Extract skills from "Skill Spotlight:" line and remove those paragraphs
            let skills = [];
            const allParagraphs = tempDiv.querySelectorAll('p');
            const paragraphsToRemove = [];
            allParagraphs.forEach(p => {
                const text = p.textContent;
                if (text.startsWith('Skill Spotlight:')) {
                    const skillsText = text.replace('Skill Spotlight:', '').trim();
                    skills = skillsText.split(',').map(s => s.trim()).filter(s => s.length > 0);
                    paragraphsToRemove.push(p);
                }
            });
            // Remove skill spotlight paragraphs from content
            paragraphsToRemove.forEach(p => p.remove());
            
            // Find first narrative paragraph (skip "At a glance" section items)
            let preview = '';
            const remainingParagraphs = tempDiv.querySelectorAll('p');
            for (const p of remainingParagraphs) {
                const text = p.textContent.trim();
                // Skip empty paragraphs and list-like items (starting with -)
                if (text && !text.startsWith('-') && text.length > 50) {
                    preview = text.substring(0, 150) + '...';
                    break;
                }
            }
            
            return {
                ...vignette,
                content: tempDiv.innerHTML,
                preview: preview,
                skills: skills
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
                ${vignette.skills && vignette.skills.length > 0 ? `
                    <div class="vignette-skills">
                        ${vignette.skills.map(skill => `<span class="vignette-skill-tag">${skill}</span>`).join('')}
                    </div>
                ` : ''}
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
    },

    // ============================================
    // Craft Tab Methods
    // ============================================

    /**
     * Build a structured list of all ingredients from the data
     */
    buildIngredientsList() {
        if (!this.ingredients) return;
        
        this.ingredientsList = {
            commonFlora: [],
            rareFlora: {},
            creatureParts: {}
        };
        
        // Common flora
        if (this.ingredients.flora && this.ingredients.flora.common) {
            this.ingredientsList.commonFlora = this.ingredients.flora.common.map(f => f.name);
        }
        
        // Rare flora by terrain
        if (this.ingredients.flora && this.ingredients.flora.rare) {
            for (const terrain in this.ingredients.flora.rare) {
                this.ingredientsList.rareFlora[terrain] = this.ingredients.flora.rare[terrain].map(f => f.name);
            }
        }
        
        // Creature parts by type
        if (this.ingredients.creatureParts) {
            for (const creatureType in this.ingredients.creatureParts) {
                this.ingredientsList.creatureParts[creatureType] = 
                    this.ingredients.creatureParts[creatureType].map(c => c.name);
            }
        }
    },

    /**
     * Load inventory from localStorage
     */
    loadInventory() {
        try {
            const stored = localStorage.getItem(this.INVENTORY_STORAGE_KEY);
            if (stored) {
                this.ingredientInventory = JSON.parse(stored);
            }
        } catch (e) {
            console.warn('Failed to load inventory from localStorage:', e);
            this.ingredientInventory = {};
        }
    },

    /**
     * Save inventory to localStorage
     */
    saveInventory() {
        try {
            localStorage.setItem(this.INVENTORY_STORAGE_KEY, JSON.stringify(this.ingredientInventory));
        } catch (e) {
            console.warn('Failed to save inventory to localStorage:', e);
        }
    },

    /**
     * Render the craft inventory panel
     * Preserves the expanded/collapsed state of each section across re-renders.
     * Organizes ingredients into nested Flora and Creatures parent groups.
     */
    renderCraftInventory() {
        const container = document.getElementById('inventory-sections');
        if (!container || !this.ingredientsList) return;
        
        // Preserve current expanded/collapsed state before re-rendering
        const expandedSections = new Set();
        container.querySelectorAll('.inventory-section, .inventory-group').forEach(section => {
            if (!section.classList.contains('collapsed')) {
                const title = section.querySelector('.inventory-section-title, .inventory-group-title')?.textContent;
                if (title) expandedSections.add(title);
            }
        });
        
        // Determine if this is the first render (no existing sections)
        const isFirstRender = expandedSections.size === 0 && 
            container.querySelectorAll('.inventory-section, .inventory-group').length === 0;
        
        // Build Flora sections
        let floraHtml = '';
        
        // Common Flora section (expanded by default on first render)
        const commonFloraExpanded = isFirstRender ? true : expandedSections.has('Common Flora');
        floraHtml += this.createInventorySection('Common Flora', this.ingredientsList.commonFlora, !commonFloraExpanded, 'common');
        
        // Rare Flora sections by terrain
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
        
        // Build Creature Parts sections
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
        
        // Wrap in parent groups
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
    },

    /**
     * Create HTML for an inventory section
     * @param {string} title - Section title
     * @param {string[]} ingredients - List of ingredient names
     * @param {boolean} collapsed - Whether section starts collapsed
     * @param {string} sectionType - Type of section: 'common', 'rare', or 'creature'
     */
    createInventorySection(title, ingredients, collapsed = true, sectionType = 'common') {
        const uniqueIngredients = [...new Set(ingredients)]; // Remove duplicates
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
    },

    /**
     * Get the ingredient type class for color-coding
     * Common flora: matches medicine category colors
     * Rare flora: green
     * Creature parts: red
     */
    getIngredientTypeClass(name, sectionType) {
        if (sectionType === 'creature') {
            return 'ingredient-creature';
        }
        if (sectionType === 'rare') {
            return 'ingredient-rare';
        }
        // Common flora - match by name to category
        const commonFloraTypes = {
            'Deadly nightshade': 'ingredient-augmenting',
            'Juniper berries': 'ingredient-curative',
            'Willow bark': 'ingredient-fortifying',
            'Fleshwort': 'ingredient-restorative',
            'Alchemilla': 'ingredient-enhancing',
            'Ephedra': 'ingredient-enhancing'
        };
        return commonFloraTypes[name] || 'ingredient-common';
    },

    /**
     * Create HTML for an ingredient row with number spinner
     * @param {string} name - Ingredient name
     * @param {string} sectionType - Type of section: 'common', 'rare', or 'creature'
     */
    createIngredientRow(name, sectionType = 'common') {
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
    },

    /**
     * Bind craft event listeners
     * Uses event delegation on container elements, so only needs to be called once.
     * Subsequent calls are no-ops to prevent duplicate event listeners.
     */
    bindCraftEvents() {
        // Prevent duplicate event listener binding
        if (this.craftEventsBound) return;
        this.craftEventsBound = true;
        
        const inventoryContainer = document.getElementById('inventory-sections');
        if (inventoryContainer) {
            // Collapsible section and group headers
            inventoryContainer.addEventListener('click', (e) => {
                // Parent group headers (Flora, Creature Parts)
                const groupHeader = e.target.closest('.inventory-group-header');
                if (groupHeader) {
                    const group = groupHeader.closest('.inventory-group');
                    group.classList.toggle('collapsed');
                    return; // Don't process further
                }
                
                // Child section headers
                const header = e.target.closest('.inventory-section-header');
                if (header) {
                    const section = header.closest('.inventory-section');
                    section.classList.toggle('collapsed');
                    return; // Don't process further
                }
                
                // Spinner buttons
                if (e.target.classList.contains('spinner-dec')) {
                    this.updateIngredientCount(e.target.dataset.ingredient, -1);
                }
                if (e.target.classList.contains('spinner-inc')) {
                    this.updateIngredientCount(e.target.dataset.ingredient, 1);
                }
            });
            
            // Direct input changes
            // Note: Some ingredients appear in multiple locations, so we sync all matching inputs
            inventoryContainer.addEventListener('change', (e) => {
                if (e.target.classList.contains('spinner-value')) {
                    const name = e.target.dataset.ingredient;
                    const value = Math.max(0, Math.min(99, parseInt(e.target.value) || 0));
                    this.ingredientInventory[name] = value;
                    
                    // Update ALL inputs with this ingredient name (handles duplicates)
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
        
        // Clear inventory button
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
        
        // Export button
        const exportBtn = document.getElementById('export-inventory');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportInventory());
        }
        
        // Import input
        const importInput = document.getElementById('import-inventory');
        if (importInput) {
            importInput.addEventListener('change', (e) => {
                if (e.target.files && e.target.files[0]) {
                    this.importInventory(e.target.files[0]);
                    e.target.value = ''; // Reset so same file can be imported again
                }
            });
        }
        
        // Craft modal events
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
    },

    /**
     * Update ingredient count by delta
     * Note: Some ingredients appear in multiple locations (e.g., Mistletoe in Arctic and Forest),
     * so we must update ALL rows with matching ingredient name using querySelectorAll.
     */
    updateIngredientCount(name, delta) {
        const current = this.ingredientInventory[name] || 0;
        const newValue = Math.max(0, Math.min(99, current + delta));
        this.ingredientInventory[name] = newValue;
        
        // Update ALL UI rows with this ingredient (handles duplicates across terrains/creature types)
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
    },

    /**
     * Update ingredient row visual state
     * Note: Some ingredients appear in multiple locations, so we update all matching rows.
     */
    updateIngredientRowState(name) {
        const rows = document.querySelectorAll(`.ingredient-row[data-ingredient="${name}"]`);
        rows.forEach(row => {
            const count = this.ingredientInventory[name] || 0;
            const decBtn = row.querySelector('.spinner-dec');
            if (decBtn) decBtn.disabled = count === 0;
            row.classList.toggle('has-count', count > 0);
        });
    },

    /**
     * Export inventory to JSON file
     */
    exportInventory() {
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
    },

    /**
     * Import inventory from JSON file
     */
    importInventory(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                if (data.inventory && typeof data.inventory === 'object') {
                    this.ingredientInventory = data.inventory;
                    this.saveInventory();
                    this.renderCraftInventory();
                    this.renderCraftableMedicines();
                    this.bindCraftEvents(); // Rebind after re-render
                } else {
                    throw new Error('Invalid inventory format');
                }
            } catch (err) {
                alert('Failed to import inventory: Invalid file format');
                console.error('Import error:', err);
            }
        };
        reader.readAsText(file);
    },

    /**
     * Check if a medicine has alternative secondary ingredients (OR-type)
     * Alternatives are detected by:
     * 1. Notes containing "or"
     * 2. Secondary array containing objects with different types (flora vs creature)
     */
    hasAlternativeSecondaries(medicine) {
        // Check if notes mention "or"
        if (medicine.notes?.toLowerCase().includes(' or ')) {
            return true;
        }
        
        // Check if secondary array has objects with different types
        const secondaries = medicine.secondary || [];
        if (secondaries.length < 2) return false;
        
        // Get unique types from secondary ingredients
        const types = new Set();
        for (const s of secondaries) {
            if (typeof s === 'object' && s.type) {
                types.add(s.type);
            }
        }
        
        // If we have multiple different types (flora and creature), it's alternatives
        return types.size > 1;
    },

    /**
     * Check if a medicine can be crafted with current inventory
     */
    canCraftMedicine(medicine) {
        // Check primary component
        if (medicine.primary && (this.ingredientInventory[medicine.primary] || 0) < 1) {
            return false;
        }
        
        // Check secondary components
        const secondaries = medicine.secondary || [];
        if (secondaries.length === 0) return true;
        
        // Check if this is an OR alternative
        const isOrAlternative = this.hasAlternativeSecondaries(medicine);
        
        if (isOrAlternative) {
            // Need at least one of the alternatives
            return secondaries.some(s => {
                const name = this.getSecondaryName(s);
                return (this.ingredientInventory[name] || 0) >= 1;
            });
        } else {
            // Need all secondary components
            return secondaries.every(s => {
                const name = this.getSecondaryName(s);
                return (this.ingredientInventory[name] || 0) >= 1;
            });
        }
    },

    /**
     * Get available alternatives for OR-type medicines
     * Returns array of objects with name and type
     */
    getAvailableAlternatives(medicine) {
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
    },

    /**
     * Get available alternative names only (for backward compatibility)
     */
    getAvailableAlternativeNames(medicine) {
        return this.getAvailableAlternatives(medicine).map(a => a.name);
    },

    /**
     * Get all craftable medicines based on current inventory
     */
    getCraftableMedicines() {
        return this.medicines.filter(medicine => this.canCraftMedicine(medicine));
    },

    /**
     * Render craftable medicine cards
     */
    renderCraftableMedicines() {
        const grid = document.getElementById('craftable-grid');
        const countEl = document.getElementById('craftable-count');
        if (!grid) return;
        
        const craftable = this.getCraftableMedicines();
        
        // Update count
        if (countEl) {
            countEl.textContent = `${craftable.length} medicine${craftable.length !== 1 ? 's' : ''}`;
        }
        
        if (craftable.length === 0) {
            grid.innerHTML = '<p class="empty-state">Add ingredients to see what you can craft...</p>';
            return;
        }
        
        // Track which cards are new for animation
        const previousIds = Array.from(grid.querySelectorAll('.craftable-card'))
            .map(card => card.dataset.id);
        
        grid.innerHTML = craftable.map(medicine => {
            const isNew = !previousIds.includes(medicine.id);
            return this.createCraftableCard(medicine, isNew);
        }).join('');
        
        // Bind card events
        this.bindCraftableCardEvents(grid);
        this.refreshIcons();
    },

    /**
     * Create HTML for a compact craftable medicine card
     * The entire card is clickable to open the craft modal
     * Uses vertical stacking: Name, Stars, Tag & DC, Brief
     */
    createCraftableCard(medicine, isNew = false) {
        const stars = this.getMedicineStars(medicine);
        // Use brief field if available, otherwise truncate effect
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
    },

    /**
     * Bind events for craftable cards
     * The entire card is clickable to open the craft modal
     */
    bindCraftableCardEvents(container) {
        container.querySelectorAll('.craftable-card').forEach(card => {
            card.addEventListener('click', () => {
                const medicineId = card.dataset.medicine;
                const medicine = this.medicines.find(m => m.id === medicineId);
                if (medicine) {
                    this.openCraftModal(medicine);
                }
            });
        });
    },

    /**
     * Check if a medicine can use Alchemilla (has extendable duration)
     */
    canMedicineUseAlchemilla(medicine) {
        const nonExtendableDurations = [
            'instant', 'permanent', 'until used', 'until triggered', 
            'until depleted', 'until long rest'
        ];
        const duration = (medicine.duration || '').toLowerCase();
        return !nonExtendableDurations.some(d => duration === d);
    },

    /**
     * Check if a medicine can use Ephedra (has dice in effect)
     */
    canMedicineUseEphedra(medicine) {
        const dicePattern = /\d+d\d+/i;
        return dicePattern.test(medicine.fullEffect || medicine.effect || '');
    },

    /**
     * Get max Alchemilla slots for a medicine (can use all slots including ✧)
     */
    getMaxAlchemillaSlots(medicine) {
        return medicine.maxStars - medicine.difficulty;
    },

    /**
     * Get max Ephedra slots for a medicine (cannot use the ✧ slot)
     */
    getMaxEphedraSlots(medicine) {
        let slots = medicine.maxStars - medicine.difficulty;
        // Ephedra cannot fill the indefinite star slot
        if (medicine.indefiniteStar) {
            slots -= 1;
        }
        return Math.max(0, slots);
    },

    /**
     * Open craft modal for a medicine
     */
    openCraftModal(medicine, preselectedAlternative = null) {
        const overlay = document.getElementById('craft-modal-overlay');
        const content = document.getElementById('craft-modal-content');
        if (!overlay || !content) return;
        
        const maxEnhancements = medicine.maxStars - medicine.difficulty;
        const canUseAlchemilla = this.canMedicineUseAlchemilla(medicine);
        const canUseEphedra = this.canMedicineUseEphedra(medicine);
        const maxAlchemillaSlots = this.getMaxAlchemillaSlots(medicine);
        const maxEphedraSlots = this.getMaxEphedraSlots(medicine);
        const alternatives = this.getAvailableAlternatives(medicine);
        
        // Get default chosen alternative name
        const defaultAlt = alternatives.length > 0 ? alternatives[0].name : null;
        
        // Initialize modal state
        this.craftModalState = {
            medicine: medicine,
            alchemillaCount: 0,
            ephedraCount: 0,
            chosenAlternative: preselectedAlternative || defaultAlt,
            alternatives: alternatives, // Store full alternatives with types
            maxEnhancements: maxEnhancements,
            maxAlchemillaSlots: maxAlchemillaSlots,
            maxEphedraSlots: maxEphedraSlots,
            canUseAlchemilla: canUseAlchemilla,
            canUseEphedra: canUseEphedra
        };
        
        this.renderCraftModalContent();
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    },

    /**
     * Render craft modal content based on current state
     */
    renderCraftModalContent() {
        const content = document.getElementById('craft-modal-content');
        if (!content || !this.craftModalState) return;
        
        const { 
            medicine, alchemillaCount, ephedraCount, chosenAlternative, alternatives,
            maxEnhancements, maxAlchemillaSlots, maxEphedraSlots, canUseAlchemilla, canUseEphedra 
        } = this.craftModalState;
        
        // Calculate used slots - both share the same pool
        const totalEnhancementsUsed = alchemillaCount + ephedraCount;
        const remainingSlots = maxEnhancements - totalEnhancementsUsed;
        const effectiveDifficulty = medicine.difficulty + totalEnhancementsUsed;
        const effectiveDC = this.getDCForDifficulty(effectiveDifficulty);
        
        const hasAlchemillaInventory = (this.ingredientInventory['Alchemilla'] || 0) > 0;
        const hasEphedraInventory = (this.ingredientInventory['Ephedra'] || 0) > 0;
        
        // Max Alchemilla: can use any remaining slot (including ✧)
        const maxAlchemillaForSpinner = Math.min(
            this.ingredientInventory['Alchemilla'] || 0,
            maxEnhancements - ephedraCount
        );
        
        // Max Ephedra: can only use ☆ slots (not ✧), minus what Alchemilla has taken
        const maxEphedraForSpinner = Math.min(
            this.ingredientInventory['Ephedra'] || 0,
            Math.max(0, maxEphedraSlots - alchemillaCount)
        );
        
        // Generate star display - show ✧ only if indefiniteStar and not all slots filled by Alchemilla
        const starDisplay = this.generateEnhancedStarDisplay(
            medicine.difficulty, 
            totalEnhancementsUsed, 
            Math.max(0, remainingSlots),
            medicine.indefiniteStar
        );
        
        // Alternative selection HTML
        let alternativeHtml = '';
        if (alternatives && alternatives.length > 1) {
            alternativeHtml = `
                <div class="craft-modal-section">
                    <h4>Choose Ingredient</h4>
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
        
        // Build enhancement rows based on what's applicable
        let enhancementRows = '';
        
        // Only show enhancement options if there are slots available
        const hasEnhancementSlots = maxEnhancements > 0;
        
        // Alchemilla row (only if medicine has extendable duration and has slots)
        if (hasEnhancementSlots && canUseAlchemilla && hasAlchemillaInventory) {
            const alchemillaDisabled = maxAlchemillaForSpinner === 0 && alchemillaCount === 0;
            enhancementRows += `
                <div class="enhancement-row ${alchemillaDisabled ? 'disabled' : ''}">
                    <div class="enhancement-label">
                        <span class="enhancement-name">Alchemilla</span>
                        <span class="enhancement-effect">Extends duration</span>
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
        
        // Ephedra row (only if medicine has dice to double and has non-indefinite slots)
        if (hasEnhancementSlots && maxEphedraSlots > 0 && canUseEphedra && hasEphedraInventory) {
            const ephedraDisabled = maxEphedraForSpinner === 0 && ephedraCount === 0;
            enhancementRows += `
                <div class="enhancement-row ${ephedraDisabled ? 'disabled' : ''}">
                    <div class="enhancement-label">
                        <span class="enhancement-name">Ephedra</span>
                        <span class="enhancement-effect">Doubles dice (×${Math.pow(2, ephedraCount)})</span>
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
        
        // Enhancement section HTML
        let enhancementHtml = '';
        if (enhancementRows) {
            enhancementHtml = `
                <div class="craft-modal-section">
                    <h4>Enhancements</h4>
                    ${enhancementRows}
                </div>
            `;
        }
        
        // Build effect preview section (only show enhanceable effects)
        let effectItems = [];
        
        // Duration display (only if it can be enhanced with Alchemilla)
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
                        <span class="effect-label">Duration:</span>
                        <span class="effect-value">${baseDuration}</span>
                    </div>
                `);
            }
        }
        
        // Potency/dice display (only if it can be enhanced with Ephedra)
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
                        <span class="effect-label">Potency:</span>
                        <span class="effect-value">${baseDice}</span>
                    </div>
                `);
            }
        }
        
        // Build the effect section HTML
        let effectSectionHtml = '';
        if (effectItems.length > 0) {
            const isEnhanced = alchemillaCount > 0 || ephedraCount > 0;
            effectSectionHtml = `
                <div class="craft-modal-section effect-section ${isEnhanced ? 'has-enhancements' : ''}">
                    <h4>Effect</h4>
                    <div class="effect-preview-details">
                        ${effectItems.join('')}
                    </div>
                </div>
            `;
        }
        
        content.innerHTML = `
            <div class="craft-modal-header">
                <h2>${medicine.name}</h2>
                <p class="effect-preview">${medicine.effect}</p>
            </div>
            
            <div class="craft-dc-display">
                <span class="dc-label">Crafting DC:</span>
                <span class="dc-stars">${starDisplay}</span>
                <span class="dc-value">DC ${effectiveDC}</span>
            </div>
            
            ${alternativeHtml}
            ${enhancementHtml}
            ${effectSectionHtml}
            
            <div class="craft-modal-actions">
                <button class="confirm-craft-btn" id="confirm-craft">Confirm Craft</button>
                <button class="details-craft-btn" id="view-details">View Details</button>
                <button class="cancel-craft-btn" id="cancel-craft">Cancel</button>
            </div>
        `;
        
        // Bind modal events
        this.bindCraftModalEvents();
    },

    /**
     * Generate star display with enhancement highlighting
     */
    generateEnhancedStarDisplay(baseDifficulty, enhancementsUsed, slotsRemaining, hasIndefinite) {
        let display = '';
        // Filled stars (base difficulty)
        display += '★'.repeat(baseDifficulty);
        
        // Enhancement stars (being added) - shown in different style
        if (enhancementsUsed > 0) {
            if (hasIndefinite && slotsRemaining === 0) {
                // All slots filled - last enhancement fills the ✧, show as ✦
                if (enhancementsUsed > 1) {
                    display += `<span class="enhancement-stars">${'★'.repeat(enhancementsUsed - 1)}✦</span>`;
                } else {
                    display += `<span class="enhancement-stars">✦</span>`;
                }
            } else {
                display += `<span class="enhancement-stars">${'★'.repeat(enhancementsUsed)}</span>`;
            }
        }
        
        // Empty stars (still available) - if indefinite, the last empty slot is ✧
        if (hasIndefinite && slotsRemaining > 0) {
            display += '☆'.repeat(slotsRemaining - 1);
            display += '✧';
        } else {
            display += '☆'.repeat(slotsRemaining);
        }
        return display;
    },

    /**
     * Get DC for a difficulty level
     */
    getDCForDifficulty(difficulty) {
        const dcMap = { 1: 10, 2: 15, 3: 20, 4: 25, 5: 28 };
        return dcMap[Math.min(5, difficulty)] || 28;
    },

    /**
     * Duration ladder for Alchemilla enhancement
     */
    durationLadder: ['1 minute', '10 minutes', '1 hour', '8 hours', '24 hours'],

    /**
     * Get enhanced duration string based on Alchemilla count
     */
    getEnhancedDuration(medicine, alchemillaCount, hasIndefinite, slotsRemaining) {
        if (!medicine.alchemilla) return null;
        
        const baseIndex = medicine.alchemilla.durationIndex;
        let newIndex = baseIndex + alchemillaCount;
        
        // Check if reaching indefinite (✧)
        if (hasIndefinite && slotsRemaining === 0 && alchemillaCount > 0) {
            return 'Indefinite';
        }
        
        // Cap at max index (24 hours = index 4)
        newIndex = Math.min(newIndex, this.durationLadder.length - 1);
        return this.durationLadder[newIndex];
    },

    /**
     * Get enhanced dice string based on Ephedra count
     */
    getEnhancedDice(medicine, ephedraCount) {
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
    },

    /**
     * Bind events within the craft modal
     */
    bindCraftModalEvents() {
        // Alternative selection
        document.querySelectorAll('input[name="alternative"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.craftModalState.chosenAlternative = e.target.value;
                this.renderCraftModalContent();
            });
        });
        
        // Alchemilla spinner
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
                // Alchemilla can use any remaining slot
                const max = maxEnhancements - ephedraCount;
                const inventoryMax = this.ingredientInventory['Alchemilla'] || 0;
                if (this.craftModalState.alchemillaCount < Math.min(max, inventoryMax)) {
                    this.craftModalState.alchemillaCount++;
                    this.renderCraftModalContent();
                }
            });
        }
        
        // Ephedra spinner
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
                // Ephedra can only use ☆ slots (not ✧)
                const max = Math.max(0, maxEphedraSlots - alchemillaCount);
                const inventoryMax = this.ingredientInventory['Ephedra'] || 0;
                if (this.craftModalState.ephedraCount < Math.min(max, inventoryMax)) {
                    this.craftModalState.ephedraCount++;
                    this.renderCraftModalContent();
                }
            });
        }
        
        // Confirm craft
        const confirmBtn = document.getElementById('confirm-craft');
        if (confirmBtn) {
            confirmBtn.addEventListener('click', () => this.executeCraft());
        }
        
        // View Details - opens medicine detail modal (keeps craft modal open underneath)
        const detailsBtn = document.getElementById('view-details');
        if (detailsBtn) {
            detailsBtn.addEventListener('click', () => {
                const medicine = this.craftModalState?.medicine;
                if (medicine) {
                    this.openModal(medicine);
                }
            });
        }
        
        // Cancel
        const cancelBtn = document.getElementById('cancel-craft');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => this.closeCraftModal());
        }
    },

    /**
     * Execute the craft action
     */
    executeCraft() {
        if (!this.craftModalState) return;
        
        const { medicine, alchemillaCount, ephedraCount, chosenAlternative } = this.craftModalState;
        
        // Deduct primary component
        if (medicine.primary) {
            this.ingredientInventory[medicine.primary] = 
                (this.ingredientInventory[medicine.primary] || 0) - 1;
        }
        
        // Deduct secondary components
        const isOrAlternative = this.hasAlternativeSecondaries(medicine);
        
        if (isOrAlternative && chosenAlternative) {
            // Deduct only the chosen alternative
            this.ingredientInventory[chosenAlternative] = 
                (this.ingredientInventory[chosenAlternative] || 0) - 1;
        } else if (!isOrAlternative) {
            // Deduct all secondary components (only for non-alternative recipes)
            (medicine.secondary || []).forEach(s => {
                const name = this.getSecondaryName(s);
                this.ingredientInventory[name] = (this.ingredientInventory[name] || 0) - 1;
            });
        }
        
        // Deduct enhancing agents
        if (alchemillaCount > 0) {
            this.ingredientInventory['Alchemilla'] = 
                (this.ingredientInventory['Alchemilla'] || 0) - alchemillaCount;
        }
        if (ephedraCount > 0) {
            this.ingredientInventory['Ephedra'] = 
                (this.ingredientInventory['Ephedra'] || 0) - ephedraCount;
        }
        
        // Clean up zero values
        for (const key in this.ingredientInventory) {
            if (this.ingredientInventory[key] <= 0) {
                delete this.ingredientInventory[key];
            }
        }
        
        // Save and update UI
        this.saveInventory();
        this.closeCraftModal();
        this.renderCraftInventory();
        this.renderCraftableMedicines();
        this.bindCraftEvents(); // Rebind after re-render
    },

    /**
     * Close the craft modal
     */
    closeCraftModal() {
        const overlay = document.getElementById('craft-modal-overlay');
        if (overlay) {
            overlay.classList.remove('active');
            document.body.style.overflow = '';
        }
        this.craftModalState = null;
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
