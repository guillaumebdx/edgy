/**
 * LevelInfo Component
 * Displays current level information in career mode
 */

import React, { useEffect } from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { getLevelImage } from '../levelAssets';
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
  currentScore = 0,
  highScore = 0,
  maxValue, 
  initialStock, 
  currentStock,
  totalLevels, 
  challenge, 
  challengeCompleted,
  isTutorialLastStep = false,
  highlightMax = false,
  levelId = null,
  isFreeMode = false,
}) => {
  // Get level component image
  const levelImage = levelId !== null ? getLevelImage(levelId) : null;
  
  // Calculate progress percentages
  const hasObjective = targetScore && targetScore > 0;
  // For free mode: if no high score yet, show empty bar; otherwise show progress vs high score
  const scoreReference = isFreeMode ? highScore : targetScore;
  const scoreProgress = scoreReference > 0 ? Math.min(currentScore / scoreReference, 1) : (currentScore > 0 ? 1 : 0);
  const stockProgress = initialStock > 0 ? Math.max(0, currentStock / initialStock) : 1;
  
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

  // Get color for stock gauge based on remaining percentage
  const getStockColor = () => {
    if (stockProgress > 0.5) return '#70D0B0';
    if (stockProgress > 0.25) return '#E8943A';
    return '#FF6B6B';
  };

  return (
    <View style={styles.dashboardCard}>
      {/* Left side: Component image */}
      {levelImage && (
        <View style={styles.imageSection}>
          <Image source={levelImage} style={styles.componentImage} resizeMode="contain" />
        </View>
      )}
      
      {/* Right side: Info */}
      <View style={styles.infoSection}>
        {/* Header: Level number and name */}
        <View style={styles.headerRow}>
          {levelNumber !== null && (
            <View style={styles.levelBadge}>
              <Text style={styles.levelNumber}>{levelNumber}</Text>
            </View>
          )}
          <Text style={styles.levelName}>{levelName}</Text>
          
          {/* MAX badge */}
          <Animated.View style={[
            styles.maxBadge,
            highlightMax && maxBlinkStyle,
          ]}>
            <Text style={styles.maxLabel}>MAX</Text>
            <Animated.Text style={[
              styles.maxValue,
              highlightMax && styles.maxHighlight,
            ]}>
              {maxValue}
            </Animated.Text>
          </Animated.View>
        </View>
        
        {/* Gauges row */}
        <View style={styles.gaugesRow}>
          {/* Score gauge - different display for career vs free mode */}
          {isFreeMode ? (
            <View style={[styles.gaugeContainer, styles.gaugeContainerScore]}>
              <View style={styles.gaugeHeader}>
                <Text style={styles.gaugeLabel}>SCORE vs RECORD</Text>
                <Text style={[
                  styles.gaugeValue,
                  currentScore > highScore && highScore > 0 && styles.gaugeValueComplete,
                ]}>
                  {currentScore.toLocaleString('fr-FR')}{highScore > 0 ? ` / ${highScore.toLocaleString('fr-FR')}` : ''}
                </Text>
              </View>
              <View style={styles.gaugeTrack}>
                <View style={[
                  styles.gaugeFill,
                  currentScore > highScore && highScore > 0 ? styles.gaugeFillComplete : styles.gaugeFillScore,
                  { width: `${scoreProgress * 100}%` },
                ]} />
              </View>
            </View>
          ) : hasObjective ? (
            <Animated.View style={[
              styles.gaugeContainer,
              styles.gaugeContainerScore,
              isTutorialLastStep && blinkStyle,
            ]}>
              <View style={styles.gaugeHeader}>
                <Text style={styles.gaugeLabel}>SCORE</Text>
                <Animated.Text style={[
                  styles.gaugeValue,
                  scoreProgress >= 1 && styles.gaugeValueComplete,
                  isTutorialLastStep && styles.objectifHighlight,
                ]}>
                  {currentScore.toLocaleString('fr-FR')} / {targetScore.toLocaleString('fr-FR')}
                </Animated.Text>
              </View>
              <View style={styles.gaugeTrack}>
                <View style={[
                  styles.gaugeFill,
                  styles.gaugeFillScore,
                  { width: `${scoreProgress * 100}%` },
                  scoreProgress >= 1 && styles.gaugeFillComplete,
                ]} />
              </View>
            </Animated.View>
          ) : (
            <View style={[styles.gaugeContainer, styles.gaugeContainerScore]}>
              <View style={styles.gaugeHeader}>
                <Text style={styles.gaugeLabel}>SCORE</Text>
                <Text style={styles.gaugeValue}>{currentScore.toLocaleString('fr-FR')}</Text>
              </View>
              <View style={styles.gaugeTrack}>
                <View style={[styles.gaugeFill, styles.gaugeFillFree, { width: '100%' }]} />
              </View>
            </View>
          )}
          
          {/* Stock gauge */}
          <View style={styles.gaugeContainer}>
            <View style={styles.gaugeHeader}>
              <Text style={styles.gaugeLabel}>STOCK</Text>
              <Text style={[styles.gaugeValue, { color: getStockColor() }]}>
                {currentStock}
              </Text>
            </View>
            <View style={styles.gaugeTrack}>
              <View style={[
                styles.gaugeFill,
                { width: `${stockProgress * 100}%`, backgroundColor: getStockColor() },
              ]} />
            </View>
          </View>
        </View>
        
        {/* Challenge row */}
        {challenge && (
          <View style={[
            styles.challengeRow,
            challengeCompleted && styles.challengeRowCompleted,
          ]}>
            <Text style={[
              styles.challengeText,
              challengeCompleted && styles.challengeCompleted
            ]}>
              {challengeCompleted ? '⭐' : '☆'} {challenge.description}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  dashboardCard: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 12,
    backgroundColor: 'rgba(20, 30, 40, 0.85)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(80, 120, 140, 0.4)',
  },
  imageSection: {
    width: 70,
    height: 70,
    marginRight: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(40, 60, 80, 0.5)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(100, 160, 180, 0.3)',
  },
  componentImage: {
    width: 50,
    height: 50,
  },
  infoSection: {
    flex: 1,
    justifyContent: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  levelBadge: {
    backgroundColor: 'rgba(100, 160, 180, 0.3)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 8,
  },
  levelNumber: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'monospace',
    color: 'rgba(255, 255, 255, 0.9)',
  },
  levelName: {
    flex: 1,
    fontSize: 17,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.95)',
  },
  maxBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(80, 60, 80, 0.4)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 4,
  },
  maxLabel: {
    fontSize: 10,
    fontWeight: '600',
    fontFamily: 'monospace',
    color: 'rgba(255, 255, 255, 0.5)',
  },
  maxValue: {
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'monospace',
    color: 'rgba(255, 255, 255, 0.9)',
  },
  gaugesRow: {
    flexDirection: 'row',
    gap: 10,
  },
  gaugeContainer: {
    flex: 1,
  },
  gaugeContainerScore: {
    flex: 1.8,
  },
  gaugeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 3,
  },
  gaugeLabel: {
    fontSize: 10,
    fontWeight: '600',
    fontFamily: 'monospace',
    color: 'rgba(255, 255, 255, 0.5)',
    letterSpacing: 0.5,
  },
  gaugeValue: {
    fontSize: 13,
    fontWeight: '700',
    fontFamily: 'monospace',
    color: 'rgba(255, 255, 255, 0.9)',
  },
  gaugeValueComplete: {
    color: '#70D0B0',
  },
  gaugeTrack: {
    height: 8,
    backgroundColor: 'rgba(60, 80, 100, 0.4)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  gaugeFill: {
    height: '100%',
    borderRadius: 3,
  },
  gaugeFillScore: {
    backgroundColor: 'rgba(100, 160, 180, 0.8)',
  },
  gaugeFillComplete: {
    backgroundColor: '#70D0B0',
  },
  gaugeFillFree: {
    backgroundColor: 'rgba(100, 160, 180, 0.4)',
  },
  objectifHighlight: {
    color: '#70D0B0',
  },
  maxHighlight: {
    color: '#FF6B6B',
  },
  challengeRow: {
    marginTop: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: 'rgba(255, 200, 100, 0.1)',
    borderRadius: 4,
    borderLeftWidth: 2,
    borderLeftColor: 'rgba(255, 200, 100, 0.5)',
  },
  challengeRowCompleted: {
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    borderLeftColor: '#FFD700',
  },
  challengeText: {
    fontSize: 10,
    fontFamily: 'monospace',
    color: 'rgba(255, 200, 100, 0.9)',
  },
  challengeCompleted: {
    color: '#FFD700',
  },
});

export default LevelInfo;
