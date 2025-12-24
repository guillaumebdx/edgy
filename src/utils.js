/**
 * Utility Functions
 * Helper functions for UI calculations and rendering
 */

import { GRID_SIZE } from './constants';
import { getCellPosition } from './gameLogic';

/**
 * Calculates the style for connection lines between path cells
 * @param {number} fromIndex - Starting cell index
 * @param {number} toIndex - Ending cell index
 * @param {number} cellWidth - Width of each cell
 * @param {number} cellHeight - Height of each cell
 * @param {number} gridSize - Size of the grid (default from constants)
 * @returns {Object} Style object for the connection line
 */
export const getConnectionStyle = (fromIndex, toIndex, cellWidth, cellHeight, gridSize = GRID_SIZE) => {
  const from = getCellPosition(fromIndex, gridSize);
  const to = getCellPosition(toIndex, gridSize);

  // Calculate center points of cells
  const fromX = (from.col + 0.5) * cellWidth;
  const fromY = (from.row + 0.5) * cellHeight;
  const toX = (to.col + 0.5) * cellWidth;
  const toY = (to.row + 0.5) * cellHeight;

  // Calculate line properties
  const deltaX = toX - fromX;
  const deltaY = toY - fromY;
  const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
  const angle = Math.atan2(deltaY, deltaX);

  return {
    position: 'absolute',
    left: fromX,
    top: fromY,
    width: distance,
    height: 2,
    backgroundColor: 'rgba(100, 160, 180, 0.6)',
    borderRadius: 1,
    transform: [{ rotate: `${angle}rad` }],
    transformOrigin: 'left center',
    shadowColor: '#4A8090',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
  };
};
