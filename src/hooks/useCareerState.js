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
  // Current level number (1-indexed)
  const [currentLevelNumber, setCurrentLevelNumber] = useState(1);
  
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
          setCurrentLevelNumber(progress.currentLevel);
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
   * Get current level configuration
   * @returns {Object} Current level config
   */
  const getCurrentLevel = useCallback(() => {
    return getLevelConfig(currentLevelNumber);
  }, [currentLevelNumber]);

  /**
   * Check if score meets level objective
   * @param {number} score - Final score of the run
   * @returns {boolean} True if level is completed
   */
  const isLevelCompleted = useCallback((score) => {
    const level = getCurrentLevel();
    return level && score >= level.targetScore;
  }, [getCurrentLevel]);

  /**
   * Process end of run and determine result
   * Does NOT advance level - just returns the result
   * Level advancement happens via advanceToNextLevel when user clicks "Next"
   * @param {number} finalScore - Score achieved in the run
   * @returns {Object} Result with success status
   */
  const processRunEnd = useCallback((finalScore) => {
    const level = getCurrentLevel();
    const success = isLevelCompleted(finalScore);
    
    if (success) {
      const nextLevelNumber = currentLevelNumber + 1;
      const hasNextLevel = levelExists(nextLevelNumber);
      
      return {
        success: true,
        careerCompleted: !hasNextLevel,
        nextLevel: hasNextLevel ? nextLevelNumber : null,
        message: `Niveau ${currentLevelNumber} terminé !`,
        completedLevel: currentLevelNumber,
      };
    } else {
      // Retry same level
      return {
        success: false,
        careerCompleted: false,
        nextLevel: currentLevelNumber,
        message: `Score insuffisant. Objectif : ${level.targetScore}`,
        completedLevel: null,
      };
    }
  }, [currentLevelNumber, getCurrentLevel, isLevelCompleted]);

  /**
   * Advance to next level after user confirms
   * Called when user clicks "Next Level" button
   * Saves progress to SQLite
   */
  const advanceToNextLevel = useCallback(async () => {
    const nextLevelNumber = currentLevelNumber + 1;
    
    if (levelExists(nextLevelNumber)) {
      const newUnlockedLevel = Math.max(unlockedLevel, nextLevelNumber);
      
      setCurrentLevelNumber(nextLevelNumber);
      setUnlockedLevel(newUnlockedLevel);
      setHasSavedGame(true);
      
      // Save to SQLite
      await saveCareerProgress(nextLevelNumber, newUnlockedLevel);
    } else {
      // Career completed
      setCareerCompleted(true);
      setHasSavedGame(true);
      
      // Save final state
      await saveCareerProgress(currentLevelNumber, unlockedLevel);
    }
  }, [currentLevelNumber, unlockedLevel]);

  /**
   * Reset career to level 1 (new game)
   * Clears SQLite storage
   */
  const resetCareer = useCallback(async () => {
    setCurrentLevelNumber(1);
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
    // State is already loaded from SQLite on mount
    // This function exists for explicit intent from menu
    return {
      currentLevel: currentLevelNumber,
      unlockedLevel,
    };
  }, [currentLevelNumber, unlockedLevel]);

  return {
    // State
    currentLevelNumber,
    currentLevel: getCurrentLevel(),
    unlockedLevel,
    careerCompleted,
    totalLevels: getTotalLevels(),
    isLoading,
    hasSavedGame,
    
    // Actions
    isLevelCompleted,
    processRunEnd,
    advanceToNextLevel,
    resetCareer,
    continueCareer,
  };
};

export default useCareerState;
