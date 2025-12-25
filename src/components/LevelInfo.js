/**
 * LevelInfo Component
 * Displays current level information in career mode
 */

import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

const LevelInfo = ({ 
  levelNumber, 
  levelName, 
  targetScore, 
  maxValue, 
  stock, 
  totalLevels, 
  challenge, 
  challengeCompleted,
  isTutorialLastStep = false,
  highlightMax = false,
}) => {
  // Blinking animation for tutorial highlights
  const blinkOpacity = useSharedValue(1);
  const maxBlinkOpacity = useSharedValue(1);
  
  useEffect(() => {
    if (isTutorialLastStep) {
      blinkOpacity.value = withRepeat(
        withSequence(
          withTiming(0.4, { duration: 400 }),
          withTiming(1, { duration: 400 })
        ),
        -1, // infinite
        false
      );
    } else {
      blinkOpacity.value = 1;
    }
  }, [isTutorialLastStep]);
  
  useEffect(() => {
    if (highlightMax) {
      maxBlinkOpacity.value = withRepeat(
        withSequence(
          withTiming(0.4, { duration: 400 }),
          withTiming(1, { duration: 400 })
        ),
        -1, // infinite
        false
      );
    } else {
      maxBlinkOpacity.value = 1;
    }
  }, [highlightMax]);
  
  const blinkStyle = useAnimatedStyle(() => ({
    opacity: blinkOpacity.value,
  }));
  
  const maxBlinkStyle = useAnimatedStyle(() => ({
    opacity: maxBlinkOpacity.value,
  }));

  return (
    <View style={styles.container}>
      <View style={styles.levelBadge}>
        <Text style={styles.levelNumber}>{levelNumber}</Text>
        <Text style={styles.levelTotal}>/{totalLevels}</Text>
      </View>
      <View style={styles.infoContainer}>
        <Text style={styles.levelName}>{levelName}</Text>
        <View style={styles.statsRow}>
          <Animated.Text style={[
            styles.statText,
            isTutorialLastStep && styles.objectifHighlight,
            isTutorialLastStep && blinkStyle,
          ]}>
            Objectif: {targetScore.toLocaleString()}
          </Animated.Text>
          <Text style={styles.statSeparator}>•</Text>
          <Animated.Text style={[
            styles.statText,
            highlightMax && styles.maxHighlight,
            highlightMax && maxBlinkStyle,
          ]}>
            MAX: {maxValue}
          </Animated.Text>
          <Text style={styles.statSeparator}>•</Text>
          <Text style={styles.statText}>Stock: {stock}</Text>
        </View>
        {challenge && (
          <View style={styles.challengeRow}>
            <Text style={[
              styles.challengeText,
              challengeCompleted && styles.challengeCompleted
            ]}>
              {challengeCompleted ? '⭐ ' : '☆ '}
              {challenge.description}
              {challengeCompleted ? ' ✓' : ''}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 8,
  },
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'baseline',
    backgroundColor: 'rgba(80, 140, 160, 0.3)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(100, 160, 180, 0.4)',
    marginRight: 12,
  },
  levelNumber: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'monospace',
    color: 'rgba(255, 255, 255, 0.9)',
  },
  levelTotal: {
    fontSize: 12,
    fontWeight: '500',
    fontFamily: 'monospace',
    color: 'rgba(255, 255, 255, 0.5)',
  },
  infoContainer: {
    flex: 1,
  },
  levelName: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.85)',
    marginBottom: 2,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    fontSize: 13,
    fontFamily: 'monospace',
    color: 'rgba(255, 255, 255, 0.6)',
  },
  objectifHighlight: {
    color: '#70D0B0',
    fontWeight: 'bold',
    fontSize: 14,
  },
  maxHighlight: {
    color: '#FF6B6B',
    fontWeight: 'bold',
    fontSize: 14,
  },
  statSeparator: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: 6,
  },
  challengeRow: {
    marginTop: 4,
  },
  challengeText: {
    fontSize: 10,
    fontFamily: 'monospace',
    color: 'rgba(255, 200, 100, 0.8)',
  },
  challengeCompleted: {
    color: '#FFD700',
    textShadowColor: 'rgba(255, 215, 0, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 4,
  },
});

export default LevelInfo;
