/**
 * Meilin's Apothecary - UI Components
 * Lightbox, modals, and shared UI utilities
 */
(function(App) {

    /**
     * Bind global lightbox events for all images with data-lightbox attribute
     */
    App.bindGlobalLightbox = function() {
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
    };

    /**
     * Scroll to a specific section on the current page
     */
    App.scrollToSection = function(sectionId) {
        const section = document.getElementById(sectionId);
        if (section) {
            section.scrollIntoView({ behavior: 'smooth', block: 'start' });
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

})(window.App = window.App || {});
