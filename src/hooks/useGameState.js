/**
 * useGameState Hook
 * Centralized game state management
 * Handles all game state, refs, and core game actions
 */

import { useState, useRef, useCallback } from 'react';
import {
  GRID_SIZE,
  INITIAL_STOCK,
  MAX_VALUE,
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
 * @returns {Object} Game state and action handlers
 */
const useGameState = () => {
  // Grid and visual state
  const [gridData, setGridData] = useState(() => generateGrid());
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
  });

  // Score and progression state
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [stock, setStock] = useState(INITIAL_STOCK);
  const [gameOver, setGameOver] = useState(false);

  // Feedback state
  const [floatingScore, setFloatingScore] = useState({ visible: false, text: '', key: 0 });
  const [celebration, setCelebration] = useState({ visible: false, text: '', key: 0 });

  // Refs for gesture handling (avoid stale closures)
  const pathRef = useRef([]);
  const pathValueRef = useRef(null);
  const isResolvingRef = useRef(false);
  const stockRef = useRef(INITIAL_STOCK);

  /**
   * Handles grid layout measurement for touch coordinate conversion
   */
  const handleGridLayout = useCallback((event) => {
    const { width, height } = event.nativeEvent.layout;
    const padding = GRID_PADDING;
    const contentWidth = width - padding * 2;
    const contentHeight = height - padding * 2;
    const cellWidth = contentWidth / GRID_SIZE;
    const cellHeight = contentHeight / GRID_SIZE;
    setGridLayout({
      width: contentWidth,
      height: contentHeight,
      cellWidth,
      cellHeight,
      padding,
    });
  }, []);

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
      if (!areAdjacent(lastCell, cellIndex)) {
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

      // Handle exceeded cells (value > MAX_VALUE)
      if (pathLength > MAX_VALUE) {
        setExceededCells(currentPath);
        setShakingCells(currentPath);

        setTimeout(() => {
          triggerHaptic('explosion');

          // Update combo and score
          const newCombo = combo + 1;
          const points = calculateFinalPoints(basePoints, newCombo);

          setCombo(newCombo);
          setScore((prev) => prev + points);
          showFloatingScore(getFloatingScoreText(points, newCombo));

          // Check for celebration trigger
          if (shouldCelebrate(pathLength, newCombo, currentPath.length)) {
            showCelebration();
          }

          // Apply gravity and check game over
          setGridData((prevGrid) => {
            const gridWithNulls = [...prevGrid];
            currentPath.forEach((cellIndex) => {
              if (gridWithNulls[cellIndex] > MAX_VALUE) {
                gridWithNulls[cellIndex] = null;
              }
            });

            const { grid: newGrid, cellsUsed } = applyGravityAndFill(
              gridWithNulls,
              stockRef.current
            );
            stockRef.current -= cellsUsed;
            setStock(stockRef.current);

            const fallDistances = calculateFallDistances(gridWithNulls, newGrid);

            setTimeout(() => {
              setFallingCells(fallDistances);
              setTimeout(() => {
                setFallingCells({});
                isResolvingRef.current = false;

                if (!hasValidMove(newGrid)) {
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
        setScore((prev) => prev + basePoints);
        showFloatingScore(`+${basePoints}`);
        isResolvingRef.current = false;

        // Check game over
        setGridData((currentGrid) => {
          if (!hasValidMove(currentGrid)) {
            setGameOver(true);
          }
          return currentGrid;
        });
      }
    }
  }, [combo, triggerHaptic, showFloatingScore, showCelebration]);

  /**
   * Restarts the game with fresh state
   */
  const restartGame = useCallback(() => {
    setGridData(generateGrid());
    setScore(0);
    setCombo(0);
    stockRef.current = INITIAL_STOCK;
    setStock(INITIAL_STOCK);
    setGameOver(false);
    setPath([]);
    pathRef.current = [];
    pathValueRef.current = null;
    isResolvingRef.current = false;
  }, []);

  /**
   * Gesture handlers for pan gesture
   */
  const handleGestureBegin = useCallback(
    (x, y) => {
      if (gameOver) return;
      const cellIndex = getCellFromPosition(x, y, gridLayout);
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
      const cellIndex = getCellFromPosition(x, y, gridLayout);
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
    floatingScore,
    celebration,

    // Actions
    handleGridLayout,
    handleGestureBegin,
    handleGestureUpdate,
    handleGestureEnd,
    restartGame,
  };
};

export default useGameState;
