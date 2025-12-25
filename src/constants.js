/**
 * Game Constants
 * Centralized configuration values for the game
 */

// Grid configuration
export const GRID_SIZE = 6;
export const MAX_VALUE = 5;
export const INITIAL_STOCK = 50;
export const GRID_PADDING = 6;

// Color palette for cell values (Circuit/Logic theme)
// Functional charge-level palette: high contrast between values
// Low values = cool/dim, High values = warm/bright
export const COLOR_MAP = {
  1: { base: '#2D4048', top: '#3A5058', bottom: '#243238', border: '#1C2428' },
  2: { base: '#386068', top: '#487078', bottom: '#2C4850', border: '#203840' },
  3: { base: '#408888', top: '#509898', bottom: '#306868', border: '#205050' },
  4: { base: '#48A090', top: '#58B0A0', bottom: '#388070', border: '#286058' },
  5: { base: '#70D0B0', top: '#88E0C0', bottom: '#58B898', border: '#48A080' },
};

// Celebration words displayed on significant achievements
export const CELEBRATION_WORDS = [
  'PARFAIT !',
  'INCROYABLE !',
  'BIEN JOUÉ !',
  'SUPERBE !',
  'MAGNIFIQUE !',
  'EXCELLENT !',
];

// Animation timing constants
export const ANIMATION = {
  PRESS_SCALE: 0.88,
  FALL_DELAY_PER_COLUMN: 30,
  SHAKE_DURATION: 205,
  FALL_ANIMATION_DURATION: 400,
  FLOATING_TEXT_DURATION: 1000,
  CELEBRATION_DURATION: 900,
  // Level entry animation
  ENTRY_FALL_DURATION: 400,
  ENTRY_FALL_DELAY_PER_CELL: 20,
  ENTRY_REVEAL_DURATION: 250,
  ENTRY_REVEAL_DELAY: 50,
};

// Neutral color for entry animation (before reveal)
export const NEUTRAL_COLOR = {
  base: '#2A3438',
  top: '#343E42',
  bottom: '#222A2E',
  border: '#1A2024',
};

// Celebration trigger thresholds
export const CELEBRATION_THRESHOLDS = {
  MIN_PATH_LENGTH: 8,
  MIN_COMBO: 3,
  MIN_CELLS_DESTROYED: 6,
};
