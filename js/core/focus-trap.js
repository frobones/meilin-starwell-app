/**
 * Focus Trap Utility
 * Traps keyboard focus within a container for accessibility.
 */

// Selector for focusable elements
const FOCUSABLE_SELECTOR = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
    '[contenteditable]'
].join(', ');

/**
 * Create a focus trap for a container element
 * @param {HTMLElement} container - The element to trap focus within
 * @returns {Object} Focus trap controller with activate/deactivate methods
 */
export function createFocusTrap(container) {
    let previouslyFocused = null;
    let isActive = false;
    
    /**
     * Get all focusable elements within the container
     */
    function getFocusableElements() {
        const elements = Array.from(container.querySelectorAll(FOCUSABLE_SELECTOR));
        // Filter out hidden elements
        return elements.filter(el => {
            return el.offsetParent !== null && 
                   getComputedStyle(el).visibility !== 'hidden';
        });
    }
    
    /**
     * Handle tab key to trap focus
     */
    function handleKeyDown(e) {
        if (!isActive || e.key !== 'Tab') return;
        
        const focusable = getFocusableElements();
        if (focusable.length === 0) return;
        
        const firstFocusable = focusable[0];
        const lastFocusable = focusable[focusable.length - 1];
        
        if (e.shiftKey) {
            // Shift + Tab: go to last element if at first
            if (document.activeElement === firstFocusable || !container.contains(document.activeElement)) {
                e.preventDefault();
                lastFocusable.focus();
            }
        } else {
            // Tab: go to first element if at last
            if (document.activeElement === lastFocusable || !container.contains(document.activeElement)) {
                e.preventDefault();
                firstFocusable.focus();
            }
        }
    }
    
    /**
     * Activate the focus trap
     */
    function activate() {
        if (isActive) return;
        
        isActive = true;
        previouslyFocused = document.activeElement;
        
        // Focus the first focusable element or the container itself
        const focusable = getFocusableElements();
        if (focusable.length > 0) {
            focusable[0].focus();
        } else {
            container.focus();
        }
        
        document.addEventListener('keydown', handleKeyDown);
    }
    
    /**
     * Deactivate the focus trap and restore previous focus
     */
    function deactivate() {
        if (!isActive) return;
        
        isActive = false;
        document.removeEventListener('keydown', handleKeyDown);
        
        // Restore focus to previously focused element
        if (previouslyFocused && typeof previouslyFocused.focus === 'function') {
            previouslyFocused.focus();
        }
        previouslyFocused = null;
    }
    
    return {
        activate,
        deactivate,
        get isActive() { return isActive; }
    };
}

/**
 * Track active focus traps for modal management
 */
const activeFocusTraps = new Map();

/**
 * Activate focus trap for a modal element
 * @param {string|HTMLElement} modalOrId - Modal element or its ID
 */
export function activateFocusTrap(modalOrId) {
    const modal = typeof modalOrId === 'string' 
        ? document.getElementById(modalOrId) 
        : modalOrId;
    
    if (!modal) return null;
    
    // Create or retrieve existing trap
    let trap = activeFocusTraps.get(modal);
    if (!trap) {
        trap = createFocusTrap(modal);
        activeFocusTraps.set(modal, trap);
    }
    
    trap.activate();
    return trap;
}

/**
 * Deactivate focus trap for a modal element
 * @param {string|HTMLElement} modalOrId - Modal element or its ID
 */
export function deactivateFocusTrap(modalOrId) {
    const modal = typeof modalOrId === 'string' 
        ? document.getElementById(modalOrId) 
        : modalOrId;
    
    if (!modal) return;
    
    const trap = activeFocusTraps.get(modal);
    if (trap) {
        trap.deactivate();
    }
}
