/**
 * Meilin's Apothecary - Overview Page
 * "At a Glance" character overview rendering
 */
(function(App) {

    /**
     * Load At a Glance page data
     */
    App.loadOverview = async function() {
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
    };

    /**
     * Render the At a Glance page
     */
    App.renderOverview = function() {
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
    };

    /**
     * Bind events for quick link cards on At a Glance page
     */
    App.bindQuickLinkEvents = function() {
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
    };

})(window.App = window.App || {});
