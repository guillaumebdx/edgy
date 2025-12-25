/**
 * useLevelEntryAnimation Hook
 * Manages the level entry animation with two phases:
 * 1. Falling: blocks fall from top with neutral appearance
 * 2. Revealing: blocks reveal their colors and values
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { ANIMATION } from '../constants';

/**
 * Animation phases
 */
const PHASES = {
  FALLING: 'falling',
  REVEALING: 'revealing',
  READY: 'ready',
};

/**
 * Custom hook for level entry animation
 * @param {number} gridSize - Size of the grid
 * @param {string} levelId - Current level identifier (triggers animation on change)
 * @param {boolean} isGameScreen - Whether we're on the game screen (triggers animation when entering)
 * @param {Function} onFallComplete - Callback when fall phase completes (for sound)
 * @returns {Object} Animation state and controls
 */
const useLevelEntryAnimation = (gridSize, levelId, isGameScreen = true, onFallComplete = null) => {
  const [phase, setPhase] = useState(PHASES.READY);
  const [isAnimating, setIsAnimating] = useState(false);
  const animationTriggeredRef = useRef(null);
  const wasOnGameScreenRef = useRef(false);
  
  const totalCells = gridSize * gridSize;
  
  // Calculate total animation duration
  const fallDuration = ANIMATION.ENTRY_FALL_DURATION + (totalCells * ANIMATION.ENTRY_FALL_DELAY_PER_CELL);
  const revealDuration = ANIMATION.ENTRY_REVEAL_DURATION + ANIMATION.ENTRY_REVEAL_DELAY;
  
  /**
   * Start the entry animation sequence
   */
  const startAnimation = useCallback(() => {
    setIsAnimating(true);
    setPhase(PHASES.FALLING);
    
    // Play landing sound earlier - when blocks visually land (about 25% through animation)
    const soundDelay = Math.floor(fallDuration * 0.25);
    setTimeout(() => {
      if (onFallComplete) {
        onFallComplete();
      }
    }, soundDelay);
    
    // After fall completes, start reveal
    setTimeout(() => {
      setPhase(PHASES.REVEALING);
      
      // After reveal completes, set ready
      setTimeout(() => {
        setPhase(PHASES.READY);
        setIsAnimating(false);
      }, revealDuration);
    }, fallDuration);
  }, [fallDuration, revealDuration, onFallComplete]);
  
  /**
   * Skip animation (for quick restarts)
   */
  const skipAnimation = useCallback(() => {
    setPhase(PHASES.READY);
    setIsAnimating(false);
  }, []);
  
  // Trigger animation when level changes OR when entering game screen from menu
  useEffect(() => {
    // Create a unique key combining levelId and screen state
    const animationKey = `${levelId}-${isGameScreen}`;
    
    // Trigger if: entering game screen OR level changed while on game screen
    const shouldAnimate = isGameScreen && (
      // Just entered game screen
      (!wasOnGameScreenRef.current && isGameScreen) ||
      // Level changed while on game screen
      (levelId !== null && animationTriggeredRef.current !== animationKey)
    );
    
    if (shouldAnimate && levelId !== null) {
      animationTriggeredRef.current = animationKey;
      startAnimation();
    }
    
    wasOnGameScreenRef.current = isGameScreen;
  }, [levelId, isGameScreen, startAnimation]);
  
  /**
   * Get entry delay for a specific cell based on its position
   * Creates a cascade effect from top-left to bottom-right
   */
  const getEntryDelay = useCallback((cellIndex) => {
    const row = Math.floor(cellIndex / gridSize);
    const col = cellIndex % gridSize;
    // Delay based on row + slight column offset for wave effect
    return (row * ANIMATION.ENTRY_FALL_DELAY_PER_CELL * 2) + (col * ANIMATION.ENTRY_FALL_DELAY_PER_CELL);
  }, [gridSize]);
  
  /**
   * Get reveal delay for a specific cell
   * Almost simultaneous with slight random variation
   */
  const getRevealDelay = useCallback((cellIndex) => {
    // Very slight delay variation for organic feel
    return (cellIndex % 4) * 15;
  }, []);
  
  return {
    phase,
    isAnimating,
    startAnimation,
    skipAnimation,
    getEntryDelay,
    getRevealDelay,
  };
};

export default useLevelEntryAnimation;
