/**
 * Data Loader Module
 * Handles fetching and caching of JSON and Markdown data files.
 * 
 * Usage:
 *   import { dataLoader } from './core/data-loader.js';
 *   
 *   // Load JSON data
 *   const medicines = await dataLoader.loadJSON('js/data/medicines.json');
 *   
 *   // Load Markdown content
 *   const backstory = await dataLoader.loadMarkdown('content/backstory/stage01.md');
 *   
 *   // Preload multiple files
 *   await dataLoader.preload([
 *     { type: 'json', path: 'js/data/medicines.json' },
 *     { type: 'json', path: 'js/data/ingredients.json' }
 *   ]);
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

    /**
     * Load and parse a Markdown file
     * @param {string} path - Path to Markdown file
     * @param {boolean} [useCache=true] - Whether to use cached data
     * @returns {Promise<string>} Parsed HTML content
     */
    async loadMarkdown(path, useCache = true) {
        const cacheKey = `md:${path}`;
        
        if (useCache && this.#cache.has(cacheKey)) {
            return this.#cache.get(cacheKey);
        }

        if (this.#pending.has(cacheKey)) {
            return this.#pending.get(cacheKey);
        }

        const promise = (async () => {
            try {
                const response = await fetch(path);
                if (!response.ok) {
                    throw new Error(`Failed to fetch ${path}: ${response.status}`);
                }
                const markdown = await response.text();
                
                // Parse markdown if parser is available
                const html = this.#markdownParser 
                    ? this.#markdownParser(markdown)
                    : markdown;
                
                this.#cache.set(cacheKey, html);
                return html;
            } catch (error) {
                console.error(`Error loading markdown: ${path}`, error);
                return '<p class="error-message">Failed to load content.</p>';
            } finally {
                this.#pending.delete(cacheKey);
            }
        })();

        this.#pending.set(cacheKey, promise);
        return promise;
    }

    /**
     * Load raw text file
     * @param {string} path - Path to text file
     * @param {boolean} [useCache=true] - Whether to use cached data
     * @returns {Promise<string>} File contents
     */
    async loadText(path, useCache = true) {
        const cacheKey = `text:${path}`;
        
        if (useCache && this.#cache.has(cacheKey)) {
            return this.#cache.get(cacheKey);
        }

        try {
            const response = await fetch(path);
            if (!response.ok) {
                throw new Error(`Failed to fetch ${path}: ${response.status}`);
            }
            const text = await response.text();
            this.#cache.set(cacheKey, text);
            return text;
        } catch (error) {
            console.error(`Error loading text: ${path}`, error);
            throw error;
        }
    }

    /**
     * Preload multiple files
     * @param {Array<{type: string, path: string}>} files - Files to preload
     * @returns {Promise<Map<string, *>>} Map of path to data
     */
    async preload(files) {
        const results = new Map();
        
        await Promise.all(files.map(async ({ type, path }) => {
            try {
                let data;
                switch (type) {
                    case 'json':
                        data = await this.loadJSON(path);
                        break;
                    case 'markdown':
                    case 'md':
                        data = await this.loadMarkdown(path);
                        break;
                    case 'text':
                        data = await this.loadText(path);
                        break;
                    default:
                        console.warn(`Unknown file type: ${type}`);
                        return;
                }
                results.set(path, data);
            } catch (error) {
                console.error(`Failed to preload ${path}:`, error);
            }
        }));

        return results;
    }

    /**
     * Clear cache
     * @param {string} [path] - Optional specific path to clear
     */
    clearCache(path) {
        if (path) {
            this.#cache.delete(path);
            this.#cache.delete(`md:${path}`);
            this.#cache.delete(`text:${path}`);
        } else {
            this.#cache.clear();
        }
    }

    /**
     * Check if a path is cached
     * @param {string} path
     * @returns {boolean}
     */
    isCached(path) {
        return this.#cache.has(path) || 
               this.#cache.has(`md:${path}`) || 
               this.#cache.has(`text:${path}`);
    }
}

// Export singleton instance
export const dataLoader = new DataLoader();

// Export class for testing/custom instances
export { DataLoader };
