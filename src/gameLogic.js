/**
 * Game Logic Module
 * Handles grid management, move validation, gravity, and game state checks
 */

import { GRID_SIZE, MAX_VALUE } from './constants';

/**
 * Generates a new random grid and initial preview row
 * @param {number} gridSize - Size of the grid (default from constants)
 * @param {number} maxValue - Maximum cell value (default from constants)
 * @param {number} stockCount - Number of stock cells remaining (just a counter)
 * @returns {{grid: number[], previewRow: number[], stockCount: number}} Grid, preview row, and stock counter
 */
export const generateGrid = (gridSize = GRID_SIZE, maxValue = MAX_VALUE, stockCount = 0) => {
  const grid = [];
  for (let i = 0; i < gridSize * gridSize; i++) {
    grid.push(Math.floor(Math.random() * maxValue) + 1);
  }
  
  // Preview row is like "row -1" - the next cells that will fall into each column
  // Generate initial preview row (costs gridSize from stock)
  const previewRow = [];
  let remainingStock = stockCount;
  for (let col = 0; col < gridSize; col++) {
    if (remainingStock > 0) {
      previewRow.push(Math.floor(Math.random() * maxValue) + 1);
      remainingStock--;
    } else {
      previewRow.push(null);
    }
  }
  
  return { grid, previewRow, stockCount: remainingStock };
};

/**
 * Converts a cell index to row/column position
 * @param {number} index - Cell index (0 to gridSize*gridSize-1)
 * @param {number} gridSize - Size of the grid (default from constants)
 * @returns {{row: number, col: number}} Position object
 */
export const getCellPosition = (index, gridSize = GRID_SIZE) => {
  const row = Math.floor(index / gridSize);
  const col = index % gridSize;
  return { row, col };
};

/**
 * Checks if two cells are adjacent (including diagonals)
 * @param {number} index1 - First cell index
 * @param {number} index2 - Second cell index
 * @param {number} gridSize - Size of the grid (default from constants)
 * @returns {boolean} True if cells are adjacent
 */
export const areAdjacent = (index1, index2, gridSize = GRID_SIZE) => {
  const pos1 = getCellPosition(index1, gridSize);
  const pos2 = getCellPosition(index2, gridSize);
  
  const rowDiff = Math.abs(pos1.row - pos2.row);
  const colDiff = Math.abs(pos1.col - pos2.col);
  
  return rowDiff <= 1 && colDiff <= 1 && (rowDiff + colDiff > 0);
};

/**
 * Validates if a path meets the game rules
 * A valid path must have length > cell value
 * @param {number[]} path - Array of cell indices
 * @param {number} pathValue - Value of cells in the path
 * @returns {boolean} True if path is valid
 */
export const isValidPath = (path, pathValue) => {
  return path.length > pathValue;
};

/**
 * Applies gravity to the grid and fills empty spaces using preview row
 * Preview row acts as "row -1" - cells fall from there, then preview regenerates
 * @param {(number|null)[]} grid - Current grid state
 * @param {number[]} previewRow - Current preview row (one cell per column)
 * @param {number} stockCount - Remaining stock counter
 * @param {number} maxValue - Maximum cell value (default from constants)
 * @param {number} gridSize - Size of the grid (default from constants)
 * @returns {{grid: (number|null)[], newPreviewRow: number[], newStockCount: number}} New grid, preview row, and stock count
 */
export const applyGravityAndFill = (grid, previewRow, stockCount, maxValue = MAX_VALUE, gridSize = GRID_SIZE) => {
  const newGrid = [...grid];
  const newPreviewRow = [...previewRow];
  let newStockCount = stockCount;
  
  // Process each column
  for (let col = 0; col < gridSize; col++) {
    // Collect non-null cells in column (from top to bottom)
    const column = [];
    for (let row = 0; row < gridSize; row++) {
      const index = row * gridSize + col;
      if (newGrid[index] !== null) {
        column.push(newGrid[index]);
      }
    }
    
    // Calculate how many new cells we need
    const emptyCount = gridSize - column.length;
    
    // Fill from preview row and regenerate
    for (let i = 0; i < emptyCount; i++) {
      // Take cell from preview row if available
      if (newPreviewRow[col] !== null) {
        column.unshift(newPreviewRow[col]);
        
        // Regenerate preview cell if stock available
        if (newStockCount > 0) {
          newPreviewRow[col] = Math.floor(Math.random() * maxValue) + 1;
          newStockCount--;
        } else {
          newPreviewRow[col] = null;
        }
      } else {
        // No preview cell, fill with null
        column.unshift(null);
      }
    }
    
    // Write column back to grid
    for (let row = 0; row < gridSize; row++) {
      const index = row * gridSize + col;
      newGrid[index] = column[row];
    }
  }
  
  return { grid: newGrid, newPreviewRow, newStockCount };
};

/**
 * Calculates fall distances for animation after gravity
 * @param {(number|null)[]} oldGrid - Grid before gravity
 * @param {(number|null)[]} newGrid - Grid after gravity
 * @param {number} gridSize - Size of the grid (default from constants)
 * @returns {Object.<number, number>} Map of cell index to fall distance
 */
export const calculateFallDistances = (oldGrid, newGrid, gridSize = GRID_SIZE) => {
  const fallDistances = {};
  
  for (let col = 0; col < gridSize; col++) {
    let emptyCount = 0;
    // Count empty cells from bottom up
    for (let row = gridSize - 1; row >= 0; row--) {
      const index = row * gridSize + col;
      if (oldGrid[index] === null) {
        emptyCount++;
      } else if (emptyCount > 0) {
        const newIndex = (row + emptyCount) * gridSize + col;
        fallDistances[newIndex] = emptyCount;
      }
    }
    // New cells falling from top
    for (let i = 0; i < emptyCount; i++) {
      const index = i * gridSize + col;
      fallDistances[index] = gridSize - i;
    }
  }
  
  return fallDistances;
};

/**
 * Checks if any valid move exists on the grid
 * Uses BFS to find paths where length > cell value
 * @param {(number|null)[]} grid - Current grid state
 * @param {number} gridSize - Size of the grid (default from constants)
 * @returns {boolean} True if at least one valid move exists
 */
export const hasValidMove = (grid, gridSize = GRID_SIZE) => {
  for (let startIndex = 0; startIndex < grid.length; startIndex++) {
    const startValue = grid[startIndex];
    if (startValue === null) continue;
    
    const visited = new Set();
    const queue = [{ index: startIndex, pathLength: 1 }];
    visited.add(startIndex);
    
    while (queue.length > 0) {
      const { index, pathLength } = queue.shift();
      
      // Found a valid path
      if (pathLength > startValue) {
        return true;
      }
      
      // Explore neighbors
      const pos = getCellPosition(index, gridSize);
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          const newRow = pos.row + dr;
          const newCol = pos.col + dc;
          if (newRow < 0 || newRow >= gridSize || newCol < 0 || newCol >= gridSize) continue;
          
          const neighborIndex = newRow * gridSize + newCol;
          if (visited.has(neighborIndex)) continue;
          if (grid[neighborIndex] !== startValue) continue;
          
          visited.add(neighborIndex);
          queue.push({ index: neighborIndex, pathLength: pathLength + 1 });
        }
      }
    }
  }
  return false;
};

/**
 * Transforms path cells to their new value after validation
 * @param {(number|null)[]} grid - Current grid
 * @param {number[]} path - Validated path indices
 * @param {number} newValue - New value for all cells in path
 * @returns {(number|null)[]} Updated grid
 */
export const transformPathCells = (grid, path, newValue) => {
  const newGrid = [...grid];
  path.forEach(cellIndex => {
    newGrid[cellIndex] = newValue;
  });
  return newGrid;
};

/**
 * Removes exceeded cells (value > MAX_VALUE) from grid
 * @param {(number|null)[]} grid - Current grid
 * @returns {{grid: (number|null)[], hadExceeded: boolean}} Grid with nulls and flag
 */
export const removeExceededCells = (grid) => {
  const newGrid = [...grid];
  let hadExceeded = false;
  
  for (let i = 0; i < newGrid.length; i++) {
    if (newGrid[i] !== null && newGrid[i] > MAX_VALUE) {
      newGrid[i] = null;
      hadExceeded = true;
    }
  }
  
  return { grid: newGrid, hadExceeded };
};

/**
 * Check if any column is entirely filled with identical values (any value)
 * Used for free mode challenge detection
 * @param {number[]} grid - Current grid
 * @param {number} gridSize - Size of the grid
 * @returns {{col: number, value: number}|null} Column index and value if found, null otherwise
 */
export const checkColumnOfIdenticalValues = (grid, gridSize = GRID_SIZE) => {
  for (let col = 0; col < gridSize; col++) {
    const firstValue = grid[col];
    if (firstValue === null) continue;
    
    let isFullColumn = true;
    for (let row = 1; row < gridSize; row++) {
      const index = row * gridSize + col;
      if (grid[index] !== firstValue) {
        isFullColumn = false;
        break;
      }
    }
    if (isFullColumn) {
      return { col, value: firstValue };
    }
  }
  return null;
};

/**
 * Check if any row is entirely filled with identical values (any value)
 * Used for free mode challenge detection
 * @param {number[]} grid - Current grid
 * @param {number} gridSize - Size of the grid
 * @returns {{row: number, value: number}|null} Row index and value if found, null otherwise
 */
export const checkRowOfIdenticalValues = (grid, gridSize = GRID_SIZE) => {
  for (let row = 0; row < gridSize; row++) {
    const firstIndex = row * gridSize;
    const firstValue = grid[firstIndex];
    if (firstValue === null) continue;
    
    let isFullRow = true;
    for (let col = 1; col < gridSize; col++) {
      const index = row * gridSize + col;
      if (grid[index] !== firstValue) {
        isFullRow = false;
        break;
      }
    }
    if (isFullRow) {
      return { row, value: firstValue };
    }
  }
  return null;
};

/**
 * Check if any column is entirely filled with a specific value
 * Used for challenge detection (e.g., column of 5s)
 * @param {number[]} grid - Current grid
 * @param {number} targetValue - Value to check for
 * @param {number} gridSize - Size of the grid
 * @returns {number|null} Column index if found, null otherwise
 */
export const checkColumnOfValue = (grid, targetValue, gridSize = GRID_SIZE) => {
  for (let col = 0; col < gridSize; col++) {
    let isFullColumn = true;
    for (let row = 0; row < gridSize; row++) {
      const index = row * gridSize + col;
      if (grid[index] !== targetValue) {
        isFullColumn = false;
        break;
      }
    }
    if (isFullColumn) {
      return col; // Return the column index that matches
    }
  }
  return null; // No column found
};

/**
 * Check if any row is entirely filled with a specific value
 * Used for challenge detection (e.g., row of 5s)
 * @param {number[]} grid - Current grid
 * @param {number} targetValue - Value to check for
 * @param {number} gridSize - Size of the grid
 * @returns {number|null} Row index if found, null otherwise
 */
export const checkRowOfValue = (grid, targetValue, gridSize = GRID_SIZE) => {
  for (let row = 0; row < gridSize; row++) {
    let isFullRow = true;
    for (let col = 0; col < gridSize; col++) {
      const index = row * gridSize + col;
      if (grid[index] !== targetValue) {
        isFullRow = false;
        break;
      }
    }
    if (isFullRow) {
      return row; // Return the row index that matches
    }
  }
  return null; // No row found
};

/**
 * Check if any valid moves exist on the grid
 * A valid move requires at least (value + 1) adjacent cells of the same value
 * @param {(number|null)[]} grid - Current grid
 * @param {number} gridSize - Size of the grid
 * @returns {boolean} True if at least one valid move exists
 */
export const hasValidMoves = (grid, gridSize = GRID_SIZE) => {
  // For each cell, check if we can form a valid path starting from it
  for (let startIndex = 0; startIndex < grid.length; startIndex++) {
    const value = grid[startIndex];
    if (value === null) continue;
    
    // We need at least (value + 1) cells to form a valid path
    const requiredLength = value + 1;
    
    // BFS to find connected cells of same value
    const visited = new Set();
    const queue = [startIndex];
    visited.add(startIndex);
    
    while (queue.length > 0 && visited.size < requiredLength) {
      const current = queue.shift();
      const currentPos = { 
        row: Math.floor(current / gridSize), 
        col: current % gridSize 
      };
      
      // Check all 8 adjacent cells
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          
          const newRow = currentPos.row + dr;
          const newCol = currentPos.col + dc;
          
          if (newRow < 0 || newRow >= gridSize || newCol < 0 || newCol >= gridSize) continue;
          
          const neighborIndex = newRow * gridSize + newCol;
          
          if (!visited.has(neighborIndex) && grid[neighborIndex] === value) {
            visited.add(neighborIndex);
            queue.push(neighborIndex);
          }
        }
      }
    }
    
    // If we found enough connected cells, a valid move exists
    if (visited.size >= requiredLength) {
      return true;
    }
  }
  
  return false;
};

/**
 * Converts screen coordinates to cell index
 * @param {number} x - X coordinate
 * @param {number} y - Y coordinate
 * @param {{cellWidth: number, cellHeight: number, padding: number, width: number, height: number, gridSize: number}} layout - Grid layout info
 * @param {number} gridSize - Size of the grid (default from constants)
 * @returns {number|null} Cell index or null if outside grid
 */
export const getCellFromPosition = (x, y, layout, gridSize = GRID_SIZE) => {
  const { padding = 0, width, height } = layout;
  
  // CRITICAL: Always use the passed gridSize parameter - it comes from gridSizeRef.current
  // which is always up-to-date. Don't rely on layout.gridSize which may be stale.
  const effectiveGridSize = gridSize;
  
  // Guard against uninitialized layout
  if (!width || !height || width <= 0 || height <= 0) return null;
  
  // Always calculate cell dimensions from width/height and gridSize
  // This ensures perfect synchronization regardless of when layout was measured
  const effectiveCellWidth = width / effectiveGridSize;
  const effectiveCellHeight = height / effectiveGridSize;
  
  if (effectiveCellWidth <= 0 || effectiveCellHeight <= 0) return null;
  
  const relativeX = x - padding;
  const relativeY = y - padding;
  
  if (relativeX < 0 || relativeY < 0) return null;
  if (relativeX >= width || relativeY >= height) return null;
  
  const col = Math.floor(relativeX / effectiveCellWidth);
  const row = Math.floor(relativeY / effectiveCellHeight);
  
  if (col < 0 || col >= effectiveGridSize || row < 0 || row >= effectiveGridSize) return null;
  
  return row * effectiveGridSize + col;
};
