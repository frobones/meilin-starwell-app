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
    { file: 'Meilin Starwell - Vignette 01 - First bolt.md', number: '01', title: 'First Bolt' },
    { file: 'Meilin Starwell - Vignette 02 - Vex lesson.md', number: '02', title: 'Vex Lesson' },
    { file: 'Meilin Starwell - Vignette 03 - Cant notes.md', number: '03', title: 'Cant Notes' },
    { file: 'Meilin Starwell - Vignette 04 - Theo Lockwell, quiet preparation.md', number: '04', title: 'Theo Lockwell' },
    { file: 'Meilin Starwell - Vignette 05 - The tell, the pause.md', number: '05', title: 'The Tell, the Pause' },
    { file: 'Meilin Starwell - Vignette 06 - A polite lie in Undercommon.md', number: '06', title: 'A Polite Lie in Undercommon' },
    { file: 'Meilin Starwell - Vignette 07 - Persuasion is triage.md', number: '07', title: 'Persuasion is Triage' },
    { file: 'Meilin Starwell - Vignette 08 - Quiet feet, open eyes.md', number: '08', title: 'Quiet Feet, Open Eyes' },
    { file: 'Meilin Starwell - Vignette 09 - Fingers, coin, and shame.md', number: '09', title: 'Fingers, Coin, and Shame' },
    { file: 'Meilin Starwell - Vignette 10 - The window with three seals.md', number: '10', title: 'The Window with Three Seals' }
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
            
            // Extract skills
            let skills = [];
            const allParagraphs = tempDiv.querySelectorAll('p');
            allParagraphs.forEach(p => {
                if (p.textContent.startsWith('Skill Spotlight:')) {
                    skills = p.textContent.replace('Skill Spotlight:', '').trim().split(',').map(s => s.trim());
                    p.remove();
                }
            });
            
            // Get preview
            let preview = '';
            const remainingParagraphs = tempDiv.querySelectorAll('p');
            for (const p of remainingParagraphs) {
                const text = p.textContent.trim();
                if (text && !text.startsWith('-') && text.length > 50) {
                    preview = text.substring(0, 150) + '...';
                    break;
                }
            }
            
            return { ...vignette, content: tempDiv.innerHTML, preview, skills };
        } catch (error) {
            console.error(`Failed to load vignette: ${vignette.file}`, error);
            return { ...vignette, content: '<p>Failed to load.</p>', preview: '', skills: [] };
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
            <div class="vignette-number">Vignette ${vignette.number}</div>
            <h3 class="vignette-title">${vignette.title}</h3>
            ${vignette.skills?.length > 0 ? `
                <div class="vignette-skills">
                    ${vignette.skills.map(skill => `<span class="vignette-skill-tag">${skill}</span>`).join('')}
                </div>
            ` : ''}
            <p class="vignette-preview">${vignette.preview}</p>
            <span class="vignette-read-more">Read more →</span>
        </div>
    `).join('');
    
    container.querySelectorAll('.vignette-card').forEach(card => {
        card.addEventListener('click', () => {
            const index = parseInt(card.dataset.vignette);
            openVignetteModal(vignettes[index]);
        });
    });
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
