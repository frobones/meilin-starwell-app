/**
 * Modal Dialog Web Component
 * A reusable modal dialog with customizable content.
 * 
 * Usage:
 *   <modal-dialog id="my-modal">
 *     <h2 slot="title">Modal Title</h2>
 *     <div slot="content">Modal content here</div>
 *   </modal-dialog>
 * 
 * JavaScript:
 *   document.getElementById('my-modal').open();
 *   document.getElementById('my-modal').close();
 */

import { createFocusTrap } from '../core/focus-trap.js';

const template = document.createElement('template');
template.innerHTML = `
    <style>
        :host {
            display: none;
            position: fixed;
            inset: 0;
            z-index: 1000;
            justify-content: center;
            align-items: center;
            padding: 1rem;
        }
        
        :host([open]) {
            display: flex;
        }
        
        .overlay {
            position: absolute;
            inset: 0;
            background: rgba(0, 0, 0, 0.7);
            backdrop-filter: blur(4px);
        }
        
        .dialog {
            position: relative;
            background: var(--color-surface, #1a1a1a);
            border: 1px solid var(--color-border, #333);
            border-radius: 12px;
            max-width: min(90vw, 600px);
            max-height: 85vh;
            overflow: hidden;
            display: flex;
            flex-direction: column;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
            animation: modal-enter 0.2s ease-out;
        }
        
        @keyframes modal-enter {
            from {
                opacity: 0;
                transform: scale(0.95) translateY(-10px);
            }
            to {
                opacity: 1;
                transform: scale(1) translateY(0);
            }
        }
        
        .header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 1rem 1.25rem;
            border-bottom: 1px solid var(--color-border, #333);
        }
        
        .close-btn {
            background: none;
            border: none;
            color: var(--color-text-muted, #888);
            cursor: pointer;
            padding: 0.5rem;
            font-size: 1.5rem;
            line-height: 1;
            transition: color 0.2s;
        }
        
        .close-btn:hover {
            color: var(--color-text, #fff);
        }
        
        .content {
            padding: 1.25rem;
            overflow-y: auto;
            flex: 1;
        }
        
        ::slotted(h2) {
            margin: 0;
            font-size: 1.25rem;
            color: var(--color-text, #fff);
        }
    </style>
    
    <div class="overlay" part="overlay"></div>
    <div class="dialog" role="dialog" aria-modal="true" part="dialog">
        <div class="header" part="header">
            <slot name="title"></slot>
            <button class="close-btn" aria-label="Close modal">&times;</button>
        </div>
        <div class="content" part="content">
            <slot name="content"></slot>
            <slot></slot>
        </div>
    </div>
`;

export class ModalDialog extends HTMLElement {
    static get observedAttributes() {
        return ['open'];
    }
    
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.shadowRoot.appendChild(template.content.cloneNode(true));
        
        this._handleKeyDown = this._handleKeyDown.bind(this);
        this._handleOverlayClick = this._handleOverlayClick.bind(this);
        this._focusTrap = null;
        this._previouslyFocused = null;
    }
    
    connectedCallback() {
        const closeBtn = this.shadowRoot.querySelector('.close-btn');
        const overlay = this.shadowRoot.querySelector('.overlay');
        
        closeBtn.addEventListener('click', () => this.close());
        overlay.addEventListener('click', this._handleOverlayClick);
        document.addEventListener('keydown', this._handleKeyDown);
    }
    
    disconnectedCallback() {
        document.removeEventListener('keydown', this._handleKeyDown);
    }
    
    attributeChangedCallback(name, oldValue, newValue) {
        if (name === 'open') {
            if (newValue !== null) {
                this._onOpen();
            } else {
                this._onClose();
            }
        }
    }
    
    open() {
        this.setAttribute('open', '');
    }
    
    close() {
        this.removeAttribute('open');
    }
    
    get isOpen() {
        return this.hasAttribute('open');
    }
    
    /**
     * Set the modal content dynamically
     */
    setContent(html) {
        const contentSlot = this.querySelector('[slot="content"]');
        if (contentSlot) {
            contentSlot.innerHTML = html;
        } else {
            // Create a content slot element if none exists
            const div = document.createElement('div');
            div.slot = 'content';
            div.innerHTML = html;
            this.appendChild(div);
        }
        
        // Refresh icons if available
        if (window.lucide) {
            window.lucide.createIcons({ icons: window.lucide.icons, nameAttr: 'data-lucide' });
        }
    }
    
    /**
     * Set the modal title dynamically
     */
    setTitle(text) {
        const titleSlot = this.querySelector('[slot="title"]');
        if (titleSlot) {
            titleSlot.textContent = text;
        } else {
            const h2 = document.createElement('h2');
            h2.slot = 'title';
            h2.textContent = text;
            this.appendChild(h2);
        }
    }
    
    _onOpen() {
        document.body.style.overflow = 'hidden';
        this.dispatchEvent(new CustomEvent('modal-open', { bubbles: true }));
        
        // Store previously focused element
        this._previouslyFocused = document.activeElement;
        
        // Create focus trap for the dialog
        const dialog = this.shadowRoot.querySelector('.dialog');
        this._focusTrap = createFocusTrap(dialog);
        this._focusTrap.activate();
    }
    
    _onClose() {
        document.body.style.overflow = '';
        this.dispatchEvent(new CustomEvent('modal-close', { bubbles: true }));
        
        // Deactivate focus trap
        if (this._focusTrap) {
            this._focusTrap.deactivate();
            this._focusTrap = null;
        }
        
        // Restore focus to previously focused element
        if (this._previouslyFocused && typeof this._previouslyFocused.focus === 'function') {
            this._previouslyFocused.focus();
        }
        this._previouslyFocused = null;
    }
    
    _handleKeyDown(e) {
        if (e.key === 'Escape' && this.isOpen) {
            this.close();
        }
    }
    
    _handleOverlayClick(e) {
        if (e.target === e.currentTarget) {
            this.close();
        }
    }
}

// Register the component
customElements.define('modal-dialog', ModalDialog);
