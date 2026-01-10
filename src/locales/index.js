/**
 * i18n Configuration
 * Internationalization setup with auto-detection and persistence
 */

import { I18n } from 'i18n-js';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';

import fr from './fr.json';
import en from './en.json';
import de from './de.json';
import es from './es.json';
import it from './it.json';
import pt from './pt.json';

const LANGUAGE_KEY = '@edgy_language';

// Supported language codes
const SUPPORTED_LANGUAGES = ['fr', 'en', 'de', 'es', 'it', 'pt'];

// Create i18n instance
const i18n = new I18n({
  fr,
  en,
  de,
  es,
  it,
  pt,
});

// Set default locale based on device
i18n.defaultLocale = 'en';
i18n.enableFallback = true;

// Available languages with flags
export const LANGUAGES = [
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'it', name: 'Italiano', flag: '🇮🇹' },
  { code: 'pt', name: 'Português', flag: '🇧🇷' },
];

/**
 * Initialize language from storage or device locale
 */
export const initLanguage = async () => {
  try {
    // Try to load saved preference
    const savedLanguage = await AsyncStorage.getItem(LANGUAGE_KEY);
    
    if (savedLanguage && SUPPORTED_LANGUAGES.includes(savedLanguage)) {
      i18n.locale = savedLanguage;
    } else {
      // Auto-detect from device
      const deviceLocale = Localization.getLocales()[0]?.languageCode || 'en';
      i18n.locale = SUPPORTED_LANGUAGES.includes(deviceLocale) ? deviceLocale : 'en';
    }
    
    return i18n.locale;
  } catch (error) {
    console.error('Failed to init language:', error);
    i18n.locale = 'en';
    return 'en';
  }
};

/**
 * Change language and persist preference
 */
export const setLanguage = async (languageCode) => {
  try {
    if (SUPPORTED_LANGUAGES.includes(languageCode)) {
      i18n.locale = languageCode;
      await AsyncStorage.setItem(LANGUAGE_KEY, languageCode);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Failed to set language:', error);
    return false;
  }
};

/**
 * Get current language code
 */
export const getCurrentLanguage = () => i18n.locale;

/**
 * Translation function
 */
export const t = (key, options) => i18n.t(key, options);

/**
 * Get translated level name by level ID
 */
export const getLevelName = (levelId) => i18n.t(`levels.${levelId}`);

export default i18n;
