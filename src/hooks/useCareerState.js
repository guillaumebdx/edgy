/**
 * useCareerState Hook
 * Manages career mode progression
 * 
 * Handles:
 * - Current level tracking
 * - Level completion logic
 * - Progression to next level
 * 
 * Note: No persistence yet - state resets on app restart
 * Architecture allows easy addition of SQLite persistence later
 */

import { useState, useCallback } from 'react';
import { getLevelConfig, levelExists, getTotalLevels } from '../careerLevels';

/**
 * Custom hook for managing career progression
 * @returns {Object} Career state and actions
 */
const useCareerState = () => {
  // Current level number (1-indexed)
  const [currentLevelNumber, setCurrentLevelNumber] = useState(1);
  
  // Career completion flag
  const [careerCompleted, setCareerCompleted] = useState(false);

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
   * Process end of run and determine progression
   * @param {number} finalScore - Score achieved in the run
   * @returns {Object} Result with success status and next action
   */
  const processRunEnd = useCallback((finalScore) => {
    const level = getCurrentLevel();
    const success = isLevelCompleted(finalScore);
    
    if (success) {
      const nextLevelNumber = currentLevelNumber + 1;
      
      if (levelExists(nextLevelNumber)) {
        // Progress to next level
        setCurrentLevelNumber(nextLevelNumber);
        return {
          success: true,
          careerCompleted: false,
          nextLevel: nextLevelNumber,
          message: `Niveau ${currentLevelNumber} terminé !`,
        };
      } else {
        // Career completed
        setCareerCompleted(true);
        return {
          success: true,
          careerCompleted: true,
          nextLevel: null,
          message: 'Carrière terminée !',
        };
      }
    } else {
      // Retry same level
      return {
        success: false,
        careerCompleted: false,
        nextLevel: currentLevelNumber,
        message: `Score insuffisant. Objectif : ${level.targetScore}`,
      };
    }
  }, [currentLevelNumber, getCurrentLevel, isLevelCompleted]);

  /**
   * Reset career to level 1
   */
  const resetCareer = useCallback(() => {
    setCurrentLevelNumber(1);
    setCareerCompleted(false);
  }, []);

  return {
    // State
    currentLevelNumber,
    currentLevel: getCurrentLevel(),
    careerCompleted,
    totalLevels: getTotalLevels(),
    
    // Actions
    isLevelCompleted,
    processRunEnd,
    resetCareer,
  };
};

export default useCareerState;
