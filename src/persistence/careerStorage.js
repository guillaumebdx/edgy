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
const STARS_TABLE = 'level_stars';
const HIGH_SCORES_TABLE = 'high_scores';

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
    
    // Create level_stars table for star system
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS ${STARS_TABLE} (
        level_id INTEGER PRIMARY KEY NOT NULL,
        stars INTEGER NOT NULL DEFAULT 0,
        updated_at INTEGER DEFAULT (strftime('%s', 'now'))
      );
    `);
    
    // Create high_scores table for free mode
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS ${HIGH_SCORES_TABLE} (
        mode TEXT PRIMARY KEY NOT NULL,
        score INTEGER NOT NULL DEFAULT 0,
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

/**
 * Save stars for a specific level
 * Only updates if new stars count is higher (stars are permanent)
 * @param {number} levelId - Level ID
 * @param {number} stars - Number of stars (0-3)
 * @returns {Promise<boolean>}
 */
export const saveLevelStars = async (levelId, stars) => {
  if (!db) {
    const initialized = await initDatabase();
    if (!initialized) return false;
  }
  
  try {
    const timestamp = Math.floor(Date.now() / 1000);
    
    // Only update if new stars count is higher (stars are permanent)
    await db.runAsync(
      `INSERT INTO ${STARS_TABLE} (level_id, stars, updated_at) VALUES (?, ?, ?)
       ON CONFLICT(level_id) DO UPDATE SET 
         stars = MAX(${STARS_TABLE}.stars, excluded.stars),
         updated_at = excluded.updated_at`,
      [levelId, stars, timestamp]
    );
    
    return true;
  } catch (error) {
    console.error('Failed to save level stars:', error);
    return false;
  }
};

/**
 * Load stars for a specific level
 * @param {number} levelId - Level ID
 * @returns {Promise<number>} Number of stars (0 if none)
 */
export const loadLevelStars = async (levelId) => {
  if (!db) {
    const initialized = await initDatabase();
    if (!initialized) return 0;
  }
  
  try {
    const row = await db.getFirstAsync(
      `SELECT stars FROM ${STARS_TABLE} WHERE level_id = ?`,
      [levelId]
    );
    
    return row ? row.stars : 0;
  } catch (error) {
    console.error('Failed to load level stars:', error);
    return 0;
  }
};

/**
 * Load stars for all levels
 * @returns {Promise<Object>} Map of levelId -> stars
 */
export const loadAllStars = async () => {
  if (!db) {
    const initialized = await initDatabase();
    if (!initialized) return {};
  }
  
  try {
    const rows = await db.getAllAsync(`SELECT level_id, stars FROM ${STARS_TABLE}`);
    
    const starsMap = {};
    rows.forEach(row => {
      starsMap[row.level_id] = row.stars;
    });
    
    return starsMap;
  } catch (error) {
    console.error('Failed to load all stars:', error);
    return {};
  }
};

/**
 * Load high score for a specific game mode
 * @param {string} mode - Game mode identifier (e.g., 'free_mode')
 * @returns {Promise<number>} High score (0 if none)
 */
export const loadHighScore = async (mode = 'free_mode') => {
  try {
    if (!db) {
      const initialized = await initDatabase();
      if (!initialized || !db) return 0;
    }
    
    const row = await db.getFirstAsync(
      `SELECT score FROM ${HIGH_SCORES_TABLE} WHERE mode = ?`,
      [mode]
    );
    
    return row ? row.score : 0;
  } catch (error) {
    console.error('Failed to load high score:', error);
    return 0;
  }
};

/**
 * Save high score for a specific game mode
 * Only updates if new score is higher
 * @param {number} score - Score to save
 * @param {string} mode - Game mode identifier (e.g., 'free_mode')
 * @returns {Promise<boolean>} True if score was updated (new high score)
 */
export const saveHighScore = async (score, mode = 'free_mode') => {
  try {
    if (!db) {
      const initialized = await initDatabase();
      if (!initialized || !db) return false;
    }
    
    const timestamp = Math.floor(Date.now() / 1000);
    
    // Only update if new score is higher
    const result = await db.runAsync(
      `INSERT INTO ${HIGH_SCORES_TABLE} (mode, score, updated_at) VALUES (?, ?, ?)
       ON CONFLICT(mode) DO UPDATE SET 
         score = MAX(${HIGH_SCORES_TABLE}.score, excluded.score),
         updated_at = CASE WHEN excluded.score > ${HIGH_SCORES_TABLE}.score THEN excluded.updated_at ELSE ${HIGH_SCORES_TABLE}.updated_at END`,
      [mode, score, timestamp]
    );
    
    // Check if it was actually a new high score
    const currentHighScore = await loadHighScore(mode);
    return currentHighScore === score;
  } catch (error) {
    console.error('Failed to save high score:', error);
    return false;
  }
};
