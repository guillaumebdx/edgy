/**
 * MainMenu Component
 * Entry point screen for the game
 * 
 * Features:
 * - Game title display
 * - Continue button (if saved progress exists)
 * - New Game button
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';

const MainMenu = ({ 
  onContinue, 
  onNewGame, 
  hasSavedGame, 
  isLoading,
  savedLevelNumber,
}) => {
  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="rgba(100, 160, 180, 0.8)" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Game Title */}
      <View style={styles.titleContainer}>
        <Text style={styles.title}>EDGY</Text>
        <Text style={styles.subtitle}>GRID</Text>
      </View>

      {/* Menu Buttons */}
      <View style={styles.buttonContainer}>
        {/* Continue Button - only if saved progress exists */}
        {hasSavedGame && (
          <TouchableOpacity 
            style={styles.button} 
            onPress={onContinue}
            activeOpacity={0.7}
          >
            <Text style={styles.buttonText}>Continuer</Text>
            {savedLevelNumber && (
              <Text style={styles.buttonSubtext}>Niveau {savedLevelNumber}</Text>
            )}
          </TouchableOpacity>
        )}

        {/* New Game Button */}
        <TouchableOpacity 
          style={[styles.button, hasSavedGame && styles.secondaryButton]} 
          onPress={onNewGame}
          activeOpacity={0.7}
        >
          <Text style={[styles.buttonText, hasSavedGame && styles.secondaryButtonText]}>
            Nouvelle partie
          </Text>
        </TouchableOpacity>
      </View>

      {/* Version indicator */}
      <Text style={styles.version}>v1.0</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1C1C1E',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 80,
  },
  title: {
    fontSize: 56,
    fontWeight: '800',
    fontFamily: 'monospace',
    color: 'rgba(100, 160, 180, 0.9)',
    letterSpacing: 12,
    textShadowColor: 'rgba(80, 140, 160, 0.4)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  subtitle: {
    fontSize: 32,
    fontWeight: '300',
    fontFamily: 'monospace',
    color: 'rgba(255, 255, 255, 0.6)',
    letterSpacing: 16,
    marginTop: -4,
  },
  buttonContainer: {
    width: '100%',
    maxWidth: 280,
    gap: 16,
  },
  button: {
    backgroundColor: 'rgba(80, 140, 160, 0.3)',
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(100, 160, 180, 0.5)',
    alignItems: 'center',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  secondaryButtonText: {
    color: 'rgba(255, 255, 255, 0.6)',
  },
  buttonSubtext: {
    fontSize: 11,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: 4,
  },
  version: {
    position: 'absolute',
    bottom: 40,
    fontSize: 11,
    fontFamily: 'monospace',
    color: 'rgba(255, 255, 255, 0.3)',
  },
});

export default MainMenu;
