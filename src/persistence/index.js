/**
 * Persistence Module Index
 * Central export for storage utilities
 */

export {
  initDatabase,
  loadCareerProgress,
  saveCareerProgress,
  resetCareerProgress,
  hasSavedProgress,
  saveLevelStars,
  loadLevelStars,
  loadAllStars,
  loadHighScore,
  saveHighScore,
  resetHighScore,
  loadRatingStatus,
  saveRatingStatus,
} from './careerStorage';
