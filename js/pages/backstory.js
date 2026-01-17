/**
 * Backstory Page Controller
 * Enhanced backstory rendering with chapter expansion.
 * 
 * Data is loaded from JSON files:
 * - content/backstory/backstory.json - Main backstory with paragraphs and section config
 * - content/backstory/chapters/chapter-XX.json - Full chapter content and metadata
 */

import { dataLoader } from '../core/data-loader.js';
import { events } from '../core/events.js';
import { icons } from '../core/icons.js';

// Private state
let backstoryData = null;
let sectionsConfig = [];

/**
 * Load all backstory content
 */
export async function loadBackstoryContent() {
    await loadEnhancedBackstory();
    events.emit('backstory:loaded');
}

/**
 * Load the enhanced backstory with styled sections
 */
export async function loadEnhancedBackstory() {
    const container = document.getElementById('backstory-enhanced');
    if (!container) return;

    container.innerHTML = '<div class="loading-spinner">Loading backstory...</div>';

    try {
        // Load main backstory JSON
        backstoryData = await dataLoader.loadJSON('content/backstory/backstory.json');
        
        // Load all chapter metadata in parallel for section configuration
        const chapterPromises = backstoryData.sections.map(async (section, index) => {
            try {
                const chapterData = await dataLoader.loadJSON(
                    `content/backstory/chapters/${section.chapterFile}`
                );
                return {
                    title: chapterData.sectionTitle,
                    icon: chapterData.icon,
                    chapterIndex: index,
                    chapterNumber: chapterData.number,
                    chapterTitle: chapterData.title,
                    paragraphs: section.paragraphs,
                    pullQuote: chapterData.pullQuote,
                    chapterFile: section.chapterFile
                };
            } catch (error) {
                console.error(`Failed to load chapter: ${section.chapterFile}`, error);
                return null;
            }
        });
        
        sectionsConfig = (await Promise.all(chapterPromises)).filter(s => s !== null);
        
        const enhancedHtml = renderEnhancedBackstory(backstoryData.paragraphs);
        container.innerHTML = enhancedHtml;
        
        bindChapterLinkEvents();
        icons.refresh();
    } catch (error) {
        console.error('Failed to load backstory:', error);
        container.innerHTML = '<p class="error-message">Failed to load backstory.</p>';
    }
}

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
 * Render the backstory with styled sections
 * @param {string[]} paragraphs - Array of paragraph strings from backstory.json
 */
export function renderEnhancedBackstory(paragraphs) {
    let html = '';

    sectionsConfig.forEach((section, idx) => {
        const sectionParagraphs = section.paragraphs
            .map(i => paragraphs[i])
            .filter(p => p !== undefined)
            .map(p => `<p>${parseInlineMarkdown(p)}</p>`)
            .join('');

        if (sectionParagraphs.length === 0) return;

        const isEven = idx % 2 === 0;
        
        html += `
            <section class="backstory-section ${isEven ? 'even' : 'odd'}" data-chapter-index="${section.chapterIndex}">
                <div class="backstory-section-header" role="button" tabindex="0">
                    <span class="backstory-section-icon"><i data-lucide="${section.icon}"></i></span>
                    <h2 class="backstory-section-title">${section.title}</h2>
                    <span class="chapter-badge">Chapter ${section.chapterNumber}</span>
                    <span class="expand-indicator">▼</span>
                </div>
                ${section.pullQuote ? `<blockquote class="backstory-quote">${section.pullQuote}</blockquote>` : ''}
                <div class="backstory-section-content">
                    ${sectionParagraphs}
                </div>
                <div class="chapter-expand-cue">
                    <span class="expand-text">Read full chapter</span>
                    <span class="expand-icon"><i data-lucide="chevron-down"></i></span>
                </div>
                <div class="chapter-content-expanded" data-chapter="${section.chapterIndex}" data-chapter-file="${section.chapterFile}">
                    <div class="chapter-loading">Loading chapter...</div>
                </div>
            </section>
        `;
    });

    html += `
        <div class="backstory-epilogue">
            <div class="backstory-separator">✦ ✦ ✦</div>
            <p class="backstory-end-note">
                And now that warning had a heartbeat.
            </p>
        </div>
    `;

    return html;
}

/**
 * Bind click events for section headers and expand cues
 */
export function bindChapterLinkEvents() {
    // Bind header clicks
    document.querySelectorAll('.backstory-section-header').forEach(header => {
        header.addEventListener('click', () => {
            const section = header.closest('.backstory-section');
            toggleChapterExpansion(section);
        });
        
        header.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                const section = header.closest('.backstory-section');
                toggleChapterExpansion(section);
            }
        });
    });
    
    // Bind expand cue clicks
    document.querySelectorAll('.chapter-expand-cue').forEach(cue => {
        cue.addEventListener('click', () => {
            const section = cue.closest('.backstory-section');
            toggleChapterExpansion(section);
        });
    });
}

/**
 * Toggle the expansion of a chapter section
 */
export async function toggleChapterExpansion(section) {
    const isExpanded = section.classList.contains('expanded');
    const chapterIndex = parseInt(section.dataset.chapterIndex);
    const contentContainer = section.querySelector('.chapter-content-expanded');
    
    if (isExpanded) {
        section.classList.remove('expanded');
        return;
    }
    
    // Collapse other sections
    document.querySelectorAll('.backstory-section.expanded').forEach(s => {
        s.classList.remove('expanded');
    });
    
    section.classList.add('expanded');
    
    if (!contentContainer.dataset.loaded) {
        await loadChapterContent(chapterIndex, contentContainer);
    }
    
    setTimeout(() => {
        section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
}

/**
 * Parse chapter markdown content to HTML
 * @param {string} markdown - Markdown content from chapter JSON
 * @returns {string} HTML content
 */
function parseChapterContent(markdown) {
    // Use marked if available, otherwise do basic parsing
    if (window.marked) {
        return window.marked.parse(markdown);
    }
    
    // Basic markdown parsing fallback
    let html = markdown
        .split('\n\n')
        .map(p => {
            if (p.startsWith('# ')) return `<h1>${p.slice(2)}</h1>`;
            if (p.startsWith('## ')) return `<h2>${p.slice(3)}</h2>`;
            if (p.startsWith('---')) return '<hr>';
            return `<p>${parseInlineMarkdown(p)}</p>`;
        })
        .join('\n');
    return html;
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
 * Load chapter content into the expanded container
 * @param {number} chapterIndex - Index of the chapter to load
 * @param {HTMLElement} container - Container element for the content
 */
export async function loadChapterContent(chapterIndex, container) {
    const chapterFile = container.dataset.chapterFile;
    if (!chapterFile) {
        container.innerHTML = '<p class="error">Chapter not found.</p>';
        return;
    }

    try {
        const chapterData = await dataLoader.loadJSON(`content/backstory/chapters/${chapterFile}`);
        const narrativeHtml = parseChapterContent(chapterData.content || '');
        const takeawaysHtml = renderKeyTakeaways(chapterData.keyTakeaways);
        
        container.innerHTML = `
            <div class="chapter-full-content">
                <div class="chapter-divider">
                    <span class="chapter-divider-text">Full Chapter</span>
                </div>
                <h2 class="chapter-title">${chapterData.title || ''}</h2>
                ${takeawaysHtml}
                <hr class="takeaways-separator">
                <div class="chapter-narrative">
                    ${narrativeHtml}
                </div>
            </div>
        `;
        container.dataset.loaded = 'true';
    } catch (error) {
        console.error(`Failed to load chapter: ${chapterFile}`, error);
        container.innerHTML = '<p class="error">Failed to load chapter content.</p>';
    }
}

/**
 * Get backstory data
 */
export function getBackstoryData() {
    return backstoryData;
}

/**
 * Get sections configuration
 */
export function getSectionsConfig() {
    return sectionsConfig;
}

// Listen for page change events
events.on('page:change', ({ page }) => {
    if (page === 'backstory' && !backstoryData) {
        loadBackstoryContent();
    }
});
