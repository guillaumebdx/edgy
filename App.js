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
import Animated, { 
  runOnJS, 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withSequence, 
  withTiming 
} from 'react-native-reanimated';

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
  CareerMap,
  TutorialOverlay,
} from './src/components';
import { getLevelConfig } from './src/careerLevels';
import { useGameState, useCareerState, useTutorialState, useLevelEntryAnimation } from './src/hooks';
import { initSounds, unloadSounds, startBackgroundMusic, stopBackgroundMusic, playLandingSound } from './src/sounds';

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

  // Initialize sounds on mount and start music if on menu
  useEffect(() => {
    const init = async () => {
      await initSounds();
      // Start music on initial load if on menu screen
      if (currentScreen === SCREENS.MENU) {
        startBackgroundMusic();
      }
    };
    init();
    return () => unloadSounds();
  }, []);

  // Control background music based on current screen (after initial load)
  useEffect(() => {
    if (currentScreen === SCREENS.MENU) {
      startBackgroundMusic();
    } else {
      stopBackgroundMusic();
    }
  }, [currentScreen]);

  // Career state management
  const {
    careerLevelNumber,
    unlockedLevel,
    totalLevels,
    isLoading,
    hasSavedGame,
    levelStars,
    playingLevelNumber,
    playingLevel,
    processRunEnd,
    advanceToNextLevel,
    resetCareer,
    continueCareer,
    selectLevel,
    debugSetLevel,
  } = useCareerState();

  // Level result state for game over screen
  const [levelResult, setLevelResult] = useState(null);

  // Tutorial state management
  const tutorialConfig = playingLevel?.tutorial || null;
  const isTutorialLevel = !!tutorialConfig;
  const tutorialState = useTutorialState(tutorialConfig, isTutorialLevel);

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
    challengeCompleted,
    challengeColumn,
    floatingScore,
    celebration,
    gridSize,
    maxValue,
    shufflesRemaining,
    isShuffling,
    noMovesAvailable,
    handleGridLayout,
    handleGestureBegin,
    handleGestureUpdate,
    handleGestureEnd,
    restartGame,
    shuffleGrid,
  } = useGameState(playingLevel, tutorialState);

  // Level entry animation
  const isGameScreen = currentScreen === SCREENS.GAME;
  const {
    phase: entryPhase,
    isAnimating: isEntryAnimating,
    getEntryDelay,
    getRevealDelay,
  } = useLevelEntryAnimation(gridSize, playingLevel?.id, isGameScreen, playLandingSound);

  // Score blinking animation for tutorial last step
  const scoreBlinkOpacity = useSharedValue(1);
  const shouldBlinkScore = isTutorialLevel && tutorialState.isLastStep;
  
  useEffect(() => {
    if (shouldBlinkScore) {
      scoreBlinkOpacity.value = withRepeat(
        withSequence(
          withTiming(0.4, { duration: 400 }),
          withTiming(1, { duration: 400 })
        ),
        -1,
        false
      );
    } else {
      scoreBlinkOpacity.value = 1;
    }
  }, [shouldBlinkScore]);
  
  const scoreBlinkStyle = useAnimatedStyle(() => ({
    opacity: scoreBlinkOpacity.value,
  }));

  // Shuffle button blinking animation when no moves available
  const shuffleBlinkOpacity = useSharedValue(1);
  
  useEffect(() => {
    if (noMovesAvailable && shufflesRemaining > 0) {
      shuffleBlinkOpacity.value = withRepeat(
        withSequence(
          withTiming(0.3, { duration: 300 }),
          withTiming(1, { duration: 300 })
        ),
        -1,
        false
      );
    } else {
      shuffleBlinkOpacity.value = 1;
    }
  }, [noMovesAvailable, shufflesRemaining]);
  
  const shuffleBlinkStyle = useAnimatedStyle(() => ({
    opacity: shuffleBlinkOpacity.value,
  }));

  /**
   * Handle level selection from career map
   * @param {number} levelNumber - Selected level number
   */
  const handleSelectLevel = useCallback((levelNumber) => {
    selectLevel(levelNumber);
    setLevelResult(null);
    setCurrentScreen(SCREENS.GAME);
  }, [selectLevel]);

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
   * Return to career map menu
   * If level was completed (levelResult.success), progress is already saved
   */
  const handleBackToMenu = useCallback(async () => {
    // If level was completed but user clicks Menu instead of Next Level,
    // we need to ensure progress was saved (it should already be via handleGameOver)
    // Just clear state and go back to menu
    setLevelResult(null);
    setCurrentScreen(SCREENS.MENU);
  }, []);

  /**
   * Handle game over - process level completion
   * Uses levelComplete from useGameState (set when target score is reached)
   */
  const handleGameOver = useCallback(async () => {
    if (levelComplete) {
      // Target score reached - process as success with challenge status
      const result = await processRunEnd(score, challengeCompleted);
      result.targetScore = playingLevel?.targetScore;
      setLevelResult(result);
    } else {
      // Game over without reaching target - failure
      setLevelResult({
        success: false,
        careerCompleted: false,
        message: 'Score insuffisant',
        targetScore: playingLevel?.targetScore,
        starsEarned: 0,
      });
    }
  }, [score, levelComplete, challengeCompleted, processRunEnd, playingLevel]);

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

  // Wrapped gesture handlers that block during entry animation
  const wrappedGestureBegin = useCallback((x, y) => {
    if (isEntryAnimating) return;
    handleGestureBegin(x, y);
  }, [isEntryAnimating, handleGestureBegin]);

  const wrappedGestureUpdate = useCallback((x, y) => {
    if (isEntryAnimating) return;
    handleGestureUpdate(x, y);
  }, [isEntryAnimating, handleGestureUpdate]);

  const wrappedGestureEnd = useCallback(() => {
    if (isEntryAnimating) return;
    handleGestureEnd();
  }, [isEntryAnimating, handleGestureEnd]);

  // Configure pan gesture for path drawing
  const panGesture = Gesture.Pan()
    .onBegin((e) => {
      'worklet';
      runOnJS(wrappedGestureBegin)(e.x, e.y);
    })
    .onUpdate((e) => {
      'worklet';
      runOnJS(wrappedGestureUpdate)(e.x, e.y);
    })
    .onEnd(() => {
      'worklet';
      runOnJS(wrappedGestureEnd)();
    })
    .minDistance(0);

  // Show Career Map (Main Menu)
  if (currentScreen === SCREENS.MENU) {
    return (
      <GestureHandlerRootView style={styles.container}>
        <StatusBar style="light" />
        <CareerMap
          currentLevelNumber={careerLevelNumber}
          unlockedLevel={unlockedLevel}
          levelStars={levelStars}
          isLoading={isLoading}
          onSelectLevel={handleSelectLevel}
          onNewGame={handleNewGame}
          onDebugSetLevel={debugSetLevel}
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
      {playingLevel && (
        <LevelInfo
          levelNumber={playingLevelNumber}
          levelName={playingLevel.name}
          targetScore={playingLevel.targetScore}
          maxValue={maxValue}
          stock={playingLevel.stock}
          totalLevels={totalLevels}
          challenge={playingLevel.challenge}
          challengeCompleted={challengeCompleted}
          isTutorialLastStep={isTutorialLevel && tutorialState.isLastStep}
          highlightMax={isTutorialLevel && tutorialState.currentStep?.highlightMax}
        />
      )}

      {/* Header: Score and Stock display */}
      <View style={styles.headerContainer}>
        <View style={styles.scoreContainer}>
          <Animated.Text style={[
            styles.scoreText,
            shouldBlinkScore && { color: '#70D0B0' },
            shouldBlinkScore && scoreBlinkStyle,
          ]}>
            {score.toLocaleString()}
          </Animated.Text>
          {combo > 1 && <Text style={styles.comboText}>x{combo}</Text>}
        </View>
        <View style={styles.stockContainer}>
          <Text style={styles.stockText}>{stock}</Text>
          <Text style={styles.stockLabel}>restantes</Text>
        </View>
        {/* Shuffle button - only shown when shuffles available */}
        {(playingLevel?.shuffles > 0 || shufflesRemaining > 0) && (
          <Animated.View style={[noMovesAvailable && shuffleBlinkStyle]}>
            <TouchableOpacity 
              style={[
                styles.shuffleButton,
                shufflesRemaining === 0 && styles.shuffleButtonDisabled,
                isShuffling && styles.shuffleButtonActive,
                noMovesAvailable && styles.shuffleButtonUrgent,
              ]}
              onPress={shuffleGrid}
              disabled={shufflesRemaining === 0 || isShuffling}
            >
              <Text style={styles.shuffleIcon}>🔀</Text>
              <Text style={styles.shuffleCount}>{shufflesRemaining}</Text>
            </TouchableOpacity>
          </Animated.View>
        )}
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

              const isChallengeColumn = challengeColumn !== null && col === challengeColumn;

              // Entry animation delay based on phase
              const entryDelay = entryPhase === 'falling' 
                ? getEntryDelay(index) 
                : entryPhase === 'revealing' 
                  ? getRevealDelay(index) 
                  : 0;

              return (
                <AnimatedCell
                  key={index}
                  value={value}
                  index={index}
                  isInPath={isEntryAnimating ? false : isInPath}
                  pathIndex={pathIndex}
                  isExceeded={isExceeded}
                  isShaking={isShaking}
                  isFalling={fallDistance > 0}
                  fallDistance={fallDistance}
                  columnDelay={col * ANIMATION.FALL_DELAY_PER_COLUMN}
                  cellHeight={gridLayout.cellHeight}
                  gridSize={gridSize}
                  maxValue={maxValue}
                  isChallengeColumn={isChallengeColumn}
                  entryPhase={entryPhase}
                  entryDelay={entryDelay}
                  isShuffling={isShuffling}
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

            {/* Tutorial guide overlay */}
            {isTutorialLevel && (
              <TutorialOverlay
                expectedPath={tutorialState.expectedPath}
                hint={tutorialState.hint}
                gridLayout={gridLayout}
                visible={tutorialState.showGuide && !gameOver}
              />
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
