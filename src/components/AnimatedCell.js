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
import { GRID_SIZE, MAX_VALUE, COLOR_MAP, ANIMATION } from '../constants';

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
    } else {
      shakeAnim.value = 0;
      scaleAnim.value = 1;
      opacityAnim.value = 1;
    }
  }, [isShaking]);

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
      { translateY: translateY.value },
      { scale: scaleAnim.value * pressScale.value },
    ],
    opacity: opacityAnim.value,
  }));

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
          { backgroundColor: colorData.border },
          isInPath && styles.cellOuterActive,
          isExceeded && styles.cellOuterExceeded,
        ]}
      >
        {/* Inner module surface */}
        <View style={[styles.cellInner, { backgroundColor: colorData.base }]}>
          {/* Subtle top gradient for depth */}
          <View style={[styles.cellGradientTop, { backgroundColor: colorData.top }]} />
          
          {/* Cell value - technical typography */}
          <Text style={[styles.cellText, isExceeded && styles.cellTextExceeded]}>
            {value > MAX_VALUE ? `${value}` : value}
          </Text>
          
          {/* Subtle bottom gradient for depth */}
          <View style={[styles.cellGradientBottom, { backgroundColor: colorData.bottom }]} />
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
