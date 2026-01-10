/**
 * GameOverScreen Component
 * Overlay displayed when the game ends (no valid moves remaining)
 * Shows level completion status in career mode
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { formatScore } from '../scoreManager';
import useTranslation from '../hooks/useTranslation';

const GameOverScreen = ({ 
  score, 
  onRestart, 
  levelResult = null,
  onNextLevel = null,
  onVictoryOverride = null, // Called when we detect score >= target but levelResult said failure
}) => {
  const { t } = useTranslation();
  
  // BULLETPROOF FIX: If score >= target, it's ALWAYS a victory, regardless of what levelResult says
  // This is the final safety net against any race condition bugs
  const targetScore = levelResult?.targetScore;
  const scoreReachedTarget = targetScore && score >= targetScore;
  
  // Force victory if score >= target, even if levelResult.success is false (race condition bug)
  const isLevelComplete = scoreReachedTarget || levelResult?.success;
  const isCareerComplete = levelResult?.careerCompleted;
  
  // Track if we've already called the override to prevent multiple calls
  const hasCalledOverride = useRef(false);
  
  // Determine the message to show
  let displayMessage = levelResult?.message;
  const isRaceConditionDetected = scoreReachedTarget && !levelResult?.success;
  if (isRaceConditionDetected) {
    displayMessage = t('gameOver.levelComplete');
  }
  
  // Call victory override once when race condition is detected
  useEffect(() => {
    if (isRaceConditionDetected && onVictoryOverride && !hasCalledOverride.current) {
      hasCalledOverride.current = true;
      onVictoryOverride(score);
    }
  }, [isRaceConditionDetected, onVictoryOverride, score]);
  
  return (
    <View style={styles.overlay}>
      <View style={styles.container}>
        {/* Level result message */}
        {levelResult && (
          <Text style={[
            styles.resultMessage,
            isLevelComplete ? styles.successMessage : styles.failMessage
          ]}>
            {displayMessage}
          </Text>
        )}
        
        <Text style={styles.title}>
          {isCareerComplete ? t('gameOver.careerComplete') : t('gameOver.gameOver')}
        </Text>
        <Text style={styles.score}>{formatScore(score)}</Text>
        <Text style={styles.label}>{t('common.points')}</Text>
        
        {/* Target score reminder if failed */}
        {levelResult && !isLevelComplete && (
          <Text style={styles.targetReminder}>
            {t('gameOver.objective')} {levelResult.targetScore?.toLocaleString() || '—'}
          </Text>
        )}
        
        {/* Action buttons */}
        <View style={styles.buttonContainer}>
          {isLevelComplete && !isCareerComplete && onNextLevel && (
            <TouchableOpacity style={styles.button} onPress={onNextLevel}>
              <Text style={styles.buttonText}>{t('gameOver.nextLevel')}</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity 
            style={[styles.button, isLevelComplete && !isCareerComplete && styles.secondaryButton]} 
            onPress={onRestart}
          >
            <Text style={[styles.buttonText, isLevelComplete && !isCareerComplete && styles.secondaryButtonText]}>
              {isLevelComplete ? t('gameOver.replay') : t('gameOver.retry')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(28, 28, 30, 0.95)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    alignItems: 'center',
    padding: 40,
  },
  resultMessage: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 4,
  },
  successMessage: {
    color: '#70D0B0',
    backgroundColor: 'rgba(112, 208, 176, 0.15)',
  },
  failMessage: {
    color: '#E08080',
    backgroundColor: 'rgba(224, 128, 128, 0.15)',
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 20,
  },
  score: {
    fontSize: 48,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  label: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.4)',
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  targetReminder: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
    marginBottom: 24,
  },
  buttonContainer: {
    marginTop: 16,
    gap: 12,
  },
  button: {
    backgroundColor: '#5AB88F',
    paddingHorizontal: 40,
    paddingVertical: 14,
    borderRadius: 25,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 1,
    textAlign: 'center',
  },
  secondaryButtonText: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
});

export default GameOverScreen;
