/**
 * Web Components Index
 * Imports and registers all custom elements.
 */

// Import components (they self-register via customElements.define)
import { ModalDialog } from './modal-dialog.js';
import { MedicineCard } from './medicine-card.js';
import { RumorCard } from './rumor-card.js';
import { LightBox } from './lightbox.js';
import { debug } from '../core/debug.js';

// Export for use in other modules
export { ModalDialog, MedicineCard, RumorCard, LightBox };

// Log registration for debugging
debug.log('[Components] Web Components registered: modal-dialog, medicine-card, rumor-card, light-box');
