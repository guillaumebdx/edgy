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
  hasValidMoves,
  getCellFromPosition,
  checkColumnOfValue,
  checkRowOfValue,
  checkColumnOfIdenticalValues,
  checkRowOfIdenticalValues,
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
import { playSuccessSound, playErrorSound, playLandingSound, playChallengeSound, playMixSound } from '../sounds';

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
  const initialShuffles = levelConfig?.shuffles || 0;
  const isFreeMode = levelConfig?.isFreeMode || false;
  
  // Tutorial configuration
  const tutorial = levelConfig?.tutorial || null;
  const isTutorialLevel = !!tutorial;

  // Grid and visual state - use fixed grid for tutorial
  // IMPORTANT: Ensure grid has exactly gridSize*gridSize elements
  const [gridData, setGridData] = useState(() => {
    const expectedLength = gridSize * gridSize;
    if (tutorial?.initialGrid) {
      const grid = [...tutorial.initialGrid].slice(0, expectedLength);
      while (grid.length < expectedLength) {
        grid.push(Math.floor(Math.random() * maxValue) + 1);
      }
      return grid;
    }
    return generateGrid(gridSize, maxValue);
  });
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
  
  // Shuffle state
  const [shufflesRemaining, setShufflesRemaining] = useState(initialShuffles);
  const [isShuffling, setIsShuffling] = useState(false);
  const [noMovesAvailable, setNoMovesAvailable] = useState(false);
  
  // Store targetScore in ref for use in callbacks
  const targetScoreRef = useRef(targetScore);
  
  // Score ref for centralized game end checking
  const scoreRef = useRef(0);
  
  // Game over ref to prevent race conditions in async callbacks
  const gameOverRef = useRef(false);

  // Feedback state
  const [floatingScore, setFloatingScore] = useState({ visible: false, text: '', key: 0 });
  const [celebration, setCelebration] = useState({ visible: false, text: '', key: 0 });

  // Refs for gesture handling (avoid stale closures)
  const pathRef = useRef([]);
  const pathValueRef = useRef(null);
  const isResolvingRef = useRef(false);
  const stockRef = useRef(initialStock);
  const shufflesRemainingRef = useRef(initialShuffles);
  
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
  
  // Keep shufflesRemainingRef in sync
  useEffect(() => {
    shufflesRemainingRef.current = shufflesRemaining;
  }, [shufflesRemaining]);
  
  // Reset game state when level changes (different level ID)
  useEffect(() => {
    if (prevLevelIdRef.current !== levelId) {
      prevLevelIdRef.current = levelId;
      
      // Reset all game state for new level - use fixed grid for tutorial
      // IMPORTANT: Ensure grid has exactly gridSize*gridSize elements
      const expectedLength = gridSize * gridSize;
      let newGrid;
      if (tutorial?.initialGrid) {
        newGrid = [...tutorial.initialGrid].slice(0, expectedLength);
        // Pad if too short
        while (newGrid.length < expectedLength) {
          newGrid.push(Math.floor(Math.random() * maxValue) + 1);
        }
      } else {
        newGrid = generateGrid(gridSize, maxValue);
      }
      setGridData(newGrid);
      setScore(0);
      scoreRef.current = 0;
      setCombo(0);
      stockRef.current = initialStock;
      setStock(initialStock);
      setGameOver(false);
      gameOverRef.current = false;
      setLevelComplete(false);
      setChallengeCompleted(false);
      setChallengeColumn(null);
      setShufflesRemaining(initialShuffles);
      shufflesRemainingRef.current = initialShuffles;
      setIsShuffling(false);
      setNoMovesAvailable(false);
      setPath([]);
      pathRef.current = [];
      pathValueRef.current = null;
      isResolvingRef.current = false;
      setExceededCells([]);
      setShakingCells([]);
      setFallingCells({});
    }
  }, [levelId, gridSize, maxValue, initialStock, initialShuffles, tutorial]);

  /**
   * Handles grid layout measurement for touch coordinate conversion
   */
  const handleGridLayout = useCallback((event) => {
    const { width, height } = event.nativeEvent.layout;
    // No padding on grid anymore - cells handle their own spacing
    const padding = 0;
    const contentWidth = width;
    const contentHeight = height;
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
   * Shows "no moves" message
   */
  const showNoMovesMessage = useCallback(() => {
    setCelebration({ visible: true, text: 'Plus de moove !', key: Date.now() });
    setTimeout(
      () => setCelebration((prev) => ({ ...prev, visible: false })),
      ANIMATION.CELEBRATION_DURATION + 500
    );
  }, []);

  /**
   * CENTRALIZED GAME END CHECK
   * This is the ONLY function that should determine game end state.
   * It uses refs to get the most up-to-date values.
   * 
   * Priority hierarchy:
   * 1. Score >= target → VICTORY (levelComplete=true, gameOver=true)
   * 2. No valid moves + no shuffles → DEFEAT (levelComplete=false, gameOver=true)
   * 3. No valid moves + shuffles > 0 → STUCK (show message, blink shuffle)
   * 4. Otherwise → PLAYING
   * 
   * @param {number[]} currentGrid - The current grid state
   * @param {number} currentScore - The current score (passed explicitly to avoid stale refs)
   */
  const checkGameEnd = useCallback((currentGrid, currentScore) => {
    // Skip if already game over - use REF to avoid stale closure issues
    if (gameOverRef.current) return;
    
    // PRIORITY 1: Check for victory (score >= target) - applies to ALL levels including tutorial
    if (targetScoreRef.current && currentScore >= targetScoreRef.current) {
      gameOverRef.current = true; // Set ref FIRST to prevent race conditions
      setLevelComplete(true);
      setGameOver(true);
      setNoMovesAvailable(false);
      return;
    }
    
    // Skip no-moves check for tutorial (tutorial has guided steps, not free play)
    if (isTutorialLevel) return;
    
    // Check if there are valid moves
    const hasMoves = hasValidMoves(currentGrid, gridSizeRef.current);
    
    if (!hasMoves) {
      // PRIORITY 2: No moves + no shuffles = DEFEAT
      if (shufflesRemainingRef.current === 0) {
        gameOverRef.current = true; // Set ref FIRST to prevent race conditions
        setLevelComplete(false);
        setGameOver(true);
        setNoMovesAvailable(false);
      } else {
        // PRIORITY 3: No moves but shuffles available = STUCK
        setNoMovesAvailable(true);
        showNoMovesMessage();
      }
    } else {
      // PRIORITY 4: Game continues
      setNoMovesAvailable(false);
    }
  }, [isTutorialLevel, showNoMovesMessage]);

  /**
   * Check if challenge is completed on current grid
   * Only checks if challenge exists and hasn't been completed yet
   */
  const challengeCompletedRef = useRef(false);
  
  // Keep ref in sync with state
  useEffect(() => {
    challengeCompletedRef.current = challengeCompleted;
  }, [challengeCompleted]);
  
  /**
   * Triggers challenge celebration and effects
   * @param {number|null} colOrRow - Column index (positive) or row index (negative: -(row+1))
   */
  const triggerChallengeSuccess = useCallback((colOrRow, bonusPoints = 0) => {
    setChallengeColumn(colOrRow);
    // Show celebration for challenge completion
    const celebrationText = bonusPoints > 0 ? `⭐ +${bonusPoints} BONUS! ⭐` : '⭐ CHALLENGE! ⭐';
    setCelebration({ visible: true, text: celebrationText, key: Date.now() });
    setTimeout(
      () => setCelebration((prev) => ({ ...prev, visible: false })),
      ANIMATION.CELEBRATION_DURATION
    );
    // Clear highlight after 1 second
    setTimeout(() => setChallengeColumn(null), 1000);
    // Haptic feedback for challenge
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    // Play challenge success sound
    playChallengeSound();
    
    // Award bonus points if specified
    if (bonusPoints > 0) {
      const newScore = scoreRef.current + bonusPoints;
      scoreRef.current = newScore;
      setScore(newScore);
    }
  }, []);

  const checkChallenge = useCallback((grid, isFreeMode = false) => {
    // FREE MODE: Check for any row/column of identical values
    if (isFreeMode) {
      // Check columns
      const colResult = checkColumnOfIdenticalValues(grid, gridSizeRef.current);
      if (colResult !== null) {
        triggerChallengeSuccess(colResult.col, 500);
        return;
      }
      // Check rows
      const rowResult = checkRowOfIdenticalValues(grid, gridSizeRef.current);
      if (rowResult !== null) {
        triggerChallengeSuccess(-(rowResult.row + 1), 500);
        return;
      }
      return;
    }
    
    // CAREER MODE: Check specific challenge type
    const currentChallenge = challengeRef.current;
    if (!currentChallenge) return;
    
    // Skip if already completed
    if (challengeCompletedRef.current) return;
    
    if (currentChallenge.type === CHALLENGE_TYPES.COLUMN_OF_FIVES) {
      const col = checkColumnOfValue(grid, 5, gridSizeRef.current);
      if (col !== null) {
        setChallengeCompleted(true);
        challengeCompletedRef.current = true;
        triggerChallengeSuccess(col);
      }
    } else if (currentChallenge.type === CHALLENGE_TYPES.ROW_OF_FIVES) {
      const row = checkRowOfValue(grid, 5, gridSizeRef.current);
      if (row !== null) {
        setChallengeCompleted(true);
        challengeCompletedRef.current = true;
        triggerChallengeSuccess(-(row + 1));
      }
    }
  }, [triggerChallengeSuccess]);

  /**
   * Adds a cell to the current path if valid
   * Also handles backtracking: if user slides back to a previous cell in the path,
   * truncate the path to that cell (allowing undo of selections)
   */
  const addCellToPath = useCallback((cellIndex, currentGridData) => {
    if (cellIndex === null) return;
    
    const currentPath = pathRef.current;
    
    // Check if this cell is already in the path (potential backtrack)
    const existingIndex = currentPath.indexOf(cellIndex);
    if (existingIndex !== -1) {
      // If it's not the last cell, this is a backtrack - truncate path to this cell
      if (existingIndex < currentPath.length - 1) {
        pathRef.current = currentPath.slice(0, existingIndex + 1);
        setPath([...pathRef.current]);
        // Validate tutorial path after backtrack
        tutorialHandlers?.validateTutorialPath?.(pathRef.current);
      }
      // If it's the last cell, do nothing (finger still on same cell)
      return;
    }

    // Check adjacency if not first cell
    if (currentPath.length > 0) {
      const lastCell = currentPath[currentPath.length - 1];
      if (!areAdjacent(lastCell, cellIndex, gridSizeRef.current)) {
        return;
      }
    }

    // Check value matches path value
    if (currentGridData[cellIndex] !== pathValueRef.current) {
      return;
    }

    pathRef.current = [...currentPath, cellIndex];
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
          
          // Calculate and store final score SYNCHRONOUSLY before any setState
          // This ensures checkGameEnd always has the correct score
          const finalScore = scoreRef.current + points;
          scoreRef.current = finalScore;

          setCombo(newCombo);
          setScore(finalScore);
          showFloatingScore(getFloatingScoreText(points, newCombo));

          // Check for celebration trigger
          if (shouldCelebrate(pathLength, newCombo, currentPath.length)) {
            showCelebration();
          }

          // Apply gravity
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
                checkChallenge(newGrid, isFreeMode);

                // CENTRALIZED GAME END CHECK - called AFTER all animations complete
                checkGameEnd(newGrid, scoreRef.current);
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
        
        // Calculate and store final score SYNCHRONOUSLY before any setState
        // This ensures checkGameEnd always has the correct score
        const finalScore = scoreRef.current + basePoints;
        scoreRef.current = finalScore;
        
        setScore(finalScore);
        showFloatingScore(`+${basePoints}`);
        isResolvingRef.current = false;

        // Check challenge and game end
        setGridData((currentGrid) => {
          // Check challenge after transformation
          checkChallenge(currentGrid, isFreeMode);
          
          // CENTRALIZED GAME END CHECK - scoreRef.current is already updated
          checkGameEnd(currentGrid, scoreRef.current);
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
  }, [combo, triggerHaptic, showFloatingScore, showCelebration, checkChallenge, checkGameEnd, tutorialHandlers]);

  /**
   * Shuffles the existing grid cells (does not create new values)
   * Uses Fisher-Yates shuffle algorithm
   */
  const shuffleGrid = useCallback(() => {
    if (shufflesRemaining <= 0 || isShuffling || gameOver || isTutorialLevel) return;
    
    // Update ref SYNCHRONOUSLY before setState to ensure checkGameEnd has correct value
    const newShufflesRemaining = shufflesRemaining - 1;
    shufflesRemainingRef.current = newShufflesRemaining;
    
    setIsShuffling(true);
    setShufflesRemaining(newShufflesRemaining);
    playMixSound();
    
    // Get all non-null cell values and their positions
    const values = gridData.filter(v => v !== null);
    
    // Fisher-Yates shuffle
    for (let i = values.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [values[i], values[j]] = [values[j], values[i]];
    }
    
    // Rebuild grid with shuffled values
    let valueIndex = 0;
    const newGrid = gridData.map(cell => {
      if (cell === null) return null;
      return values[valueIndex++];
    });
    
    // Apply with animation delay, then check game end
    setTimeout(() => {
      setGridData(newGrid);
      setIsShuffling(false);
      // Check game end after shuffle (score unchanged, just check for moves)
      checkGameEnd(newGrid, scoreRef.current);
    }, 300);
  }, [shufflesRemaining, isShuffling, gameOver, isTutorialLevel, gridData, checkGameEnd]);

  /**
   * Restarts the game with fresh state using current level parameters
   */
  const restartGame = useCallback(() => {
    // Use fixed grid for tutorial, random for normal levels
    // IMPORTANT: Ensure grid has exactly gridSize*gridSize elements
    const expectedLength = gridSizeRef.current * gridSizeRef.current;
    let newGrid;
    if (tutorial?.initialGrid) {
      newGrid = [...tutorial.initialGrid].slice(0, expectedLength);
      while (newGrid.length < expectedLength) {
        newGrid.push(Math.floor(Math.random() * maxValueRef.current) + 1);
      }
    } else {
      newGrid = generateGrid(gridSizeRef.current, maxValueRef.current);
    }
    setGridData(newGrid);
    setScore(0);
    scoreRef.current = 0;
    setCombo(0);
    stockRef.current = initialStock;
    setStock(initialStock);
    setGameOver(false);
    gameOverRef.current = false;
    setLevelComplete(false);
    setChallengeCompleted(false);
    setChallengeColumn(null);
    setShufflesRemaining(initialShuffles);
    shufflesRemainingRef.current = initialShuffles;
    setIsShuffling(false);
    setNoMovesAvailable(false);
    setPath([]);
    pathRef.current = [];
    pathValueRef.current = null;
    isResolvingRef.current = false;
    // Reset tutorial state if in tutorial mode
    tutorialHandlers?.resetTutorial?.();
  }, [initialStock, initialShuffles, tutorial, tutorialHandlers]);

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
    shufflesRemaining,
    isShuffling,
    noMovesAvailable,
    
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
    shuffleGrid,
  };
};

export default useGameState;
