/**
 * Router Module
 * Hash-based client-side routing for single-page navigation.
 * 
 * Usage:
 *   import { router } from './core/router.js';
 *   
 *   // Register routes
 *   router.register('overview', () => loadOverviewPage());
 *   router.register('backstory', () => loadBackstoryPage());
 *   
 *   // Navigate programmatically
 *   router.navigate('backstory');
 *   
 *   // Initialize (reads current hash and navigates)
 *   router.init();
 */

import { events } from './events.js';

class Router {
    #routes = new Map();
    #currentRoute = null;
    #defaultRoute = 'rumors';
    #beforeNavigate = null;

    /**
     * Register a route handler
     * @param {string} path - Route path (without #)
     * @param {Function} handler - Handler function called when route is active
     * @returns {Router} For chaining
     */
    register(path, handler) {
        this.#routes.set(path, handler);
        return this;
    }

    /**
     * Set the default route
     * @param {string} path - Default route path
     * @returns {Router} For chaining
     */
    setDefault(path) {
        this.#defaultRoute = path;
        return this;
    }

    /**
     * Set a before-navigate guard
     * @param {Function} guard - Function that can block navigation (return false to block)
     * @returns {Router} For chaining
     */
    setGuard(guard) {
        this.#beforeNavigate = guard;
        return this;
    }

    /**
     * Navigate to a route
     * @param {string} path - Route to navigate to
     * @param {boolean} [updateHash=true] - Whether to update the URL hash
     * @param {Object} [params={}] - Optional parameters to pass to handler
     * @returns {boolean} Whether navigation succeeded
     */
    navigate(path, updateHash = true, params = {}) {
        // Check guard
        if (this.#beforeNavigate) {
            const allowed = this.#beforeNavigate(path, this.#currentRoute);
            if (allowed === false) {
                return false;
            }
        }

        const handler = this.#routes.get(path);
        if (!handler) {
            console.warn(`No route handler for: ${path}`);
            return false;
        }

        const previousRoute = this.#currentRoute;
        this.#currentRoute = path;

        // Update URL hash
        if (updateHash) {
            history.replaceState(null, '', `#${path}`);
        }

        // Emit route change event
        events.emit('route:change', { path, previousRoute, params });

        // Call handler
        try {
            handler(params);
        } catch (error) {
            console.error(`Error in route handler for "${path}":`, error);
        }

        return true;
    }

    /**
     * Get current route
     * @returns {string|null}
     */
    get current() {
        return this.#currentRoute;
    }

    /**
     * Handle hash change events
     * @private
     */
    #handleHashChange = () => {
        const hash = window.location.hash.slice(1) || this.#defaultRoute;
        if (this.#routes.has(hash)) {
            this.navigate(hash, false);
        }
    };

    /**
     * Initialize the router
     * Binds to hashchange and navigates to current/default route
     */
    init() {
        window.addEventListener('hashchange', this.#handleHashChange);
        this.#handleHashChange();
    }

    /**
     * Destroy the router (cleanup)
     */
    destroy() {
        window.removeEventListener('hashchange', this.#handleHashChange);
        this.#routes.clear();
        this.#currentRoute = null;
    }

    /**
     * Check if a route exists
     * @param {string} path
     * @returns {boolean}
     */
    has(path) {
        return this.#routes.has(path);
    }
}

// Export singleton instance
export const router = new Router();

// Export class for testing/custom instances
export { Router };
