/**
 * Rumors Page Controller
 * Handles loading and rendering of rumors with hover effects.
 */

import { dataLoader } from '../core/data-loader.js';
import { events } from '../core/events.js';
import { icons } from '../core/icons.js';

// Private state
let rumorsData = null;

// Banner pan animation state (module-level singleton)
let bannerPanState = null;

// Gallery crossfade state
let galleryCrossfadeState = null;

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
 * Setup hover effects to swap gallery image with smooth crossfade
 */
export function setupRumorHoverEffects() {
    const rumorItems = document.querySelectorAll('.rumor-item');
    const galleryContainer = document.getElementById('rumors-gallery-container');
    const imageA = document.getElementById('rumors-gallery-image-a');
    const imageB = document.getElementById('rumors-gallery-image-b');
    
    if (!imageA || !imageB || !galleryContainer) return;
    
    // Initialize crossfade state
    galleryCrossfadeState = {
        activeImage: imageA,
        inactiveImage: imageB,
        currentSrc: imageA.src,
        isTransitioning: false
    };
    
    rumorItems.forEach(item => {
        item.addEventListener('mouseenter', () => {
            const newImageSrc = item.dataset.image;
            crossfadeToImage(newImageSrc, galleryContainer);
        });
    });
    
    // Setup banner pan effect
    setupBannerPanEffect();
}

/**
 * Crossfade to a new image with smooth transition
 */
function crossfadeToImage(newSrc, container) {
    const state = galleryCrossfadeState;
    if (!state || !newSrc) return;
    
    // Skip if already showing this image
    if (state.currentSrc === newSrc || state.currentSrc.endsWith(newSrc)) return;
    
    // Skip if we're mid-transition to the same image
    if (state.pendingSrc === newSrc) return;
    
    state.pendingSrc = newSrc;
    
    // Preload the new image before transitioning
    const preloadImg = new Image();
    preloadImg.onload = () => {
        // Check if this is still the pending image (user might have moved to another)
        if (state.pendingSrc !== newSrc) return;
        
        // Set the new image on the inactive (hidden) layer
        state.inactiveImage.src = newSrc;
        
        // Force browser to acknowledge the new src before animating
        // This prevents flash of broken image
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                // Fade through black: outgoing fades out immediately,
                // incoming fades in with delay (via CSS class)
                state.inactiveImage.classList.add('rumors-gallery-image--entering');
                state.inactiveImage.classList.remove('rumors-gallery-image--hidden');
                state.activeImage.classList.add('rumors-gallery-image--hidden');
                state.activeImage.classList.remove('rumors-gallery-image--entering');
                
                // Swap references for next transition
                const temp = state.activeImage;
                state.activeImage = state.inactiveImage;
                state.inactiveImage = temp;
                
                // Update state
                state.currentSrc = newSrc;
                state.pendingSrc = null;
                
                // Update lightbox data
                if (container) {
                    container.dataset.lightbox = newSrc;
                }
                
                // Clean up the entering class after transition completes
                setTimeout(() => {
                    state.activeImage.classList.remove('rumors-gallery-image--entering');
                }, 1400); // 0.5s delay + 0.8s transition + buffer
            });
        });
    };
    
    // Handle load errors gracefully
    preloadImg.onerror = () => {
        state.pendingSrc = null;
    };
    
    preloadImg.src = newSrc;
}

/**
 * Setup banner panning animation with smooth return
 * Uses JavaScript-controlled animation to allow seamless re-entry
 * Uses module-level singleton to prevent duplicate event listeners
 */
function setupBannerPanEffect() {
    const hero = document.querySelector('.rumors-hero');
    const heroImage = document.querySelector('.rumors-hero-image');
    
    if (!hero || !heroImage) return;
    
    // Check if already set up on this element
    if (bannerPanState && bannerPanState.hero === hero) {
        return; // Already initialized for this element
    }
    
    // Clean up any previous state
    if (bannerPanState) {
        // Cancel any running animation
        if (bannerPanState.animationId) {
            cancelAnimationFrame(bannerPanState.animationId);
        }
        // Remove old event listeners
        if (bannerPanState.hero && bannerPanState.handlers) {
            bannerPanState.hero.removeEventListener('mouseenter', bannerPanState.handlers.mouseenter);
            bannerPanState.hero.removeEventListener('mouseleave', bannerPanState.handlers.mouseleave);
        }
    }
    
    // Animation constants
    const minY = 5;
    const maxY = 100;
    const panSpeed = 0.13; // Percentage per frame (~8 seconds for full pan at 60fps)
    const returnSpeed = 0.08; // Slower return speed
    
    // Initialize state
    bannerPanState = {
        hero: hero,
        heroImage: heroImage,
        animationId: null,
        isHovering: false,
        currentY: minY,
        direction: 1, // 1 = moving down, -1 = moving up
        handlers: null
    };
    
    /**
     * Animate the banner panning
     */
    function animatePan() {
        const state = bannerPanState;
        if (!state || state.hero !== hero) return; // State was replaced
        
        if (state.isHovering) {
            // Pan up and down
            state.currentY += panSpeed * state.direction;
            
            if (state.currentY >= maxY) {
                state.currentY = maxY;
                state.direction = -1;
            } else if (state.currentY <= minY) {
                state.currentY = minY;
                state.direction = 1;
            }
            
            heroImage.style.objectPosition = `center ${state.currentY}%`;
            state.animationId = requestAnimationFrame(animatePan);
        } else {
            // Return to rest position
            if (Math.abs(state.currentY - minY) > 0.1) {
                state.currentY += (minY - state.currentY) * returnSpeed;
                heroImage.style.objectPosition = `center ${state.currentY}%`;
                state.animationId = requestAnimationFrame(animatePan);
            } else {
                // Snap to final position and stop
                state.currentY = minY;
                heroImage.style.objectPosition = `center ${minY}%`;
                state.animationId = null;
            }
        }
    }
    
    /**
     * Start or resume animation
     */
    function startAnimation() {
        const state = bannerPanState;
        if (!state || state.hero !== hero) return;
        
        if (state.animationId === null) {
            state.animationId = requestAnimationFrame(animatePan);
        }
    }
    
    // Create named handlers so we can remove them later
    const handlers = {
        mouseenter: () => {
            if (bannerPanState && bannerPanState.hero === hero) {
                bannerPanState.isHovering = true;
                startAnimation();
            }
        },
        mouseleave: () => {
            if (bannerPanState && bannerPanState.hero === hero) {
                bannerPanState.isHovering = false;
                startAnimation();
            }
        }
    };
    
    bannerPanState.handlers = handlers;
    hero.addEventListener('mouseenter', handlers.mouseenter);
    hero.addEventListener('mouseleave', handlers.mouseleave);
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
