/**
 * Meilin's Apothecary - Rules System
 * Quick rules, harvesting rules, and potion rules rendering
 */
(function(App) {

    /**
     * Render quick rules reference
     */
    App.renderQuickRules = function() {
        const rulesContent = document.getElementById('rules-content');
        
        if (!this.rules) {
            rulesContent.innerHTML = '<p>Rules data not available.</p>';
            return;
        }

        const difficultyRows = this.rules.difficultyScale.map(d => `
            <tr>
                <td>${this.getStars(d.stars)}</td>
                <td>${d.label}</td>
                <td>${d.dc}</td>
            </tr>
        `).join('');

        const gatheringOptionsRows = this.rules.gatheringOptions?.options?.map(opt => `
            <tr>
                <td><strong>${opt.threshold}+</strong></td>
                <td><strong>${opt.name}</strong></td>
                <td>${opt.description}</td>
            </tr>
        `).join('') || '';

        const commonFloraRows = this.rules.commonFloraTable?.map(f => `
            <tr>
                <td>${f.roll}</td>
                <td>${f.component}</td>
                <td>${f.category}</td>
            </tr>
        `).join('') || '';

        const alchemillaAgent = this.rules.enhancingAgents?.find(a => a.name === 'Alchemilla');
        const durationLadder = alchemillaAgent?.durationLadder?.join(' → ') || '';
        const ephedraAgent = this.rules.enhancingAgents?.find(a => a.name === 'Ephedra');

        rulesContent.innerHTML = `
            ${this.rules.downtimeLimit ? `
            <div class="rules-callout">
                <strong>Daily Limit:</strong> ${this.rules.downtimeLimit}
            </div>
            ` : ''}
            <div class="rules-grid">
                <div class="rules-card">
                    <h4>Gathering Plants</h4>
                    <ul>
                        <li><strong>Time:</strong> ${this.rules.gathering.time}</li>
                        <li><strong>Check:</strong> Intelligence (Nature)</li>
                        <li><strong>Advantage:</strong> ${this.rules.gathering.advantage}</li>
                        <li><strong>Spoilage:</strong> 8 hours without kit storage</li>
                    </ul>
                </div>
                
                <div class="rules-card">
                    <h4>Making a Medicine</h4>
                    <ul>
                        <li><strong>Time:</strong> ${this.rules.crafting.time}</li>
                        <li><strong>Tool:</strong> ${this.rules.crafting.tool}</li>
                        <li><strong>Rest:</strong> ${this.rules.crafting.restCompatible}</li>
                        <li><strong>On failure:</strong> ${this.rules.crafting.failure}</li>
                    </ul>
                </div>
                
                <div class="rules-card">
                    <h4>Difficulty Scale</h4>
                    <table class="ingredient-table" style="font-size: 0.85rem;">
                        <tbody>
                            ${difficultyRows}
                        </tbody>
                    </table>
                </div>
                
            </div>

            ${this.rules.gatheringOptions ? `
            <h3>Gathering Results (Choose One)</h3>
            <p style="margin-bottom: 0.5rem; font-style: italic;">${this.rules.gatheringOptions.intro}</p>
            <table class="ingredient-table" style="font-size: 0.85rem; margin-bottom: 1.5rem;">
                <thead>
                    <tr>
                        <th>Result</th>
                        <th>Option</th>
                        <th>Details</th>
                    </tr>
                </thead>
                <tbody>
                    ${gatheringOptionsRows}
                </tbody>
            </table>
            ` : ''}

            ${this.rules.commonFloraTable ? `
            <h3>Common Flora Table (d6)</h3>
            <table class="ingredient-table" style="font-size: 0.85rem; margin-bottom: 1.5rem;">
                <thead>
                    <tr>
                        <th>d6</th>
                        <th>Component</th>
                        <th>Category</th>
                    </tr>
                </thead>
                <tbody>
                    ${commonFloraRows}
                </tbody>
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

            ${this.rules.enhancementLimits ? `
            <h3>Enhancement Limits</h3>
            <ul style="margin-bottom: 1.5rem;">
                <li><strong>Max enhancements:</strong> ${this.rules.enhancementLimits.maxEnhancements}</li>
                <li><strong>Indefinite duration:</strong> ${this.rules.enhancementLimits.indefiniteDuration}</li>
                <li><strong>Limit:</strong> ${this.rules.enhancementLimits.indefiniteLimit}</li>
            </ul>
            ` : ''}

            ${this.rules.spellAssist ? `
            <h3>Spell-Assisted Gathering</h3>
            <ul style="margin-bottom: 1.5rem;">
                ${this.rules.spellAssist.map(s => `
                    <li><strong>${s.spell}:</strong> ${s.effect}</li>
                `).join('')}
            </ul>
            ` : ''}
            
            <h3>Important Gotchas</h3>
            <ul>
                ${this.rules.crafting.gotchas.map(g => `<li>${g}</li>`).join('')}
            </ul>
        `;
    };

    /**
     * Render harvesting rules reference
     */
    App.renderHarvestingRules = function() {
        const harvestingContent = document.getElementById('harvesting-content');
        
        if (!this.harvesting) {
            harvestingContent.innerHTML = '<p>Harvesting data not available.</p>';
            return;
        }

        const creatureSkillRows = this.harvesting.creatureTypeSkills?.map(cs => `
            <tr>
                <td><strong>${cs.skill}</strong></td>
                <td>${cs.types}</td>
            </tr>
        `).join('') || '';

        const kitActivityRows = this.harvesting.kitActivities?.map(ka => `
            <tr>
                <td>${ka.activity}</td>
                <td>${ka.dc}</td>
            </tr>
        `).join('') || '';

        harvestingContent.innerHTML = `
            <p style="margin-bottom: 1rem; font-style: italic;">${this.harvesting.overview}</p>
            
            <div class="rules-grid">
                <div class="rules-card">
                    <h4>Harvesting Creatures</h4>
                    <ul>
                        <li><strong>Time:</strong> ${this.harvesting.process.time}</li>
                        <li><strong>Rest:</strong> ${this.harvesting.process.restCompatible}</li>
                        <li><strong>Requirement:</strong> ${this.harvesting.process.requirement}</li>
                        <li><strong>Check:</strong> Proficiency + Strength or Dexterity</li>
                        <li><strong>Spoilage:</strong> ${this.harvesting.storage?.spoilage}</li>
                    </ul>
                </div>
                
                <div class="rules-card">
                    <h4>Harvesting Kit</h4>
                    <ul>
                        <li><strong>Cost:</strong> ${this.harvesting.tool.cost} (${this.harvesting.tool.weight})</li>
                        <li><strong>Advantage:</strong> ${this.harvesting.modifiers.advantage}</li>
                        <li><strong>Favored Enemy:</strong> ${this.harvesting.modifiers.favoredEnemy}</li>
                    </ul>
                </div>
                
                <div class="rules-card">
                    <h4>Harvesting Results</h4>
                    <ul>
                        <li><strong>On success:</strong> ${this.harvesting.results.success}</li>
                        <li><strong>Component DC:</strong> ${this.harvesting.results.componentDC}</li>
                        <li><strong>On failure:</strong> ${this.harvesting.results.failure}</li>
                    </ul>
                </div>
            </div>

            <h3>Creature Type Skills</h3>
            <p style="margin-bottom: 0.5rem; font-style: italic;">Proficiency in the associated skill grants advantage on the harvesting check.</p>
            <table class="ingredient-table" style="font-size: 0.85rem; margin-bottom: 1.5rem;">
                <thead>
                    <tr>
                        <th>Skill</th>
                        <th>Creature Types</th>
                    </tr>
                </thead>
                <tbody>
                    ${creatureSkillRows}
                </tbody>
            </table>

            ${this.harvesting.groupHarvesting ? `
            <div class="rules-callout">
                <strong>Group Harvesting:</strong> ${this.harvesting.groupHarvesting.description}. ${this.harvesting.groupHarvesting.benefit}.
            </div>
            ` : ''}

            ${this.harvesting.modifiers?.temporaryEffects ? `
            <div class="rules-callout" style="border-left-color: var(--herb-green-dark, #2d6a4f);">
                <strong>Important:</strong> ${this.harvesting.modifiers.temporaryEffects}
            </div>
            ` : ''}

            ${this.harvesting.kitActivities ? `
            <h3>Kit Activities</h3>
            <table class="ingredient-table" style="font-size: 0.85rem; margin-bottom: 1.5rem;">
                <thead>
                    <tr>
                        <th>Activity</th>
                        <th>DC</th>
                    </tr>
                </thead>
                <tbody>
                    ${kitActivityRows}
                </tbody>
            </table>
            ` : ''}

            <h3>Kit Contents</h3>
            <p style="font-size: 0.85rem;">${this.harvesting.tool.components}</p>
        `;
    };

    /**
     * Render potion rules reference tab
     */
    App.renderPotionRules = function() {
        const section = document.getElementById('potion-rules-section');
        
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
                        <p>An extended rest is a period of <strong>downtime</strong> between adventures, at least <strong>1 week</strong> long, during which a character attends to other affairs.</p>
                        <p>Some potions in the Alchemy Almanac require the drinker to finish an extended rest before it can benefit from the effects of that potion again.</p>
                    </div>
                </div>
            </div>
        `;

        this.refreshIcons();
    };

})(window.App = window.App || {});
