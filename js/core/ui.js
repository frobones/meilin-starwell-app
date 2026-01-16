/**
 * UI Module
 * Lightbox, modals, and shared UI utilities.
 */

import { events } from './events.js';

/**
 * Close a modal by overlay ID
 */
export function closeModal(overlayId = 'modal-overlay') {
    const modal = document.getElementById(overlayId);
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

/**
 * Open a modal by overlay ID
 */
export function openModal(overlayId) {
    const modal = document.getElementById(overlayId);
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

/**
 * Bind global lightbox events
 */
export function bindGlobalLightbox() {
    const lightbox = document.getElementById('global-lightbox');
    const lightboxImage = document.getElementById('lightbox-image');
    const lightboxClose = document.getElementById('lightbox-close');
    
    if (!lightbox || !lightboxImage) return;
    
    // Use event delegation for data-lightbox clicks
    document.addEventListener('click', (e) => {
        const lightboxTrigger = e.target.closest('[data-lightbox]');
        if (lightboxTrigger) {
            const imageSrc = lightboxTrigger.dataset.lightbox;
            lightboxImage.src = imageSrc;
            lightbox.classList.add('active');
        }
    });
    
    if (lightboxClose) {
        lightboxClose.addEventListener('click', () => {
            lightbox.classList.remove('active');
        });
    }
    
    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) {
            lightbox.classList.remove('active');
        }
    });
    
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && lightbox.classList.contains('active')) {
            lightbox.classList.remove('active');
        }
    });
}

/**
 * Bind modal close events
 */
export function bindModalEvents() {
    // Medicine modal
    const modalOverlay = document.getElementById('modal-overlay');
    const modalClose = document.getElementById('modal-close');
    
    if (modalOverlay) {
        modalOverlay.addEventListener('click', (e) => {
            if (e.target.id === 'modal-overlay') {
                closeModal('modal-overlay');
            }
        });
    }
    
    if (modalClose) {
        modalClose.addEventListener('click', () => {
            closeModal('modal-overlay');
        });
    }
    
    // Vignette modal
    bindModalCloseEvents('vignette-modal-overlay', 'vignette-modal-close');
    
    // NPC/Relationship modal
    bindModalCloseEvents('npc-modal-overlay', 'npc-modal-close');
    
    // Knife modal
    bindModalCloseEvents('knife-modal-overlay', 'knife-modal-close');
    
    // Craft modal
    bindModalCloseEvents('craft-modal-overlay', 'craft-modal-close');
    
    // Global escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            events.emit('modal:close');
        }
    });
}

/**
 * Helper to bind close events for a modal
 */
function bindModalCloseEvents(overlayId, closeButtonId) {
    const overlay = document.getElementById(overlayId);
    const closeBtn = document.getElementById(closeButtonId);
    
    if (overlay) {
        overlay.addEventListener('click', (e) => {
            if (e.target.id === overlayId) {
                closeModal(overlayId);
            }
        });
    }
    
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            closeModal(overlayId);
        });
    }
}

/**
 * Show an error message in the medicine grid
 */
export function showError(message) {
    const grid = document.getElementById('medicine-grid');
    if (grid) {
        grid.innerHTML = `
            <div class="no-results">
                <div class="no-results-icon"><i data-lucide="triangle-alert"></i></div>
                <p>${message}</p>
            </div>
        `;
    }
}

/**
 * Add dynamic styles for creature parts
 */
export function addDynamicStyles() {
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
}

// Listen for modal close events
events.on('modal:close', () => {
    closeModal('modal-overlay');
    closeModal('vignette-modal-overlay');
    closeModal('npc-modal-overlay');
    closeModal('knife-modal-overlay');
    closeModal('craft-modal-overlay');
});

