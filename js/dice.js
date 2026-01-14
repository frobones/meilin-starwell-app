/**
 * Dice rolling utilities for Meilin's Apothecary
 * Handles d20 rolls with advantage support
 */

const Dice = {
    /**
     * Roll a single die
     * @param {number} sides - Number of sides on the die
     * @returns {number} The result of the roll
     */
    roll(sides) {
        return Math.floor(Math.random() * sides) + 1;
    },

    /**
     * Roll a d20
     * @returns {number} Result from 1-20
     */
    d20() {
        return this.roll(20);
    },

    /**
     * Roll a d20 with advantage (roll twice, take higher)
     * @returns {{result: number, rolls: number[], type: string}} Result object
     */
    d20Advantage() {
        const roll1 = this.d20();
        const roll2 = this.d20();
        return {
            result: Math.max(roll1, roll2),
            rolls: [roll1, roll2],
            type: 'advantage'
        };
    },

    /**
     * Roll a d20 with disadvantage (roll twice, take lower)
     * @returns {{result: number, rolls: number[], type: string}} Result object
     */
    d20Disadvantage() {
        const roll1 = this.d20();
        const roll2 = this.d20();
        return {
            result: Math.min(roll1, roll2),
            rolls: [roll1, roll2],
            type: 'disadvantage'
        };
    },

    /**
     * Roll a d20, optionally with advantage
     * @param {boolean} advantage - Whether to roll with advantage
     * @returns {{result: number, rolls: number[], type: string, isNat20: boolean, isNat1: boolean}}
     */
    craftingCheck(advantage = false) {
        let rollData;
        
        if (advantage) {
            rollData = this.d20Advantage();
        } else {
            const result = this.d20();
            rollData = {
                result: result,
                rolls: [result],
                type: 'normal'
            };
        }

        return {
            ...rollData,
            isNat20: rollData.result === 20,
            isNat1: rollData.result === 1
        };
    },

    /**
     * Compare a roll result against a DC
     * @param {number} result - The roll result
     * @param {number} dc - The difficulty class to beat
     * @returns {{success: boolean, margin: number}}
     */
    checkAgainstDC(result, dc) {
        return {
            success: result >= dc,
            margin: result - dc
        };
    },

    /**
     * Generate star display for difficulty rating
     * @param {number} difficulty - Difficulty level (1-5)
     * @returns {string} Star string representation
     */
    getStars(difficulty) {
        const filled = '★';
        const empty = '☆';
        const maxStars = 5;
        
        const filledCount = Math.min(difficulty, maxStars);
        const emptyCount = maxStars - filledCount;
        
        return filled.repeat(filledCount) + empty.repeat(emptyCount);
    },

    /**
     * Get DC from difficulty level
     * @param {number} difficulty - Difficulty level (1-5)
     * @returns {number} The DC value
     */
    getDCFromDifficulty(difficulty) {
        const dcMap = {
            1: 10,
            2: 15,
            3: 20,
            4: 25,
            5: 28
        };
        return dcMap[difficulty] || 10;
    },

    /**
     * Get difficulty label
     * @param {number} difficulty - Difficulty level (1-5)
     * @returns {string} Human-readable difficulty label
     */
    getDifficultyLabel(difficulty) {
        const labels = {
            1: 'Low',
            2: 'Moderate',
            3: 'High',
            4: 'Very High',
            5: 'Maximum'
        };
        return labels[difficulty] || 'Unknown';
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Dice;
}
