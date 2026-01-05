/**
 * StockPreview Component
 * Displays the next cells from the stock that will fall into the grid
 * Shows gridSize cells with slide animation when cells are consumed
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import { COLOR_MAP, NEUTRAL_COLOR } from '../constants';

const StockPreviewCell = ({ value, index, maxValue, cellWidth, isNew }) => {
  const displayValue = value > maxValue ? maxValue : value;
  const colorData = COLOR_MAP[displayValue] || COLOR_MAP[1];
  
  // Animation for new cells entering from right
  const translateX = useSharedValue(isNew ? 50 : 0);
  const opacity = useSharedValue(isNew ? 0 : 1);
  
  useEffect(() => {
    if (isNew) {
      translateX.value = withSpring(0, { damping: 15, stiffness: 120 });
      opacity.value = withTiming(1, { duration: 200 });
    }
  }, [isNew]);
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
    opacity: opacity.value,
  }));
  
  return (
    <Animated.View 
      style={[
        styles.cell,
        { width: cellWidth, height: cellWidth * 0.9 },
        animatedStyle,
      ]}
    >
      <View style={[styles.cellInner, { backgroundColor: colorData.base }]}>
        <View style={[styles.cellTop, { backgroundColor: colorData.top }]} />
        <Text style={styles.cellText}>{value}</Text>
        <View style={[styles.cellBottom, { backgroundColor: colorData.bottom }]} />
        <View style={styles.cellOverlay} />
      </View>
    </Animated.View>
  );
};

const StockPreview = ({ previewRow, gridSize, maxValue, gridWidth }) => {
  // previewRow is the "row -1" - next cells to fall into each column
  // Each position corresponds directly to its column
  const visibleCells = previewRow || [];
  
  // Calculate cell width to match grid cells
  const cellWidth = gridWidth ? (gridWidth / gridSize) * 0.82 : 50;
  
  // Count non-null cells
  const activeCells = visibleCells.filter(cell => cell !== null).length;
  
  // If no active cells, don't show preview
  if (activeCells === 0) {
    return null;
  }
  
  return (
    <View style={styles.container}>
      {/* Glass box wrapper */}
      <View style={[styles.glassBox, { width: gridWidth || '100%' }]}>
        {/* Cells row */}
        <View style={styles.cellsRow}>
          {visibleCells.map((value, index) => (
            value !== null && value !== undefined ? (
              <StockPreviewCell
                key={`stock-${index}-${value}`}
                value={value}
                index={index}
                maxValue={maxValue}
                cellWidth={cellWidth}
                isNew={false}
              />
            ) : (
              <View 
                key={`empty-${index}`} 
                style={[styles.cell, styles.emptyCell, { width: cellWidth, height: cellWidth * 0.9 }]} 
              />
            )
          ))}
        </View>
        {/* Glass reflection overlay */}
        <View style={styles.glassReflection} pointerEvents="none" />
      </View>
      
      {/* Laser arrow image */}
      <Image 
        source={require('../../assets/laser-arrow-2.png')} 
        style={styles.laserArrow}
        resizeMode="contain"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 5,
  },
  glassBox: {
    backgroundColor: 'rgba(15, 25, 35, 0.85)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(80, 120, 140, 0.25)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
    paddingVertical: 8,
    position: 'relative',
    overflow: 'hidden',
  },
  cellsRow: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
  },
  glassReflection: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '40%',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  laserArrow: {
    width: '110%',
    height: 35,
    marginTop: -3,
    alignSelf: 'center',
  },
  cell: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  cellInner: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    position: 'relative',
  },
  cellOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(10, 20, 30, 0.65)',
    borderRadius: 8,
    zIndex: 10,
  },
  cellTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '30%',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    opacity: 0.6,
  },
  cellBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '30%',
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    opacity: 0.6,
  },
  cellText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
    zIndex: 1,
  },
  emptyCell: {
    backgroundColor: 'rgba(40, 50, 60, 0.3)',
    borderWidth: 1,
    borderColor: 'rgba(100, 120, 140, 0.2)',
    borderStyle: 'dashed',
  },
});

export default StockPreview;
