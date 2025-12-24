import { StatusBar } from 'expo-status-bar';
import { useState, useRef, useCallback, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { GestureHandlerRootView, GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  withSpring,
  withSequence,
  withDelay,
  runOnJS,
  Easing
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

const GRID_SIZE = 6;
const MAX_VALUE = 5;

const COLOR_MAP = {
  1: '#E63946',
  2: '#F77F00',
  3: '#06D6A0',
  4: '#118AB2',
  5: '#9D4EDD',
};

const generateGrid = () => {
  const grid = [];
  for (let i = 0; i < GRID_SIZE * GRID_SIZE; i++) {
    grid.push(Math.floor(Math.random() * 5) + 1);
  }
  return grid;
};

const getCellPosition = (index) => {
  const row = Math.floor(index / GRID_SIZE);
  const col = index % GRID_SIZE;
  return { row, col };
};

const areAdjacent = (index1, index2) => {
  const pos1 = getCellPosition(index1);
  const pos2 = getCellPosition(index2);
  
  const rowDiff = Math.abs(pos1.row - pos2.row);
  const colDiff = Math.abs(pos1.col - pos2.col);
  
  return rowDiff <= 1 && colDiff <= 1 && (rowDiff + colDiff > 0);
};

const getConnectionStyle = (fromIndex, toIndex, cellWidth, cellHeight) => {
  const from = getCellPosition(fromIndex);
  const to = getCellPosition(toIndex);
  
  const fromX = (from.col + 0.5) * cellWidth;
  const fromY = (from.row + 0.5) * cellHeight;
  const toX = (to.col + 0.5) * cellWidth;
  const toY = (to.row + 0.5) * cellHeight;
  
  const deltaX = toX - fromX;
  const deltaY = toY - fromY;
  const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
  const angle = Math.atan2(deltaY, deltaX);
  
  return {
    position: 'absolute',
    left: fromX,
    top: fromY,
    width: distance,
    height: 4,
    backgroundColor: '#ffffff',
    transform: [{ rotate: `${angle}rad` }],
    transformOrigin: 'left center',
    opacity: 0.8,
  };
};

const AnimatedCell = ({ value, index, isInPath, pathIndex, isExceeded, isShaking, isFalling, fallDistance, columnDelay, cellHeight }) => {
  const displayValue = value > MAX_VALUE ? MAX_VALUE : value;
  
  const shakeAnim = useSharedValue(0);
  const scaleAnim = useSharedValue(1);
  const opacityAnim = useSharedValue(1);
  const translateY = useSharedValue(0);
  
  useEffect(() => {
    if (isShaking) {
      shakeAnim.value = withSequence(
        withTiming(-3, { duration: 50 }),
        withTiming(3, { duration: 50 }),
        withTiming(-3, { duration: 50 }),
        withTiming(3, { duration: 50 }),
        withTiming(-2, { duration: 40 }),
        withTiming(2, { duration: 40 }),
        withTiming(0, { duration: 30 })
      );
      scaleAnim.value = withSequence(
        withDelay(260, withTiming(0, { duration: 150, easing: Easing.in(Easing.ease) }))
      );
      opacityAnim.value = withSequence(
        withDelay(260, withTiming(0, { duration: 150 }))
      );
    } else {
      shakeAnim.value = 0;
      scaleAnim.value = 1;
      opacityAnim.value = 1;
    }
  }, [isShaking]);
  
  useEffect(() => {
    if (isFalling && fallDistance > 0) {
      translateY.value = -fallDistance * cellHeight;
      translateY.value = withDelay(
        columnDelay,
        withSpring(0, {
          damping: 12,
          stiffness: 200,
          mass: 0.8,
        })
      );
    }
  }, [isFalling, fallDistance, cellHeight, columnDelay]);
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: shakeAnim.value },
      { translateY: translateY.value },
      { scale: scaleAnim.value }
    ],
    opacity: opacityAnim.value,
  }));
  
  return (
    <Animated.View
      style={[
        styles.cell,
        isInPath && styles.cellInPath,
        isExceeded && !isInPath && styles.cellExceeded,
        !isInPath && !isExceeded && { backgroundColor: COLOR_MAP[displayValue] },
        isExceeded && !isInPath && { backgroundColor: COLOR_MAP[displayValue] },
        animatedStyle
      ]}
    >
      <Text style={[styles.cellText, isExceeded && styles.cellTextExceeded]}>
        {value > MAX_VALUE ? `${value}` : value}
      </Text>
      {isInPath && pathIndex >= 0 && (
        <View style={styles.pathIndicator}>
          <Text style={styles.pathNumber}>{pathIndex + 1}</Text>
        </View>
      )}
    </Animated.View>
  );
};

const FloatingText = ({ text, visible, style }) => {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(0.5);
  
  useEffect(() => {
    if (visible) {
      opacity.value = 1;
      translateY.value = 0;
      scale.value = 0.5;
      
      opacity.value = withSequence(
        withTiming(1, { duration: 100 }),
        withDelay(600, withTiming(0, { duration: 300 }))
      );
      translateY.value = withTiming(-30, { duration: 1000, easing: Easing.out(Easing.ease) });
      scale.value = withSpring(1, { damping: 8, stiffness: 200 });
    }
  }, [visible, text]);
  
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateY: translateY.value },
      { scale: scale.value }
    ],
  }));
  
  if (!visible) return null;
  
  return (
    <Animated.View style={[styles.floatingText, style, animatedStyle]}>
      <Text style={styles.floatingTextContent}>{text}</Text>
    </Animated.View>
  );
};

export default function App() {
  const [gridData, setGridData] = useState(() => generateGrid());
  const [exceededCells, setExceededCells] = useState([]);
  const [shakingCells, setShakingCells] = useState([]);
  const [fallingCells, setFallingCells] = useState({});
  const [path, setPath] = useState([]);
  const [gridLayout, setGridLayout] = useState({ width: 0, height: 0, cellWidth: 0, cellHeight: 0, padding: 0 });
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [floatingScore, setFloatingScore] = useState({ visible: false, text: '', key: 0 });
  const pathRef = useRef([]);
  const pathValueRef = useRef(null);
  const isResolvingRef = useRef(false);

  const handleGridLayout = useCallback((event) => {
    const { width, height } = event.nativeEvent.layout;
    const padding = 8;
    const contentWidth = width - (padding * 2);
    const contentHeight = height - (padding * 2);
    const cellWidth = contentWidth / GRID_SIZE;
    const cellHeight = contentHeight / GRID_SIZE;
    setGridLayout({ 
      width: contentWidth, 
      height: contentHeight, 
      cellWidth,
      cellHeight,
      padding 
    });
  }, []);

  const getCellFromPosition = useCallback((x, y) => {
    const { cellWidth, cellHeight, padding, width, height } = gridLayout;
    if (cellWidth === 0 || cellHeight === 0) return null;
    
    const relativeX = x - padding;
    const relativeY = y - padding;
    
    if (relativeX < 0 || relativeY < 0) return null;
    if (relativeX >= width || relativeY >= height) return null;
    
    const col = Math.floor(relativeX / cellWidth);
    const row = Math.floor(relativeY / cellHeight);
    
    if (col < 0 || col >= GRID_SIZE || row < 0 || row >= GRID_SIZE) return null;
    
    return row * GRID_SIZE + col;
  }, [gridLayout]);

  const addCellToPath = useCallback((cellIndex, currentGridData) => {
    if (cellIndex === null) return;
    if (pathRef.current.includes(cellIndex)) return;
    
    if (pathRef.current.length > 0) {
      const lastCell = pathRef.current[pathRef.current.length - 1];
      if (!areAdjacent(lastCell, cellIndex)) {
        return;
      }
    }
    
    if (currentGridData[cellIndex] !== pathValueRef.current) {
      return;
    }
    
    pathRef.current = [...pathRef.current, cellIndex];
    setPath([...pathRef.current]);
  }, []);

  const applyGravityAndFill = useCallback((grid) => {
    const newGrid = [...grid];
    
    for (let col = 0; col < GRID_SIZE; col++) {
      const column = [];
      for (let row = 0; row < GRID_SIZE; row++) {
        const index = row * GRID_SIZE + col;
        if (newGrid[index] !== null) {
          column.push(newGrid[index]);
        }
      }
      
      const emptyCount = GRID_SIZE - column.length;
      for (let i = 0; i < emptyCount; i++) {
        column.unshift(Math.floor(Math.random() * MAX_VALUE) + 1);
      }
      
      for (let row = 0; row < GRID_SIZE; row++) {
        const index = row * GRID_SIZE + col;
        newGrid[index] = column[row];
      }
    }
    
    return newGrid;
  }, []);

  const resolveExceededCells = useCallback((grid) => {
    const newGrid = [...grid];
    let hasExceeded = false;
    
    for (let i = 0; i < newGrid.length; i++) {
      if (newGrid[i] > MAX_VALUE) {
        newGrid[i] = null;
        hasExceeded = true;
      }
    }
    
    if (hasExceeded) {
      return applyGravityAndFill(newGrid);
    }
    
    return newGrid;
  }, [applyGravityAndFill]);

  const triggerHaptic = useCallback((type) => {
    if (type === 'validation') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } else if (type === 'explosion') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, []);

  const calculateFallDistances = useCallback((oldGrid, newGrid) => {
    const fallDistances = {};
    
    for (let col = 0; col < GRID_SIZE; col++) {
      let emptyCount = 0;
      for (let row = GRID_SIZE - 1; row >= 0; row--) {
        const index = row * GRID_SIZE + col;
        if (oldGrid[index] === null) {
          emptyCount++;
        } else if (emptyCount > 0) {
          const newIndex = (row + emptyCount) * GRID_SIZE + col;
          fallDistances[newIndex] = emptyCount;
        }
      }
      for (let i = 0; i < emptyCount; i++) {
        const index = i * GRID_SIZE + col;
        fallDistances[index] = GRID_SIZE - i;
      }
    }
    
    return fallDistances;
  }, []);

  const validateAndTransformPath = useCallback(() => {
    if (isResolvingRef.current) return;
    
    const currentPath = pathRef.current;
    const pathLength = currentPath.length;
    const pathValue = pathValueRef.current;
    
    pathRef.current = [];
    pathValueRef.current = null;
    setPath([]);
    
    if (pathLength > pathValue) {
      isResolvingRef.current = true;
      triggerHaptic('validation');
      
      const basePoints = pathLength * pathLength * currentPath.length;
      
      setGridData(prevGrid => {
        const newGrid = [...prevGrid];
        currentPath.forEach(cellIndex => {
          newGrid[cellIndex] = pathLength;
        });
        return newGrid;
      });
      
      if (pathLength > MAX_VALUE) {
        setExceededCells(currentPath);
        setShakingCells(currentPath);
        
        setTimeout(() => {
          triggerHaptic('explosion');
          
          const newCombo = combo + 1;
          const comboMultiplier = newCombo;
          const points = basePoints * comboMultiplier;
          
          setCombo(newCombo);
          setScore(prev => prev + points);
          setFloatingScore({ 
            visible: true, 
            text: newCombo > 1 ? `+${points} x${newCombo}` : `+${points}`,
            key: Date.now()
          });
          
          setTimeout(() => setFloatingScore(prev => ({ ...prev, visible: false })), 1000);
          
          setGridData(prevGrid => {
            const gridWithNulls = [...prevGrid];
            currentPath.forEach(cellIndex => {
              if (gridWithNulls[cellIndex] > MAX_VALUE) {
                gridWithNulls[cellIndex] = null;
              }
            });
            
            const newGrid = applyGravityAndFill(gridWithNulls);
            const fallDistances = calculateFallDistances(gridWithNulls, newGrid);
            
            setTimeout(() => {
              setFallingCells(fallDistances);
              setTimeout(() => {
                setFallingCells({});
                isResolvingRef.current = false;
              }, 400);
            }, 50);
            
            return newGrid;
          });
          
          setShakingCells([]);
          setExceededCells([]);
        }, 400);
      } else {
        setCombo(0);
        setScore(prev => prev + basePoints);
        setFloatingScore({ 
          visible: true, 
          text: `+${basePoints}`,
          key: Date.now()
        });
        setTimeout(() => setFloatingScore(prev => ({ ...prev, visible: false })), 1000);
        isResolvingRef.current = false;
      }
    }
  }, [applyGravityAndFill, calculateFallDistances, triggerHaptic, combo]);

  const handleGestureBegin = useCallback((x, y) => {
    const cellIndex = getCellFromPosition(x, y);
    if (cellIndex !== null) {
      pathValueRef.current = gridData[cellIndex];
      pathRef.current = [cellIndex];
      setPath([cellIndex]);
    }
  }, [getCellFromPosition, gridData]);

  const handleGestureUpdate = useCallback((x, y) => {
    const cellIndex = getCellFromPosition(x, y);
    addCellToPath(cellIndex, gridData);
  }, [getCellFromPosition, addCellToPath, gridData]);

  const handleGestureEnd = useCallback(() => {
    validateAndTransformPath();
  }, [validateAndTransformPath]);

  const panGesture = Gesture.Pan()
    .onBegin((e) => {
      'worklet';
      runOnJS(handleGestureBegin)(e.x, e.y);
    })
    .onUpdate((e) => {
      'worklet';
      runOnJS(handleGestureUpdate)(e.x, e.y);
    })
    .onEnd(() => {
      'worklet';
      runOnJS(handleGestureEnd)();
    })
    .minDistance(0);

  return (
    <GestureHandlerRootView style={styles.container}>
      <StatusBar style="light" />
      
      <View style={styles.scoreContainer}>
        <Text style={styles.scoreText}>{score.toLocaleString()}</Text>
        {combo > 1 && (
          <Text style={styles.comboText}>x{combo}</Text>
        )}
      </View>
      
      <View style={styles.gridContainer}>
        <FloatingText 
          text={floatingScore.text} 
          visible={floatingScore.visible} 
          key={floatingScore.key}
        />
        <GestureDetector gesture={panGesture}>
          <View 
            style={styles.grid} 
            onLayout={handleGridLayout}
          >
            {gridData.map((value, index) => {
              const isInPath = path.includes(index);
              const pathIndex = path.indexOf(index);
              const isExceeded = exceededCells.includes(index);
              const isShaking = shakingCells.includes(index);
              const fallDistance = fallingCells[index] || 0;
              const col = index % GRID_SIZE;
              
              return (
                <AnimatedCell
                  key={index}
                  value={value}
                  index={index}
                  isInPath={isInPath}
                  pathIndex={pathIndex}
                  isExceeded={isExceeded}
                  isShaking={isShaking}
                  isFalling={fallDistance > 0}
                  fallDistance={fallDistance}
                  columnDelay={col * 30}
                  cellHeight={gridLayout.cellHeight}
                />
              );
            })}
            {gridLayout.cellWidth > 0 && path.length > 1 && (
              <View style={styles.connectionsContainer}>
                {path.slice(0, -1).map((fromIndex, i) => (
                  <View
                    key={`connection-${i}`}
                    style={getConnectionStyle(fromIndex, path[i + 1], gridLayout.cellWidth, gridLayout.cellHeight)}
                  />
                ))}
              </View>
            )}
          </View>
        </GestureDetector>
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 12,
  },
  scoreText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#ffffff',
  },
  comboText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFD700',
  },
  floatingText: {
    position: 'absolute',
    top: -40,
    alignSelf: 'center',
    zIndex: 100,
  },
  floatingTextContent: {
    fontSize: 24,
    fontWeight: '700',
    color: '#00FF00',
    textShadowColor: '#000000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  gridContainer: {
    width: '85%',
    alignItems: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: '100%',
    aspectRatio: 1,
    padding: 8,
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    position: 'relative',
  },
  connectionsContainer: {
    position: 'absolute',
    top: 8,
    left: 8,
    right: 8,
    bottom: 8,
    pointerEvents: 'none',
  },
  cell: {
    width: `${100 / GRID_SIZE}%`,
    height: `${100 / GRID_SIZE}%`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#ffffff',
  },
  cellInPath: {
    borderWidth: 5,
    borderColor: '#FFFF00',
    backgroundColor: 'rgba(255, 255, 0, 0.5)',
    shadowColor: '#FFFF00',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 15,
    elevation: 15,
  },
  cellExceeded: {
    borderWidth: 3,
    borderColor: '#FF0000',
    shadowColor: '#FF0000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 20,
    elevation: 20,
  },
  cellTextExceeded: {
    color: '#FF4444',
    textShadowColor: '#FF0000',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  pathIndicator: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pathNumber: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
});
