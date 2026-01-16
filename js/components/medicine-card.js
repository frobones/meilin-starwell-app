/**
 * Medicine Card Web Component
 * Displays a medicine item in a card format.
 * 
 * Usage:
 *   <medicine-card 
 *     name="Healing Salve"
 *     category="restorative"
 *     difficulty="2"
 *     dc="12"
 *     brief="Heals minor wounds">
 *   </medicine-card>
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
            transition: transform 0.2s, border-color 0.2s, box-shadow 0.2s;
        }
        
        :host(:hover) {
            transform: translateY(-2px);
            border-color: var(--color-accent, #d4af37);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        }
        
        .badges {
            display: flex;
            gap: 0.25rem;
            margin-bottom: 0.5rem;
        }
        
        .badge {
            display: inline-flex;
            align-items: center;
            padding: 0.2rem 0.4rem;
            border-radius: 4px;
            font-size: 0.7rem;
        }
        
        .badge.flora {
            background: rgba(76, 175, 80, 0.2);
            color: #81c784;
        }
        
        .badge.creature {
            background: rgba(244, 67, 54, 0.2);
            color: #e57373;
        }
        
        .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 0.5rem;
        }
        
        .name {
            margin: 0;
            font-size: 1rem;
            font-weight: 600;
            color: var(--color-text, #fff);
        }
        
        .stars {
            font-size: 0.9rem;
            color: var(--color-accent, #d4af37);
        }
        
        .meta {
            display: flex;
            gap: 0.5rem;
            margin-bottom: 0.5rem;
        }
        
        .category {
            padding: 0.2rem 0.5rem;
            border-radius: 4px;
            font-size: 0.7rem;
            text-transform: uppercase;
            background: var(--category-color, #333);
            color: var(--color-text, #fff);
        }
        
        :host([data-category="restorative"]) .category {
            background: rgba(76, 175, 80, 0.2);
            color: #81c784;
        }
        
        :host([data-category="protective"]) .category {
            background: rgba(33, 150, 243, 0.2);
            color: #64b5f6;
        }
        
        :host([data-category="utility"]) .category {
            background: rgba(156, 39, 176, 0.2);
            color: #ba68c8;
        }
        
        :host([data-category="enhancement"]) .category {
            background: rgba(255, 152, 0, 0.2);
            color: #ffb74d;
        }
        
        :host([data-category="poison"]) .category {
            background: rgba(244, 67, 54, 0.2);
            color: #e57373;
        }
        
        .dc {
            padding: 0.2rem 0.5rem;
            border-radius: 4px;
            font-size: 0.7rem;
            background: rgba(255, 255, 255, 0.1);
            color: var(--color-text-muted, #888);
        }
        
        .preview {
            font-size: 0.85rem;
            color: var(--color-text-muted, #888);
            line-height: 1.4;
            margin: 0;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
        }
        
        .variable-indicator {
            color: #ffc107;
            margin-left: 0.25rem;
        }
    </style>
    
    <div class="badges" part="badges"></div>
    <div class="header" part="header">
        <h3 class="name" part="name"></h3>
        <span class="stars" part="stars"></span>
    </div>
    <div class="meta" part="meta">
        <span class="category" part="category"></span>
        <span class="dc" part="dc"></span>
    </div>
    <p class="preview" part="preview"></p>
`;

export class MedicineCard extends HTMLElement {
    static get observedAttributes() {
        return ['name', 'category', 'difficulty', 'dc', 'brief', 'max-stars', 'has-flora', 'has-creature', 'variable-stars'];
    }
    
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.shadowRoot.appendChild(template.content.cloneNode(true));
    }
    
    connectedCallback() {
        this._render();
        this.addEventListener('click', this._handleClick.bind(this));
    }
    
    attributeChangedCallback() {
        if (this.shadowRoot) {
            this._render();
        }
    }
    
    _render() {
        const name = this.getAttribute('name') || '';
        const category = this.getAttribute('category') || '';
        const difficulty = parseInt(this.getAttribute('difficulty') || '1');
        const dc = this.getAttribute('dc') || '';
        const brief = this.getAttribute('brief') || '';
        const maxStars = parseInt(this.getAttribute('max-stars') || '5');
        const hasFlora = this.hasAttribute('has-flora');
        const hasCreature = this.hasAttribute('has-creature');
        const variableStars = this.hasAttribute('variable-stars');
        
        // Update data attribute for CSS styling
        this.setAttribute('data-category', category);
        
        // Render badges
        const badgesEl = this.shadowRoot.querySelector('.badges');
        let badgesHtml = '';
        if (hasFlora) {
            badgesHtml += '<span class="badge flora">🌿</span>';
        }
        if (hasCreature) {
            badgesHtml += '<span class="badge creature">🦴</span>';
        }
        badgesEl.innerHTML = badgesHtml;
        
        // Render stars
        const starsEl = this.shadowRoot.querySelector('.stars');
        const filled = '★'.repeat(difficulty);
        const empty = '☆'.repeat(maxStars - difficulty);
        starsEl.innerHTML = filled + empty + (variableStars ? '<span class="variable-indicator">⚡</span>' : '');
        
        // Render other elements
        this.shadowRoot.querySelector('.name').textContent = name;
        this.shadowRoot.querySelector('.category').textContent = category;
        this.shadowRoot.querySelector('.dc').textContent = `DC ${dc}`;
        this.shadowRoot.querySelector('.preview').textContent = brief;
    }
    
    _handleClick() {
        this.dispatchEvent(new CustomEvent('medicine-select', {
            bubbles: true,
            composed: true,
            detail: {
                id: this.getAttribute('data-id'),
                name: this.getAttribute('name')
            }
        }));
    }
}

// Register the component
customElements.define('medicine-card', MedicineCard);
