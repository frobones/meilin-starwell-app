/**
 * Authentication Module
 * Handles passkey system for protected pages.
 */

import { store } from './state.js';
import { events } from './events.js';

const CONFIG = {
    // SHA-256 hash of the passkey (obfuscated for security)
    PASSKEY_HASH: 'e339999870b56a14ec00a640677a673c68e0cb0d88e8115235671f370ef80915',
    STORAGE_KEY: 'meilin-backstory-unlocked',
    PROTECTED_PAGES: ['overview', 'backstory', 'dmtools']
};

/**
 * Hash a string using SHA-256
 */
async function hashString(str) {
    const encoder = new TextEncoder();
    const data = encoder.encode(str.toLowerCase().trim());
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hashBuffer))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
}

/**
 * Check if a page requires authentication
 */
export function isProtectedPage(pageName) {
    return CONFIG.PROTECTED_PAGES.includes(pageName);
}

/**
 * Check if the app is unlocked
 */
export function isUnlocked() {
    return store.get('appUnlocked') === true;
}

/**
 * Check for stored unlock status on init
 */
export function checkStoredUnlock() {
    const stored = localStorage.getItem(CONFIG.STORAGE_KEY);
    const unlocked = stored === 'true';
    store.set('appUnlocked', unlocked);
    return unlocked;
}

/**
 * Verify the passkey (async - uses SHA-256 hash comparison)
 */
export async function verifyPasskey(entered) {
    const hash = await hashString(entered);
    return hash === CONFIG.PASSKEY_HASH;
}

/**
 * Unlock the app
 */
export function unlock() {
    store.set('appUnlocked', true);
    localStorage.setItem(CONFIG.STORAGE_KEY, 'true');
    events.emit('auth:unlocked');
}

/**
 * Show the passkey modal
 */
export function showPasskeyModal() {
    const overlay = document.getElementById('passkey-modal-overlay');
    const input = document.getElementById('passkey-input');
    if (overlay) {
        overlay.classList.add('active');
        if (input) {
            input.value = '';
            input.classList.remove('error');
            input.focus();
        }
        const errorEl = document.getElementById('passkey-error');
        if (errorEl) errorEl.textContent = '';
    }
}

/**
 * Close the passkey modal
 */
export function closePasskeyModal() {
    const overlay = document.getElementById('passkey-modal-overlay');
    if (overlay) {
        overlay.classList.remove('active');
    }
}

/**
 * Cancel passkey entry and navigate to a safe page
 */
export function cancelPasskey() {
    store.set('pendingPage', null);
    closePasskeyModal();
    // Navigate to the default safe page (rumors)
    events.emit('navigate:to', { page: 'rumors' });
}

/**
 * Handle passkey submission (async)
 */
export async function checkPasskey() {
    const input = document.getElementById('passkey-input');
    const errorEl = document.getElementById('passkey-error');
    const entered = input?.value || '';
    
    const isValid = await verifyPasskey(entered);
    
    if (isValid) {
        unlock();
        closePasskeyModal();
        const pendingPage = store.get('pendingPage');
        if (pendingPage) {
            store.set('pendingPage', null);
            events.emit('navigate:to', { page: pendingPage });
        }
        return true;
    } else {
        if (input) input.classList.add('error');
        if (errorEl) errorEl.textContent = 'Incorrect passkey. Try again.';
        return false;
    }
}

/**
 * Bind passkey modal events
 */
export function bindPasskeyEvents() {
    const form = document.getElementById('passkey-form');
    const input = document.getElementById('passkey-input');
    const cancelBtn = document.getElementById('passkey-cancel');
    
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await checkPasskey();
        });
    }
    
    if (input) {
        input.addEventListener('input', () => {
            input.classList.remove('error');
            const errorEl = document.getElementById('passkey-error');
            if (errorEl) errorEl.textContent = '';
        });
    }
    
    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            cancelPasskey();
        });
    }
}

/**
 * Check if navigation to a page should be allowed
 */
export function canNavigateTo(pageName) {
    if (!isProtectedPage(pageName)) return true;
    if (isUnlocked()) return true;
    
    // Store pending page and show modal
    store.set('pendingPage', pageName);
    showPasskeyModal();
    return false;
}

// Listen for passkey required events
events.on('passkey:required', () => {
    showPasskeyModal();
});

