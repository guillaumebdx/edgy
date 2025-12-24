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
import { 
  initDatabase, 
  loadCareerProgress, 
  saveCareerProgress, 
  resetCareerProgress 
} from '../persistence';

/**
 * Custom hook for managing career progression
 * @returns {Object} Career state and actions
 */
const useCareerState = () => {
  // Career progress level - the actual progression (persisted in DB)
  const [careerLevelNumber, setCareerLevelNumber] = useState(1);
  
  // Currently playing level - may differ when replaying previous levels
  const [playingLevelNumber, setPlayingLevelNumber] = useState(1);
  
  // Highest unlocked level
  const [unlockedLevel, setUnlockedLevel] = useState(1);
  
  // Career completion flag
  const [careerCompleted, setCareerCompleted] = useState(false);
  
  // Loading state for async initialization
  const [isLoading, setIsLoading] = useState(true);
  
  // Whether saved progress exists
  const [hasSavedGame, setHasSavedGame] = useState(false);

  /**
   * Initialize database and load saved progress on mount
   */
  useEffect(() => {
    const loadProgress = async () => {
      try {
        await initDatabase();
        const progress = await loadCareerProgress();
        
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
   * Process end of run and determine result
   * Does NOT advance level - just returns the result
   * Level advancement happens via advanceToNextLevel when user clicks "Next"
   * Only advances career if playing level >= career level (not replaying old levels)
   * @param {number} finalScore - Score achieved in the run
   * @returns {Object} Result with success status
   */
  const processRunEnd = useCallback((finalScore) => {
    const level = getPlayingLevel();
    const success = isLevelCompleted(finalScore);
    const isReplayingOldLevel = playingLevelNumber < careerLevelNumber;
    
    if (success) {
      if (isReplayingOldLevel) {
        // Replaying old level - no career progression
        return {
          success: true,
          careerCompleted: false,
          nextLevel: null,
          message: `Niveau ${playingLevelNumber} terminé !`,
          completedLevel: playingLevelNumber,
          isReplay: true,
        };
      }
      
      const nextLevelNumber = playingLevelNumber + 1;
      const hasNextLevel = levelExists(nextLevelNumber);
      
      return {
        success: true,
        careerCompleted: !hasNextLevel,
        nextLevel: hasNextLevel ? nextLevelNumber : null,
        message: `Niveau ${playingLevelNumber} terminé !`,
        completedLevel: playingLevelNumber,
        isReplay: false,
      };
    } else {
      // Retry same level
      return {
        success: false,
        careerCompleted: false,
        nextLevel: playingLevelNumber,
        message: `Score insuffisant. Objectif : ${level.targetScore}`,
        completedLevel: null,
        isReplay: isReplayingOldLevel,
      };
    }
  }, [playingLevelNumber, careerLevelNumber, getPlayingLevel, isLevelCompleted]);

  /**
   * Advance to next level after user confirms
   * Called when user clicks "Next Level" button
   * Saves progress to SQLite
   * Only called when completing current career level (not replays)
   */
  const advanceToNextLevel = useCallback(async () => {
    const nextLevelNumber = playingLevelNumber + 1;
    
    if (levelExists(nextLevelNumber)) {
      const newUnlockedLevel = Math.max(unlockedLevel, nextLevelNumber);
      
      setCareerLevelNumber(nextLevelNumber);
      setPlayingLevelNumber(nextLevelNumber);
      setUnlockedLevel(newUnlockedLevel);
      setHasSavedGame(true);
      
      // Save to SQLite
      await saveCareerProgress(nextLevelNumber, newUnlockedLevel);
    } else {
      // Career completed
      setCareerCompleted(true);
      setHasSavedGame(true);
      
      // Save final state
      await saveCareerProgress(playingLevelNumber, unlockedLevel);
    }
  }, [playingLevelNumber, unlockedLevel]);

  /**
   * Reset career to level 1 (new game)
   * Clears SQLite storage
   */
  const resetCareer = useCallback(async () => {
    setCareerLevelNumber(1);
    setPlayingLevelNumber(1);
    setUnlockedLevel(1);
    setCareerCompleted(false);
    setHasSavedGame(false);
    
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

  return {
    // State - career progress (persisted)
    careerLevelNumber,
    unlockedLevel,
    careerCompleted,
    totalLevels: getTotalLevels(),
    isLoading,
    hasSavedGame,
    
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
  };
};

export default useCareerState;
