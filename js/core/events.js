/**
 * Event Bus Module
 * A simple pub/sub event system for component communication.
 * 
 * Usage:
 *   import { events } from './core/events.js';
 *   
 *   // Subscribe to events
 *   events.on('medicine:selected', (medicine) => {
 *     console.log('Medicine selected:', medicine);
 *   });
 *   
 *   // Emit events
 *   events.emit('medicine:selected', medicineData);
 *   
 *   // One-time listener
 *   events.once('app:ready', () => {
 *     console.log('App is ready!');
 *   });
 */

class EventBus {
    #listeners = new Map();

    /**
     * Subscribe to an event
     * @param {string} event - Event name
     * @param {Function} callback - Event handler
     * @returns {Function} Unsubscribe function
     */
    on(event, callback) {
        if (!this.#listeners.has(event)) {
            this.#listeners.set(event, new Set());
        }
        this.#listeners.get(event).add(callback);

        // Return unsubscribe function
        return () => this.off(event, callback);
    }

    /**
     * Subscribe to an event once
     * @param {string} event - Event name
     * @param {Function} callback - Event handler
     * @returns {Function} Unsubscribe function
     */
    once(event, callback) {
        const wrapper = (...args) => {
            this.off(event, wrapper);
            callback(...args);
        };
        return this.on(event, wrapper);
    }

    /**
     * Unsubscribe from an event
     * @param {string} event - Event name
     * @param {Function} callback - Event handler to remove
     */
    off(event, callback) {
        const listeners = this.#listeners.get(event);
        if (listeners) {
            listeners.delete(callback);
        }
    }

    /**
     * Emit an event
     * @param {string} event - Event name
     * @param {...*} args - Arguments to pass to handlers
     */
    emit(event, ...args) {
        const listeners = this.#listeners.get(event);
        if (listeners) {
            listeners.forEach(callback => {
                try {
                    callback(...args);
                } catch (error) {
                    console.error(`Error in event handler for "${event}":`, error);
                }
            });
        }
    }

    /**
     * Remove all listeners for an event (or all events)
     * @param {string} [event] - Optional event name
     */
    clear(event) {
        if (event) {
            this.#listeners.delete(event);
        } else {
            this.#listeners.clear();
        }
    }

    /**
     * Get listener count for debugging
     * @param {string} [event] - Optional event name
     * @returns {number} Number of listeners
     */
    listenerCount(event) {
        if (event) {
            const listeners = this.#listeners.get(event);
            return listeners ? listeners.size : 0;
        }
        let count = 0;
        this.#listeners.forEach(set => count += set.size);
        return count;
    }
}

// Export singleton instance
export const events = new EventBus();

// Export class for testing/custom instances
export { EventBus };
