/**
 * Career Levels Configuration
 * Static definition of all career mode levels
 * 
 * Each level defines:
 * - gridSize: size of the grid (gridSize x gridSize)
 * - maxValue: maximum cell value before destruction
 * - stock: total cells available for refilling
 * - targetScore: score required to complete the level
 * 
 * Progression is pedagogical: complexity increases gradually
 * through parameter adjustments only, no new rules.
 */

export const CAREER_LEVELS = [
  {
    id: 1,
    name: 'Initiation',
    gridSize: 4,
    maxValue: 3,
    stock: 30,
    targetScore: 200,
  },
  {
    id: 2,
    name: 'Circuits simples',
    gridSize: 5,
    maxValue: 4,
    stock: 40,
    targetScore: 500,
  },
  {
    id: 3,
    name: 'Logique avancée',
    gridSize: 6,
    maxValue: 4,
    stock: 45,
    targetScore: 1000,
  },
  {
    id: 4,
    name: 'Haute tension',
    gridSize: 6,
    maxValue: 5,
    stock: 50,
    targetScore: 2000,
  },
  {
    id: 5,
    name: 'Maître du circuit',
    gridSize: 6,
    maxValue: 5,
    stock: 40,
    targetScore: 3500,
  },
];

/**
 * Get level configuration by level number (1-indexed)
 * @param {number} levelNumber - Level number (1-5)
 * @returns {Object|null} Level configuration or null if not found
 */
export const getLevelConfig = (levelNumber) => {
  return CAREER_LEVELS.find(level => level.id === levelNumber) || null;
};

/**
 * Check if a level exists
 * @param {number} levelNumber - Level number to check
 * @returns {boolean} True if level exists
 */
export const levelExists = (levelNumber) => {
  return CAREER_LEVELS.some(level => level.id === levelNumber);
};

/**
 * Get total number of levels
 * @returns {number} Total level count
 */
export const getTotalLevels = () => CAREER_LEVELS.length;
