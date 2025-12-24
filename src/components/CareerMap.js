/**
 * CareerMap Component
 * Circuit board styled career progression map
 * 
 * Displays levels as electronic components connected by circuit traces
 * Vertical scrolling navigation through career progression
 */

import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  ImageBackground,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { CAREER_LEVELS } from '../careerLevels';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Hardcoded assets for each level (1 unique asset per level)
const LEVEL_1_IMAGE = require('../../assets/led.png');
const LEVEL_2_IMAGE = require('../../assets/resistance.png');
const LEVEL_3_IMAGE = require('../../assets/transistor.png');
const LEVEL_4_IMAGE = require('../../assets/2branches.png');
const LEVEL_5_IMAGE = require('../../assets/3branches.png');

// Map level IDs to their specific component images
const LEVEL_COMPONENTS = {
  1: LEVEL_1_IMAGE,
  2: LEVEL_2_IMAGE,
  3: LEVEL_3_IMAGE,
  4: LEVEL_4_IMAGE,
  5: LEVEL_5_IMAGE,
};

/**
 * Single level node component
 */
const LevelNode = ({ 
  level, 
  isCompleted, 
  isCurrent, 
  isLocked, 
  onPress,
  position,
}) => {
  const componentImage = LEVEL_COMPONENTS[level.id];
  
  const handlePress = () => {
    if (!isLocked && onPress) {
      onPress(level);
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.levelNode,
        position === 'left' && styles.levelNodeLeft,
        position === 'right' && styles.levelNodeRight,
        position === 'center' && styles.levelNodeCenter,
        isLocked && styles.levelNodeLocked,
      ]}
      onPress={handlePress}
      disabled={isLocked}
      activeOpacity={isLocked ? 1 : 0.7}
    >
      {/* Component image */}
      <View style={[
        styles.componentContainer,
        isCompleted && styles.componentCompleted,
        isCurrent && styles.componentCurrent,
        isLocked && styles.componentLocked,
      ]}>
        <Image
          source={componentImage}
          style={[
            styles.componentImage,
            isLocked && styles.componentImageLocked,
          ]}
          resizeMode="contain"
        />
        
        {/* Current level indicator */}
        {isCurrent && (
          <View style={styles.currentIndicator}>
            <View style={styles.currentDot} />
          </View>
        )}
        
        {/* Completed checkmark */}
        {isCompleted && (
          <View style={styles.completedBadge}>
            <Text style={styles.completedCheck}>✓</Text>
          </View>
        )}
      </View>

      {/* Level info */}
      <View style={styles.levelInfo}>
        <Text style={[
          styles.levelNumber,
          isLocked && styles.textLocked,
        ]}>
          {level.id}
        </Text>
        <Text style={[
          styles.levelName,
          isLocked && styles.textLocked,
        ]} numberOfLines={1}>
          {level.name}
        </Text>
        <Text style={[
          styles.levelTarget,
          isLocked && styles.textLocked,
        ]}>
          {level.targetScore} pts
        </Text>
      </View>
    </TouchableOpacity>
  );
};

/**
 * Circuit trace connection between levels (PCB style)
 * Connects directly to level cards with visible traces and glowing nodes
 */
const CircuitConnection = ({ fromPosition, toPosition, isActive }) => {
  // Position mapping - aligned with card centers
  const positionMap = { left: 0.4, center: 0.5, right: 0.6 };
  const fromX = positionMap[fromPosition] || 0.5;
  const toX = positionMap[toPosition] || 0.5;
  const needsDiagonal = fromX !== toX;

  return (
    <View style={styles.connectionContainer}>
      {/* Top node - touches bottom of previous level card */}
      <View style={[
        styles.traceNodeTop,
        { left: `${fromX * 100}%` },
        !isActive && styles.traceNodeInactive,
      ]} />
      
      {/* Vertical line from top */}
      <View style={[
        styles.traceLine,
        { 
          left: `${fromX * 100}%`,
          top: 10,
          height: needsDiagonal ? 25 : 60,
        },
        !isActive && styles.traceInactive,
      ]} />
      
      {/* Horizontal segment if positions differ */}
      {needsDiagonal && (
        <>
          <View style={[
            styles.traceLineHorizontal,
            {
              left: `${Math.min(fromX, toX) * 100}%`,
              width: `${Math.abs(toX - fromX) * 100}%`,
              top: 35,
            },
            !isActive && styles.traceInactive,
          ]} />
          {/* Corner node */}
          <View style={[
            styles.traceNodeSmall,
            { left: `${fromX * 100}%`, top: 32 },
            !isActive && styles.traceNodeInactive,
          ]} />
          <View style={[
            styles.traceNodeSmall,
            { left: `${toX * 100}%`, top: 32 },
            !isActive && styles.traceNodeInactive,
          ]} />
        </>
      )}
      
      {/* Vertical line to bottom */}
      <View style={[
        styles.traceLine,
        { 
          left: `${toX * 100}%`,
          bottom: 10,
          height: needsDiagonal ? 25 : 60,
        },
        !isActive && styles.traceInactive,
      ]} />
      
      {/* Bottom node - touches top of next level card */}
      <View style={[
        styles.traceNodeBottom,
        { left: `${toX * 100}%` },
        !isActive && styles.traceNodeInactive,
      ]} />
    </View>
  );
};

/**
 * Main CareerMap component
 */
const CareerMap = ({
  currentLevelNumber,
  unlockedLevel,
  isLoading,
  onSelectLevel,
  onNewGame,
}) => {
  if (isLoading) {
    return (
      <ImageBackground
        source={require('../../assets/background-menu.png')}
        style={styles.container}
        resizeMode="cover"
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="rgba(100, 160, 180, 0.8)" />
        </View>
      </ImageBackground>
    );
  }

  // Alternate positions for visual interest
  const getPosition = (index) => {
    const positions = ['left', 'center', 'right', 'center'];
    return positions[index % positions.length];
  };

  const handleLevelPress = (level) => {
    onSelectLevel(level.id);
  };

  return (
    <ImageBackground
      source={require('../../assets/background-menu.png')}
      style={styles.container}
      resizeMode="cover"
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>EDGY</Text>
        <Text style={styles.subtitle}>CIRCUIT</Text>
      </View>

      {/* Scrollable map */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Circuit path */}
        <View style={styles.circuitPath}>
          {CAREER_LEVELS.map((level, index) => {
            const isCompleted = level.id < currentLevelNumber;
            const isCurrent = level.id === currentLevelNumber;
            const isLocked = level.id > unlockedLevel;
            const position = getPosition(index);
            const nextPosition = index < CAREER_LEVELS.length - 1 
              ? getPosition(index + 1) 
              : null;

            return (
              <View key={level.id} style={styles.levelSection}>
                {/* Level node */}
                <LevelNode
                  level={level}
                  isCompleted={isCompleted}
                  isCurrent={isCurrent}
                  isLocked={isLocked}
                  onPress={handleLevelPress}
                  position={position}
                />

                {/* Connection to next level */}
                {nextPosition && (
                  <CircuitConnection
                    fromPosition={position}
                    toPosition={nextPosition}
                    isActive={level.id < unlockedLevel}
                  />
                )}
              </View>
            );
          })}
        </View>

        {/* Bottom spacing */}
        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* New Game button at bottom */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.newGameButton}
          onPress={onNewGame}
          activeOpacity={0.7}
        >
          <Text style={styles.newGameText}>Nouvelle partie</Text>
        </TouchableOpacity>
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0c',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 42,
    fontWeight: '800',
    fontFamily: 'monospace',
    color: 'rgba(100, 160, 180, 0.9)',
    letterSpacing: 10,
    textShadowColor: 'rgba(80, 140, 160, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '300',
    fontFamily: 'monospace',
    color: 'rgba(255, 255, 255, 0.5)',
    letterSpacing: 12,
    marginTop: -2,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  circuitPath: {
    alignItems: 'center',
  },
  levelSection: {
    width: '100%',
    marginBottom: 10,
  },
  levelNode: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginVertical: 8,
    backgroundColor: 'rgba(20, 25, 30, 0.85)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(80, 120, 140, 0.3)',
  },
  levelNodeLeft: {
    marginRight: '20%',
  },
  levelNodeRight: {
    marginLeft: '20%',
  },
  levelNodeCenter: {
    marginHorizontal: '10%',
  },
  levelNodeLocked: {
    opacity: 0.85,
    borderColor: 'rgba(70, 75, 85, 0.4)',
  },
  componentContainer: {
    width: 70,
    height: 70,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 35,
    backgroundColor: 'rgba(30, 40, 50, 0.6)',
    borderWidth: 2,
    borderColor: 'rgba(80, 120, 140, 0.4)',
    position: 'relative',
  },
  componentCompleted: {
    borderColor: 'rgba(80, 180, 120, 0.6)',
    backgroundColor: 'rgba(40, 60, 50, 0.6)',
  },
  componentCurrent: {
    borderColor: 'rgba(100, 180, 220, 0.8)',
    backgroundColor: 'rgba(40, 60, 80, 0.6)',
    shadowColor: 'rgba(100, 180, 220, 0.5)',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 5,
  },
  componentLocked: {
    borderColor: 'rgba(80, 85, 95, 0.5)',
    backgroundColor: 'rgba(35, 40, 50, 0.6)',
  },
  componentImage: {
    width: 50,
    height: 50,
  },
  componentImageLocked: {
    opacity: 0.5,
  },
  currentIndicator: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(100, 180, 220, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  currentDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fff',
  },
  completedBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(80, 180, 120, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  completedCheck: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
  },
  levelInfo: {
    flex: 1,
    marginLeft: 14,
  },
  levelNumber: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(100, 160, 180, 0.8)',
    fontFamily: 'monospace',
    letterSpacing: 1,
  },
  levelName: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 2,
  },
  levelTarget: {
    fontSize: 12,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: 2,
  },
  textLocked: {
    color: 'rgba(140, 145, 160, 0.7)',
  },
  connectionContainer: {
    height: 80,
    position: 'relative',
    marginVertical: -8,
    zIndex: 1,
  },
  traceLine: {
    position: 'absolute',
    width: 4,
    backgroundColor: '#00BFFF',
    marginLeft: -2,
    borderRadius: 2,
    shadowColor: '#00BFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 4,
  },
  traceLineHorizontal: {
    position: 'absolute',
    height: 4,
    backgroundColor: '#00BFFF',
    borderRadius: 2,
    shadowColor: '#00BFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 4,
  },
  traceNodeTop: {
    position: 'absolute',
    top: -4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#00E5FF',
    marginLeft: -8,
    borderWidth: 3,
    borderColor: '#80F0FF',
    shadowColor: '#00E5FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 8,
  },
  traceNodeBottom: {
    position: 'absolute',
    bottom: -4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#00E5FF',
    marginLeft: -8,
    borderWidth: 3,
    borderColor: '#80F0FF',
    shadowColor: '#00E5FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 8,
  },
  traceNodeSmall: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#00D4FF',
    marginLeft: -5,
    borderWidth: 2,
    borderColor: '#60E0FF',
    shadowColor: '#00D4FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 6,
  },
  traceInactive: {
    backgroundColor: '#0080A0',
    shadowOpacity: 0.5,
  },
  traceNodeInactive: {
    backgroundColor: '#0090B0',
    borderColor: '#40A0C0',
    shadowOpacity: 0.5,
  },
  bottomSpacer: {
    height: 100,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingVertical: 20,
    paddingHorizontal: 40,
    paddingBottom: 40,
    backgroundColor: 'rgba(10, 10, 12, 0.95)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(60, 80, 100, 0.3)',
  },
  newGameButton: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(100, 100, 110, 0.4)',
    alignItems: 'center',
  },
  newGameText: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.6)',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
});

export default CareerMap;
