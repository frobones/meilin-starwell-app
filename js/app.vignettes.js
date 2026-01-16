/**
 * Meilin's Apothecary - Vignettes System
 * Vignette loading and modal display
 */
(function(App) {

    /**
     * Load all vignette files
     */
    App.loadVignettes = async function() {
        const container = document.getElementById('vignettes-grid');
        if (!container) return;

        container.innerHTML = '<div class="loading-spinner">Loading vignettes...</div>';

        const vignetteFiles = [
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

        const vignettePromises = vignetteFiles.map(async (vignette) => {
            const html = await this.fetchMarkdown(`content/vignettes/${vignette.file}`);
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = html;
            const firstH1 = tempDiv.querySelector('h1');
            if (firstH1) firstH1.remove();
            
            let skills = [];
            const allParagraphs = tempDiv.querySelectorAll('p');
            const paragraphsToRemove = [];
            allParagraphs.forEach(p => {
                const text = p.textContent;
                if (text.startsWith('Skill Spotlight:')) {
                    const skillsText = text.replace('Skill Spotlight:', '').trim();
                    skills = skillsText.split(',').map(s => s.trim()).filter(s => s.length > 0);
                    paragraphsToRemove.push(p);
                }
            });
            paragraphsToRemove.forEach(p => p.remove());
            
            let preview = '';
            const remainingParagraphs = tempDiv.querySelectorAll('p');
            for (const p of remainingParagraphs) {
                const text = p.textContent.trim();
                if (text && !text.startsWith('-') && text.length > 50) {
                    preview = text.substring(0, 150) + '...';
                    break;
                }
            }
            
            return {
                ...vignette,
                content: tempDiv.innerHTML,
                preview: preview,
                skills: skills
            };
        });

        this.vignettes = await Promise.all(vignettePromises);
        this.renderVignettes();
    };

    /**
     * Render vignettes grid
     */
    App.renderVignettes = function() {
        const container = document.getElementById('vignettes-grid');
        if (!container) return;

        container.innerHTML = this.vignettes.map((vignette, index) => `
            <div class="vignette-card" data-vignette="${index}">
                <div class="vignette-number">Vignette ${vignette.number}</div>
                <h3 class="vignette-title">${vignette.title}</h3>
                ${vignette.skills && vignette.skills.length > 0 ? `
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
                this.openVignetteModal(this.vignettes[index]);
            });
        });
    };

    /**
     * Open vignette modal with full content
     */
    App.openVignetteModal = function(vignette) {
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
    };

    /**
     * Close vignette modal
     */
    App.closeVignetteModal = function() {
        const overlay = document.getElementById('vignette-modal-overlay');
        if (overlay) {
            overlay.classList.remove('active');
            document.body.style.overflow = '';
        }
    };

})(window.App = window.App || {});
