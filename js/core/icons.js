/**
 * Icons Module
 * Wrapper for Lucide icon management.
 * 
 * Usage:
 *   import { icons } from './core/icons.js';
 *   
 *   // Refresh icons after dynamic content update
 *   icons.refresh();
 *   
 *   // Create an icon element
 *   const iconHtml = icons.create('user', { size: 24 });
 */

class IconManager {
    #initialized = false;

    /**
     * Initialize icons on page load
     */
    init() {
        if (this.#initialized) return;
        
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
            this.#initialized = true;
        } else {
            console.warn('Lucide icons not loaded');
        }
    }

    /**
     * Refresh icons after dynamic content is added
     * Call this after rendering dynamic HTML that contains data-lucide attributes
     */
    refresh() {
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }

    /**
     * Create an icon HTML string
     * @param {string} name - Icon name (e.g., 'user', 'book-open')
     * @param {Object} [options] - Optional attributes
     * @param {number} [options.size] - Icon size
     * @param {string} [options.class] - Additional CSS classes
     * @returns {string} HTML string for the icon
     */
    create(name, options = {}) {
        const attrs = [];
        attrs.push(`data-lucide="${name}"`);
        
        if (options.size) {
            attrs.push(`width="${options.size}"`);
            attrs.push(`height="${options.size}"`);
        }
        
        if (options.class) {
            attrs.push(`class="${options.class}"`);
        }
        
        return `<i ${attrs.join(' ')}></i>`;
    }

    /**
     * Check if lucide is available
     * @returns {boolean}
     */
    isAvailable() {
        return typeof lucide !== 'undefined';
    }
}

// Export singleton instance
export const icons = new IconManager();

// Export class for testing/custom instances
export { IconManager };
