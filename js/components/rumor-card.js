/**
 * Rumor Card Web Component
 * Displays a rumor with cipher text effect.
 * 
 * Usage:
 *   <rumor-card text="Some mysterious rumor text" image="img/rumor.png"></rumor-card>
 */

const template = document.createElement('template');
template.innerHTML = `
    <style>
        :host {
            display: block;
            background: var(--color-surface, #1a1a1a);
            border: 1px solid var(--color-border, #333);
            border-radius: 8px;
            padding: 1rem;
            cursor: pointer;
            transition: border-color 0.2s, box-shadow 0.2s;
            position: relative;
        }
        
        :host(:hover) {
            border-color: var(--color-accent, #d4af37);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        }
        
        .text-container {
            position: relative;
            line-height: 1.6;
        }
        
        .readable {
            display: block;
            color: var(--color-text, #fff);
            transition: opacity 0.2s, mask-image 0.2s;
            -webkit-mask-image: linear-gradient(to right, black 0%, black 25%, transparent 40%);
            mask-image: linear-gradient(to right, black 0%, black 25%, transparent 40%);
        }
        
        .cipher {
            position: absolute;
            inset: 0;
            font-family: 'Redacted Script', cursive;
            color: var(--color-text-muted, #888);
            opacity: 1;
            transition: opacity 0.15s, filter 0.15s;
            pointer-events: none;
            -webkit-mask-image: linear-gradient(to right, transparent 0%, transparent 20%, black 35%, black 100%);
            mask-image: linear-gradient(to right, transparent 0%, transparent 20%, black 35%, black 100%);
        }
        
        :host(:hover) .readable {
            -webkit-mask-image: none;
            mask-image: none;
        }
        
        :host(:hover) .cipher {
            opacity: 0;
            filter: blur(2px);
        }
        
        :host([revealed]) .readable {
            -webkit-mask-image: none;
            mask-image: none;
        }
        
        :host([revealed]) .cipher {
            display: none;
        }
    </style>
    
    <div class="text-container" part="text">
        <span class="readable" part="readable"></span>
        <span class="cipher" aria-hidden="true" part="cipher"></span>
    </div>
`;

export class RumorCard extends HTMLElement {
    static get observedAttributes() {
        return ['text', 'image', 'revealed'];
    }
    
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.shadowRoot.appendChild(template.content.cloneNode(true));
    }
    
    connectedCallback() {
        this._render();
        this.addEventListener('mouseenter', this._handleMouseEnter.bind(this));
        this.addEventListener('mouseleave', this._handleMouseLeave.bind(this));
    }
    
    attributeChangedCallback() {
        if (this.shadowRoot) {
            this._render();
        }
    }
    
    _render() {
        const text = this.getAttribute('text') || '';
        
        this.shadowRoot.querySelector('.readable').textContent = text;
        this.shadowRoot.querySelector('.cipher').textContent = text;
    }
    
    _handleMouseEnter() {
        const image = this.getAttribute('image');
        if (image) {
            this.dispatchEvent(new CustomEvent('rumor-hover', {
                bubbles: true,
                composed: true,
                detail: { image }
            }));
        }
    }
    
    _handleMouseLeave() {
        this.dispatchEvent(new CustomEvent('rumor-leave', {
            bubbles: true,
            composed: true
        }));
    }
    
    /**
     * Reveal the full rumor text
     */
    reveal() {
        this.setAttribute('revealed', '');
    }
    
    /**
     * Hide the rumor text (show cipher)
     */
    hide() {
        this.removeAttribute('revealed');
    }
}

// Register the component
customElements.define('rumor-card', RumorCard);
