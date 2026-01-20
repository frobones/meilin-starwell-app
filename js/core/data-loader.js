/**
 * Data Loader Module
 * Handles fetching and caching of JSON data files.
 * 
 * Usage:
 *   import { dataLoader } from './core/data-loader.js';
 *   
 *   // Load JSON data
 *   const medicines = await dataLoader.loadJSON('js/data/medicines.json');
 */

class DataLoader {
    #cache = new Map();
    #pending = new Map();
    #markdownParser = null;

    /**
     * Set the markdown parser (e.g., marked.parse)
     * @param {Function} parser - Function that converts markdown to HTML
     */
    setMarkdownParser(parser) {
        this.#markdownParser = parser;
    }

    /**
     * Get the markdown parser
     * @returns {Function|null} The markdown parser function
     */
    getMarkdownParser() {
        return this.#markdownParser;
    }

    /**
     * Load a JSON file
     * @param {string} path - Path to JSON file
     * @param {boolean} [useCache=true] - Whether to use cached data
     * @returns {Promise<*>} Parsed JSON data
     */
    async loadJSON(path, useCache = true) {
        if (useCache && this.#cache.has(path)) {
            return this.#cache.get(path);
        }

        // Handle concurrent requests
        if (this.#pending.has(path)) {
            return this.#pending.get(path);
        }

        const promise = (async () => {
            try {
                const response = await fetch(path);
                if (!response.ok) {
                    throw new Error(`Failed to fetch ${path}: ${response.status}`);
                }
                const data = await response.json();
                this.#cache.set(path, data);
                return data;
            } finally {
                this.#pending.delete(path);
            }
        })();

        this.#pending.set(path, promise);
        return promise;
    }
}

// Export singleton instance
export const dataLoader = new DataLoader();

// Export class for testing/custom instances
export { DataLoader };
