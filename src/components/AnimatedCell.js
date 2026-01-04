/**
 * AnimatedCell Component
 * Renders a single grid cell with all animations (press, shake, fall)
 */

import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withSequence,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { GRID_SIZE, MAX_VALUE, COLOR_MAP, ANIMATION, NEUTRAL_COLOR } from '../constants';

const AnimatedCell = ({
  value,
  index,
  isInPath,
  pathIndex,
  isExceeded,
  isShaking,
  isFalling,
  fallDistance,
  columnDelay,
  cellHeight,
  gridSize = GRID_SIZE,
  maxValue = MAX_VALUE,
  isChallengeColumn = false,
  // Entry animation props
  entryPhase = 'ready', // 'falling' | 'revealing' | 'ready'
  entryDelay = 0,
  // Shuffle animation
  isShuffling = false,
  // Short circuit animation
  isShortCircuit = false,
}) => {
  // Calculate cell size based on gridSize
  const cellSizePercent = 100 / gridSize;
  
  // Empty cell placeholder
  if (value === null) {
    return <View style={[styles.cell, { width: `${cellSizePercent}%`, height: `${cellSizePercent}%` }]} />;
  }

  // Get color data, clamping to maxValue for display
  const displayValue = value > maxValue ? maxValue : value;
  const colorData = COLOR_MAP[displayValue] || COLOR_MAP[1];

  // Animation shared values
  const shakeAnim = useSharedValue(0);
  const scaleAnim = useSharedValue(1);
  const opacityAnim = useSharedValue(1);
  const translateY = useSharedValue(0);
  const pressScale = useSharedValue(1);
  const challengeGlow = useSharedValue(0);
  const shuffleRotate = useSharedValue(0);
  const shuffleScale = useSharedValue(1);
  
  // Entry animation shared values
  const entryTranslateY = useSharedValue(entryPhase === 'falling' ? -400 : 0);
  const entryReveal = useSharedValue(entryPhase === 'ready' ? 1 : 0);
  const entryScale = useSharedValue(entryPhase === 'ready' ? 1 : 0.9);

  // Entry fall animation
  useEffect(() => {
    if (entryPhase === 'falling') {
      entryTranslateY.value = -400;
      entryReveal.value = 0;
      entryScale.value = 0.9;
      entryTranslateY.value = withDelay(
        entryDelay,
        withSpring(0, {
          damping: 12,
          stiffness: 200,
          mass: 0.8,
        })
      );
    } else if (entryPhase === 'revealing') {
      entryTranslateY.value = 0;
      entryReveal.value = withDelay(
        entryDelay,
        withTiming(1, { duration: ANIMATION.ENTRY_REVEAL_DURATION, easing: Easing.out(Easing.ease) })
      );
      entryScale.value = withDelay(
        entryDelay,
        withSpring(1, { damping: 15, stiffness: 300 })
      );
    } else if (entryPhase === 'ready') {
      entryTranslateY.value = 0;
      entryReveal.value = 1;
      entryScale.value = 1;
    }
  }, [entryPhase, entryDelay]);

  // Challenge column glow animation
  useEffect(() => {
    if (isChallengeColumn) {
      challengeGlow.value = withSequence(
        withTiming(1, { duration: 300 }),
        withTiming(0.6, { duration: 400 }),
        withTiming(1, { duration: 400 }),
        withTiming(0.6, { duration: 400 }),
        withTiming(0.8, { duration: 300 })
      );
    } else {
      challengeGlow.value = 0;
    }
  }, [isChallengeColumn]);

  // Shuffle animation
  useEffect(() => {
    if (isShuffling) {
      // Random delay for staggered effect
      const randomDelay = Math.random() * 100;
      shuffleScale.value = withDelay(
        randomDelay,
        withSequence(
          withTiming(0.3, { duration: 150, easing: Easing.in(Easing.ease) }),
          withTiming(1, { duration: 150, easing: Easing.out(Easing.ease) })
        )
      );
      shuffleRotate.value = withDelay(
        randomDelay,
        withSequence(
          withTiming(180, { duration: 150 }),
          withTiming(360, { duration: 150 })
        )
      );
    } else {
      shuffleRotate.value = 0;
      shuffleScale.value = 1;
    }
  }, [isShuffling]);

  // Press animation when cell is in path - snappy with subtle bounce
  useEffect(() => {
    if (isInPath) {
      pressScale.value = withSpring(ANIMATION.PRESS_SCALE, { damping: 15, stiffness: 800 });
    } else {
      pressScale.value = withSpring(1, { damping: 12, stiffness: 600 });
    }
  }, [isInPath]);

  // Shake and disappear animation for exceeded cells
  useEffect(() => {
    if (isShaking) {
      scaleAnim.value = withSequence(
        withTiming(1.12, { duration: 50 }),
        withTiming(0.9, { duration: 40 }),
        withTiming(1.05, { duration: 35 }),
        withTiming(0, { duration: 80, easing: Easing.in(Easing.ease) })
      );
      opacityAnim.value = withSequence(
        withDelay(100, withTiming(0, { duration: 80 }))
      );
    } else if (!isShortCircuit) {
      shakeAnim.value = 0;
      scaleAnim.value = 1;
      opacityAnim.value = 1;
    }
  }, [isShaking]);

  // Short circuit electric destruction animation
  const electricFlicker = useSharedValue(1);
  useEffect(() => {
    if (isShortCircuit) {
      // Electric flicker effect - rapid opacity changes then disappear
      electricFlicker.value = withSequence(
        withTiming(0.3, { duration: 50 }),
        withTiming(1, { duration: 30 }),
        withTiming(0.2, { duration: 40 }),
        withTiming(1, { duration: 30 }),
        withTiming(0.1, { duration: 50 }),
        withTiming(0.8, { duration: 30 }),
        withTiming(0, { duration: 60 })
      );
      scaleAnim.value = withSequence(
        withTiming(1.15, { duration: 80 }),
        withTiming(0.95, { duration: 60 }),
        withTiming(1.1, { duration: 50 }),
        withTiming(0, { duration: 80, easing: Easing.in(Easing.ease) })
      );
    } else {
      electricFlicker.value = 1;
    }
  }, [isShortCircuit]);

  // Fall animation after gravity
  useEffect(() => {
    if (isFalling && fallDistance > 0) {
      translateY.value = -fallDistance * cellHeight;
      translateY.value = withDelay(
        columnDelay,
        withSpring(0, {
          damping: 10,
          stiffness: 280,
          mass: 0.8,
        })
      );
    }
  }, [isFalling, fallDistance, cellHeight, columnDelay]);

  // Combined animated style
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: shakeAnim.value },
      { translateY: translateY.value + entryTranslateY.value },
      { scale: scaleAnim.value * pressScale.value * entryScale.value * shuffleScale.value },
      { rotateZ: `${shuffleRotate.value}deg` },
    ],
    opacity: opacityAnim.value * electricFlicker.value,
  }));
  
  // Determine colors based on entry phase
  const isRevealed = entryPhase === 'ready' || entryPhase === 'revealing';
  const currentColor = isRevealed ? colorData : NEUTRAL_COLOR;
  const showValue = entryPhase === 'ready' || entryPhase === 'revealing';

  // Dynamic cell style
  const cellStyle = {
    width: `${cellSizePercent}%`,
    height: `${cellSizePercent}%`,
    padding: 2,
  };

  return (
    <Animated.View style={[cellStyle, animatedStyle]}>
      {/* Module container with border */}
      <View
        style={[
          styles.cellOuter,
          { backgroundColor: currentColor.border },
          isInPath && styles.cellOuterActive,
          isExceeded && styles.cellOuterExceeded,
          isChallengeColumn && styles.cellOuterChallenge,
          isShortCircuit && styles.cellOuterShortCircuit,
        ]}
      >
        {/* Inner module surface */}
        <View style={[styles.cellInner, { backgroundColor: currentColor.base }]}>
          {/* Subtle top gradient for depth */}
          <View style={[styles.cellGradientTop, { backgroundColor: currentColor.top }]} />
          
          {/* Inner glow when selected - light from center */}
          {isInPath && (
            <View style={styles.innerGlow}>
              <View style={styles.innerGlowCore} />
            </View>
          )}
          
          {/* Cell value - technical typography */}
          {showValue && (
            <Text style={[styles.cellText, isExceeded && styles.cellTextExceeded, isInPath && styles.cellTextActive]}>
              {value > MAX_VALUE ? `${value}` : value}
            </Text>
          )}
          
          {/* Subtle bottom gradient for depth */}
          <View style={[styles.cellGradientBottom, { backgroundColor: currentColor.bottom }]} />
        </View>
      </View>
      
      {/* Path position indicator */}
      {isInPath && pathIndex >= 0 && (
        <View style={styles.pathIndicator}>
          <Text style={styles.pathNumber}>{pathIndex + 1}</Text>
        </View>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  cell: {
    width: `${100 / GRID_SIZE}%`,
    height: `${100 / GRID_SIZE}%`,
    padding: 2,
  },
  cellOuter: {
    flex: 1,
    borderRadius: 4,
    padding: 2,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.3)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 2,
    elevation: 5,
  },
  cellOuterActive: {
    borderColor: 'rgba(100, 180, 200, 0.6)',
    shadowColor: '#4A90A8',
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 7,
  },
  cellOuterExceeded: {
    borderColor: 'rgba(180, 80, 80, 0.6)',
    shadowColor: '#A04040',
    shadowOpacity: 0.5,
    shadowRadius: 5,
  },
  cellOuterChallenge: {
    borderColor: '#FFD700',
    borderWidth: 2,
    shadowColor: '#FFD700',
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 10,
  },
  cellOuterShortCircuit: {
    borderColor: '#00FFFF',
    borderWidth: 2,
    shadowColor: '#00FFFF',
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 15,
  },
  cellInner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 2,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
  },
  cellGradientTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '40%',
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
    opacity: 0.4,
  },
  cellGradientBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '35%',
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 2,
    opacity: 0.5,
  },
  cellText: {
    fontSize: 24,
    fontWeight: '700',
    fontFamily: 'monospace',
    color: 'rgba(255, 255, 255, 0.95)',
    letterSpacing: 2,
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    zIndex: 1,
  },
  cellTextExceeded: {
    color: '#FFFFFF',
    textShadowColor: 'rgba(255, 100, 100, 0.4)',
  },
  cellTextActive: {
    color: '#FFFFFF',
    textShadowColor: 'rgba(150, 220, 255, 0.8)',
    textShadowRadius: 6,
  },
  innerGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 0,
  },
  innerGlowCore: {
    width: '80%',
    height: '80%',
    borderRadius: 100,
    backgroundColor: 'rgba(150, 220, 255, 0.35)',
    shadowColor: '#96DCFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 15,
    elevation: 10,
  },
  pathIndicator: {
    position: 'absolute',
    top: 3,
    right: 3,
    backgroundColor: 'rgba(80, 140, 160, 0.85)',
    borderRadius: 2,
    borderWidth: 1,
    borderColor: 'rgba(100, 180, 200, 0.5)',
    width: 12,
    height: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pathNumber: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 7,
    fontWeight: '600',
    fontFamily: 'monospace',
  },
});

export default AnimatedCell;
