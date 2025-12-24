/**
 * LevelInfo Component
 * Displays current level information in career mode
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const LevelInfo = ({ levelNumber, levelName, targetScore, maxValue, stock, totalLevels }) => {
  return (
    <View style={styles.container}>
      <View style={styles.levelBadge}>
        <Text style={styles.levelNumber}>{levelNumber}</Text>
        <Text style={styles.levelTotal}>/{totalLevels}</Text>
      </View>
      <View style={styles.infoContainer}>
        <Text style={styles.levelName}>{levelName}</Text>
        <View style={styles.statsRow}>
          <Text style={styles.statText}>Objectif: {targetScore.toLocaleString()}</Text>
          <Text style={styles.statSeparator}>•</Text>
          <Text style={styles.statText}>MAX: {maxValue}</Text>
          <Text style={styles.statSeparator}>•</Text>
          <Text style={styles.statText}>Stock: {stock}</Text>
        </View>
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
    fontSize: 10,
    fontFamily: 'monospace',
    color: 'rgba(255, 255, 255, 0.5)',
  },
  statSeparator: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: 6,
  },
});

export default LevelInfo;
