/**
 * Meilin's Apothecary - Navigation
 * Page switching, tab handling, and URL hash routing
 */
(function(App) {

    /**
     * Bind all event listeners
     */
    App.bindEvents = function() {
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
    };

    /**
     * Bind page navigation events
     */
    App.bindPageEvents = function() {
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
    };

    /**
     * Handle URL hash changes for navigation
     */
    App.handleHashChange = function() {
        // Default to 'rumors' (a non-protected page) if no hash
        const hash = window.location.hash.slice(1) || 'rumors';
        if (hash === 'overview' || hash === 'medicine' || hash === 'backstory' || hash === 'dmtools' || hash === 'rumors') {
            this.switchPage(hash, false);
        }
    };

    /**
     * Switch between main pages
     */
    App.switchPage = function(pageName, updateHash = true) {
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
    };

    /**
     * Switch between DM Tools tabs
     */
    App.switchDMToolsTab = function(tabName) {
        // Update tab buttons
        document.querySelectorAll('.dmtools-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.dmtab === tabName);
        });

        // Update tab panels
        document.querySelectorAll('.dmtools-panel').forEach(panel => {
            panel.classList.toggle('active', panel.id === `${tabName}-panel`);
        });
    };

    /**
     * Switch between tabs (medicine page)
     */
    App.switchTab = function(tabName) {
        this.currentTab = tabName;
        
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabName);
        });
        
        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.toggle('active', content.id === `${tabName}-tab`);
        });
    };

    /**
     * Close modal
     */
    App.closeModal = function() {
        const modal = document.getElementById('modal-overlay');
        modal.classList.remove('active');
        document.body.style.overflow = '';
    };

})(window.App = window.App || {});
