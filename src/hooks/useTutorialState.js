/**
 * useTutorialState Hook
 * Manages tutorial level state and progression
 * 
 * Features:
 * - Tracks current tutorial step
 * - Validates if player's path matches expected path
 * - Controls overlay visibility
 * - Provides hint text and expected path for overlay
 */

import { useState, useCallback, useRef, useEffect } from 'react';

/**
 * Check if two paths are equivalent (same cells, either direction)
 */
const pathsMatch = (path1, path2) => {
  if (path1.length !== path2.length) return false;
  // Check forward direction
  const forwardMatch = path1.every((cell, index) => cell === path2[index]);
  if (forwardMatch) return true;
  // Check reverse direction
  const reversedPath2 = [...path2].reverse();
  return path1.every((cell, index) => cell === reversedPath2[index]);
};

/**
 * Check if path1 starts with the beginning of path2 (in either direction)
 */
const pathStartsCorrectly = (playerPath, expectedPath) => {
  if (playerPath.length === 0) return true;
  if (playerPath.length > expectedPath.length) return false;
  
  // Check forward direction
  const forwardMatch = playerPath.every((cell, index) => cell === expectedPath[index]);
  if (forwardMatch) return true;
  
  // Check reverse direction
  const reversedExpected = [...expectedPath].reverse();
  return playerPath.every((cell, index) => cell === reversedExpected[index]);
};

/**
 * Custom hook for tutorial state management
 * @param {Object} tutorialConfig - Tutorial configuration from level
 * @param {boolean} isTutorialLevel - Whether current level is tutorial
 * @returns {Object} Tutorial state and handlers
 */
const useTutorialState = (tutorialConfig, isTutorialLevel) => {
  // Current step index (0-based)
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  
  // Whether to show the guide overlay
  const [showGuide, setShowGuide] = useState(true);
  
  // Whether player is on correct path
  const [isOnCorrectPath, setIsOnCorrectPath] = useState(false);
  
  // Ref to track if tutorial is active
  const tutorialActiveRef = useRef(isTutorialLevel);
  
  // Update ref when level changes
  useEffect(() => {
    tutorialActiveRef.current = isTutorialLevel;
    if (isTutorialLevel) {
      setCurrentStepIndex(0);
      setShowGuide(true);
      setIsOnCorrectPath(false);
    }
  }, [isTutorialLevel]);

  // Get current step
  const currentStep = tutorialConfig?.steps?.[currentStepIndex] || null;
  
  // Get expected path for current step
  const expectedPath = currentStep?.expectedPath || [];
  
  // Get hint text for current step
  const hint = currentStep?.hint || '';
  
  // Check if this is the last step
  const isLastStep = currentStep?.isLastStep || false;

  /**
   * Check if player's current path is valid for tutorial
   * Returns true if path matches expected, false otherwise
   * Also updates guide visibility
   */
  const validateTutorialPath = useCallback((playerPath) => {
    if (!tutorialActiveRef.current || !currentStep) {
      return true; // Not in tutorial, allow all moves
    }

    const expected = currentStep.expectedPath;
    
    // Check if player is starting correctly
    if (pathStartsCorrectly(playerPath, expected)) {
      setIsOnCorrectPath(true);
      // Hide guide when player starts correct path
      if (playerPath.length > 0) {
        setShowGuide(false);
      }
      return true;
    }
    
    setIsOnCorrectPath(false);
    return false;
  }, [currentStep]);

  /**
   * Check if completed path matches expected path exactly
   * Called when player releases gesture
   */
  const isPathComplete = useCallback((playerPath) => {
    if (!tutorialActiveRef.current || !currentStep) {
      return true; // Not in tutorial, allow all moves
    }
    
    return pathsMatch(playerPath, currentStep.expectedPath);
  }, [currentStep]);

  /**
   * Advance to next tutorial step
   * Called after successful move
   */
  const advanceStep = useCallback(() => {
    if (!tutorialActiveRef.current) return;
    
    const nextIndex = currentStepIndex + 1;
    const totalSteps = tutorialConfig?.steps?.length || 0;
    
    if (nextIndex < totalSteps) {
      setCurrentStepIndex(nextIndex);
      setShowGuide(true);
      setIsOnCorrectPath(false);
    }
  }, [currentStepIndex, tutorialConfig]);

  /**
   * Reset tutorial state (for restart)
   */
  const resetTutorial = useCallback(() => {
    setCurrentStepIndex(0);
    setShowGuide(true);
    setIsOnCorrectPath(false);
  }, []);

  /**
   * Cancel current path attempt - show guide again
   */
  const cancelPath = useCallback(() => {
    if (tutorialActiveRef.current) {
      setShowGuide(true);
      setIsOnCorrectPath(false);
    }
  }, []);

  return {
    // State
    currentStepIndex,
    currentStep,
    expectedPath,
    hint,
    showGuide,
    isOnCorrectPath,
    isLastStep,
    isTutorialActive: isTutorialLevel,
    
    // Actions
    validateTutorialPath,
    isPathComplete,
    advanceStep,
    resetTutorial,
    cancelPath,
  };
};

export default useTutorialState;
