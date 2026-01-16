/**
 * Meilin's Apothecary - Backstory System
 * Enhanced backstory rendering and chapter expansion
 */
(function(App) {

    /**
     * Load all backstory content (backstory, vignettes, npcs)
     */
    App.loadBackstoryContent = async function() {
        await Promise.all([
            this.loadEnhancedBackstory(),
            this.loadVignettes()
        ]);
    };

    /**
     * Load the enhanced backstory with styled sections and chapter links
     */
    App.loadEnhancedBackstory = async function() {
        const container = document.getElementById('backstory-enhanced');
        if (!container) return;

        container.innerHTML = '<div class="loading-spinner">Loading backstory...</div>';

        try {
            const response = await fetch('content/backstory/backstory.md');
            const markdown = await response.text();
            this.backstoryContent = markdown;
            
            const enhancedHtml = this.renderEnhancedBackstory(markdown);
            container.innerHTML = enhancedHtml;
            
            this.bindChapterLinkEvents();
            this.refreshIcons();
        } catch (error) {
            console.error('Failed to load backstory:', error);
            container.innerHTML = '<p class="error-message">Failed to load backstory.</p>';
        }
    };

    /**
     * Render the backstory with styled sections and inline chapter links
     */
    App.renderEnhancedBackstory = function(markdown) {
        const lines = markdown.split('\n\n');
        const title = lines[0].replace('# ', '');
        const paragraphs = lines.slice(1).filter(p => p.trim());
        
        const sections = [
            {
                title: 'The Docks',
                icon: 'anchor',
                chapterIndex: 0,
                chapterNumber: '01',
                chapterTitle: 'Dock-born',
                paragraphs: [0, 1, 2],
                pullQuote: '"People lie," he told her. "Bodies don\'t."'
            },
            {
                title: 'Cassian',
                icon: 'star',
                chapterIndex: 1,
                chapterNumber: '02',
                chapterTitle: 'Cassian Leaves',
                paragraphs: [3],
                pullQuote: 'She kept it because paper didn\'t change shape when people did.'
            },
            {
                title: 'Politics of Medicine',
                icon: 'scale',
                chapterIndex: 2,
                chapterNumber: '03',
                chapterTitle: 'Apprenticeship',
                paragraphs: [4, 5, 6],
                pullQuote: '"Your cure comes with a leash."'
            },
            {
                title: 'Near Death',
                icon: 'skull',
                chapterIndex: 3,
                chapterNumber: '04',
                chapterTitle: 'Near-death',
                paragraphs: [7, 8, 9, 10, 11, 12],
                pullQuote: 'Pain is data. Fear is data. Curiosity outranks comfort.'
            },
            {
                title: 'The Pattern-Hunter',
                icon: 'search',
                chapterIndex: 4,
                chapterNumber: '05',
                chapterTitle: 'Pattern-hunter',
                paragraphs: [13, 14, 15],
                pullQuote: '"Maps lead places. Some places don\'t like visitors."'
            },
            {
                title: 'Meredin\'s Patronage',
                icon: 'handshake',
                chapterIndex: 5,
                chapterNumber: '06',
                chapterTitle: 'Meredin',
                paragraphs: [16, 17, 18],
                pullQuote: '"Being useful is a kind of target."'
            },
            {
                title: 'The Drift-Sparrow',
                icon: 'ship',
                chapterIndex: 6,
                chapterNumber: '07',
                chapterTitle: 'Shipboard Scare',
                paragraphs: [19, 20, 21, 22, 23, 24],
                pullQuote: 'The easiest way to control people wasn\'t a blade. It was what you fed them.'
            },
            {
                title: 'Sera\'s Trail',
                icon: 'clipboard-list',
                chapterIndex: 7,
                chapterNumber: '08',
                chapterTitle: 'Sera Trail',
                paragraphs: [25, 26, 27, 28],
                pullQuote: 'It\'s control shaped like help.'
            },
            {
                title: 'Smith\'s Coster',
                icon: 'landmark',
                chapterIndex: 8,
                chapterNumber: '09',
                chapterTitle: 'Smith\'s Coster',
                paragraphs: [29, 30, 31, 32, 33],
                pullQuote: '"Paper burns."'
            },
            {
                title: 'The Ledger Page',
                icon: 'scroll',
                chapterIndex: 9,
                chapterNumber: '10',
                chapterTitle: 'Ledger Page',
                paragraphs: [34, 35, 36, 37, 38, 39, 40],
                pullQuote: '"MS-13: mindersand"'
            },
            {
                title: 'Exit Strategy',
                icon: 'door-open',
                chapterIndex: 10,
                chapterNumber: '11',
                chapterTitle: 'Exit Strategy',
                paragraphs: [41, 42, 43, 44, 45, 46, 47, 48],
                pullQuote: 'You\'re not the reason. You\'re the symptom. This is the disease.'
            },
            {
                title: 'The Astral Bazaar',
                icon: 'sparkles',
                chapterIndex: 11,
                chapterNumber: '12',
                chapterTitle: 'Astral Bazaar',
                paragraphs: [49],
                pullQuote: '"Where anything can be bought, everything is leverage."'
            }
        ];

        let html = '';

        sections.forEach((section, idx) => {
            const sectionParagraphs = section.paragraphs
                .map(i => paragraphs[i])
                .filter(p => p !== undefined)
                .map(p => {
                    let parsed = p.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
                    parsed = parsed.replace(/\*([^*]+)\*/g, '<em>$1</em>');
                    return `<p>${parsed}</p>`;
                })
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
                    <div class="chapter-content-expanded" data-chapter="${section.chapterIndex}">
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
    };

    /**
     * Bind click events for section headers to expand/collapse chapters
     */
    App.bindChapterLinkEvents = function() {
        document.querySelectorAll('.backstory-section-header').forEach(header => {
            header.addEventListener('click', () => {
                const section = header.closest('.backstory-section');
                this.toggleChapterExpansion(section);
            });
            
            header.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    const section = header.closest('.backstory-section');
                    this.toggleChapterExpansion(section);
                }
            });
        });
    };

    /**
     * Toggle the expansion of a chapter section
     */
    App.toggleChapterExpansion = async function(section) {
        const isExpanded = section.classList.contains('expanded');
        const chapterIndex = parseInt(section.dataset.chapterIndex);
        const contentContainer = section.querySelector('.chapter-content-expanded');
        
        if (isExpanded) {
            section.classList.remove('expanded');
            return;
        }
        
        document.querySelectorAll('.backstory-section.expanded').forEach(s => {
            s.classList.remove('expanded');
        });
        
        section.classList.add('expanded');
        
        if (!contentContainer.dataset.loaded) {
            await this.loadChapterContent(chapterIndex, contentContainer);
        }
        
        setTimeout(() => {
            section.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    };

    /**
     * Load chapter content into the expanded container
     */
    App.loadChapterContent = async function(chapterIndex, container) {
        const chapterFiles = [
            { file: 'Meilin Starwell - Stage 01 - Dock-born.md', title: 'Dock-born' },
            { file: 'Meilin Starwell - Stage 02 - Cassian Leaves.md', title: 'Cassian Leaves' },
            { file: 'Meilin Starwell - Stage 03 - Apprenticeship.md', title: 'Apprenticeship' },
            { file: 'Meilin Starwell - Stage 04 - Near-death.md', title: 'Near-death' },
            { file: 'Meilin Starwell - Stage 05 - Pattern-hunter.md', title: 'Pattern-hunter' },
            { file: 'Meilin Starwell - Stage 06 - Meredin.md', title: 'Meredin' },
            { file: 'Meilin Starwell - Stage 07 - Shipboard Scare.md', title: 'Shipboard Scare' },
            { file: 'Meilin Starwell - Stage 08 - Sera Trail.md', title: 'Sera Trail' },
            { file: 'Meilin Starwell - Stage 09 - Smith\'s Coster.md', title: 'Smith\'s Coster' },
            { file: 'Meilin Starwell - Stage 10 - Ledger Page.md', title: 'Ledger Page' },
            { file: 'Meilin Starwell - Stage 11 - Exit Strategy.md', title: 'Exit Strategy' },
            { file: 'Meilin Starwell - Stage 12 - Astral Bazaar.md', title: 'Astral Bazaar' }
        ];

        const chapter = chapterFiles[chapterIndex];
        if (!chapter) {
            container.innerHTML = '<p class="error">Chapter not found.</p>';
            return;
        }

        try {
            const html = await this.fetchMarkdown(`content/backstory/stages/${chapter.file}`);
            container.innerHTML = `
                <div class="chapter-full-content">
                    <div class="chapter-divider">
                        <span class="chapter-divider-text">Full Chapter</span>
                    </div>
                    ${html}
                </div>
            `;
            container.dataset.loaded = 'true';
        } catch (error) {
            container.innerHTML = '<p class="error">Failed to load chapter content.</p>';
        }
    };

})(window.App = window.App || {});
