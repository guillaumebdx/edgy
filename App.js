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
import { Text, View, ImageBackground, TouchableOpacity, Image } from 'react-native';
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
  PathCounter,
} from './src/components';
import { getLevelConfig } from './src/careerLevels';
import { useGameState, useCareerState, useTutorialState, useLevelEntryAnimation } from './src/hooks';
import { initSounds, unloadSounds, startBackgroundMusic, stopBackgroundMusic, playLandingSound } from './src/sounds';
import { saveHighScore, loadHighScore } from './src/persistence';

// App screens
const SCREENS = {
  MENU: 'menu',
  GAME: 'game',
  FREE_MODE: 'free_mode',
};

// Free Mode configuration
const FREE_MODE_CONFIG = {
  id: 'free_mode',
  name: 'Mode Libre',
  gridSize: 6,
  maxValue: 6,
  stock: 20,
  shuffles: 2,
  targetScore: null, // No target - play for high score
  isFreeMode: true, // Enable free mode challenges (row/column bonus)
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
  
  // Free mode state
  const [isFreeModeActive, setIsFreeModeActive] = useState(false);
  const [freeHighScore, setFreeHighScore] = useState(0);

  // Determine active level config (career level or free mode)
  const activeLevelConfig = isFreeModeActive ? FREE_MODE_CONFIG : playingLevel;
  
  // Tutorial state management - only active in career mode, not free mode
  const tutorialConfig = !isFreeModeActive ? (playingLevel?.tutorial || null) : null;
  const isTutorialLevel = !!tutorialConfig && !isFreeModeActive;
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
    finalScore, // AUTHORITATIVE score at game over moment
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
    // Short circuit (Free Mode)
    shortCircuitsRemaining,
    isShortCircuitActive,
    shortCircuitCell,
    // Reprogram (Free Mode)
    reprogramsRemaining,
    isReprogramModalOpen,
    reprogramSelectedValue,
    isReprogramActive,
    handleGridLayout,
    handleGestureBegin,
    handleGestureUpdate,
    handleGestureEnd,
    restartGame,
    shuffleGrid,
    toggleShortCircuit,
    openReprogramModal,
    closeReprogramModal,
    selectReprogramValue,
    cancelReprogram,
  } = useGameState(activeLevelConfig, tutorialState);

  // Level entry animation
  const isGameScreen = currentScreen === SCREENS.GAME || currentScreen === SCREENS.FREE_MODE;
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
    setIsFreeModeActive(false);
    setCurrentScreen(SCREENS.GAME);
  }, [resetCareer]);

  /**
   * Handle Free Mode start
   */
  const handleFreeMode = useCallback(async () => {
    const highScore = await loadHighScore('free_mode');
    setFreeHighScore(highScore);
    setIsFreeModeActive(true);
    setLevelResult(null);
    setCurrentScreen(SCREENS.FREE_MODE);
  }, []);

  /**
   * Return to career map menu
   * If level was completed (levelResult.success), progress is already saved
   */
  const handleBackToMenu = useCallback(async () => {
    // If in free mode, save high score before returning
    if (isFreeModeActive && score > 0) {
      await saveHighScore(score, 'free_mode');
    }
    setIsFreeModeActive(false);
    setLevelResult(null);
    setCurrentScreen(SCREENS.MENU);
  }, [isFreeModeActive, score]);

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

  /**
   * Handle victory override - called by GameOverScreen when it detects
   * score >= target but levelResult said failure (race condition recovery)
   */
  const handleVictoryOverride = useCallback(async (overrideScore) => {
    if (isFreeModeActive) return; // Free mode doesn't need this
    
    // Save progression that was missed due to race condition
    const result = await processRunEnd(overrideScore, challengeCompleted);
    result.targetScore = playingLevel?.targetScore;
    setLevelResult(result);
  }, [isFreeModeActive, processRunEnd, challengeCompleted, playingLevel]);

  // Process level completion when game ends
  // ROBUST FIX: Use finalScore which is captured at the EXACT moment of game over
  // This eliminates ALL race conditions - finalScore is set synchronously with gameOver
  useEffect(() => {
    // Wait for BOTH gameOver AND finalScore to be set (they are set together in checkGameEnd)
    if (gameOver && finalScore !== null && !levelResult && (currentScreen === SCREENS.GAME || currentScreen === SCREENS.FREE_MODE)) {
      const processGameOver = async () => {
        // Free mode: save high score and show result
        if (isFreeModeActive) {
          const isNewHighScore = await saveHighScore(finalScore, 'free_mode');
          const currentHighScore = await loadHighScore('free_mode');
          setFreeHighScore(currentHighScore);
          setLevelResult({
            success: false,
            careerCompleted: false,
            isFreeMode: true,
            isNewHighScore: isNewHighScore && finalScore > 0,
            highScore: currentHighScore,
            message: isNewHighScore && finalScore > 0 ? 'Nouveau Record !' : 'Partie terminée',
          });
          return;
        }
        
        // ROBUST: Use finalScore (captured at game over moment) to check victory
        const targetScore = playingLevel?.targetScore;
        const isVictory = targetScore && finalScore >= targetScore;
        
        if (isVictory) {
          // Target score reached - process as success with challenge status
          const result = await processRunEnd(finalScore, challengeCompleted);
          result.targetScore = targetScore;
          setLevelResult(result);
        } else {
          // Game over without reaching target - failure
          setLevelResult({
            success: false,
            careerCompleted: false,
            message: 'Score insuffisant',
            targetScore: targetScore,
            starsEarned: 0,
          });
        }
      };
      processGameOver();
    }
  }, [gameOver, finalScore, levelResult, currentScreen, isFreeModeActive, challengeCompleted, processRunEnd, playingLevel]);

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
          onFreeMode={handleFreeMode}
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

      {/* Path selection counter - absolute positioned */}
      <PathCounter count={path.length} />

      {/* Tutorial hint text - above dashboard (stays visible during entire step) */}
      {isTutorialLevel && tutorialState.hint && !gameOver && (
        <View style={styles.tutorialHintContainer}>
          <Text style={styles.tutorialHintText}>{tutorialState.hint}</Text>
        </View>
      )}

      {/* Level info display */}
      {isFreeModeActive ? (
        <LevelInfo
          levelNumber={null}
          levelName="Mode Libre"
          targetScore={null}
          currentScore={score}
          highScore={freeHighScore}
          maxValue={maxValue}
          initialStock={FREE_MODE_CONFIG.stock}
          currentStock={stock}
          totalLevels={null}
          challenge={null}
          challengeCompleted={false}
          isTutorialLastStep={false}
          highlightMax={false}
          levelId={null}
          isFreeMode={true}
        />
      ) : playingLevel && (
        <LevelInfo
          levelNumber={playingLevelNumber}
          levelName={playingLevel.name}
          targetScore={playingLevel.targetScore}
          currentScore={score}
          highScore={0}
          maxValue={maxValue}
          initialStock={playingLevel.stock}
          currentStock={stock}
          totalLevels={totalLevels}
          challenge={playingLevel.challenge}
          challengeCompleted={challengeCompleted}
          isTutorialLastStep={isTutorialLevel && tutorialState.isLastStep}
          highlightMax={isTutorialLevel && tutorialState.currentStep?.highlightMax}
          levelId={playingLevel.id}
          isFreeMode={false}
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
            {score.toLocaleString('fr-FR')}
          </Animated.Text>
          {combo > 1 && <Text style={styles.comboText}>x{combo}</Text>}
        </View>
        <View style={styles.stockContainer}>
          <Text style={styles.stockText}>{stock}</Text>
          <Text style={styles.stockLabel}>restantes</Text>
        </View>
        {/* Shuffle button - only shown when shuffles available */}
        {(activeLevelConfig?.shuffles > 0 || shufflesRemaining > 0) && (
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
              const row = Math.floor(index / gridSize);

              // challengeColumn: positive = column index, negative = -(row + 1)
              const isChallengeHighlight = challengeColumn !== null && (
                (challengeColumn >= 0 && col === challengeColumn) ||
                (challengeColumn < 0 && row === -(challengeColumn + 1))
              );

              // Entry animation delay based on phase
              const entryDelay = entryPhase === 'falling' 
                ? getEntryDelay(index) 
                : entryPhase === 'revealing' 
                  ? getRevealDelay(index) 
                  : 0;

              const isShortCircuitTarget = shortCircuitCell === index;
              
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
                  isChallengeColumn={isChallengeHighlight}
                  entryPhase={entryPhase}
                  entryDelay={entryDelay}
                  isShuffling={isShuffling}
                  isShortCircuit={isShortCircuitTarget}
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

      {/* Free Mode power-ups: Short Circuit and Reprogram */}
      {isFreeModeActive && (
        <View style={styles.powerUpsContainer}>
          {/* Short Circuit button */}
          <View style={styles.powerUpWrapper}>
            <TouchableOpacity
              style={[
                styles.shortCircuitButton,
                shortCircuitsRemaining === 0 && styles.shortCircuitButtonDisabled,
                isShortCircuitActive && styles.shortCircuitButtonActive,
              ]}
              onPress={toggleShortCircuit}
              disabled={shortCircuitsRemaining === 0 && !isShortCircuitActive}
            >
              <Image 
                source={require('./assets/court_circuit.png')} 
                style={styles.shortCircuitIcon}
                resizeMode="contain"
              />
              {!isShortCircuitActive && (
                <Text style={styles.shortCircuitCount}>{shortCircuitsRemaining}</Text>
              )}
            </TouchableOpacity>
          </View>
          
          {/* Reprogram button */}
          <View style={styles.powerUpWrapper}>
            <TouchableOpacity
              style={[
                styles.reprogramButton,
                reprogramsRemaining === 0 && styles.reprogramButtonDisabled,
                isReprogramActive && styles.reprogramButtonActive,
              ]}
              onPress={isReprogramActive ? cancelReprogram : openReprogramModal}
              disabled={reprogramsRemaining === 0 && !isReprogramActive}
            >
              <Image 
                source={require('./assets/reprogram.png')} 
                style={styles.reprogramIcon}
                resizeMode="contain"
              />
              {!isReprogramActive && (
                <Text style={styles.reprogramCount}>{reprogramsRemaining}</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}
      
      {/* Hint text for active power-ups */}
      {isFreeModeActive && (isShortCircuitActive || isReprogramActive) && (
        <Text style={styles.powerUpHint}>
          {isShortCircuitActive ? 'Touchez une case à détruire' : `Touchez une case pour la changer en ${reprogramSelectedValue}`}
        </Text>
      )}
      
      {/* Reprogram value selection modal */}
      {isReprogramModalOpen && (
        <View style={styles.modalOverlay}>
          <View style={styles.reprogramModal}>
            <Text style={styles.reprogramModalTitle}>Reprogrammation</Text>
            <Text style={styles.reprogramModalSubtitle}>Choisissez la nouvelle valeur</Text>
            <View style={styles.reprogramValueGrid}>
              {Array.from({ length: maxValue - 1 }, (_, i) => i + 1).map((value) => (
                <TouchableOpacity
                  key={value}
                  style={styles.reprogramValueButton}
                  onPress={() => selectReprogramValue(value)}
                >
                  <Text style={styles.reprogramValueText}>{value}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={styles.reprogramCancelButton} onPress={closeReprogramModal}>
              <Text style={styles.reprogramCancelText}>Annuler</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

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
          levelResult={levelResult || { success: false, message: 'Partie terminée', targetScore: playingLevel?.targetScore }}
          onNextLevel={!isFreeModeActive && !levelResult?.careerCompleted ? handleNextLevel : null}
          onVictoryOverride={handleVictoryOverride}
        />
      )}
      </ImageBackground>
    </GestureHandlerRootView>
  );
}
