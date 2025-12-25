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
} from './careerStorage';
