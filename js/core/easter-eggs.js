/**
 * Easter Eggs Module
 * Hidden surprises for curious visitors.
 */

import { events } from './events.js';
import { debug } from './debug.js';

// Konami Code sequence
const KONAMI_CODE = [
    'ArrowUp', 'ArrowUp',
    'ArrowDown', 'ArrowDown',
    'ArrowLeft', 'ArrowRight',
    'ArrowLeft', 'ArrowRight',
    'KeyB', 'KeyA'
];

// Track user input
let inputSequence = [];
let konamiActivated = false;

// Secret 10th rumor
const SECRET_RUMOR = {
    id: 10,
    text: "She knows you're watching. She doesn't mind.",
    image: "easter_egg.png",
    isSecret: true
};

/**
 * Check if the input sequence matches Konami Code
 */
function checkKonamiCode(key) {
    // Convert key to expected format
    const normalizedKey = key.code || key;
    
    inputSequence.push(normalizedKey);
    
    // Keep only the last N inputs (where N = code length)
    if (inputSequence.length > KONAMI_CODE.length) {
        inputSequence.shift();
    }
    
    // Check if sequence matches
    if (inputSequence.length === KONAMI_CODE.length) {
        const matches = inputSequence.every((key, index) => key === KONAMI_CODE[index]);
        if (matches && !konamiActivated) {
            konamiActivated = true;
            triggerKonamiEasterEgg();
            return true;
        }
    }
    
    return false;
}

/**
 * Play quick sparkle sound effect using Web Audio API
 * Fast, energetic ascending chime
 */
function playSparkleSound() {
    try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const baseTime = audioCtx.currentTime;
        
        // Quick sparkle: C5, E5, G5, C6, E6
        const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51];
        
        notes.forEach((freq, index) => {
            const oscillator = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();
            
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(freq, baseTime);
            
            oscillator.connect(gainNode);
            gainNode.connect(audioCtx.destination);
            
            // Fast timing for quick sparkle
            const noteStart = baseTime + index * 0.06;
            
            gainNode.gain.setValueAtTime(0, noteStart);
            gainNode.gain.linearRampToValueAtTime(0.12, noteStart + 0.01);
            gainNode.gain.exponentialRampToValueAtTime(0.001, noteStart + 0.4);
            
            oscillator.start(noteStart);
            oscillator.stop(noteStart + 0.4);
        });
        
    } catch (e) {
        // Silently fail if Web Audio API is not available
        debug.log('Audio not available:', e.message);
    }
}

/**
 * Create constellation sparkle effect
 */
function createConstellationEffect() {
    const overlay = document.createElement('div');
    overlay.className = 'konami-overlay';
    document.body.appendChild(overlay);
    
    // Create random stars
    const starCount = 30;
    for (let i = 0; i < starCount; i++) {
        const star = document.createElement('div');
        star.className = 'konami-star';
        star.style.left = `${Math.random() * 100}%`;
        star.style.top = `${Math.random() * 100}%`;
        star.style.animationDelay = `${Math.random() * 0.5}s`;
        star.style.setProperty('--scale', 0.5 + Math.random() * 1);
        overlay.appendChild(star);
    }
    
    // Create connecting lines (constellation effect)
    const lineCount = 8;
    for (let i = 0; i < lineCount; i++) {
        const line = document.createElement('div');
        line.className = 'konami-line';
        line.style.left = `${10 + Math.random() * 80}%`;
        line.style.top = `${10 + Math.random() * 80}%`;
        line.style.width = `${50 + Math.random() * 150}px`;
        line.style.transform = `rotate(${Math.random() * 360}deg)`;
        line.style.animationDelay = `${0.2 + Math.random() * 0.3}s`;
        overlay.appendChild(line);
    }
    
    // Remove after animation
    setTimeout(() => {
        overlay.classList.add('konami-overlay--fading');
        setTimeout(() => overlay.remove(), 1000);
    }, 2000);
}

/**
 * Add the secret rumor to the list
 */
function addSecretRumor() {
    const rumorsList = document.getElementById('rumors-list');
    if (!rumorsList) return;
    
    // Check if already added
    if (document.querySelector('.rumor-item--secret')) return;
    
    // Create the secret rumor element
    const rumorEl = document.createElement('div');
    rumorEl.className = 'rumor-item rumor-item--secret';
    rumorEl.setAttribute('data-image', `img/${SECRET_RUMOR.image}`);
    rumorEl.setAttribute('tabindex', '0');
    rumorEl.setAttribute('role', 'button');
    rumorEl.setAttribute('aria-label', `Secret Rumor: ${SECRET_RUMOR.text}`);
    
    rumorEl.innerHTML = `
        <span class="rumor-text">
            <span class="rumor-readable">${SECRET_RUMOR.text}</span>
            <span class="rumor-cipher" aria-hidden="true">${SECRET_RUMOR.text}</span>
        </span>
        <span class="rumor-secret-badge">✧ Secret ✧</span>
    `;
    
    // Add hover effect for gallery crossfade via event (to avoid circular imports)
    rumorEl.addEventListener('mouseenter', () => {
        events.emit('rumor:crossfade', { 
            src: `img/${SECRET_RUMOR.image}` 
        });
    });
    
    // Insert at the end with animation
    rumorEl.style.opacity = '0';
    rumorEl.style.transform = 'translateX(-20px)';
    rumorsList.appendChild(rumorEl);
    
    // Trigger animation
    requestAnimationFrame(() => {
        rumorEl.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        rumorEl.style.opacity = '';
        rumorEl.style.transform = '';
    });
}

/**
 * Trigger the Konami Code easter egg
 */
function triggerKonamiEasterEgg() {
    debug.log('🎮 Konami Code activated!');
    
    // Sound effect
    playSparkleSound();
    
    // Visual effects
    createConstellationEffect();
    
    // Add secret rumor after a delay
    setTimeout(() => {
        addSecretRumor();
        events.emit('easteregg:activated', { type: 'konami' });
    }, 1200);
}

/**
 * Initialize easter egg listeners
 */
export function initEasterEggs() {
    // Listen for keydown events
    document.addEventListener('keydown', (e) => {
        // Only activate on Rumors or Medicine page (unlocked pages)
        const currentPage = document.querySelector('.page.active');
        if (!currentPage) return;
        
        const pageId = currentPage.id;
        if (pageId !== 'rumors-page' && pageId !== 'medicine-page') return;
        
        checkKonamiCode(e);
    });
    
    // Add styles dynamically
    addEasterEggStyles();
}

/**
 * Add CSS styles for easter egg effects
 */
function addEasterEggStyles() {
    if (document.getElementById('easter-egg-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'easter-egg-styles';
    style.textContent = `
        /* Konami Code Overlay */
        .konami-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            pointer-events: none;
            z-index: 9999;
            background: radial-gradient(ellipse at center, rgba(90, 159, 199, 0.1) 0%, transparent 70%);
            animation: konamiFlash 0.3s ease-out;
        }
        
        .konami-overlay--fading {
            animation: konamiFadeOut 1s ease-out forwards;
        }
        
        @keyframes konamiFlash {
            0% { background: radial-gradient(ellipse at center, rgba(126, 184, 218, 0.4) 0%, transparent 60%); }
            100% { background: radial-gradient(ellipse at center, rgba(90, 159, 199, 0.1) 0%, transparent 70%); }
        }
        
        @keyframes konamiFadeOut {
            to { opacity: 0; }
        }
        
        /* Constellation Stars */
        .konami-star {
            position: absolute;
            width: 4px;
            height: 4px;
            background: #7eb8da;
            border-radius: 50%;
            box-shadow: 
                0 0 6px 2px rgba(126, 184, 218, 0.8),
                0 0 12px 4px rgba(126, 184, 218, 0.4),
                0 0 20px 8px rgba(90, 159, 199, 0.2);
            animation: starTwinkle 1.5s ease-in-out infinite;
            transform: scale(var(--scale, 1));
        }
        
        @keyframes starTwinkle {
            0%, 100% { opacity: 0.3; transform: scale(var(--scale, 1)); }
            50% { opacity: 1; transform: scale(calc(var(--scale, 1) * 1.5)); }
        }
        
        /* Constellation Lines */
        .konami-line {
            position: absolute;
            height: 1px;
            background: linear-gradient(90deg, transparent, rgba(126, 184, 218, 0.6), transparent);
            animation: lineAppear 0.8s ease-out forwards;
            opacity: 0;
        }
        
        @keyframes lineAppear {
            0% { opacity: 0; width: 0; }
            50% { opacity: 0.8; }
            100% { opacity: 0.4; }
        }
        
        /* Secret Rumor Styling */
        .rumor-item--secret {
            position: relative;
            background: linear-gradient(135deg, 
                rgba(90, 159, 199, 0.1) 0%, 
                var(--parchment-light) 50%,
                rgba(126, 184, 218, 0.1) 100%
            ) !important;
            border-left-color: #7eb8da !important;
            box-shadow: 
                0 0 20px rgba(126, 184, 218, 0.15),
                inset 0 0 30px rgba(126, 184, 218, 0.05);
        }
        
        .rumor-item--secret::before {
            color: #5a9fc7 !important;
        }
        
        .rumor-item--secret:hover {
            background: linear-gradient(135deg, 
                rgba(90, 159, 199, 0.15) 0%, 
                var(--parchment-cream) 50%,
                rgba(126, 184, 218, 0.15) 100%
            ) !important;
            box-shadow: 
                0 0 30px rgba(126, 184, 218, 0.25),
                0 4px 12px rgba(0, 0, 0, 0.1),
                inset 0 0 40px rgba(126, 184, 218, 0.08);
        }
        
        .rumor-secret-badge {
            position: absolute;
            top: var(--space-xs, 4px);
            right: var(--space-sm, 8px);
            font-family: var(--font-display, 'Uncial Antiqua', serif);
            font-size: 0.7rem;
            color: #5a9fc7;
            letter-spacing: 0.1em;
            opacity: 0.7;
            animation: badgeGlow 2s ease-in-out infinite;
        }
        
        @keyframes badgeGlow {
            0%, 100% { opacity: 0.5; text-shadow: 0 0 4px rgba(126, 184, 218, 0.5); }
            50% { opacity: 0.9; text-shadow: 0 0 8px rgba(126, 184, 218, 0.8); }
        }
        
        /* Secret rumor readable text has a subtle shimmer */
        .rumor-item--secret .rumor-readable {
            background: linear-gradient(90deg, 
                var(--ink-dark) 0%, 
                #5a9fc7 50%, 
                var(--ink-dark) 100%
            );
            background-size: 200% 100%;
            -webkit-background-clip: text;
            background-clip: text;
            animation: textShimmer 3s ease-in-out infinite;
        }
        
        @keyframes textShimmer {
            0%, 100% { background-position: 100% 0; }
            50% { background-position: 0% 0; }
        }
    `;
    
    document.head.appendChild(style);
}

/**
 * Check if Konami Code has been activated
 */
export function isKonamiActivated() {
    return konamiActivated;
}

/**
 * Reset easter egg state (for testing)
 */
export function resetEasterEggs() {
    konamiActivated = false;
    inputSequence = [];
    const secretRumor = document.querySelector('.rumor-item--secret');
    if (secretRumor) secretRumor.remove();
}
