/**
 * Edgy Grid - Main Application
 * 
 * A tactile puzzle game where players connect cells of the same value
 * to transform them. The game ends when no valid moves remain.
 * 
 * Architecture:
 * - src/constants.js: Game configuration and constants
 * - src/gameLogic.js: Grid management, validation, gravity
 * - src/scoreManager.js: Score calculation, combos, celebrations
 * - src/components/: UI components (AnimatedCell, FloatingText, etc.)
 * - src/hooks/useGameState.js: Centralized state management
 */

import { StatusBar } from 'expo-status-bar';
import { Text, View, ImageBackground } from 'react-native';
import { GestureHandlerRootView, GestureDetector, Gesture } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';

// Module imports
import { GRID_SIZE, ANIMATION } from './src/constants';
import { getConnectionStyle } from './src/utils';
import styles from './src/styles';
import {
  AnimatedCell,
  FloatingText,
  CelebrationText,
  GameOverScreen,
} from './src/components';
import { useGameState } from './src/hooks';

/**
 * Main App Component
 * Renders the game UI and handles gesture input
 */
export default function App() {
  // Get all game state and handlers from custom hook
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
    floatingScore,
    celebration,
    handleGridLayout,
    handleGestureBegin,
    handleGestureUpdate,
    handleGestureEnd,
    restartGame,
  } = useGameState();

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

  return (
    <GestureHandlerRootView style={styles.container}>
      <ImageBackground
        source={require('./assets/background-circuit.png.png')}
        style={styles.backgroundImage}
        resizeMode="cover"
        imageStyle={styles.backgroundImageStyle}
      >
        <StatusBar style="light" />

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
              const col = index % GRID_SIZE;

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
                      gridLayout.cellHeight
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

      {/* Game over screen */}
      {gameOver && <GameOverScreen score={score} onRestart={restartGame} />}
      </ImageBackground>
    </GestureHandlerRootView>
  );
}
