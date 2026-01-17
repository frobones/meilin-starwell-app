/**
 * Vignettes Page Controller
 * Handles vignette loading and modal display.
 */

import { dataLoader } from '../core/data-loader.js';
import { events } from '../core/events.js';
import { icons } from '../core/icons.js';

// Private state
let vignettes = [];

const VIGNETTE_FILES = [
    {
        file: 'Meilin Starwell - Vignette 01 - First bolt.md',
        number: '01',
        title: 'First Bolt',
        skills: ['Hand Crossbow'],
        cardBrief: 'Meilin reads Oona\'s trembling hands, catalogs the threat\'s body language like a triage assessment, and fires with control when violence becomes unavoidable.'
    },
    {
        file: 'Meilin Starwell - Vignette 02 - Vex lesson.md',
        number: '02',
        title: 'Vex Lesson',
        skills: ['Weapon Mastery (Vex)', 'Sneak Attack'],
        cardBrief: 'Theo drills Meilin until the crossbow becomes procedure, not performance. She learns to strike when attention is split: exploit the flinch, hit when the target is already compromised.'
    },
    {
        file: 'Meilin Starwell - Vignette 03 - Cant notes.md',
        number: '03',
        title: 'Cant Notes',
        skills: ['Thieves\' Cant'],
        cardBrief: 'Meilin learns the Bazaar\'s under-language by treating it like symptoms: repeated phrases, chalk marks, pauses that don\'t match the words.'
    },
    {
        file: 'Meilin Starwell - Vignette 04 - Theo Lockwell, quiet preparation.md',
        number: '04',
        title: 'Theo Lockwell',
        skills: ['Thieves\' Tools'],
        cardBrief: 'Theo teaches Meilin that speed is a symptom, not a virtue. She practices locks like medicine: documenting errors, slowing down under stress, calm hands as the first survival skill.'
    },
    {
        file: 'Meilin Starwell - Vignette 05 - The tell, the pause.md',
        number: '05',
        title: 'The Tell, the Pause',
        skills: ['Investigation', 'Insight'],
        cardBrief: 'Meilin reads micro-tells: the pause before a lie, the hand that betrays, and where a person\'s eyes go first. She learns that people look first where their work lives.'
    },
    {
        file: 'Meilin Starwell - Vignette 06 - A polite lie in Undercommon.md',
        number: '06',
        title: 'A Polite Lie in Undercommon',
        skills: ['Deception', 'Undercommon'],
        cardBrief: 'Meilin uses a plausible, controlled lie as leverage: not big, not dramatic, just enough to steer a decision. Speaking Undercommon signals she isn\'t a soft mark.'
    },
    {
        file: 'Meilin Starwell - Vignette 07 - Persuasion is triage.md',
        number: '07',
        title: 'Persuasion is Triage',
        skills: ['Persuasion'],
        cardBrief: 'Meilin talks a sailor down by naming consequences and next steps, not by moralizing. She treats de-escalation like triage: identify the real hazard, give simple instructions.'
    },
    {
        file: 'Meilin Starwell - Vignette 08 - Quiet feet, open eyes.md',
        number: '08',
        title: 'Quiet Feet, Open Eyes',
        skills: ['Perception', 'Stealth'],
        cardBrief: 'Meilin walks a route unarmed to see the truth. She reads shifted stalls and sight lines, lets a pick commit before catching them. Stealth is choosing what people notice.'
    },
    {
        file: 'Meilin Starwell - Vignette 09 - Fingers, coin, and shame.md',
        number: '09',
        title: 'Fingers, Coin, and Shame',
        skills: ['Sleight of Hand'],
        cardBrief: 'Meilin treats sleight of hand like a tourniquet: not for show, for control. She pickpockets a pickpocket to restore stolen goods. Calm, boring, and timed to someone else\'s impatience.'
    },
    {
        file: 'Meilin Starwell - Vignette 10 - The window with three seals.md',
        number: '10',
        title: 'The Window with Three Seals',
        skills: ['History'],
        cardBrief: 'Meilin demonstrates that "history" is practical institutional memory. She applies her knowledge of Bral\'s dock scandals to recognize a con being run in the Astral Bazaar.'
    }
];

/**
 * Load all vignettes
 */
export async function loadVignettes() {
    const container = document.getElementById('vignettes-grid');
    if (!container) return;
    
    container.innerHTML = '<div class="loading-spinner">Loading vignettes...</div>';
    
    const vignettePromises = VIGNETTE_FILES.map(async (vignette) => {
        try {
            const html = await dataLoader.loadMarkdown(`content/vignettes/${vignette.file}`);
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = html;
            
            // Remove H1
            const firstH1 = tempDiv.querySelector('h1');
            if (firstH1) firstH1.remove();
            
            return { ...vignette, content: tempDiv.innerHTML };
        } catch (error) {
            console.error(`Failed to load vignette: ${vignette.file}`, error);
            return { ...vignette, content: '<p>Failed to load.</p>' };
        }
    });
    
    vignettes = await Promise.all(vignettePromises);
    renderVignettes();
}

/**
 * Render vignettes grid
 */
export function renderVignettes() {
    const container = document.getElementById('vignettes-grid');
    if (!container) return;
    
    container.innerHTML = vignettes.map((vignette, index) => `
        <div class="vignette-card" data-vignette="${index}">
            <span class="click-hint"><i data-lucide="info"></i></span>
            <div class="vignette-number">Vignette ${vignette.number}</div>
            <h3 class="vignette-title">${vignette.title}</h3>
            ${vignette.skills?.length > 0 ? `
                <div class="vignette-skills">
                    ${vignette.skills.map(skill => `<span class="vignette-skill-tag">${skill}</span>`).join('')}
                </div>
            ` : ''}
            <p class="vignette-preview">${vignette.cardBrief || vignette.preview}</p>
            <span class="vignette-read-more">Read more →</span>
        </div>
    `).join('');
    
    container.querySelectorAll('.vignette-card').forEach(card => {
        card.addEventListener('click', () => {
            const index = parseInt(card.dataset.vignette);
            openVignetteModal(vignettes[index]);
        });
    });
    
    icons.refresh();
}

/**
 * Open vignette modal
 */
export function openVignetteModal(vignette) {
    const overlay = document.getElementById('vignette-modal-overlay');
    const content = document.getElementById('vignette-modal-content');
    
    if (!overlay || !content) return;
    
    content.innerHTML = `
        <div class="narrative-container">
            <div class="vignette-number">Vignette ${vignette.number}</div>
            <h2 class="vignette-modal-title">${vignette.title}</h2>
            ${vignette.content}
        </div>
    `;
    
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
}

/**
 * Close vignette modal
 */
export function closeVignetteModal() {
    const overlay = document.getElementById('vignette-modal-overlay');
    if (overlay) {
        overlay.classList.remove('active');
        document.body.style.overflow = '';
    }
}

// Getters
export function getVignettes() { return vignettes; }

// Listen for vignette open events
events.on('vignette:open', (vignette) => {
    openVignetteModal(vignette);
});

events.on('modal:close', () => {
    closeVignetteModal();
});
