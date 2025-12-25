/**
 * Sound Manager
 * Handles audio playback for game feedback
 * 
 * Only plays success sound on valid path confirmation,
 * before any destruction or gravity effects.
 */

import { Audio } from 'expo-av';

// Sound instances (reusable)
let successSound = null;
let errorSound = null;
let landingSound = null;
let backgroundMusic = null;

/**
 * Initialize sounds
 * Should be called once at app startup
 */
export const initSounds = async () => {
  try {
    // Configure audio mode for game sounds
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: false,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
    });

    // Preload success sound
    const { sound: success } = await Audio.Sound.createAsync(
      require('../assets/sounds/success.wav'),
      { volume: 0.4 } // Moderate volume, non-intrusive
    );
    successSound = success;

    // Preload error sound
    const { sound: error } = await Audio.Sound.createAsync(
      require('../assets/sounds/error.wav'),
      { volume: 0.3 } // Slightly lower volume for error
    );
    errorSound = error;

    // Preload landing sound
    const { sound: landing } = await Audio.Sound.createAsync(
      require('../assets/sounds/landing.wav'),
      { volume: 0.35 } // Moderate volume for landing
    );
    landingSound = landing;

    // Preload background music (looped, menu only)
    const { sound: music } = await Audio.Sound.createAsync(
      require('../assets/sounds/background-music.mp3'),
      { volume: 0.5, isLooping: true } // Higher volume since menu only
    );
    backgroundMusic = music;
  } catch (err) {
    console.warn('Failed to initialize sounds:', err);
  }
};

/**
 * Play success sound on valid path confirmation
 * Called once per valid path, before destruction/gravity
 */
export const playSuccessSound = async () => {
  if (!successSound) return;
  
  try {
    await successSound.setPositionAsync(0);
    await successSound.playAsync();
  } catch (error) {
    console.warn('Failed to play success sound:', error);
  }
};

/**
 * Play error sound on invalid path
 * Called when path is too short or invalid
 */
export const playErrorSound = async () => {
  if (!errorSound) return;
  
  try {
    await errorSound.setPositionAsync(0);
    await errorSound.playAsync();
  } catch (error) {
    console.warn('Failed to play error sound:', error);
  }
};

/**
 * Play landing sound when new bricks land
 * Called when gravity completes and cells arrive
 */
export const playLandingSound = async () => {
  if (!landingSound) return;
  
  try {
    await landingSound.setPositionAsync(0);
    await landingSound.playAsync();
  } catch (error) {
    console.warn('Failed to play landing sound:', error);
  }
};

/**
 * Start background music (menu only)
 * Plays in loop at low volume
 */
export const startBackgroundMusic = async () => {
  if (!backgroundMusic) return;
  
  try {
    await backgroundMusic.setPositionAsync(0);
    await backgroundMusic.playAsync();
  } catch (error) {
    console.warn('Failed to start background music:', error);
  }
};

/**
 * Stop background music immediately
 * Called when entering game
 */
export const stopBackgroundMusic = async () => {
  if (!backgroundMusic) return;
  
  try {
    await backgroundMusic.stopAsync();
  } catch (error) {
    console.warn('Failed to stop background music:', error);
  }
};

/**
 * Cleanup sounds when app unmounts
 */
export const unloadSounds = async () => {
  try {
    if (successSound) {
      await successSound.unloadAsync();
      successSound = null;
    }
    if (errorSound) {
      await errorSound.unloadAsync();
      errorSound = null;
    }
    if (landingSound) {
      await landingSound.unloadAsync();
      landingSound = null;
    }
    if (backgroundMusic) {
      await backgroundMusic.unloadAsync();
      backgroundMusic = null;
    }
  } catch (error) {
    console.warn('Failed to unload sounds:', error);
  }
};
