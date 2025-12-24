/**
 * Edgy Grid - Main Application
 * 
 * A tactile puzzle game where players connect cells of the same value
 * to transform them. Career mode with 5 progressive levels.
 * 
 * Architecture:
 * - src/constants.js: Game configuration and constants
 * - src/gameLogic.js: Grid management, validation, gravity
 * - src/scoreManager.js: Score calculation, combos, celebrations
 * - src/careerLevels.js: Level definitions for career mode
 * - src/persistence/: SQLite storage for career progress
 * - src/components/: UI components (AnimatedCell, FloatingText, etc.)
 * - src/hooks/: useGameState, useCareerState
 */

import { useState, useCallback, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Text, View, ImageBackground, TouchableOpacity } from 'react-native';
import { GestureHandlerRootView, GestureDetector, Gesture } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';

// Module imports
import { ANIMATION } from './src/constants';
import { getConnectionStyle } from './src/utils';
import styles from './src/styles';
import {
  AnimatedCell,
  FloatingText,
  CelebrationText,
  GameOverScreen,
  LevelInfo,
  MainMenu,
} from './src/components';
import { useGameState, useCareerState } from './src/hooks';

// App screens
const SCREENS = {
  MENU: 'menu',
  GAME: 'game',
};

/**
 * Main App Component
 * Renders the game UI and handles gesture input
 * Manages career mode progression and navigation
 */
export default function App() {
  // Current screen state
  const [currentScreen, setCurrentScreen] = useState(SCREENS.MENU);

  // Career state management
  const {
    currentLevelNumber,
    currentLevel,
    totalLevels,
    isLoading,
    hasSavedGame,
    processRunEnd,
    advanceToNextLevel,
    resetCareer,
    continueCareer,
  } = useCareerState();

  // Level result state for game over screen
  const [levelResult, setLevelResult] = useState(null);

  // Get all game state and handlers from custom hook with level config
  const {
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
    gridSize,
    maxValue,
    handleGridLayout,
    handleGestureBegin,
    handleGestureUpdate,
    handleGestureEnd,
    restartGame,
  } = useGameState(currentLevel);

  /**
   * Handle "Continue" from main menu
   */
  const handleContinue = useCallback(() => {
    continueCareer();
    setLevelResult(null);
    setCurrentScreen(SCREENS.GAME);
  }, [continueCareer]);

  /**
   * Handle "New Game" from main menu
   * resetCareer changes currentLevelNumber to 1, which triggers
   * useGameState to auto-reset via levelId change detection
   */
  const handleNewGame = useCallback(async () => {
    await resetCareer();
    setLevelResult(null);
    setCurrentScreen(SCREENS.GAME);
  }, [resetCareer]);

  /**
   * Handle "Back to Menu" from game
   * Does not save progress - only saves on level completion
   */
  const handleBackToMenu = useCallback(() => {
    setLevelResult(null);
    setCurrentScreen(SCREENS.MENU);
  }, []);

  /**
   * Handle game over - process level completion
   * Uses levelComplete from useGameState (set when target score is reached)
   */
  const handleGameOver = useCallback(() => {
    if (levelComplete) {
      // Target score reached - process as success
      const result = processRunEnd(score);
      result.targetScore = currentLevel?.targetScore;
      setLevelResult(result);
    } else {
      // Game over without reaching target - failure
      setLevelResult({
        success: false,
        careerCompleted: false,
        message: 'Score insuffisant',
        targetScore: currentLevel?.targetScore,
      });
    }
  }, [score, levelComplete, processRunEnd, currentLevel]);

  /**
   * Restart current level
   */
  const handleRestart = useCallback(() => {
    setLevelResult(null);
    restartGame();
  }, [restartGame]);

  /**
   * Proceed to next level (after success)
   * Calls advanceToNextLevel which changes currentLevelNumber,
   * triggering useGameState auto-reset via levelId change
   */
  const handleNextLevel = useCallback(async () => {
    setLevelResult(null);
    await advanceToNextLevel();
  }, [advanceToNextLevel]);

  // Process level completion when game ends
  useEffect(() => {
    if (gameOver && !levelResult && currentScreen === SCREENS.GAME) {
      handleGameOver();
    }
  }, [gameOver, levelResult, handleGameOver, currentScreen]);

  // Configure pan gesture for path drawing
  const panGesture = Gesture.Pan()
    .onBegin((e) => {
      'worklet';
      runOnJS(handleGestureBegin)(e.x, e.y);
    })
    .onUpdate((e) => {
      'worklet';
      runOnJS(handleGestureUpdate)(e.x, e.y);
    })
    .onEnd(() => {
      'worklet';
      runOnJS(handleGestureEnd)();
    })
    .minDistance(0);

  // Show Main Menu
  if (currentScreen === SCREENS.MENU) {
    return (
      <GestureHandlerRootView style={styles.container}>
        <StatusBar style="light" />
        <MainMenu
          onContinue={handleContinue}
          onNewGame={handleNewGame}
          hasSavedGame={hasSavedGame}
          isLoading={isLoading}
          savedLevelNumber={currentLevelNumber}
        />
      </GestureHandlerRootView>
    );
  }

  // Show Game Screen
  return (
    <GestureHandlerRootView style={styles.container}>
      <ImageBackground
        source={require('./assets/background-circuit.png.png')}
        style={styles.backgroundImage}
        resizeMode="cover"
        imageStyle={styles.backgroundImageStyle}
      >
        <StatusBar style="light" />

      {/* Back to Menu button */}
      <TouchableOpacity style={styles.menuButton} onPress={handleBackToMenu}>
        <Text style={styles.menuButtonText}>← Menu</Text>
      </TouchableOpacity>

      {/* Level info display */}
      {currentLevel && (
        <LevelInfo
          levelNumber={currentLevelNumber}
          levelName={currentLevel.name}
          targetScore={currentLevel.targetScore}
          maxValue={maxValue}
          stock={currentLevel.stock}
          totalLevels={totalLevels}
        />
      )}

      {/* Header: Score and Stock display */}
      <View style={styles.headerContainer}>
        <View style={styles.scoreContainer}>
          <Text style={styles.scoreText}>{score.toLocaleString()}</Text>
          {combo > 1 && <Text style={styles.comboText}>x{combo}</Text>}
        </View>
        <View style={styles.stockContainer}>
          <Text style={styles.stockText}>{stock}</Text>
          <Text style={styles.stockLabel}>restantes</Text>
        </View>
      </View>

      {/* Grid Container */}
      <View style={styles.gridContainer}>
        {/* Floating score feedback */}
        <FloatingText
          text={floatingScore.text}
          visible={floatingScore.visible}
          key={floatingScore.key}
        />

        {/* Main game grid with gesture detection */}
        <GestureDetector gesture={panGesture}>
          <View style={styles.grid} onLayout={handleGridLayout}>
            {/* Render all cells */}
            {gridData.map((value, index) => {
              const isInPath = path.includes(index);
              const pathIndex = path.indexOf(index);
              const isExceeded = exceededCells.includes(index);
              const isShaking = shakingCells.includes(index);
              const fallDistance = fallingCells[index] || 0;
              const col = index % gridSize;

              return (
                <AnimatedCell
                  key={index}
                  value={value}
                  index={index}
                  isInPath={isInPath}
                  pathIndex={pathIndex}
                  isExceeded={isExceeded}
                  isShaking={isShaking}
                  isFalling={fallDistance > 0}
                  fallDistance={fallDistance}
                  columnDelay={col * ANIMATION.FALL_DELAY_PER_COLUMN}
                  cellHeight={gridLayout.cellHeight}
                  gridSize={gridSize}
                  maxValue={maxValue}
                />
              );
            })}

            {/* Connection lines between path cells */}
            {gridLayout.cellWidth > 0 && path.length > 1 && (
              <View style={styles.connectionsContainer}>
                {path.slice(0, -1).map((fromIndex, i) => (
                  <View
                    key={`connection-${i}`}
                    style={getConnectionStyle(
                      fromIndex,
                      path[i + 1],
                      gridLayout.cellWidth,
                      gridLayout.cellHeight,
                      gridSize
                    )}
                  />
                ))}
              </View>
            )}
          </View>
        </GestureDetector>
      </View>

      {/* Celebration text overlay */}
      <CelebrationText
        text={celebration.text}
        visible={celebration.visible}
        key={celebration.key}
      />

      {/* Game over screen with level result */}
      {gameOver && (
        <GameOverScreen 
          score={score} 
          onRestart={handleRestart}
          levelResult={levelResult || { success: false, message: 'Partie terminée' }}
          onNextLevel={levelResult?.success && !levelResult?.careerCompleted ? handleNextLevel : null}
        />
      )}
      </ImageBackground>
    </GestureHandlerRootView>
  );
}
