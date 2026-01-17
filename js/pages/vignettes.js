/**
 * Vignettes Page Controller
 * Handles vignette loading and modal display.
 * 
 * Vignette files are discovered via content/vignettes/index.json
 * Each vignette JSON file contains metadata and embedded Markdown content.
 */

import { dataLoader } from '../core/data-loader.js';
import { events } from '../core/events.js';
import { icons } from '../core/icons.js';

// Private state
let vignettes = [];

/**
 * Parse inline markdown formatting (bold, italic) to HTML
 * @param {string} text - Text with markdown formatting
 * @returns {string} HTML string
 */
function parseInlineMarkdown(text) {
    let parsed = text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    parsed = parsed.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    return parsed;
}

/**
 * Render key takeaways as HTML
 * @param {string[]} takeaways - Array of takeaway strings (may contain markdown)
 * @returns {string} HTML for the takeaways section
 */
function renderKeyTakeaways(takeaways) {
    if (!takeaways || takeaways.length === 0) return '';
    
    const items = takeaways
        .map(t => {
            // Split on **: to separate label from description
            // Format: "**Label**: Description text"
            const match = t.match(/^\*\*([^*]+)\*\*:\s*(.*)$/);
            if (match) {
                const label = match[1];
                const description = parseInlineMarkdown(match[2]);
                return `<li><span class="takeaway-label">${label}</span><span class="takeaway-desc">${description}</span></li>`;
            }
            // Fallback if format doesn't match
            return `<li><span class="takeaway-desc">${parseInlineMarkdown(t)}</span></li>`;
        })
        .join('\n');
    
    return `
        <div class="chapter-takeaways">
            <h3 class="takeaways-heading">Key Takeaways</h3>
            <ul class="takeaways-list">
                ${items}
            </ul>
        </div>
    `;
}

/**
 * Parse Markdown content from JSON and convert to HTML
 * @param {string} markdown - Raw Markdown content
 * @returns {string} HTML content with H1 removed
 */
function parseVignetteContent(markdown) {
    // Use marked if available (set via dataLoader), otherwise return raw
    const html = window.marked ? window.marked.parse(markdown) : markdown;
    
    // Remove H1 from content (title is displayed separately)
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    const firstH1 = tempDiv.querySelector('h1');
    if (firstH1) firstH1.remove();
    
    return tempDiv.innerHTML;
}

/**
 * Load all vignettes from JSON files
 */
export async function loadVignettes() {
    const container = document.getElementById('vignettes-grid');
    if (!container) return;
    
    container.innerHTML = '<div class="loading-spinner">Loading vignettes...</div>';
    
    try {
        // Load the vignette index to discover available files
        const index = await dataLoader.loadJSON('content/vignettes/index.json');
        const vignetteFiles = index.vignettes || [];
        
        // Load all vignette files in parallel
        const vignettePromises = vignetteFiles.map(async (filename) => {
            const jsonPath = `content/vignettes/${filename}`;
            try {
                const data = await dataLoader.loadJSON(jsonPath);
                // Parse embedded Markdown content to HTML
                const htmlContent = parseVignetteContent(data.content || '');
                return { ...data, content: htmlContent };
            } catch (error) {
                console.error(`Failed to load vignette: ${jsonPath}`, error);
                return null;
            }
        });
        
        vignettes = (await Promise.all(vignettePromises)).filter(v => v !== null);
        renderVignettes();
    } catch (error) {
        console.error('Failed to load vignette index:', error);
        container.innerHTML = '<p class="error-message">Failed to load vignettes.</p>';
    }
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
    
    const takeawaysHtml = renderKeyTakeaways(vignette.keyTakeaways);
    
    content.innerHTML = `
        <div class="narrative-container">
            <div class="vignette-number">Vignette ${vignette.number}</div>
            <h2 class="vignette-modal-title">${vignette.title}</h2>
            ${takeawaysHtml}
            ${takeawaysHtml ? '<hr class="takeaways-separator">' : ''}
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
