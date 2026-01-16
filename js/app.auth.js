/**
 * Meilin's Apothecary - Authentication
 * Passkey system for protected pages
 */
(function(App) {

    /**
     * Check if backstory was previously unlocked
     */
    App.checkStoredUnlock = function() {
        const stored = localStorage.getItem(this.STORAGE_KEY);
        this.appUnlocked = stored === 'true';
    };

    /**
     * Bind passkey modal events
     */
    App.bindPasskeyEvents = function() {
        const form = document.getElementById('passkey-form');
        const input = document.getElementById('passkey-input');
        
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.checkPasskey();
            });
        }
        
        // Clear error when typing
        if (input) {
            input.addEventListener('input', () => {
                input.classList.remove('error');
                document.getElementById('passkey-error').textContent = '';
            });
        }
    };

    /**
     * Show the passkey modal
     */
    App.showPasskeyModal = function() {
        const overlay = document.getElementById('passkey-modal-overlay');
        const input = document.getElementById('passkey-input');
        if (overlay) {
            overlay.classList.add('active');
            if (input) {
                input.value = '';
                input.classList.remove('error');
                input.focus();
            }
            document.getElementById('passkey-error').textContent = '';
        }
    };

    /**
     * Close the passkey modal
     */
    App.closePasskeyModal = function() {
        const overlay = document.getElementById('passkey-modal-overlay');
        if (overlay) {
            overlay.classList.remove('active');
        }
    };

    /**
     * Check the entered passkey
     */
    App.checkPasskey = function() {
        const input = document.getElementById('passkey-input');
        const errorEl = document.getElementById('passkey-error');
        const entered = input.value.toLowerCase().trim();
        
        if (entered === this.PASSKEY.toLowerCase()) {
            // Correct passkey
            this.appUnlocked = true;
            localStorage.setItem(this.STORAGE_KEY, 'true');
            this.closePasskeyModal();
            this.switchPage(this.pendingPage || 'medicine');
        } else {
            // Wrong passkey
            input.classList.add('error');
            errorEl.textContent = 'Incorrect passkey. Try again.';
        }
    };

})(window.App = window.App || {});
