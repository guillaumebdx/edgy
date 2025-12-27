/**
 * PathCounter Component
 * Displays the current path length - minimal floating number
 * Animated when value changes
 */

import React, { useEffect } from 'react';
import { Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
} from 'react-native-reanimated';

const PathCounter = ({ count }) => {
  const scale = useSharedValue(1);
  
  // Animate on count change
  useEffect(() => {
    if (count > 0) {
      scale.value = withSequence(
        withSpring(1.3, { damping: 8, stiffness: 500 }),
        withSpring(1, { damping: 10, stiffness: 300 })
      );
    } else {
      scale.value = 1;
    }
  }, [count]);
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  
  // Dynamic opacity - more visible as count increases
  const textOpacity = Math.min(0.4 + count * 0.07, 0.95);
  
  // Glow effect for count >= 4
  const isGlowing = count >= 4;
  const glowRadius = isGlowing ? 20 + (count - 4) * 5 : 15;
  const glowOpacity = isGlowing ? 0.7 + (count - 4) * 0.05 : 0.4;
  
  if (count === 0) {
    return null;
  }
  
  return (
    <Animated.View style={[styles.container, animatedStyle]} pointerEvents="none">
      <Text style={[
        styles.counterText, 
        { 
          opacity: textOpacity,
          textShadowRadius: glowRadius,
          textShadowColor: `rgba(112, 208, 176, ${glowOpacity})`,
        },
        isGlowing && styles.glowingText,
      ]}>
        {count}
      </Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 95,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  counterText: {
    fontSize: 56,
    fontWeight: '200',
    fontFamily: 'monospace',
    color: '#70D0B0',
    textShadowColor: 'rgba(112, 208, 176, 0.4)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 15,
  },
  glowingText: {
    fontWeight: '300',
    color: '#90E8C8',
  },
});

export default PathCounter;
