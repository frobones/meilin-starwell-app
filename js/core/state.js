/**
 * State Management Module
 * A simple observable store for managing application state.
 * 
 * Usage:
 *   import { store } from './core/state.js';
 *   
 *   // Set state
 *   store.set('medicines', [...]);
 *   
 *   // Get state
 *   const medicines = store.get('medicines');
 *   
 *   // Subscribe to changes
 *   store.subscribe('medicines', (newValue) => {
 *     console.log('Medicines updated:', newValue);
 *   });
 */

class Store {
    #state = {};
    #listeners = new Map();

    /**
     * Get a value from the store
     * @param {string} key - The state key
     * @returns {*} The stored value
     */
    get(key) {
        return this.#state[key];
    }

    /**
     * Set a value in the store and notify listeners
     * @param {string} key - The state key
     * @param {*} value - The value to store
     */
    set(key, value) {
        const oldValue = this.#state[key];
        this.#state[key] = value;
        this.#notify(key, value, oldValue);
    }

    /**
     * Update a value using a function
     * @param {string} key - The state key
     * @param {Function} updater - Function that receives current value and returns new value
     */
    update(key, updater) {
        const currentValue = this.#state[key];
        const newValue = updater(currentValue);
        this.set(key, newValue);
    }

    /**
     * Subscribe to state changes
     * @param {string} key - The state key to watch
     * @param {Function} callback - Function to call when value changes
     * @returns {Function} Unsubscribe function
     */
    subscribe(key, callback) {
        if (!this.#listeners.has(key)) {
            this.#listeners.set(key, new Set());
        }
        this.#listeners.get(key).add(callback);
        
        // Return unsubscribe function
        return () => {
            const listeners = this.#listeners.get(key);
            if (listeners) {
                listeners.delete(callback);
            }
        };
    }

    /**
     * Notify all listeners for a key
     * @private
     */
    #notify(key, newValue, oldValue) {
        const listeners = this.#listeners.get(key);
        if (listeners) {
            listeners.forEach(callback => {
                try {
                    callback(newValue, oldValue);
                } catch (error) {
                    console.error(`Error in state listener for "${key}":`, error);
                }
            });
        }
    }

    /**
     * Get all state (for debugging)
     * @returns {Object} A shallow copy of all state
     */
    getAll() {
        return { ...this.#state };
    }

    /**
     * Clear all state
     */
    clear() {
        this.#state = {};
    }
}

// Export singleton instance
export const store = new Store();

// Export class for testing/custom instances
export { Store };
