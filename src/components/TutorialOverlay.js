/**
 * TutorialOverlay Component
 * Displays animated guide line and hint text for tutorial level
 * 
 * Features:
 * - Pulsing animated line showing expected path
 * - Short hint text integrated in UI
 * - Disappears when player starts correct gesture
 */

import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';

/**
 * Single guide dot on the path
 */
const GuideDot = ({ x, y, size, delay }) => {
  const opacity = useSharedValue(0.3);
  const scale = useSharedValue(0.8);

  useEffect(() => {
    // Pulsing animation with staggered delay
    opacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 600, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.3, { duration: 600, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
    scale.value = withRepeat(
      withSequence(
        withTiming(1.2, { duration: 600, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.8, { duration: 600, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View
      style={[
        styles.guideDot,
        {
          left: x - size / 2,
          top: y - size / 2,
          width: size,
          height: size,
          borderRadius: size / 2,
        },
        animatedStyle,
      ]}
    />
  );
};

/**
 * Connection line between two guide dots
 */
const GuideLine = ({ x1, y1, x2, y2 }) => {
  const opacity = useSharedValue(0.4);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.8, { duration: 600, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.4, { duration: 600, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  // Calculate line position and rotation
  const dx = x2 - x1;
  const dy = y2 - y1;
  const length = Math.sqrt(dx * dx + dy * dy);
  const angle = Math.atan2(dy, dx) * (180 / Math.PI);

  return (
    <Animated.View
      style={[
        styles.guideLine,
        {
          left: x1,
          top: y1 - 2,
          width: length,
          transform: [{ rotate: `${angle}deg` }],
          transformOrigin: 'left center',
        },
        animatedStyle,
      ]}
    />
  );
};

/**
 * Main TutorialOverlay component
 */
const TutorialOverlay = ({
  expectedPath,
  hint,
  gridLayout,
  visible,
}) => {
  if (!visible || !expectedPath || expectedPath.length === 0 || !gridLayout.cellWidth) {
    return null;
  }

  const { cellWidth, cellHeight, padding, gridSize } = gridLayout;

  // Convert cell indices to screen coordinates (center of each cell)
  const getCoordinates = (cellIndex) => {
    const col = cellIndex % gridSize;
    const row = Math.floor(cellIndex / gridSize);
    return {
      x: padding + col * cellWidth + cellWidth / 2,
      y: padding + row * cellHeight + cellHeight / 2,
    };
  };

  const pathCoords = expectedPath.map(getCoordinates);
  const dotSize = Math.min(cellWidth, cellHeight) * 0.3;

  return (
    <View style={styles.container} pointerEvents="none">
      {/* Guide lines between dots */}
      {pathCoords.slice(0, -1).map((coord, index) => {
        const nextCoord = pathCoords[index + 1];
        return (
          <GuideLine
            key={`line-${index}`}
            x1={coord.x}
            y1={coord.y}
            x2={nextCoord.x}
            y2={nextCoord.y}
          />
        );
      })}

      {/* Guide dots on path */}
      {pathCoords.map((coord, index) => (
        <GuideDot
          key={`dot-${index}`}
          x={coord.x}
          y={coord.y}
          size={dotSize}
          delay={index * 100}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
  },
  guideDot: {
    position: 'absolute',
    backgroundColor: '#FFD700',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 10,
  },
  guideLine: {
    position: 'absolute',
    height: 4,
    backgroundColor: '#FFD700',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 5,
  },
});

export default TutorialOverlay;
