/**
 * Rumors Page Controller
 * Handles loading and rendering of rumors with hover effects.
 */

import { dataLoader } from '../core/data-loader.js';
import { events } from '../core/events.js';
import { icons } from '../core/icons.js';

// Private state
let rumorsData = null;

/**
 * Load rumors content from JSON
 */
export async function loadRumors() {
    try {
        rumorsData = await dataLoader.loadJSON('content/rumors.json?v=' + Date.now(), false);
        renderRumors();
        events.emit('rumors:loaded', rumorsData);
    } catch (error) {
        console.error('Failed to load rumors:', error);
    }
}

/**
 * Render the rumors list
 */
export function renderRumors() {
    const container = document.getElementById('rumors-list');
    if (!container || !rumorsData) return;
    
    container.innerHTML = rumorsData.rumors.map(rumor => `
        <div class="rumor-item" data-image="img/${rumor.image}">
            <span class="rumor-text">
                <span class="rumor-readable">${rumor.text}</span>
                <span class="rumor-cipher" aria-hidden="true">${rumor.text}</span>
            </span>
        </div>
    `).join('');
    
    setupRumorHoverEffects();
    icons.refresh();
}

/**
 * Setup hover effects to swap gallery image
 */
export function setupRumorHoverEffects() {
    const rumorItems = document.querySelectorAll('.rumor-item');
    const galleryImage = document.getElementById('rumors-gallery-image');
    const galleryContainer = document.getElementById('rumors-gallery-container');
    
    if (!galleryImage || !galleryContainer) return;
    
    rumorItems.forEach(item => {
        item.addEventListener('mouseenter', () => {
            const newImage = item.dataset.image;
            if (newImage && galleryImage.src !== newImage) {
                galleryImage.style.opacity = '0';
                setTimeout(() => {
                    galleryImage.src = newImage;
                    galleryContainer.dataset.lightbox = newImage;
                    galleryImage.style.opacity = '1';
                }, 150);
            }
        });
    });
    
    // Setup banner pan effect
    setupBannerPanEffect();
}

/**
 * Setup banner panning animation with smooth return
 */
function setupBannerPanEffect() {
    const hero = document.querySelector('.rumors-hero');
    const heroImage = document.querySelector('.rumors-hero-image');
    
    if (!hero || !heroImage) return;
    
    hero.addEventListener('mouseenter', () => {
        // Clear any inline styles from previous return transition
        heroImage.style.objectPosition = '';
        heroImage.classList.add('panning');
    });
    
    hero.addEventListener('mouseleave', () => {
        // Get current computed position before removing animation
        const computedStyle = getComputedStyle(heroImage);
        const currentPosition = computedStyle.objectPosition;
        
        // Remove the animation class
        heroImage.classList.remove('panning');
        
        // Set the current position as inline style to prevent snap
        heroImage.style.objectPosition = currentPosition;
        
        // Force reflow to ensure the inline style is applied
        heroImage.offsetHeight;
        
        // Transition back to default position
        heroImage.style.objectPosition = 'center 5%';
    });
}

/**
 * Get current rumors data
 */
export function getRumorsData() {
    return rumorsData;
}

// Listen for page change events
events.on('page:change', ({ page }) => {
    if (page === 'rumors' && !rumorsData) {
        loadRumors();
    }
});
