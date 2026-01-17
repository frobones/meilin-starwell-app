/**
 * Debug Utility Module
 * 
 * Provides gated console logging that can be enabled/disabled.
 * In production, debug logs are suppressed. Enable by setting
 * localStorage.debug = 'true' or window.DEBUG = true.
 */

/**
 * Check if debug mode is enabled
 * @returns {boolean}
 */
function isDebugEnabled() {
    // Check window flag first (for programmatic control)
    if (typeof window !== 'undefined' && window.DEBUG === true) {
        return true;
    }
    
    // Check localStorage (for persistent user preference)
    try {
        return localStorage.getItem('debug') === 'true';
    } catch {
        return false;
    }
}

/**
 * Debug logger that only outputs when debug mode is enabled
 */
export const debug = {
    /**
     * Log a debug message (only in debug mode)
     */
    log(...args) {
        if (isDebugEnabled()) {
            console.log(...args);
        }
    },
    
    /**
     * Log a warning (always, but prefixed for clarity)
     */
    warn(...args) {
        console.warn(...args);
    },
    
    /**
     * Log an error (always)
     */
    error(...args) {
        console.error(...args);
    },
    
    /**
     * Log info (only in debug mode)
     */
    info(...args) {
        if (isDebugEnabled()) {
            console.info(...args);
        }
    },
    
    /**
     * Enable debug mode
     */
    enable() {
        try {
            localStorage.setItem('debug', 'true');
        } catch {
            // localStorage not available
        }
        if (typeof window !== 'undefined') {
            window.DEBUG = true;
        }
        console.log('Debug mode enabled. Refresh to see all debug output.');
    },
    
    /**
     * Disable debug mode
     */
    disable() {
        try {
            localStorage.removeItem('debug');
        } catch {
            // localStorage not available
        }
        if (typeof window !== 'undefined') {
            window.DEBUG = false;
        }
        console.log('Debug mode disabled.');
    }
};

// Expose debug toggle on window for easy access in console
if (typeof window !== 'undefined') {
    window.appDebug = debug;
}
