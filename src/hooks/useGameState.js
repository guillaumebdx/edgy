/**
 * useGameState Hook
 * Centralized game state management
 * Handles all game state, refs, and core game actions
 * 
 * Accepts optional levelConfig for career mode:
 * - gridSize: size of the grid
 * - maxValue: maximum cell value before destruction
 * - stock: total cells available for refilling
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import {
  GRID_SIZE as DEFAULT_GRID_SIZE,
  INITIAL_STOCK as DEFAULT_STOCK,
  MAX_VALUE as DEFAULT_MAX_VALUE,
  GRID_PADDING,
  ANIMATION,
} from '../constants';
import {
  generateGrid,
  areAdjacent,
  applyGravityAndFill,
  calculateFallDistances,
  hasValidMove,
  getCellFromPosition,
  checkColumnOfValue,
} from '../gameLogic';
import { CHALLENGE_TYPES } from '../careerLevels';
import {
  calculateBasePoints,
  calculateFinalPoints,
  shouldCelebrate,
  getRandomCelebrationWord,
  getFloatingScoreText,
} from '../scoreManager';
import * as Haptics from 'expo-haptics';
import { playSuccessSound, playErrorSound, playLandingSound, playChallengeSound } from '../sounds';

/**
 * Custom hook for managing all game state and logic
 * @param {Object} levelConfig - Optional level configuration
 * @param {number} levelConfig.gridSize - Grid size (default: 6)
 * @param {number} levelConfig.maxValue - Max cell value (default: 5)
 * @param {number} levelConfig.stock - Initial stock (default: 50)
 * @returns {Object} Game state and action handlers
 */
const useGameState = (levelConfig = null, tutorialHandlers = null) => {
  // Extract level parameters with defaults
  const gridSize = levelConfig?.gridSize || DEFAULT_GRID_SIZE;
  const maxValue = levelConfig?.maxValue || DEFAULT_MAX_VALUE;
  const initialStock = levelConfig?.stock || DEFAULT_STOCK;
  const targetScore = levelConfig?.targetScore || null;
  
  // Tutorial configuration
  const tutorial = levelConfig?.tutorial || null;
  const isTutorialLevel = !!tutorial;

  // Grid and visual state - use fixed grid for tutorial
  const [gridData, setGridData] = useState(() => 
    tutorial?.initialGrid ? [...tutorial.initialGrid] : generateGrid(gridSize, maxValue)
  );
  const [exceededCells, setExceededCells] = useState([]);
  const [shakingCells, setShakingCells] = useState([]);
  const [fallingCells, setFallingCells] = useState({});
  const [path, setPath] = useState([]);
  const [gridLayout, setGridLayout] = useState({
    width: 0,
    height: 0,
    cellWidth: 0,
    cellHeight: 0,
    padding: 0,
    gridSize: gridSize,
  });

  // Score and progression state
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [stock, setStock] = useState(initialStock);
  const [gameOver, setGameOver] = useState(false);
  const [levelComplete, setLevelComplete] = useState(false);
  
  // Challenge state (for star system)
  const [challengeCompleted, setChallengeCompleted] = useState(false);
  const [challengeColumn, setChallengeColumn] = useState(null); // Column index when challenge is met
  const challenge = levelConfig?.challenge || null;
  const challengeRef = useRef(challenge);
  
  // Store targetScore in ref for use in callbacks
  const targetScoreRef = useRef(targetScore);

  // Feedback state
  const [floatingScore, setFloatingScore] = useState({ visible: false, text: '', key: 0 });
  const [celebration, setCelebration] = useState({ visible: false, text: '', key: 0 });

  // Refs for gesture handling (avoid stale closures)
  const pathRef = useRef([]);
  const pathValueRef = useRef(null);
  const isResolvingRef = useRef(false);
  const stockRef = useRef(initialStock);
  
  // Store level params in refs for use in callbacks
  const gridSizeRef = useRef(gridSize);
  const maxValueRef = useRef(maxValue);
  
  // Track level ID to detect level changes
  const levelId = levelConfig?.id || 0;
  const prevLevelIdRef = useRef(levelId);
  
  // Update refs when level changes
  useEffect(() => {
    gridSizeRef.current = gridSize;
    maxValueRef.current = maxValue;
    targetScoreRef.current = targetScore;
    challengeRef.current = challenge;
  }, [gridSize, maxValue, targetScore, challenge]);
  
  // Reset game state when level changes (different level ID)
  useEffect(() => {
    if (prevLevelIdRef.current !== levelId) {
      prevLevelIdRef.current = levelId;
      
      // Reset all game state for new level - use fixed grid for tutorial
      setGridData(tutorial?.initialGrid ? [...tutorial.initialGrid] : generateGrid(gridSize, maxValue));
      setScore(0);
      setCombo(0);
      stockRef.current = initialStock;
      setStock(initialStock);
      setGameOver(false);
      setLevelComplete(false);
      setChallengeCompleted(false);
      setChallengeColumn(null);
      setPath([]);
      pathRef.current = [];
      pathValueRef.current = null;
      isResolvingRef.current = false;
      setExceededCells([]);
      setShakingCells([]);
      setFallingCells({});
    }
  }, [levelId, gridSize, maxValue, initialStock]);

  /**
   * Handles grid layout measurement for touch coordinate conversion
   */
  const handleGridLayout = useCallback((event) => {
    const { width, height } = event.nativeEvent.layout;
    const padding = GRID_PADDING;
    const contentWidth = width - padding * 2;
    const contentHeight = height - padding * 2;
    const currentGridSize = gridSizeRef.current;
    const cellWidth = contentWidth / currentGridSize;
    const cellHeight = contentHeight / currentGridSize;
    setGridLayout({
      width: contentWidth,
      height: contentHeight,
      cellWidth,
      cellHeight,
      padding,
      gridSize: currentGridSize,
    });
  }, []);

  // Recalculate cell dimensions when gridSize changes (level change)
  useEffect(() => {
    if (gridLayout.width > 0 && gridLayout.gridSize !== gridSize) {
      const cellWidth = gridLayout.width / gridSize;
      const cellHeight = gridLayout.height / gridSize;
      setGridLayout(prev => ({
        ...prev,
        cellWidth,
        cellHeight,
        gridSize,
      }));
    }
  }, [gridSize, gridLayout.width, gridLayout.height, gridLayout.gridSize]);

  /**
   * Triggers haptic feedback
   */
  const triggerHaptic = useCallback((type) => {
    if (type === 'validation') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } else if (type === 'explosion') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, []);

  /**
   * Shows floating score feedback
   */
  const showFloatingScore = useCallback((text) => {
    setFloatingScore({ visible: true, text, key: Date.now() });
    setTimeout(
      () => setFloatingScore((prev) => ({ ...prev, visible: false })),
      ANIMATION.FLOATING_TEXT_DURATION
    );
  }, []);

  /**
   * Shows celebration text
   */
  const showCelebration = useCallback(() => {
    const word = getRandomCelebrationWord();
    setCelebration({ visible: true, text: word, key: Date.now() });
    setTimeout(
      () => setCelebration((prev) => ({ ...prev, visible: false })),
      ANIMATION.CELEBRATION_DURATION
    );
  }, []);

  /**
   * Check if challenge is completed on current grid
   * Only checks if challenge exists and hasn't been completed yet
   */
  const challengeCompletedRef = useRef(false);
  
  // Keep ref in sync with state
  useEffect(() => {
    challengeCompletedRef.current = challengeCompleted;
  }, [challengeCompleted]);
  
  const checkChallenge = useCallback((grid) => {
    const currentChallenge = challengeRef.current;
    if (!currentChallenge) return;
    
    // Skip if already completed
    if (challengeCompletedRef.current) return;
    
    if (currentChallenge.type === CHALLENGE_TYPES.COLUMN_OF_FIVES) {
      const col = checkColumnOfValue(grid, 5, gridSizeRef.current);
      if (col !== null) {
        setChallengeCompleted(true);
        challengeCompletedRef.current = true;
        setChallengeColumn(col);
        // Show celebration for challenge completion
        setCelebration({ visible: true, text: '⭐ CHALLENGE! ⭐', key: Date.now() });
        setTimeout(
          () => setCelebration((prev) => ({ ...prev, visible: false })),
          ANIMATION.CELEBRATION_DURATION
        );
        // Clear column highlight after 1 second
        setTimeout(() => setChallengeColumn(null), 1000);
        // Haptic feedback for challenge
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        // Play challenge success sound
        playChallengeSound();
      }
    }
  }, []);

  /**
   * Adds a cell to the current path if valid
   */
  const addCellToPath = useCallback((cellIndex, currentGridData) => {
    if (cellIndex === null) return;
    if (pathRef.current.includes(cellIndex)) return;

    // Check adjacency if not first cell
    if (pathRef.current.length > 0) {
      const lastCell = pathRef.current[pathRef.current.length - 1];
      if (!areAdjacent(lastCell, cellIndex, gridSizeRef.current)) {
        return;
      }
    }

    // Check value matches path value
    if (currentGridData[cellIndex] !== pathValueRef.current) {
      return;
    }

    pathRef.current = [...pathRef.current, cellIndex];
    setPath([...pathRef.current]);
    
    // Validate tutorial path (hides guide when player starts correct path)
    tutorialHandlers?.validateTutorialPath?.(pathRef.current);
  }, [tutorialHandlers]);

  /**
   * Validates and transforms the current path
   * Core game logic for move resolution
   * In tutorial mode, only expected paths are processed
   */
  const validateAndTransformPath = useCallback(() => {
    if (isResolvingRef.current) return;

    const currentPath = pathRef.current;
    const pathLength = currentPath.length;
    const pathValue = pathValueRef.current;

    // Reset path state
    pathRef.current = [];
    pathValueRef.current = null;
    setPath([]);

    // Tutorial mode: check if path matches expected path
    if (tutorialHandlers?.isPathComplete) {
      const isCorrectPath = tutorialHandlers.isPathComplete(currentPath);
      if (!isCorrectPath) {
        // Wrong path in tutorial - silently ignore, no error sound
        tutorialHandlers.cancelPath?.();
        return;
      }
    }

    // Check if path is valid (length > value)
    if (pathLength > pathValue) {
      isResolvingRef.current = true;
      triggerHaptic('validation');
      
      // Play success sound on valid path confirmation (before any destruction/gravity)
      playSuccessSound();
      
      // Advance tutorial step if in tutorial mode
      tutorialHandlers?.advanceStep?.();

      const basePoints = calculateBasePoints(pathLength, currentPath.length);

      // Transform cells to new value
      setGridData((prevGrid) => {
        const newGrid = [...prevGrid];
        currentPath.forEach((cellIndex) => {
          newGrid[cellIndex] = pathLength;
        });
        return newGrid;
      });

      // Handle exceeded cells (value > maxValue)
      if (pathLength > maxValueRef.current) {
        setExceededCells(currentPath);
        setShakingCells(currentPath);

        setTimeout(() => {
          triggerHaptic('explosion');

          // Update combo and score
          const newCombo = combo + 1;
          const points = calculateFinalPoints(basePoints, newCombo);

          setCombo(newCombo);
          setScore((prev) => {
            const newScore = prev + points;
            // Check if target score reached - level complete!
            if (targetScoreRef.current && newScore >= targetScoreRef.current) {
              setLevelComplete(true);
              setGameOver(true);
            }
            return newScore;
          });
          showFloatingScore(getFloatingScoreText(points, newCombo));

          // Check for celebration trigger
          if (shouldCelebrate(pathLength, newCombo, currentPath.length)) {
            showCelebration();
          }

          // Apply gravity and check game over
          setGridData((prevGrid) => {
            const gridWithNulls = [...prevGrid];
            currentPath.forEach((cellIndex) => {
              if (gridWithNulls[cellIndex] > maxValueRef.current) {
                gridWithNulls[cellIndex] = null;
              }
            });

            const { grid: newGrid, cellsUsed } = applyGravityAndFill(
              gridWithNulls,
              stockRef.current,
              maxValueRef.current,
              gridSizeRef.current
            );
            stockRef.current -= cellsUsed;
            setStock(stockRef.current);

            const fallDistances = calculateFallDistances(gridWithNulls, newGrid, gridSizeRef.current);

            setTimeout(() => {
              setFallingCells(fallDistances);
              
              // Play landing sound when cells start falling
              playLandingSound();
              
              setTimeout(() => {
                setFallingCells({});
                isResolvingRef.current = false;
                
                // Check challenge after gravity settles
                checkChallenge(newGrid);

                // Only check for game over if level not already complete
                setLevelComplete((isComplete) => {
                  if (!isComplete && !hasValidMove(newGrid, gridSizeRef.current)) {
                    setGameOver(true);
                  }
                  return isComplete;
                });
              }, ANIMATION.FALL_ANIMATION_DURATION);
            }, 50);

            return newGrid;
          });

          setShakingCells([]);
          setExceededCells([]);
        }, ANIMATION.FALL_ANIMATION_DURATION);
      } else {
        // No explosion, just transformation
        setCombo(0);
        setScore((prev) => {
          const newScore = prev + basePoints;
          // Check if target score reached - level complete!
          if (targetScoreRef.current && newScore >= targetScoreRef.current) {
            setLevelComplete(true);
            setGameOver(true);
          }
          return newScore;
        });
        showFloatingScore(`+${basePoints}`);
        isResolvingRef.current = false;

        // Check challenge and game over
        setGridData((currentGrid) => {
          // Check challenge after transformation
          checkChallenge(currentGrid);
          
          // Only check for game over if level not already complete
          setLevelComplete((isComplete) => {
            if (!isComplete && !hasValidMove(currentGrid, gridSizeRef.current)) {
              setGameOver(true);
            }
            return isComplete;
          });
          return currentGrid;
        });
      }
    } else if (pathLength > 0) {
      // Path is invalid (too short) - play error sound (but not in tutorial)
      if (!tutorialHandlers?.isTutorialActive) {
        playErrorSound();
      } else {
        tutorialHandlers.cancelPath?.();
      }
    }
  }, [combo, triggerHaptic, showFloatingScore, showCelebration, checkChallenge, tutorialHandlers]);

  /**
   * Restarts the game with fresh state using current level parameters
   */
  const restartGame = useCallback(() => {
    // Use fixed grid for tutorial, random for normal levels
    setGridData(tutorial?.initialGrid ? [...tutorial.initialGrid] : generateGrid(gridSizeRef.current, maxValueRef.current));
    setScore(0);
    setCombo(0);
    stockRef.current = initialStock;
    setStock(initialStock);
    setGameOver(false);
    setLevelComplete(false);
    setChallengeCompleted(false);
    setChallengeColumn(null);
    setPath([]);
    pathRef.current = [];
    pathValueRef.current = null;
    isResolvingRef.current = false;
    // Reset tutorial state if in tutorial mode
    tutorialHandlers?.resetTutorial?.();
  }, [initialStock, tutorial, tutorialHandlers]);

  /**
   * Gesture handlers for pan gesture
   */
  const handleGestureBegin = useCallback(
    (x, y) => {
      if (gameOver) return;
      const cellIndex = getCellFromPosition(x, y, gridLayout, gridSizeRef.current);
      if (cellIndex !== null && gridData[cellIndex] !== null) {
        pathValueRef.current = gridData[cellIndex];
        pathRef.current = [cellIndex];
        setPath([cellIndex]);
      }
    },
    [gridLayout, gridData, gameOver]
  );

  const handleGestureUpdate = useCallback(
    (x, y) => {
      const cellIndex = getCellFromPosition(x, y, gridLayout, gridSizeRef.current);
      addCellToPath(cellIndex, gridData);
    },
    [gridLayout, addCellToPath, gridData]
  );

  const handleGestureEnd = useCallback(() => {
    validateAndTransformPath();
  }, [validateAndTransformPath]);

  return {
    // State
    gridData,
    exceededCells,
    shakingCells,
    fallingCells,
    path,
    gridLayout,
    score,
    combo,
    stock,
    gameOver,
    levelComplete,
    challengeCompleted,
    challengeColumn,
    floatingScore,
    celebration,
    
    // Level parameters (for UI display)
    gridSize,
    maxValue,
    isTutorialLevel,

    // Actions
    handleGridLayout,
    handleGestureBegin,
    handleGestureUpdate,
    handleGestureEnd,
    restartGame,
  };
};

export default useGameState;
