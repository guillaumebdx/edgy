/**
 * useCareerState Hook
 * Manages career mode progression with SQLite persistence
 * 
 * Handles:
 * - Current level tracking
 * - Level completion logic
 * - Progression to next level
 * - Loading/saving progress to SQLite
 * 
 * Persistence:
 * - Saves only on level validation or unlock
 * - Loads on initialization
 */

import { useState, useCallback, useEffect } from 'react';
import { getLevelConfig, levelExists, getTotalLevels } from '../careerLevels';
import { t } from '../locales';
import { 
  initDatabase, 
  loadCareerProgress, 
  saveCareerProgress, 
  resetCareerProgress,
  saveLevelStars,
  loadAllStars,
} from '../persistence';

/**
 * Custom hook for managing career progression
 * @returns {Object} Career state and actions
 */
const useCareerState = () => {
  // Career progress level - the actual progression (persisted in DB)
  // Starts at 0 (tutorial) for new players
  const [careerLevelNumber, setCareerLevelNumber] = useState(0);
  
  // Currently playing level - may differ when replaying previous levels
  const [playingLevelNumber, setPlayingLevelNumber] = useState(0);
  
  // Highest unlocked level (0 = tutorial only)
  const [unlockedLevel, setUnlockedLevel] = useState(0);
  
  // Career completion flag
  const [careerCompleted, setCareerCompleted] = useState(false);
  
  // Loading state for async initialization
  const [isLoading, setIsLoading] = useState(true);
  
  // Whether saved progress exists
  const [hasSavedGame, setHasSavedGame] = useState(false);
  
  // Stars per level (map of levelId -> stars count)
  const [levelStars, setLevelStars] = useState({});

  /**
   * Initialize database and load saved progress on mount
   */
  useEffect(() => {
    const loadProgress = async () => {
      try {
        await initDatabase();
        const progress = await loadCareerProgress();
        const stars = await loadAllStars();
        
        setLevelStars(stars);
        
        if (progress) {
          setCareerLevelNumber(progress.currentLevel);
          setPlayingLevelNumber(progress.currentLevel);
          setUnlockedLevel(progress.unlockedLevel);
          setHasSavedGame(true);
          
          // Check if career was already completed
          if (!levelExists(progress.unlockedLevel + 1) && progress.currentLevel > getTotalLevels()) {
            setCareerCompleted(true);
          }
        }
      } catch (error) {
        console.error('Failed to load career progress:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadProgress();
  }, []);

  /**
   * Get playing level configuration (the level currently being played)
   * @returns {Object} Playing level config
   */
  const getPlayingLevel = useCallback(() => {
    return getLevelConfig(playingLevelNumber);
  }, [playingLevelNumber]);

  /**
   * Check if score meets level objective
   * @param {number} score - Final score of the run
   * @returns {boolean} True if level is completed
   */
  const isLevelCompleted = useCallback((score) => {
    const level = getPlayingLevel();
    return level && score >= level.targetScore;
  }, [getPlayingLevel]);

  /**
   * Calculate stars earned for a level completion
   * Levels 1-5: 3 stars automatically on completion
   * Level 6+: 3 stars only if challenge completed, 0 otherwise
   * @param {Object} level - Level configuration
   * @param {boolean} challengeCompleted - Whether challenge was completed
   * @returns {number} Stars earned (0 or 3)
   */
  const calculateStars = useCallback((level, challengeCompleted) => {
    if (!level) return 0;
    
    // Levels 1-5: auto 3 stars on completion
    if (!level.challenge) {
      return 3;
    }
    
    // Levels with challenges: 3 stars only if challenge completed
    return challengeCompleted ? 3 : 0;
  }, []);

  /**
   * Process end of run and determine result
   * Does NOT advance level - just returns the result
   * Level advancement happens via advanceToNextLevel when user clicks "Next"
   * Only advances career if playing level >= career level (not replaying old levels)
   * @param {number} finalScore - Score achieved in the run
   * @param {boolean} challengeCompleted - Whether challenge was completed during run
   * @returns {Object} Result with success status and stars
   */
  const processRunEnd = useCallback(async (finalScore, challengeCompleted = false) => {
    const level = getPlayingLevel();
    const success = isLevelCompleted(finalScore);
    const isReplayingOldLevel = playingLevelNumber < careerLevelNumber;
    
    if (success) {
      // Calculate stars earned
      const starsEarned = calculateStars(level, challengeCompleted);
      
      // Save stars if earned (will only update if higher than existing)
      if (starsEarned > 0) {
        await saveLevelStars(playingLevelNumber, starsEarned);
        // Update local state
        setLevelStars(prev => ({
          ...prev,
          [playingLevelNumber]: Math.max(prev[playingLevelNumber] || 0, starsEarned)
        }));
      }
      
      if (isReplayingOldLevel) {
        // Replaying old level - no career progression
        return {
          success: true,
          careerCompleted: false,
          nextLevel: null,
          message: t('gameOver.levelCompleteWithNumber', { level: playingLevelNumber }),
          completedLevel: playingLevelNumber,
          isReplay: true,
          starsEarned,
        };
      }
      
      const nextLevelNumber = playingLevelNumber + 1;
      const hasNextLevel = levelExists(nextLevelNumber);
      
      // Save progression immediately (unlock next level)
      // Only update career level if we're advancing (not replaying)
      const newUnlockedLevel = Math.max(unlockedLevel, nextLevelNumber);
      const newCareerLevel = Math.max(careerLevelNumber, nextLevelNumber);
      setUnlockedLevel(newUnlockedLevel);
      setCareerLevelNumber(newCareerLevel);
      setHasSavedGame(true);
      await saveCareerProgress(newCareerLevel, newUnlockedLevel);
      
      return {
        success: true,
        careerCompleted: !hasNextLevel,
        nextLevel: hasNextLevel ? nextLevelNumber : null,
        message: t('gameOver.levelCompleteWithNumber', { level: playingLevelNumber }),
        completedLevel: playingLevelNumber,
        isReplay: false,
        starsEarned,
      };
    } else {
      // Retry same level - no stars
      return {
        success: false,
        careerCompleted: false,
        nextLevel: playingLevelNumber,
        message: t('gameOver.insufficientScore', { target: level.targetScore }),
        completedLevel: null,
        isReplay: isReplayingOldLevel,
        starsEarned: 0,
      };
    }
  }, [playingLevelNumber, careerLevelNumber, unlockedLevel, getPlayingLevel, isLevelCompleted, calculateStars]);

  /**
   * Advance to next level after user confirms
   * Called when user clicks "Next Level" button
   * Progress is already saved in processRunEnd, this just updates playingLevelNumber
   */
  const advanceToNextLevel = useCallback(async () => {
    const nextLevelNumber = playingLevelNumber + 1;
    
    if (levelExists(nextLevelNumber)) {
      // Just update playing level - career progress already saved in processRunEnd
      setPlayingLevelNumber(nextLevelNumber);
    } else {
      // Career completed
      setCareerCompleted(true);
    }
  }, [playingLevelNumber]);

  /**
   * Reset career to level 0 (tutorial - new game)
   * Clears SQLite storage
   */
  const resetCareer = useCallback(async () => {
    setCareerLevelNumber(0);
    setPlayingLevelNumber(0);
    setUnlockedLevel(0);
    setCareerCompleted(false);
    setHasSavedGame(false);
    setLevelStars({});
    
    // Clear SQLite storage
    await resetCareerProgress();
  }, []);

  /**
   * Continue from saved progress
   * Called when user chooses "Continue" from menu
   */
  const continueCareer = useCallback(() => {
    // Reset playing level to career level
    setPlayingLevelNumber(careerLevelNumber);
    return {
      currentLevel: careerLevelNumber,
      unlockedLevel,
    };
  }, [careerLevelNumber, unlockedLevel]);

  /**
   * Select a specific level to play (does NOT change career progress)
   * Only allows selecting unlocked levels
   * Only changes playingLevelNumber, not careerLevelNumber
   * @param {number} levelNumber - Level to select
   */
  const selectLevel = useCallback((levelNumber) => {
    if (levelNumber <= unlockedLevel && levelExists(levelNumber)) {
      setPlayingLevelNumber(levelNumber);
    }
  }, [unlockedLevel]);

  /**
   * DEBUG: Set career to a specific level with all previous levels completed with 3 stars
   * @param {number} targetLevel - Level to set as current
   */
  const debugSetLevel = useCallback(async (targetLevel) => {
    // Set career state
    setCareerLevelNumber(targetLevel);
    setPlayingLevelNumber(targetLevel);
    setUnlockedLevel(targetLevel);
    setHasSavedGame(true);
    setCareerCompleted(false);
    
    // Set 3 stars for all previous levels
    const newStars = {};
    for (let i = 0; i < targetLevel; i++) {
      newStars[i] = 3;
      await saveLevelStars(i, 3);
    }
    setLevelStars(newStars);
    
    // Save to SQLite
    await saveCareerProgress(targetLevel, targetLevel);
  }, []);

  return {
    // State - career progress (persisted)
    careerLevelNumber,
    unlockedLevel,
    careerCompleted,
    totalLevels: getTotalLevels(),
    isLoading,
    hasSavedGame,
    levelStars, // Map of levelId -> stars count
    
    // State - currently playing (not persisted until level complete)
    playingLevelNumber,
    playingLevel: getPlayingLevel(),
    
    // Actions
    isLevelCompleted,
    processRunEnd,
    advanceToNextLevel,
    resetCareer,
    continueCareer,
    selectLevel,
    debugSetLevel,
  };
};

export default useCareerState;
