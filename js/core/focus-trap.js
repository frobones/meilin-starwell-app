/**
 * Focus Trap Utility
 * Traps keyboard focus within a container for accessibility.
 *
 * Traps stack: when a dialog opens on top of another (a flora card over the
 * medicine modal), only the topmost trap handles Tab and Escape. Otherwise the
 * lower trap would see focus "outside" itself and pull it back down.
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

/** Active traps, oldest first; the last entry is the one the user sees. */
const trapStack = [];

/**
 * Create a focus trap for a container element
 * @param {HTMLElement} container - The element to trap focus within
 * @param {Function} [onEscape] - Called when Escape is pressed while this trap is on top
 * @returns {Object} Focus trap controller with activate/deactivate methods
 */
export function createFocusTrap(container, onEscape) {
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
     * Keep Tab inside the container; route Escape to the owner's close function
     */
    function handleKeyDown(e) {
        if (e.key === 'Escape') {
            if (onEscape) {
                e.preventDefault();
                onEscape();
            }
            return;
        }
        if (e.key !== 'Tab') return;

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
        trapStack.push(controller);

        // Controls styled with `transition: all` fade their inherited visibility
        // in, so they can't take focus at the instant the dialog opens. Try now,
        // then again as each transition inside the dialog finishes.
        if (!focusFirst()) {
            container.addEventListener('transitionend', retryFocus);
        }
    }

    /**
     * Focus the first visible focusable element
     * @returns {boolean} Whether focus landed inside the container
     */
    function focusFirst() {
        const focusable = getFocusableElements();
        if (focusable.length === 0) return false;
        focusable[0].focus();
        return container.contains(document.activeElement);
    }

    function retryFocus() {
        if (!isActive || focusFirst()) {
            container.removeEventListener('transitionend', retryFocus);
        }
    }

    /**
     * Deactivate the focus trap and restore previous focus
     */
    function deactivate() {
        if (!isActive) return;

        isActive = false;
        container.removeEventListener('transitionend', retryFocus);
        const index = trapStack.indexOf(controller);
        if (index !== -1) trapStack.splice(index, 1);

        // Restore focus to previously focused element
        if (previouslyFocused && typeof previouslyFocused.focus === 'function') {
            previouslyFocused.focus();
        }
        // If the opener couldn't take focus back (a plain div card, or body),
        // don't leave focus on a control inside the now-hidden dialog
        if (container.contains(document.activeElement)) {
            document.activeElement.blur();
        }
        previouslyFocused = null;
    }

    const controller = {
        activate,
        deactivate,
        handleKeyDown,
        get isActive() { return isActive; }
    };
    return controller;
}

// One listener for all traps: only the topmost trap reacts to a key
document.addEventListener('keydown', (e) => {
    const top = trapStack[trapStack.length - 1];
    if (top) top.handleKeyDown(e);
});

/**
 * Track active focus traps for modal management
 */
const activeFocusTraps = new Map();

/**
 * Activate focus trap for a modal element
 * @param {string|HTMLElement} modalOrId - Modal element or its ID
 * @param {Function} [onEscape] - Close function to run when Escape is pressed on top
 */
export function activateFocusTrap(modalOrId, onEscape) {
    const modal = typeof modalOrId === 'string'
        ? document.getElementById(modalOrId)
        : modalOrId;

    if (!modal) return null;

    // Create or retrieve existing trap
    let trap = activeFocusTraps.get(modal);
    if (!trap) {
        trap = createFocusTrap(modal, onEscape);
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
        // Dialogs built on the fly are removed after closing; don't keep them alive
        activeFocusTraps.delete(modal);
    }
}
