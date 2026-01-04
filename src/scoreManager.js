/**
 * Score Manager Module
 * Handles score calculation, combo logic, and celebration triggers
 */

import { CELEBRATION_THRESHOLDS, CELEBRATION_WORDS } from './constants';

/**
 * Calculates base points for a validated path
 * Formula: pathLength² × numberOfCells
 * @param {number} pathLength - Length/value of the path
 * @param {number} cellCount - Number of cells in the path
 * @returns {number} Base points before multipliers
 */
export const calculateBasePoints = (pathLength, cellCount) => {
  return pathLength * pathLength * cellCount;
};

/**
 * Calculates final points with combo multiplier
 * @param {number} basePoints - Points before multiplier
 * @param {number} comboMultiplier - Current combo level
 * @returns {number} Final points
 */
export const calculateFinalPoints = (basePoints, comboMultiplier) => {
  return basePoints * comboMultiplier;
};

/**
 * Determines if an action should trigger a celebration
 * Celebrations are rare and reserved for significant achievements
 * @param {number} pathLength - Final value of the path
 * @param {number} combo - Current combo count
 * @param {number} cellCount - Number of cells destroyed
 * @returns {boolean} True if celebration should trigger
 */
export const shouldCelebrate = (pathLength, combo, cellCount) => {
  return (
    pathLength >= CELEBRATION_THRESHOLDS.MIN_PATH_LENGTH ||
    combo >= CELEBRATION_THRESHOLDS.MIN_COMBO ||
    cellCount >= CELEBRATION_THRESHOLDS.MIN_CELLS_DESTROYED
  );
};

/**
 * Gets a random celebration word
 * @returns {string} Random celebration message
 */
export const getRandomCelebrationWord = () => {
  return CELEBRATION_WORDS[Math.floor(Math.random() * CELEBRATION_WORDS.length)];
};

/**
 * Formats score for display with locale formatting
 * @param {number} score - Raw score value
 * @returns {string} Formatted score string
 */
export const formatScore = (score) => {
  return score.toLocaleString('fr-FR');
};

/**
 * Generates floating score text based on points and combo
 * @param {number} points - Points earned
 * @param {number} combo - Current combo (>1 shows multiplier)
 * @returns {string} Formatted text for floating display
 */
export const getFloatingScoreText = (points, combo) => {
  if (combo > 1) {
    return `+${points} x${combo}`;
  }
  return `+${points}`;
};
