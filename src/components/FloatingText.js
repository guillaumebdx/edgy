/**
 * FloatingText Component
 * Displays animated score feedback that floats upward and fades
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
  Easing,
} from 'react-native-reanimated';

const FloatingText = ({ text, visible, style }) => {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(0.5);

  useEffect(() => {
    if (visible) {
      // Reset values
      opacity.value = 1;
      translateY.value = 0;
      scale.value = 0.5;

      // Animate: fade in, hold, fade out
      opacity.value = withSequence(
        withTiming(1, { duration: 100 }),
        withDelay(600, withTiming(0, { duration: 300 }))
      );
      
      // Float upward
      translateY.value = withTiming(-30, { 
        duration: 1000, 
        easing: Easing.out(Easing.ease) 
      });
      
      // Scale with bounce
      scale.value = withSpring(1, { damping: 8, stiffness: 200 });
    }
  }, [visible, text]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  if (!visible) return null;

  return (
    <Animated.View style={[styles.container, style, animatedStyle]}>
      <Text style={styles.text}>{text}</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: -35,
    alignSelf: 'center',
    zIndex: 100,
  },
  text: {
    fontSize: 20,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.9)',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
});

export default FloatingText;
