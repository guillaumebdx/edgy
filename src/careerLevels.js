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
 * - tutorial: optional tutorial configuration for guided levels
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

/**
 * Tutorial level configuration
 * Fixed 4x4 grid with deterministic steps
 * Grid layout (indices):
 *  0  1  2  3
 *  4  5  6  7
 *  8  9 10 11
 * 12 13 14 15
 * 
 * Initial grid designed for teaching:
 *  1  1  2  3
 *  2  1  2  3
 *  1  2  3  3
 *  2  3  3  3
 * 
 * Tutorial teaches:
 * 1. Basic merging (2 cells -> value 2)
 * 2. Longer chains (3 cells -> value 3)
 * 3. Exceeding MAX causes destruction
 * 4. Big chains = big points
 */
const TUTORIAL_CONFIG = {
  // Initial fixed grid - designed for teaching with variety
  initialGrid: [
    1, 1, 2, 3,
    2, 1, 2, 3,
    1, 2, 3, 3,
    2, 3, 3, 3,
  ],
  // Tutorial steps - each step has expected path and hint
  steps: [
    {
      id: 1,
      hint: 'Relie 2 cases identiques',
      expectedPath: [0, 1], // Two 1s -> become 2
    },
    {
      id: 2,
      hint: '2 cases = valeur 2 !',
      expectedPath: [5, 8], // Two 1s -> become 2
    },
    {
      id: 3,
      hint: '3 cases = valeur 3',
      expectedPath: [2, 6, 9], // Three 2s -> become 3
    },
    {
      id: 4,
      hint: 'Dépasse MAX pour détruire !',
      expectedPath: [3, 7, 11, 10, 14, 15], // Six 3s -> become 6, exceeds MAX 3
      // Path: 3→7 (down), 7→11 (down), 11→10 (left), 10→14 (down), 14→15 (right)
      highlightMax: true,
    },
    {
      id: 5,
      hint: 'Atteins l\'objectif pour gagner !',
      // After destruction and gravity, left column has 2s
      expectedPath: [0, 4, 8, 12], // Four 2s in left column -> become 4, exceeds MAX 3
      isLastStep: true,
      // No highlightMax here - focus on objective blinking
    },
  ],
};

export const CAREER_LEVELS = [
  {
    id: 0,
    name: 'Tutoriel',
    gridSize: 4,
    maxValue: 3,
    stock: 0, // No stock refill in tutorial
    targetScore: 300, // Requires completing all steps including final destruction
    challenge: null,
    tutorial: TUTORIAL_CONFIG,
  },
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
  {
    id: 8,
    name: 'Attraction magnétique',
    gridSize: 7,
    maxValue: 7,
    stock: 60,
    targetScore: 7000,
    shuffles: 2, // New shuffle feature
    challenge: null,
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
