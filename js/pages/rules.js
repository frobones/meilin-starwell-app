/**
 * Rules Page Controller
 * Handles quick rules, harvesting rules, and potion rules rendering.
 */

import { store } from '../core/state.js';
import { icons } from '../core/icons.js';

/**
 * Get star display for difficulty
 */
function getStars(difficulty) {
    return '★'.repeat(difficulty) + '☆'.repeat(5 - difficulty);
}

/**
 * Render quick rules reference
 */
export function renderQuickRules() {
    const rulesContent = document.getElementById('rules-content');
    const rules = store.get('rules');
    
    if (!rulesContent || !rules) return;
    
    const difficultyRows = rules.difficultyScale?.map(d => `
        <tr><td>${getStars(d.stars)}</td><td>${d.label}</td><td>${d.dc}</td></tr>
    `).join('') || '';
    
    const gatheringOptionsRows = rules.gatheringOptions?.options?.map(opt => `
        <tr><td><strong>${opt.threshold}+</strong></td><td><strong>${opt.name}</strong></td><td>${opt.description}</td></tr>
    `).join('') || '';
    
    // Common Flora Table
    const commonFloraRows = rules.commonFloraTable?.map(f => `
        <tr><td>${f.roll}</td><td>${f.component}</td><td>${f.category}</td></tr>
    `).join('') || '';
    
    // Alchemilla duration ladder
    const alchemillaAgent = rules.enhancingAgents?.find(a => a.name === 'Alchemilla');
    const durationLadder = alchemillaAgent?.durationLadder?.join(' → ') || '';
    const ephedraAgent = rules.enhancingAgents?.find(a => a.name === 'Ephedra');
    
    // Spell assist
    const spellAssistHtml = rules.spellAssist?.map(s => `
        <li><strong>${s.spell}:</strong> ${s.effect}</li>
    `).join('') || '';
    
    rulesContent.innerHTML = `
        ${rules.downtimeLimit ? `
        <ul class="takeaways-list rules-takeaway-list">
            <li>
                <span class="takeaway-label">Daily Limit</span>
                <span class="takeaway-desc">${rules.downtimeLimit}</span>
            </li>
        </ul>
        ` : ''}
        
        <div class="rules-grid">
            <div class="rules-card">
                <h4>Gathering Plants</h4>
                <ul>
                    <li><strong>Time:</strong> ${rules.gathering?.time || '1 hour per attempt'}</li>
                    <li><strong>Check:</strong> Intelligence (Nature)</li>
                    <li><strong>Advantage:</strong> ${rules.gathering?.advantage || 'Herbalism kit proficiency'}</li>
                    <li><strong>Spoilage:</strong> 8 hours without kit storage</li>
                </ul>
            </div>
            
            <div class="rules-card">
                <h4>Making a Medicine</h4>
                <ul>
                    <li><strong>Time:</strong> ${rules.crafting?.time || '1 hour'}</li>
                    <li><strong>Tool:</strong> ${rules.crafting?.tool || 'Herbalism kit'}</li>
                    <li><strong>Rest:</strong> ${rules.crafting?.restCompatible || 'Short or long rest'}</li>
                    <li><strong>On failure:</strong> ${rules.crafting?.failure || 'Components wasted'}</li>
                </ul>
            </div>
            
            <div class="rules-card">
                <h4>Difficulty Scale</h4>
                <table class="ingredient-table" style="font-size: 0.85rem;">
                    <tbody>${difficultyRows}</tbody>
                </table>
            </div>
        </div>
        
        ${rules.gatheringOptions ? `
        <h3 style="margin-top: 1.5rem;">Gathering Results (Choose One)</h3>
        <p style="margin-bottom: 0.5rem; font-style: italic;">${rules.gatheringOptions.intro}</p>
        <table class="ingredient-table" style="font-size: 0.85rem; margin-bottom: 1.5rem;">
            <thead>
                <tr><th>Result</th><th>Option</th><th>Details</th></tr>
            </thead>
            <tbody>${gatheringOptionsRows}</tbody>
        </table>
        ` : ''}
        
        ${rules.commonFloraTable ? `
        <h3>Common Flora Table (d6)</h3>
        <table class="ingredient-table" style="font-size: 0.85rem; margin-bottom: 1.5rem;">
            <thead>
                <tr><th>d6</th><th>Component</th><th>Category</th></tr>
            </thead>
            <tbody>${commonFloraRows}</tbody>
        </table>
        ` : ''}
        
        ${durationLadder ? `
        <h3>Alchemilla (Duration Extension)</h3>
        <p style="margin-bottom: 0.5rem;"><strong>${durationLadder}</strong></p>
        <p style="margin-bottom: 1.5rem; font-size: 0.85rem;">Each unit steps duration up one tier. ${alchemillaAgent?.dcIncrease || '+1 difficulty level per unit'}.</p>
        ` : ''}
        
        ${ephedraAgent ? `
        <h3>Ephedra (Potency Boost)</h3>
        <p style="margin-bottom: 0.5rem;"><strong>×1 → ×2 → ×4 → ×8</strong></p>
        <p style="margin-bottom: 1.5rem; font-size: 0.85rem;">Doubles dice that restore or grant hit points or other resources. ${ephedraAgent.dcIncrease}.</p>
        ` : ''}
        
        ${rules.enhancementLimits ? `
        <h3>Enhancement Limits</h3>
        <ul style="margin-bottom: 1.5rem;">
            <li><strong>Max enhancements:</strong> ${rules.enhancementLimits.maxEnhancements}</li>
            <li><strong>Indefinite duration:</strong> ${rules.enhancementLimits.indefiniteDuration}</li>
            <li><strong>Limit:</strong> ${rules.enhancementLimits.indefiniteLimit}</li>
        </ul>
        ` : ''}
        
        ${rules.spellAssist ? `
        <h3>Spell-Assisted Gathering</h3>
        <ul style="margin-bottom: 1.5rem;">
            ${spellAssistHtml}
        </ul>
        ` : ''}
        
        <h3>Important Gotchas</h3>
        <ul>${rules.crafting?.gotchas?.map(g => `<li>${g}</li>`).join('') || ''}</ul>
    `;
    
    icons.refresh();
}

/**
 * Render harvesting rules reference
 */
export function renderHarvestingRules() {
    const harvestingContent = document.getElementById('harvesting-content');
    const harvesting = store.get('harvesting');
    
    if (!harvestingContent || !harvesting) return;
    
    const creatureSkillRows = harvesting.creatureTypeSkills?.map(cs => `
        <tr><td><strong>${cs.skill}</strong></td><td>${cs.types}</td></tr>
    `).join('') || '';
    
    const kitActivityRows = harvesting.kitActivities?.map(ka => `
        <tr><td>${ka.activity}</td><td>${ka.dc}</td></tr>
    `).join('') || '';
    
    harvestingContent.innerHTML = `
        <p style="margin-bottom: 1rem; font-style: italic;">${harvesting.overview || ''}</p>
        
        <div class="rules-grid">
            <div class="rules-card">
                <h4>Harvesting Creatures</h4>
                <ul>
                    <li><strong>Time:</strong> ${harvesting.process?.time || '10 minutes'}</li>
                    <li><strong>Rest:</strong> ${harvesting.process?.restCompatible || 'Compatible'}</li>
                    <li><strong>Requirement:</strong> ${harvesting.process?.requirement || 'Harvesting kit'}</li>
                    <li><strong>Check:</strong> Proficiency + Strength or Dexterity</li>
                    <li><strong>Spoilage:</strong> ${harvesting.storage?.spoilage || '24 hours without preservation'}</li>
                </ul>
            </div>
            
            <div class="rules-card">
                <h4>Harvesting Kit</h4>
                <ul>
                    <li><strong>Cost:</strong> ${harvesting.tool?.cost || '25 gp'}${harvesting.tool?.weight ? ` (${harvesting.tool.weight})` : ''}</li>
                    <li><strong>Advantage:</strong> ${harvesting.modifiers?.advantage || 'Skill proficiency'}</li>
                    <li><strong>Favored Enemy:</strong> ${harvesting.modifiers?.favoredEnemy || '+2 bonus'}</li>
                </ul>
            </div>
            
            <div class="rules-card">
                <h4>Harvesting Results</h4>
                <ul>
                    <li><strong>On success:</strong> ${harvesting.results?.success || 'Gain components'}</li>
                    <li><strong>Component DC:</strong> ${harvesting.results?.componentDC || 'Varies by component'}</li>
                    <li><strong>On failure:</strong> ${harvesting.results?.failure || 'No components'}</li>
                </ul>
            </div>
        </div>
        
        <h3>Creature Type Skills</h3>
        <p style="margin-bottom: 0.5rem; font-style: italic;">Proficiency in the associated skill grants advantage on the harvesting check.</p>
        <table class="ingredient-table" style="font-size: 0.85rem; margin-bottom: 1.5rem;">
            <thead>
                <tr><th>Skill</th><th>Creature Types</th></tr>
            </thead>
            <tbody>${creatureSkillRows}</tbody>
        </table>
        
        ${harvesting.groupHarvesting || harvesting.modifiers?.temporaryEffects ? `
        <ul class="takeaways-list rules-takeaway-list">
            ${harvesting.groupHarvesting ? `
            <li>
                <span class="takeaway-label">Group Harvesting</span>
                <span class="takeaway-desc">${harvesting.groupHarvesting.description}. ${harvesting.groupHarvesting.benefit}.</span>
            </li>
            ` : ''}
            ${harvesting.modifiers?.temporaryEffects ? `
            <li>
                <span class="takeaway-label">Important</span>
                <span class="takeaway-desc">${harvesting.modifiers.temporaryEffects}</span>
            </li>
            ` : ''}
        </ul>
        ` : ''}
        
        ${harvesting.kitActivities ? `
        <h3>Kit Activities</h3>
        <table class="ingredient-table" style="font-size: 0.85rem; margin-bottom: 1.5rem;">
            <thead>
                <tr><th>Activity</th><th>DC</th></tr>
            </thead>
            <tbody>${kitActivityRows}</tbody>
        </table>
        ` : ''}
        
        ${harvesting.tool?.components ? `
        <h3>Kit Contents</h3>
        <p style="font-size: 0.85rem;">${harvesting.tool.components}</p>
        ` : ''}
    `;
    
    icons.refresh();
}

/**
 * Render potion rules reference
 */
export function renderPotionRules() {
    const section = document.getElementById('potion-rules-section');
    if (!section) return;
    
    section.innerHTML = `
        <div class="potion-rules-content">
            <div class="rules-intro">
                <h2>Alchemy Almanac Rules Reference</h2>
                <p class="rules-intro-text">A recap of rules in the three core rulebooks that pertain to the use of potions. For the purposes of this section, "potion" refers to any item presented in the Alchemy Almanac or created using the rules herein.</p>
            </div>

            <div class="rules-grid">
                <div class="rules-card">
                    <h4><i data-lucide="flask-round"></i> Using a Potion</h4>
                    <ul>
                        <li>Potions are <strong>consumable items</strong>. Drinking a potion or administering it to another creature requires a <strong>Bonus Action</strong>.</li>
                        <li>Applying an <strong>oil</strong> might take longer, as specified in its description.</li>
                        <li>Once used, a potion takes effect <strong>immediately</strong>, and it is used up.</li>
                    </ul>
                </div>

                <div class="rules-card">
                    <h4><i data-lucide="beaker"></i> Mixing Potions</h4>
                    <ul>
                        <li>A character might drink one potion while still under the effects of another, or pour several potions into a single container.</li>
                        <li>The strange ingredients used in creating potions can result in <strong>unpredictable interactions</strong>.</li>
                        <li>When a character mixes two potions together, roll on the <strong>Potion Miscibility</strong> table below.</li>
                        <li>If more than two are combined, roll again for each subsequent potion, combining the results.</li>
                    </ul>
                </div>

                <div class="rules-card">
                    <h4><i data-lucide="sparkles"></i> Potions as Magic Items</h4>
                    <ul>
                        <li>Most potions are <strong>magic items</strong> and their effects count as magical for the purposes of an <em>antimagic field</em> and other effects.</li>
                        <li>However, adventuring equipment, as well as some herbal medicines, are <strong>nonmagical</strong>, and the effects they produce are also nonmagical.</li>
                        <li>The GM decides which, if any, herbal medicines are nonmagical.</li>
                    </ul>
                </div>
            </div>

            <div class="section-divider">
                <span class="divider-text">Potion Miscibility</span>
            </div>

            <div class="miscibility-section">
                <p class="miscibility-intro">When mixing potions, roll <strong>1d100</strong> and consult this table. Unless the effects are immediately obvious, reveal them only when they become evident.</p>
                <table class="miscibility-table">
                    <thead>
                        <tr>
                            <th>d100</th>
                            <th>Result</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr class="miscibility-catastrophic">
                            <td>01</td>
                            <td>Both potions lose their effects, and the mixture creates a magical explosion in a 5-foot-radius Sphere centered on itself. Each creature in that area takes <strong>4d10 Force damage</strong>.</td>
                        </tr>
                        <tr class="miscibility-bad">
                            <td>02–08</td>
                            <td>Both potions lose their effects, and the mixture becomes an <strong>ingested poison</strong> of your choice.</td>
                        </tr>
                        <tr class="miscibility-bad">
                            <td>09–15</td>
                            <td>Both potions <strong>lose their effects</strong>.</td>
                        </tr>
                        <tr class="miscibility-reduced">
                            <td>16–25</td>
                            <td><strong>One potion</strong> loses its effect.</td>
                        </tr>
                        <tr class="miscibility-reduced">
                            <td>26–35</td>
                            <td>Both potions work, but with their numerical effects and durations <strong>halved</strong>. If a potion has no numerical effect and no duration, it instead loses its effect.</td>
                        </tr>
                        <tr class="miscibility-normal">
                            <td>36–90</td>
                            <td>Both potions <strong>work normally</strong>.</td>
                        </tr>
                        <tr class="miscibility-good">
                            <td>91–99</td>
                            <td>Both potions work, but the numerical effects and duration of one potion are <strong>doubled</strong>. If neither potion has anything to double, they work normally.</td>
                        </tr>
                        <tr class="miscibility-amazing">
                            <td>00</td>
                            <td>Only one potion works, but its effects are <strong>permanent</strong>. Choose the simplest effect to make permanent, or the one that seems the most fun. <em>Dispel Magic</em> or similar magic might end this lasting effect.</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <div class="section-divider">
                <span class="divider-text">New Terminology</span>
            </div>

            <div class="terminology-section">
                <div class="terminology-card burning">
                    <h3><i data-lucide="flame"></i> Burning</h3>
                    <p class="terminology-intro">Some items in the Alchemy Almanac cause or inflict the <strong>burning</strong> condition:</p>
                    <ul>
                        <li>A burning creature takes <strong>fire damage</strong> at the start of each of its turns. The amount of damage is shown in the triggering effect in parentheses.</li>
                        <li>The creature sheds <strong>bright light</strong> in a 20-foot radius and <strong>dim light</strong> for an additional 20 feet.</li>
                        <li>If a creature is subjected to burning from multiple sources, only the <strong>highest</strong> source of damage applies; they aren't added together. For example, a creature subjected to burning (1d6) and burning (2d6) takes 2d6 fire damage at the start of each of its turns.</li>
                        <li>The condition ends if the creature or another creature within 5 feet of it uses an <strong>action</strong> to put out the flames, or some other effect douses it, such as being fully immersed in water.</li>
                    </ul>
                    <div class="terminology-notes">
                        <h5>Notes:</h5>
                        <ul>
                            <li>Spells and other magical effects that can cure disease or poison can also <strong>end</strong> the burning condition.</li>
                            <li>Creatures with <strong>immunity to fire damage</strong> also have immunity to the burning condition.</li>
                        </ul>
                    </div>
                </div>

                <div class="terminology-card extended-rest">
                    <h3><i data-lucide="bed"></i> Extended Rest</h3>
                    <p>An extended rest is a period of <strong>downtime</strong> between adventures, at least <strong>1 week</strong> long, during which a character attends to other affairs. Some potions in the Alchemy Almanac require the drinker to finish an extended rest before it can benefit from the effects of that potion again.</p>
                </div>
            </div>
        </div>
    `;
    
    icons.refresh();
}
