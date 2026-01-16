/**
 * Lightbox Web Component
 * A full-screen image viewer.
 * 
 * Usage:
 *   <light-box id="lightbox"></light-box>
 * 
 * JavaScript:
 *   document.getElementById('lightbox').show('path/to/image.jpg');
 */

const template = document.createElement('template');
template.innerHTML = `
    <style>
        :host {
            display: none;
            position: fixed;
            inset: 0;
            z-index: 2000;
            justify-content: center;
            align-items: center;
            background: rgba(0, 0, 0, 0.95);
            cursor: zoom-out;
        }
        
        :host([open]) {
            display: flex;
        }
        
        .container {
            position: relative;
            max-width: 90vw;
            max-height: 90vh;
            animation: lightbox-enter 0.2s ease-out;
        }
        
        @keyframes lightbox-enter {
            from {
                opacity: 0;
                transform: scale(0.9);
            }
            to {
                opacity: 1;
                transform: scale(1);
            }
        }
        
        img {
            max-width: 100%;
            max-height: 90vh;
            object-fit: contain;
            border-radius: 4px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
        }
        
        .close-btn {
            position: fixed;
            top: 1rem;
            right: 1rem;
            background: rgba(0, 0, 0, 0.5);
            border: none;
            color: white;
            width: 48px;
            height: 48px;
            border-radius: 50%;
            font-size: 1.5rem;
            cursor: pointer;
            transition: background 0.2s;
        }
        
        .close-btn:hover {
            background: rgba(255, 255, 255, 0.1);
        }
        
        .nav-btn {
            position: fixed;
            top: 50%;
            transform: translateY(-50%);
            background: rgba(0, 0, 0, 0.5);
            border: none;
            color: white;
            width: 48px;
            height: 48px;
            border-radius: 50%;
            font-size: 1.5rem;
            cursor: pointer;
            transition: background 0.2s;
        }
        
        .nav-btn:hover {
            background: rgba(255, 255, 255, 0.1);
        }
        
        .nav-btn.prev {
            left: 1rem;
        }
        
        .nav-btn.next {
            right: 1rem;
        }
        
        .nav-btn:disabled {
            opacity: 0.3;
            cursor: not-allowed;
        }
        
        .caption {
            position: fixed;
            bottom: 1rem;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 0, 0, 0.7);
            padding: 0.5rem 1rem;
            border-radius: 4px;
            color: white;
            font-size: 0.9rem;
        }
    </style>
    
    <button class="close-btn" aria-label="Close lightbox">&times;</button>
    <button class="nav-btn prev" aria-label="Previous image">&larr;</button>
    <div class="container">
        <img src="" alt="">
    </div>
    <button class="nav-btn next" aria-label="Next image">&rarr;</button>
    <div class="caption"></div>
`;

export class LightBox extends HTMLElement {
    static get observedAttributes() {
        return ['open'];
    }
    
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.shadowRoot.appendChild(template.content.cloneNode(true));
        
        this._images = [];
        this._currentIndex = 0;
        
        this._handleKeyDown = this._handleKeyDown.bind(this);
    }
    
    connectedCallback() {
        const closeBtn = this.shadowRoot.querySelector('.close-btn');
        const prevBtn = this.shadowRoot.querySelector('.nav-btn.prev');
        const nextBtn = this.shadowRoot.querySelector('.nav-btn.next');
        const container = this.shadowRoot.querySelector('.container');
        
        closeBtn.addEventListener('click', () => this.close());
        prevBtn.addEventListener('click', () => this.prev());
        nextBtn.addEventListener('click', () => this.next());
        container.addEventListener('click', (e) => e.stopPropagation());
        this.addEventListener('click', () => this.close());
        document.addEventListener('keydown', this._handleKeyDown);
        
        this._updateNavButtons();
    }
    
    disconnectedCallback() {
        document.removeEventListener('keydown', this._handleKeyDown);
    }
    
    /**
     * Show a single image
     */
    show(src, caption = '') {
        this._images = [{ src, caption }];
        this._currentIndex = 0;
        this._displayImage();
        this.setAttribute('open', '');
        document.body.style.overflow = 'hidden';
    }
    
    /**
     * Show a gallery of images
     */
    showGallery(images, startIndex = 0) {
        this._images = images;
        this._currentIndex = startIndex;
        this._displayImage();
        this.setAttribute('open', '');
        document.body.style.overflow = 'hidden';
    }
    
    /**
     * Close the lightbox
     */
    close() {
        this.removeAttribute('open');
        document.body.style.overflow = '';
        this.dispatchEvent(new CustomEvent('lightbox-close', { bubbles: true }));
    }
    
    /**
     * Navigate to previous image
     */
    prev() {
        if (this._currentIndex > 0) {
            this._currentIndex--;
            this._displayImage();
        }
    }
    
    /**
     * Navigate to next image
     */
    next() {
        if (this._currentIndex < this._images.length - 1) {
            this._currentIndex++;
            this._displayImage();
        }
    }
    
    get isOpen() {
        return this.hasAttribute('open');
    }
    
    _displayImage() {
        const current = this._images[this._currentIndex];
        if (!current) return;
        
        const img = this.shadowRoot.querySelector('img');
        const caption = this.shadowRoot.querySelector('.caption');
        
        img.src = current.src;
        img.alt = current.caption || '';
        caption.textContent = current.caption || '';
        caption.style.display = current.caption ? 'block' : 'none';
        
        this._updateNavButtons();
    }
    
    _updateNavButtons() {
        const prevBtn = this.shadowRoot.querySelector('.nav-btn.prev');
        const nextBtn = this.shadowRoot.querySelector('.nav-btn.next');
        
        const hasMultiple = this._images.length > 1;
        prevBtn.style.display = hasMultiple ? 'block' : 'none';
        nextBtn.style.display = hasMultiple ? 'block' : 'none';
        
        if (hasMultiple) {
            prevBtn.disabled = this._currentIndex === 0;
            nextBtn.disabled = this._currentIndex === this._images.length - 1;
        }
    }
    
    _handleKeyDown(e) {
        if (!this.isOpen) return;
        
        switch (e.key) {
            case 'Escape':
                this.close();
                break;
            case 'ArrowLeft':
                this.prev();
                break;
            case 'ArrowRight':
                this.next();
                break;
        }
    }
}

// Register the component
customElements.define('light-box', LightBox);
