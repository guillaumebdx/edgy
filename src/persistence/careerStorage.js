/**
 * Career Storage Module
 * SQLite persistence for career mode progression
 * 
 * Stores only:
 * - currentLevel: the level player is currently on
 * - unlockedLevel: highest level unlocked
 * 
 * Extensible structure for future data (stats, etc.)
 */

import * as SQLite from 'expo-sqlite';

const DATABASE_NAME = 'edgy_career.db';
const TABLE_NAME = 'career_progress';

let db = null;

/**
 * Initialize the database and create tables if needed
 * @returns {Promise<void>}
 */
export const initDatabase = async () => {
  try {
    db = await SQLite.openDatabaseAsync(DATABASE_NAME);
    
    // Create career_progress table if it doesn't exist
    // Extensible structure: key-value pairs for flexibility
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS ${TABLE_NAME} (
        key TEXT PRIMARY KEY NOT NULL,
        value TEXT NOT NULL,
        updated_at INTEGER DEFAULT (strftime('%s', 'now'))
      );
    `);
    
    return true;
  } catch (error) {
    console.error('Failed to initialize database:', error);
    return false;
  }
};

/**
 * Load career progression from database
 * @returns {Promise<{currentLevel: number, unlockedLevel: number} | null>}
 */
export const loadCareerProgress = async () => {
  if (!db) {
    const initialized = await initDatabase();
    if (!initialized) return null;
  }
  
  try {
    const rows = await db.getAllAsync(
      `SELECT key, value FROM ${TABLE_NAME} WHERE key IN ('currentLevel', 'unlockedLevel')`
    );
    
    if (rows.length === 0) {
      return null; // No saved progress
    }
    
    const progress = {
      currentLevel: 1,
      unlockedLevel: 1,
    };
    
    rows.forEach(row => {
      if (row.key === 'currentLevel') {
        progress.currentLevel = parseInt(row.value, 10);
      } else if (row.key === 'unlockedLevel') {
        progress.unlockedLevel = parseInt(row.value, 10);
      }
    });
    
    return progress;
  } catch (error) {
    console.error('Failed to load career progress:', error);
    return null;
  }
};

/**
 * Save career progression to database
 * Called only when a level is validated or a new level is unlocked
 * @param {number} currentLevel - Current level number
 * @param {number} unlockedLevel - Highest unlocked level number
 * @returns {Promise<boolean>}
 */
export const saveCareerProgress = async (currentLevel, unlockedLevel) => {
  if (!db) {
    const initialized = await initDatabase();
    if (!initialized) return false;
  }
  
  try {
    const timestamp = Math.floor(Date.now() / 1000);
    
    // Upsert current level
    await db.runAsync(
      `INSERT INTO ${TABLE_NAME} (key, value, updated_at) VALUES ('currentLevel', ?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
      [currentLevel.toString(), timestamp]
    );
    
    // Upsert unlocked level
    await db.runAsync(
      `INSERT INTO ${TABLE_NAME} (key, value, updated_at) VALUES ('unlockedLevel', ?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
      [unlockedLevel.toString(), timestamp]
    );
    
    return true;
  } catch (error) {
    console.error('Failed to save career progress:', error);
    return false;
  }
};

/**
 * Reset career progression (new game)
 * @returns {Promise<boolean>}
 */
export const resetCareerProgress = async () => {
  if (!db) {
    const initialized = await initDatabase();
    if (!initialized) return false;
  }
  
  try {
    await db.runAsync(`DELETE FROM ${TABLE_NAME}`);
    return true;
  } catch (error) {
    console.error('Failed to reset career progress:', error);
    return false;
  }
};

/**
 * Check if saved progress exists
 * @returns {Promise<boolean>}
 */
export const hasSavedProgress = async () => {
  const progress = await loadCareerProgress();
  return progress !== null;
};
