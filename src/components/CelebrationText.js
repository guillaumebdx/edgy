/**
 * CelebrationText Component
 * Displays valorizing feedback words for significant achievements
 * Appears centered on screen with scale-up bounce animation
 */

import React, { useEffect } from 'react';
import { Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withSequence,
  withDelay,
} from 'react-native-reanimated';

const CelebrationText = ({ text, visible }) => {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.3);
  const translateY = useSharedValue(10);

  useEffect(() => {
    if (visible && text) {
      // Reset values
      opacity.value = 0;
      scale.value = 0.3;
      translateY.value = 10;

      // Scale with bounce then settle
      scale.value = withSequence(
        withSpring(1.1, { damping: 8, stiffness: 400 }),
        withTiming(1, { duration: 100 })
      );
      
      // Fade in, hold, fade out
      opacity.value = withSequence(
        withTiming(1, { duration: 80 }),
        withDelay(500, withTiming(0, { duration: 250 }))
      );
      
      // Slight upward movement on exit
      translateY.value = withSequence(
        withSpring(0, { damping: 12, stiffness: 300 }),
        withDelay(500, withTiming(-20, { duration: 250 }))
      );
    }
  }, [visible, text]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { scale: scale.value },
      { translateY: translateY.value },
    ],
  }));

  if (!visible || !text) return null;

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <Text style={styles.text}>{text}</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: '45%',
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 200,
    pointerEvents: 'none',
  },
  text: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
    letterSpacing: 2,
  },
});

export default CelebrationText;
