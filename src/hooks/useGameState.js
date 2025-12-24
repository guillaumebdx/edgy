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
} from '../gameLogic';
import {
  calculateBasePoints,
  calculateFinalPoints,
  shouldCelebrate,
  getRandomCelebrationWord,
  getFloatingScoreText,
} from '../scoreManager';
import * as Haptics from 'expo-haptics';

/**
 * Custom hook for managing all game state and logic
 * @param {Object} levelConfig - Optional level configuration
 * @param {number} levelConfig.gridSize - Grid size (default: 6)
 * @param {number} levelConfig.maxValue - Max cell value (default: 5)
 * @param {number} levelConfig.stock - Initial stock (default: 50)
 * @returns {Object} Game state and action handlers
 */
const useGameState = (levelConfig = null) => {
  // Extract level parameters with defaults
  const gridSize = levelConfig?.gridSize || DEFAULT_GRID_SIZE;
  const maxValue = levelConfig?.maxValue || DEFAULT_MAX_VALUE;
  const initialStock = levelConfig?.stock || DEFAULT_STOCK;
  const targetScore = levelConfig?.targetScore || null;

  // Grid and visual state
  const [gridData, setGridData] = useState(() => generateGrid(gridSize, maxValue));
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
  
  // Update refs when level changes
  useEffect(() => {
    gridSizeRef.current = gridSize;
    maxValueRef.current = maxValue;
    targetScoreRef.current = targetScore;
  }, [gridSize, maxValue, targetScore]);

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
  }, []);

  /**
   * Validates and transforms the current path
   * Core game logic for move resolution
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

    // Check if path is valid (length > value)
    if (pathLength > pathValue) {
      isResolvingRef.current = true;
      triggerHaptic('validation');

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
              setTimeout(() => {
                setFallingCells({});
                isResolvingRef.current = false;

                if (!hasValidMove(newGrid, gridSizeRef.current)) {
                  setGameOver(true);
                }
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

        // Check game over (only if level not already complete)
        setGridData((currentGrid) => {
          if (!hasValidMove(currentGrid, gridSizeRef.current)) {
            setGameOver(true);
          }
          return currentGrid;
        });
      }
    }
  }, [combo, triggerHaptic, showFloatingScore, showCelebration]);

  /**
   * Restarts the game with fresh state using current level parameters
   */
  const restartGame = useCallback(() => {
    setGridData(generateGrid(gridSizeRef.current, maxValueRef.current));
    setScore(0);
    setCombo(0);
    stockRef.current = initialStock;
    setStock(initialStock);
    setGameOver(false);
    setLevelComplete(false);
    setPath([]);
    pathRef.current = [];
    pathValueRef.current = null;
    isResolvingRef.current = false;
  }, [initialStock]);

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
    floatingScore,
    celebration,
    
    // Level parameters (for UI display)
    gridSize,
    maxValue,

    // Actions
    handleGridLayout,
    handleGestureBegin,
    handleGestureUpdate,
    handleGestureEnd,
    restartGame,
  };
};

export default useGameState;
