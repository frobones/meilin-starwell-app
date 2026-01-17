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
    
    container.innerHTML = rumorsData.rumors.map((rumor, index) => `
        <div class="rumor-item" 
             data-image="img/${rumor.image}" 
             tabindex="0" 
             role="button"
             aria-label="Rumor ${index + 1}: ${rumor.text.substring(0, 50)}...">
            <span class="rumor-text">
                <span class="rumor-readable">${rumor.text}</span>
                <span class="rumor-cipher" aria-hidden="true">${rumor.text}</span>
            </span>
        </div>
    `).join('');
    
    setupRumorHoverEffects();
    setupRumorKeyboardNavigation();
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
    
    // Setup hotspot tap interactions for mobile
    setupHotspotTapInteractions();
    
    // Setup tap-to-reveal for rumors on mobile
    setupRumorTapToReveal(rumorItems, galleryContainer);
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
 * Setup tap-to-reveal interaction for rumors on mobile devices
 * Tapping a rumor reveals it (like hover) and updates the gallery image
 */
let rumorTapInitialized = false;

function setupRumorTapToReveal(rumorItems, galleryContainer) {
    // Prevent double initialization
    if (rumorTapInitialized) return;
    rumorTapInitialized = true;
    
    let activeRumor = null;
    
    /**
     * Check if we're on a mobile device
     */
    function isMobileView() {
        return window.matchMedia('(max-width: 768px)').matches;
    }
    
    /**
     * Deactivate the currently active rumor
     */
    function deactivateRumor() {
        if (activeRumor) {
            activeRumor.classList.remove('rumor-item--revealed');
            activeRumor = null;
        }
    }
    
    /**
     * Activate a rumor (reveal text and update gallery)
     */
    function activateRumor(item) {
        // If tapping the same rumor, toggle it off
        if (item === activeRumor) {
            deactivateRumor();
            return;
        }
        
        // Deactivate previous
        deactivateRumor();
        
        // Activate new
        item.classList.add('rumor-item--revealed');
        activeRumor = item;
        
        // Update gallery image
        const newImageSrc = item.dataset.image;
        crossfadeToImage(newImageSrc, galleryContainer);
    }
    
    // Handle tap events on rumor items
    rumorItems.forEach(item => {
        item.addEventListener('click', (e) => {
            // Only use tap behavior on mobile
            if (!isMobileView()) return;
            
            e.preventDefault();
            activateRumor(item);
        });
    });
    
    // Close when tapping outside on mobile
    document.addEventListener('click', (e) => {
        if (!isMobileView() || !activeRumor) return;
        
        // Check if click was outside any rumor item
        if (!e.target.closest('.rumor-item')) {
            deactivateRumor();
        }
    });
    
    // Handle orientation/resize changes
    window.matchMedia('(max-width: 768px)').addEventListener('change', () => {
        // Clear active state when switching between mobile/desktop
        deactivateRumor();
    });
}

/**
 * Setup tap-to-toggle interactions for hotspots on mobile devices
 * Creates a backdrop element and handles tap events to show/hide tooltip modals
 * 
 * Note: Because ancestor elements have transforms, position:fixed on the tooltip
 * doesn't work relative to viewport. We solve this by moving the tooltip to body
 * when active, then restoring it when closed.
 */
let hotspotInteractionsInitialized = false;

function setupHotspotTapInteractions() {
    // Prevent double registration of event handlers
    if (hotspotInteractionsInitialized) return;
    
    const turnaroundContainer = document.getElementById('turnaround-container');
    const hotspots = document.querySelectorAll('.hotspot');
    
    if (!turnaroundContainer || hotspots.length === 0) return;
    
    hotspotInteractionsInitialized = true;
    
    // Create backdrop if it doesn't exist
    let backdrop = document.querySelector('.hotspot-backdrop');
    if (!backdrop) {
        backdrop = document.createElement('div');
        backdrop.className = 'hotspot-backdrop';
        document.body.appendChild(backdrop);
    }
    
    // Create a container for the active tooltip modal (appended to body to escape transforms)
    let modalContainer = document.querySelector('.hotspot-modal-container');
    if (!modalContainer) {
        modalContainer = document.createElement('div');
        modalContainer.className = 'hotspot-modal-container';
        document.body.appendChild(modalContainer);
    }
    
    // Track current active hotspot and its original tooltip
    let activeHotspot = null;
    let activeTooltipClone = null;
    let isProcessingClick = false;
    
    // Update hint text for mobile
    const hint = document.querySelector('.turnaround-hint em');
    if (hint && window.matchMedia('(max-width: 768px)').matches) {
        hint.textContent = 'Tap the glowing points to explore details...';
    }
    
    /**
     * Close any active hotspot modal
     */
    function closeActiveHotspot() {
        if (activeHotspot) {
            activeHotspot.classList.remove('active');
        }
        if (activeTooltipClone) {
            activeTooltipClone.remove();
            activeTooltipClone = null;
        }
        // Re-query backdrop to ensure we have the current element
        const currentBackdrop = document.querySelector('.hotspot-backdrop');
        if (currentBackdrop) {
            currentBackdrop.classList.remove('active');
        }
        activeHotspot = null;
    }
    
    /**
     * Open a hotspot modal
     */
    function openHotspot(hotspot) {
        closeActiveHotspot();
        
        // Get the tooltip content
        const tooltip = hotspot.querySelector('.hotspot-tooltip');
        if (!tooltip) return;
        
        // Re-query modal container to ensure we have the current element
        const currentModalContainer = document.querySelector('.hotspot-modal-container');
        if (!currentModalContainer) return;
        
        // Clear any existing modals first (safety cleanup)
        currentModalContainer.innerHTML = '';
        
        // Clone the tooltip and add it to the modal container
        activeTooltipClone = tooltip.cloneNode(true);
        activeTooltipClone.classList.add('hotspot-modal-active');
        // Apply inline styles to ensure proper centering (CSS !important may not override inherited styles)
        activeTooltipClone.style.cssText = `
            position: fixed !important;
            left: 50% !important;
            top: 50% !important;
            transform: translate(-50%, -50%) !important;
            margin: 0 !important;
            z-index: 600 !important;
        `;
        currentModalContainer.appendChild(activeTooltipClone);
        
        // Mark the hotspot as active
        hotspot.classList.add('active');
        
        // Re-query backdrop to ensure we have the current element and add active class
        const currentBackdrop = document.querySelector('.hotspot-backdrop');
        if (currentBackdrop) {
            currentBackdrop.classList.add('active');
        }
        activeHotspot = hotspot;
    }
    
    // Handle hotspot taps
    hotspots.forEach(hotspot => {
        hotspot.addEventListener('click', (e) => {
            // Only use tap behavior on mobile
            if (!window.matchMedia('(max-width: 768px)').matches) return;
            
            e.preventDefault();
            e.stopPropagation();
            
            // Prevent re-entry during click processing
            if (isProcessingClick) return;
            isProcessingClick = true;
            
            try {
                if (hotspot === activeHotspot) {
                    // Clicking the active hotspot closes it
                    closeActiveHotspot();
                } else {
                    openHotspot(hotspot);
                }
            } finally {
                // Use setTimeout to prevent immediate re-trigger
                setTimeout(() => { isProcessingClick = false; }, 50);
            }
        });
    });
    
    // Close on backdrop tap - use setTimeout to avoid immediate trigger
    backdrop.addEventListener('click', (e) => {
        // Only close if the backdrop is actually active (prevents race conditions)
        if (backdrop.classList.contains('active')) {
            e.preventDefault();
            e.stopPropagation();
            closeActiveHotspot();
        }
    });
    
    // Close on escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeActiveHotspot();
        }
    });
    
    // Handle orientation/resize changes
    window.matchMedia('(max-width: 768px)').addEventListener('change', (e) => {
        const hint = document.querySelector('.turnaround-hint em');
        if (hint) {
            hint.textContent = e.matches 
                ? 'Tap the glowing points to explore details...'
                : 'Hover over the glowing points to explore details...';
        }
        // Close any open modal when switching between mobile/desktop
        closeActiveHotspot();
    });
}

/**
 * Setup keyboard navigation for rumors
 * Allows Enter/Space to activate a rumor (reveal text and change image)
 */
function setupRumorKeyboardNavigation() {
    const rumorItems = document.querySelectorAll('.rumor-item');
    const galleryContainer = document.getElementById('rumors-gallery-container');
    
    rumorItems.forEach(item => {
        item.addEventListener('keydown', (e) => {
            // Activate on Enter or Space
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                
                // Toggle revealed state for keyboard users
                const wasRevealed = item.classList.contains('rumor-item--revealed');
                
                // Remove revealed state from all other items
                rumorItems.forEach(other => other.classList.remove('rumor-item--revealed'));
                
                if (!wasRevealed) {
                    item.classList.add('rumor-item--revealed');
                    
                    // Update gallery image
                    const newImageSrc = item.dataset.image;
                    crossfadeToImage(newImageSrc, galleryContainer);
                }
            }
        });
        
        // Also reveal on focus for keyboard navigation
        item.addEventListener('focus', () => {
            const newImageSrc = item.dataset.image;
            crossfadeToImage(newImageSrc, galleryContainer);
        });
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
