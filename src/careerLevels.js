/**
 * Career Levels Configuration
 * Static definition of all career mode levels
 * 
 * Each level defines:
 * - gridSize: size of the grid (gridSize x gridSize)
 * - maxValue: maximum cell value before destruction
 * - stock: total cells available for refilling
 * - targetScore: score required to complete the level
 * - challenge: optional challenge for stars (levels 6+)
 *   - type: challenge type identifier
 *   - description: human-readable description
 * 
 * Stars system:
 * - Levels 1-5: 3 stars automatically on completion
 * - Level 6+: 3 stars only if challenge is completed during the run
 * 
 * Progression is pedagogical: complexity increases gradually
 * through parameter adjustments only, no new rules.
 */

// Challenge types
export const CHALLENGE_TYPES = {
  COLUMN_OF_FIVES: 'column_of_fives', // Full column of value 5
};

export const CAREER_LEVELS = [
  {
    id: 1,
    name: 'Initiation',
    gridSize: 4,
    maxValue: 3,
    stock: 30,
    targetScore: 200,
    challenge: null, // Auto 3 stars on completion
  },
  {
    id: 2,
    name: 'Circuits simples',
    gridSize: 5,
    maxValue: 4,
    stock: 40,
    targetScore: 500,
    challenge: null, // Auto 3 stars on completion
  },
  {
    id: 3,
    name: 'Logique avancée',
    gridSize: 6,
    maxValue: 4,
    stock: 45,
    targetScore: 1000,
    challenge: null, // Auto 3 stars on completion
  },
  {
    id: 4,
    name: 'Haute tension',
    gridSize: 6,
    maxValue: 5,
    stock: 50,
    targetScore: 2000,
    challenge: null, // Auto 3 stars on completion
  },
  {
    id: 5,
    name: 'Maître du circuit',
    gridSize: 6,
    maxValue: 5,
    stock: 40,
    targetScore: 3500,
    challenge: null, // Auto 3 stars on completion
  },
  {
    id: 6,
    name: 'Colonne parfaite',
    gridSize: 6,
    maxValue: 5,
    stock: 45,
    targetScore: 4000,
    challenge: {
      type: CHALLENGE_TYPES.COLUMN_OF_FIVES,
      description: 'Aligner une colonne complète de 5',
    },
  },
  {
    id: 7,
    name: 'Signal fort',
    gridSize: 7,
    maxValue: 5,
    stock: 55,
    targetScore: 5500,
    challenge: {
      type: CHALLENGE_TYPES.COLUMN_OF_FIVES,
      description: 'Aligner une colonne complète de 5',
    },
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
