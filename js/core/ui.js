/**
 * UI Module
 * Lightbox, modals, and shared UI utilities.
 */

import { events } from './events.js';
import { activateFocusTrap, deactivateFocusTrap } from './focus-trap.js';

// Track previously focused elements for each modal
const previouslyFocusedElements = new Map();

/**
 * Close a modal by overlay ID
 */
export function closeModal(overlayId = 'modal-overlay') {
    const modal = document.getElementById(overlayId);
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
        
        // Deactivate focus trap
        deactivateFocusTrap(modal);
        
        // Restore previously focused element
        const previouslyFocused = previouslyFocusedElements.get(overlayId);
        if (previouslyFocused && typeof previouslyFocused.focus === 'function') {
            previouslyFocused.focus();
        }
        previouslyFocusedElements.delete(overlayId);
    }
}

/**
 * Open a modal by overlay ID
 */
export function openModal(overlayId) {
    const modal = document.getElementById(overlayId);
    if (modal) {
        // Store previously focused element
        previouslyFocusedElements.set(overlayId, document.activeElement);
        
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        // Activate focus trap
        activateFocusTrap(modal);
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
    
    let lightboxPreviousFocus = null;
    
    function openLightbox(imageSrc) {
        lightboxPreviousFocus = document.activeElement;
        lightboxImage.src = imageSrc;
        lightbox.classList.add('active');
        activateFocusTrap(lightbox);
    }
    
    function closeLightbox() {
        lightbox.classList.remove('active');
        deactivateFocusTrap(lightbox);
        if (lightboxPreviousFocus && typeof lightboxPreviousFocus.focus === 'function') {
            lightboxPreviousFocus.focus();
        }
        lightboxPreviousFocus = null;
    }
    
    // Use event delegation for data-lightbox clicks
    document.addEventListener('click', (e) => {
        const lightboxTrigger = e.target.closest('[data-lightbox]');
        if (lightboxTrigger) {
            const imageSrc = lightboxTrigger.dataset.lightbox;
            openLightbox(imageSrc);
        }
    });
    
    if (lightboxClose) {
        lightboxClose.addEventListener('click', closeLightbox);
    }
    
    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) {
            closeLightbox();
        }
    });
    
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && lightbox.classList.contains('active')) {
            closeLightbox();
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

// ============================================
// Notification System
// ============================================

// Icon mapping for notification types
const NOTIFICATION_ICONS = {
    error: 'triangle-alert',
    warning: 'alert-circle',
    success: 'check-circle',
    info: 'info'
};

// Track active toast timeouts
const toastTimeouts = new Map();

/**
 * Show a notification message
 * @param {string} message - The message to display
 * @param {Object} options - Configuration options
 * @param {string} options.type - Notification type: 'error' | 'warning' | 'success' | 'info'
 * @param {string} options.containerId - Optional container ID for inline notifications
 * @param {number} options.duration - Auto-dismiss duration in ms (0 = no auto-dismiss)
 */
export function showNotification(message, options = {}) {
    const {
        type = 'info',
        containerId = null,
        duration = 5000
    } = options;
    
    const icon = NOTIFICATION_ICONS[type] || NOTIFICATION_ICONS.info;
    
    // If container specified, show inline notification
    if (containerId) {
        const container = document.getElementById(containerId);
        if (container) {
            container.innerHTML = `
                <div class="notification notification--${type}">
                    <span class="notification__icon"><i data-lucide="${icon}"></i></span>
                    <span class="notification__message">${message}</span>
                </div>
            `;
            // Refresh icons
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }
        }
        return;
    }
    
    // Otherwise, show toast notification
    showToast(message, type, icon, duration);
}

/**
 * Show a toast notification (floating, auto-dismissing)
 */
function showToast(message, type, icon, duration) {
    // Get or create toast container
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'toast-container';
        container.setAttribute('aria-live', 'polite');
        container.setAttribute('aria-atomic', 'true');
        document.body.appendChild(container);
    }
    
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast toast--${type}`;
    toast.innerHTML = `
        <span class="toast__icon"><i data-lucide="${icon}"></i></span>
        <span class="toast__message">${message}</span>
        <button class="toast__close" aria-label="Dismiss">&times;</button>
    `;
    
    // Add to container
    container.appendChild(toast);
    
    // Refresh icons
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
    
    // Trigger entrance animation
    requestAnimationFrame(() => {
        toast.classList.add('toast--visible');
    });
    
    // Close button handler
    const closeBtn = toast.querySelector('.toast__close');
    closeBtn.addEventListener('click', () => dismissToast(toast));
    
    // Auto-dismiss if duration > 0
    if (duration > 0) {
        const timeoutId = setTimeout(() => dismissToast(toast), duration);
        toastTimeouts.set(toast, timeoutId);
    }
}

/**
 * Dismiss a toast notification
 */
function dismissToast(toast) {
    // Clear any pending timeout
    if (toastTimeouts.has(toast)) {
        clearTimeout(toastTimeouts.get(toast));
        toastTimeouts.delete(toast);
    }
    
    // Animate out
    toast.classList.remove('toast--visible');
    toast.classList.add('toast--exiting');
    
    // Remove from DOM after animation
    setTimeout(() => {
        toast.remove();
    }, 300);
}

/**
 * Show an error message in the medicine grid (legacy, for backwards compatibility)
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

