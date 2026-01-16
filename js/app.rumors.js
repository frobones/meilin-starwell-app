/**
 * Meilin's Apothecary - Rumors Page
 * Rumors display with hover effects
 */
(function(App) {

    /**
     * Load rumors content
     */
    App.loadRumors = async function() {
        try {
            const response = await fetch('content/rumors.json');
            if (!response.ok) throw new Error('Failed to load rumors');
            
            this.rumorsData = await response.json();
            this.renderRumors();
        } catch (error) {
            console.error('Failed to load rumors:', error);
        }
    };

    /**
     * Render rumors list
     */
    App.renderRumors = function() {
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
        
        this.setupRumorHoverEffects();
        this.refreshIcons();
    };

    /**
     * Setup hover effects for rumors to swap gallery image
     */
    App.setupRumorHoverEffects = function() {
        const rumorItems = document.querySelectorAll('.rumor-item');
        const galleryImage = document.getElementById('rumors-gallery-image');
        const galleryContainer = document.getElementById('rumors-gallery-container');
        const defaultImage = 'img/scene.png';
        
        if (!galleryImage || !galleryContainer) return;
        
        rumorItems.forEach(item => {
            item.addEventListener('mouseenter', () => {
                const newImage = item.dataset.image;
                if (newImage && galleryImage.src !== newImage) {
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
            });
        });
    };

})(window.App = window.App || {});
