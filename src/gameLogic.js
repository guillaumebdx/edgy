/**
 * Game Logic Module
 * Handles grid management, move validation, gravity, and game state checks
 */

import { GRID_SIZE, MAX_VALUE } from './constants';

/**
 * Generates a new random grid
 * @returns {number[]} Array of random values between 1 and MAX_VALUE
 */
export const generateGrid = () => {
  const grid = [];
  for (let i = 0; i < GRID_SIZE * GRID_SIZE; i++) {
    grid.push(Math.floor(Math.random() * MAX_VALUE) + 1);
  }
  return grid;
};

/**
 * Converts a cell index to row/column position
 * @param {number} index - Cell index (0 to GRID_SIZE*GRID_SIZE-1)
 * @returns {{row: number, col: number}} Position object
 */
export const getCellPosition = (index) => {
  const row = Math.floor(index / GRID_SIZE);
  const col = index % GRID_SIZE;
  return { row, col };
};

/**
 * Checks if two cells are adjacent (including diagonals)
 * @param {number} index1 - First cell index
 * @param {number} index2 - Second cell index
 * @returns {boolean} True if cells are adjacent
 */
export const areAdjacent = (index1, index2) => {
  const pos1 = getCellPosition(index1);
  const pos2 = getCellPosition(index2);
  
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
 * Applies gravity to the grid and fills empty spaces with new cells
 * @param {(number|null)[]} grid - Current grid state
 * @param {number} availableStock - Number of new cells available
 * @returns {{grid: (number|null)[], cellsUsed: number}} New grid and cells consumed
 */
export const applyGravityAndFill = (grid, availableStock) => {
  const newGrid = [...grid];
  let cellsUsed = 0;
  
  for (let col = 0; col < GRID_SIZE; col++) {
    // Collect non-null cells in column
    const column = [];
    for (let row = 0; row < GRID_SIZE; row++) {
      const index = row * GRID_SIZE + col;
      if (newGrid[index] !== null) {
        column.push(newGrid[index]);
      }
    }
    
    // Calculate how many new cells we need and can use
    const emptyCount = GRID_SIZE - column.length;
    const availableFromStock = Math.min(emptyCount, availableStock - cellsUsed);
    
    // Add new random cells from stock
    for (let i = 0; i < availableFromStock; i++) {
      column.unshift(Math.floor(Math.random() * MAX_VALUE) + 1);
      cellsUsed++;
    }
    
    // Fill remaining with null if stock depleted
    for (let i = 0; i < emptyCount - availableFromStock; i++) {
      column.unshift(null);
    }
    
    // Write column back to grid
    for (let row = 0; row < GRID_SIZE; row++) {
      const index = row * GRID_SIZE + col;
      newGrid[index] = column[row];
    }
  }
  
  return { grid: newGrid, cellsUsed };
};

/**
 * Calculates fall distances for animation after gravity
 * @param {(number|null)[]} oldGrid - Grid before gravity
 * @param {(number|null)[]} newGrid - Grid after gravity
 * @returns {Object.<number, number>} Map of cell index to fall distance
 */
export const calculateFallDistances = (oldGrid, newGrid) => {
  const fallDistances = {};
  
  for (let col = 0; col < GRID_SIZE; col++) {
    let emptyCount = 0;
    // Count empty cells from bottom up
    for (let row = GRID_SIZE - 1; row >= 0; row--) {
      const index = row * GRID_SIZE + col;
      if (oldGrid[index] === null) {
        emptyCount++;
      } else if (emptyCount > 0) {
        const newIndex = (row + emptyCount) * GRID_SIZE + col;
        fallDistances[newIndex] = emptyCount;
      }
    }
    // New cells falling from top
    for (let i = 0; i < emptyCount; i++) {
      const index = i * GRID_SIZE + col;
      fallDistances[index] = GRID_SIZE - i;
    }
  }
  
  return fallDistances;
};

/**
 * Checks if any valid move exists on the grid
 * Uses BFS to find paths where length > cell value
 * @param {(number|null)[]} grid - Current grid state
 * @returns {boolean} True if at least one valid move exists
 */
export const hasValidMove = (grid) => {
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
      const pos = getCellPosition(index);
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          const newRow = pos.row + dr;
          const newCol = pos.col + dc;
          if (newRow < 0 || newRow >= GRID_SIZE || newCol < 0 || newCol >= GRID_SIZE) continue;
          
          const neighborIndex = newRow * GRID_SIZE + newCol;
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
 * Converts screen coordinates to cell index
 * @param {number} x - X coordinate
 * @param {number} y - Y coordinate
 * @param {{cellWidth: number, cellHeight: number, padding: number, width: number, height: number}} layout - Grid layout info
 * @returns {number|null} Cell index or null if outside grid
 */
export const getCellFromPosition = (x, y, layout) => {
  const { cellWidth, cellHeight, padding, width, height } = layout;
  if (cellWidth === 0 || cellHeight === 0) return null;
  
  const relativeX = x - padding;
  const relativeY = y - padding;
  
  if (relativeX < 0 || relativeY < 0) return null;
  if (relativeX >= width || relativeY >= height) return null;
  
  const col = Math.floor(relativeX / cellWidth);
  const row = Math.floor(relativeY / cellHeight);
  
  if (col < 0 || col >= GRID_SIZE || row < 0 || row >= GRID_SIZE) return null;
  
  return row * GRID_SIZE + col;
};
