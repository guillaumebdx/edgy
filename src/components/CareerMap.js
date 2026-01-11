/**
 * CareerMap Component
 * Circuit board styled career progression map
 * 
 * Displays levels as electronic components connected by circuit traces
 * Vertical scrolling navigation through career progression
 */

import React, { useState, useRef, useEffect } from 'react';
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
  Alert,
} from 'react-native';
import { CAREER_LEVELS } from '../careerLevels';
import SettingsMenu from './SettingsMenu';
import { loadSoundPreference, setSoundEnabled, isSoundEnabled } from '../sounds';
import { loadHighScore, resetHighScore } from '../persistence';
import { getLevelImage } from '../levelAssets';
import useTranslation from '../hooks/useTranslation';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Module-level variable to persist scroll position across component mounts
let persistedScrollPosition = 0;

/**
 * Stars display component
 */
const StarsDisplay = ({ stars, isLocked }) => {
  const maxStars = 3;
  return (
    <View style={styles.starsContainer}>
      {[...Array(maxStars)].map((_, i) => (
        <Text 
          key={i} 
          style={[
            styles.star,
            i < stars ? styles.starEarned : styles.starEmpty,
            isLocked && styles.starLocked,
          ]}
        >
          ★
        </Text>
      ))}
    </View>
  );
};

/**
 * Single level node component
 */
const LevelNode = ({ 
  level, 
  levelName,
  isCompleted, 
  isCurrent, 
  isLocked, 
  stars,
  onPress,
  position,
}) => {
  const componentImage = getLevelImage(level.id);
  
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
          {levelName}
        </Text>
        <Text style={[
          styles.levelTarget,
          isLocked && styles.textLocked,
        ]}>
          {level.targetScore} pts
        </Text>
        {/* Stars display */}
        <StarsDisplay stars={stars} isLocked={isLocked} />
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
  levelStars = {},
  isLoading,
  onSelectLevel,
  onNewGame,
  onDebugSetLevel,
  onFreeMode,
  onGiveFeedback,
}) => {
  const { t, getLevelName } = useTranslation();
  
  // Settings menu state
  const [showSettings, setShowSettings] = useState(false);
  const [soundEnabled, setSoundEnabledState] = useState(true);
  
  // Debug menu state
  const [showDebugMenu, setShowDebugMenu] = useState(false);
  
  // Free mode high score
  const [freeHighScore, setFreeHighScore] = useState(0);
  
  // Hidden debug feature - 5 taps on title
  const [tapCount, setTapCount] = useState(0);
  
  // Scroll position persistence
  const scrollViewRef = useRef(null);
  const tapTimeoutRef = useRef(null);

  // Load sound preference on mount
  useEffect(() => {
    const loadPreference = async () => {
      const enabled = await loadSoundPreference();
      setSoundEnabledState(enabled);
    };
    loadPreference();
  }, []);
  
  // Load high score only after DB is initialized (isLoading becomes false)
  useEffect(() => {
    if (!isLoading) {
      const loadScore = async () => {
        const highScore = await loadHighScore('free_mode');
        setFreeHighScore(highScore);
      };
      loadScore();
    }
  }, [isLoading]);
  
  // Restore scroll position when component mounts or becomes visible
  useEffect(() => {
    if (scrollViewRef.current && persistedScrollPosition > 0) {
      // Small delay to ensure layout is complete
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({
          y: persistedScrollPosition,
          animated: false,
        });
      }, 100);
    }
  }, []);

  const handleToggleSound = async () => {
    const newValue = !soundEnabled;
    setSoundEnabledState(newValue);
    await setSoundEnabled(newValue);
  };

  const handleResetBestScore = async () => {
    await resetHighScore('free_mode');
    setFreeHighScore(0);
  };

  const handleTitleTap = () => {
    // Clear previous timeout
    if (tapTimeoutRef.current) {
      clearTimeout(tapTimeoutRef.current);
    }

    const newCount = tapCount + 1;
    setTapCount(newCount);

    if (newCount >= 5) {
      // Reset tap count and show debug menu
      setTapCount(0);
      setShowDebugMenu(true);
    } else {
      // Reset tap count after 1 second of inactivity
      tapTimeoutRef.current = setTimeout(() => {
        setTapCount(0);
      }, 1000);
    }
  };
  
  const handleDebugSelectLevel = (levelId) => {
    setShowDebugMenu(false);
    if (onDebugSetLevel) {
      onDebugSetLevel(levelId);
    }
  };
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
  
  // Save scroll position as user scrolls
  const handleScroll = (event) => {
    persistedScrollPosition = event.nativeEvent.contentOffset.y;
  };

  return (
    <ImageBackground
      source={require('../../assets/background-menu.png')}
      style={styles.container}
      resizeMode="cover"
    >
      {/* Header - tap EDGY 5 times to reset */}
      <View style={styles.header}>
        {/* Settings button */}
        <TouchableOpacity 
          style={styles.settingsButton} 
          onPress={() => setShowSettings(true)}
        >
          <Text style={styles.settingsIcon}>⚙️</Text>
        </TouchableOpacity>
        
        <TouchableOpacity onPress={handleTitleTap} activeOpacity={0.8}>
          <Text style={styles.title}>EDGY</Text>
        </TouchableOpacity>
        <Text style={styles.subtitle}>{t('careerMap.circuit')}</Text>
      </View>

      {/* Settings Menu */}
      <SettingsMenu
        visible={showSettings}
        onClose={() => setShowSettings(false)}
        soundEnabled={soundEnabled}
        onToggleSound={handleToggleSound}
        onResetProgress={onNewGame}
        onResetBestScore={handleResetBestScore}
        onGiveFeedback={onGiveFeedback}
      />

      {/* Debug Menu Modal */}
      {showDebugMenu && (
        <View style={styles.debugOverlay}>
          <View style={styles.debugMenu}>
            <Text style={styles.debugTitle}>{t('careerMap.debugTitle')}</Text>
            <ScrollView style={styles.debugScroll}>
              {CAREER_LEVELS.map((level) => (
                <TouchableOpacity
                  key={level.id}
                  style={styles.debugLevelButton}
                  onPress={() => handleDebugSelectLevel(level.id)}
                >
                  <Text style={styles.debugLevelText}>
                    {t('common.level')} {level.id} - {t(`levels.${level.id}`)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={styles.debugCloseButton}
              onPress={() => setShowDebugMenu(false)}
            >
              <Text style={styles.debugCloseText}>{t('common.cancel')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Scrollable map */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {/* Free Mode card at top - prominent and attractive */}
        <TouchableOpacity 
          style={styles.freeModeCard} 
          onPress={onFreeMode}
          activeOpacity={0.85}
        >
          <View style={styles.freeModeGlow} />
          <View style={styles.freeModeCardContent}>
            <Text style={styles.freeModeCardTitle}>{t('careerMap.freeMode')}</Text>
            <Text style={styles.freeModeCardSubtitle}>{t('careerMap.freeModeSubtitle')}</Text>
            {freeHighScore > 0 && (
              <View style={styles.freeModeHighScoreRow}>
                <Text style={styles.freeModeHighScoreLabel}>{t('careerMap.bestScore')}</Text>
                <Text style={styles.freeModeCardHighScore}>{freeHighScore.toLocaleString()}</Text>
              </View>
            )}
          </View>
          <Text style={styles.freeModeCardArrow}>▶</Text>
        </TouchableOpacity>

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
                  levelName={getLevelName(level.id)}
                  isCompleted={isCompleted}
                  isCurrent={isCurrent}
                  isLocked={isLocked}
                  stars={levelStars[level.id] || 0}
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
  settingsButton: {
    position: 'absolute',
    top: 55,
    right: 20,
    padding: 8,
    zIndex: 10,
  },
  settingsIcon: {
    fontSize: 24,
  },
  freeModeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
    padding: 18,
    backgroundColor: 'rgba(15, 40, 55, 0.9)',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'rgba(0, 255, 255, 0.6)',
    shadowColor: '#00FFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  freeModeGlow: {
    position: 'absolute',
    top: -50,
    left: -50,
    right: -50,
    bottom: -50,
    backgroundColor: 'rgba(0, 255, 255, 0.08)',
    borderRadius: 100,
  },
  freeModeCardContent: {
    flex: 1,
    zIndex: 1,
  },
  freeModeTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  freeModeIcon: {
    fontSize: 18,
    marginHorizontal: 6,
  },
  freeModeCardTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#00FFFF',
    letterSpacing: 2,
    marginBottom: 4,
    textShadowColor: 'rgba(0, 255, 255, 0.6)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  freeModeCardSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 8,
  },
  freeModeHighScoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  freeModeHighScoreLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginRight: 6,
  },
  freeModeCardHighScore: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFD700',
    fontFamily: 'monospace',
    textShadowColor: 'rgba(255, 215, 0, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
  },
  freeModeCardArrow: {
    fontSize: 24,
    fontWeight: '700',
    color: '#00FFFF',
    marginLeft: 12,
    zIndex: 1,
    textShadowColor: 'rgba(0, 255, 255, 0.8)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
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
  starsContainer: {
    flexDirection: 'row',
    marginTop: 4,
  },
  star: {
    fontSize: 14,
    marginRight: 2,
  },
  starEarned: {
    color: '#FFD700',
    textShadowColor: 'rgba(255, 215, 0, 0.6)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 4,
  },
  starEmpty: {
    color: 'rgba(80, 90, 100, 0.4)',
    textShadowColor: 'transparent',
  },
  starLocked: {
    color: 'rgba(80, 85, 95, 0.4)',
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
    height: 40,
  },
  // Debug menu styles
  debugOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  debugMenu: {
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    padding: 20,
    width: '85%',
    maxHeight: '70%',
    borderWidth: 1,
    borderColor: 'rgba(255, 100, 100, 0.4)',
  },
  debugTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ff6666',
    textAlign: 'center',
    marginBottom: 16,
  },
  debugScroll: {
    maxHeight: 300,
  },
  debugLevelButton: {
    backgroundColor: 'rgba(255, 100, 100, 0.15)',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  debugLevelText: {
    color: '#e0e0e0',
    fontSize: 16,
  },
  debugCloseButton: {
    marginTop: 16,
    paddingVertical: 12,
    alignItems: 'center',
  },
  debugCloseText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 16,
  },
});

export default CareerMap;
