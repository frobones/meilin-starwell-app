/**
 * Template Utilities
 * Helpers for working with HTML <template> elements.
 */

/**
 * Clone a template by ID and return the document fragment
 * @param {string} templateId - The ID of the template element
 * @returns {DocumentFragment|null} - The cloned fragment or null
 */
export function cloneTemplate(templateId) {
    const template = document.getElementById(templateId);
    if (!template) {
        console.warn(`Template not found: ${templateId}`);
        return null;
    }
    return template.content.cloneNode(true);
}

/**
 * Clone a template and get the first element child
 * @param {string} templateId - The ID of the template element
 * @returns {Element|null} - The first element in the template or null
 */
export function cloneTemplateElement(templateId) {
    const fragment = cloneTemplate(templateId);
    if (!fragment) return null;
    return fragment.firstElementChild;
}

/**
 * Create a medicine card element from the template
 * @param {Object} medicine - Medicine data object
 * @returns {Element} - The populated medicine card element
 */
export function createMedicineCardFromTemplate(medicine) {
    const card = cloneTemplateElement('medicine-card-template');
    if (!card) {
        // Fall back to creating element directly
        const div = document.createElement('div');
        div.className = 'medicine-card';
        div.innerHTML = `<h3>${medicine.name}</h3>`;
        return div;
    }
    
    card.dataset.id = medicine.id;
    card.dataset.category = medicine.category;
    
    // Fill in content
    card.querySelector('.medicine-name').textContent = medicine.name;
    card.querySelector('.medicine-category').textContent = medicine.category;
    card.querySelector('.medicine-category').classList.add(medicine.category);
    card.querySelector('.medicine-dc').textContent = `DC ${medicine.dc}`;
    card.querySelector('.medicine-preview').textContent = medicine.brief || medicine.effect;
    
    // Stars
    const difficulty = medicine.difficulty;
    const maxStars = medicine.maxStars || 5;
    const filled = '★'.repeat(difficulty);
    const empty = '☆'.repeat(maxStars - difficulty);
    card.querySelector('.medicine-stars').textContent = filled + empty;
    
    return card;
}

/**
 * Create a knife card element from the template
 * @param {Object} knife - Knife data object
 * @param {number} index - Index for data attribute
 * @returns {Element} - The populated knife card element
 */
export function createKnifeCardFromTemplate(knife, index) {
    const card = cloneTemplateElement('knife-card-template');
    if (!card) return null;
    
    card.classList.add(knife.type);
    card.dataset.knifeIndex = index;
    
    card.querySelector('.knife-card-name').textContent = knife.name;
    card.querySelector('.knife-card-type').textContent = knife.type;
    card.querySelector('.knife-card-summary').textContent = knife.summary;
    card.querySelector('.knife-card-icon i').setAttribute('data-lucide', knife.icon);
    
    return card;
}

/**
 * Create a rumor item element from the template
 * @param {Object} rumor - Rumor data object
 * @returns {Element} - The populated rumor item element
 */
export function createRumorItemFromTemplate(rumor) {
    const item = cloneTemplateElement('rumor-item-template');
    if (!item) return null;
    
    item.dataset.image = `img/${rumor.image}`;
    item.querySelector('.rumor-readable').textContent = rumor.text;
    item.querySelector('.rumor-cipher').textContent = rumor.text;
    
    return item;
}

/**
 * Create a relationship card element from the template
 * @param {Object} connection - Connection data object
 * @returns {Element} - The populated relationship card element
 */
export function createRelationshipCardFromTemplate(connection) {
    const card = cloneTemplateElement('relationship-card-template');
    if (!card) return null;
    
    const typeLabels = { 'ally': 'Ally', 'complicated': 'Complicated', 'antagonist': 'Antagonist' };
    const hasDetails = connection.details !== undefined;
    
    card.classList.add(connection.type);
    if (hasDetails) {
        card.classList.add('clickable');
        card.title = 'Click for details';
    }
    card.dataset.connectionName = connection.name;
    
    card.querySelector('.relationship-card-name').textContent = connection.name;
    card.querySelector('.relationship-card-type').textContent = typeLabels[connection.type] || connection.type;
    card.querySelector('.relationship-card-role').textContent = connection.role;
    card.querySelector('.relationship-card-tension').textContent = connection.tension;
    card.querySelector('.relationship-card-location').textContent = `📍 ${connection.location}`;
    
    return card;
}

/**
 * Create a vignette card element from the template
 * @param {Object} vignette - Vignette data object
 * @param {number} index - Vignette index
 * @returns {Element} - The populated vignette card element
 */
export function createVignetteCardFromTemplate(vignette, index) {
    const card = cloneTemplateElement('vignette-card-template');
    if (!card) return null;
    
    card.dataset.vignetteIndex = index;
    card.querySelector('.vignette-number').textContent = `Vignette ${String(index + 1).padStart(2, '0')}`;
    card.querySelector('.vignette-title').textContent = vignette.title;
    card.querySelector('.vignette-preview').textContent = vignette.preview || vignette.opening;
    
    // Skills
    const skillsContainer = card.querySelector('.vignette-skills');
    if (vignette.skills && vignette.skills.length > 0) {
        skillsContainer.innerHTML = vignette.skills
            .map(skill => `<span class="vignette-skill-tag">${skill}</span>`)
            .join('');
    } else {
        skillsContainer.remove();
    }
    
    return card;
}

/**
 * Create a backstory section element from the template
 * @param {Object} section - Section configuration object
 * @param {Array} paragraphs - Array of paragraph strings
 * @param {number} idx - Section index (for even/odd styling)
 * @returns {Element|null} - The populated section element or null
 */
export function createBackstorySectionFromTemplate(section, paragraphs, idx) {
    const sectionEl = cloneTemplateElement('backstory-section-template');
    if (!sectionEl) return null;
    
    // Get section paragraphs
    const sectionParagraphs = section.paragraphs
        .map(i => paragraphs[i])
        .filter(p => p !== undefined)
        .map(p => {
            let parsed = p.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
            parsed = parsed.replace(/\*([^*]+)\*/g, '<em>$1</em>');
            return `<p>${parsed}</p>`;
        })
        .join('');

    if (sectionParagraphs.length === 0) return null;

    sectionEl.classList.add(idx % 2 === 0 ? 'even' : 'odd');
    sectionEl.dataset.chapterIndex = section.chapterIndex;
    
    sectionEl.querySelector('.backstory-section-icon i').setAttribute('data-lucide', section.icon);
    sectionEl.querySelector('.backstory-section-title').textContent = section.title;
    sectionEl.querySelector('.chapter-badge').textContent = `Chapter ${section.chapterNumber}`;
    sectionEl.querySelector('.backstory-section-content').innerHTML = sectionParagraphs;
    
    const quote = sectionEl.querySelector('.backstory-quote');
    if (section.pullQuote) {
        quote.textContent = section.pullQuote;
    } else {
        quote.remove();
    }
    
    sectionEl.querySelector('.chapter-content-expanded').dataset.chapter = section.chapterIndex;
    
    return sectionEl;
}
