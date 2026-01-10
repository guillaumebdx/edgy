/**
 * useTranslation Hook
 * React hook for i18n with re-render on language change
 */

import { useState, useEffect, useCallback } from 'react';
import i18n, { t, getCurrentLanguage, setLanguage, initLanguage, LANGUAGES, getLevelName } from '../locales';

/**
 * Hook that provides translation function and language management
 * Re-renders component when language changes
 */
const useTranslation = () => {
  const [locale, setLocale] = useState(getCurrentLanguage());
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize language on mount
  useEffect(() => {
    const init = async () => {
      await initLanguage();
      setLocale(getCurrentLanguage());
      setIsInitialized(true);
    };
    init();
  }, []);

  // Change language and trigger re-render
  const changeLanguage = useCallback(async (languageCode) => {
    const success = await setLanguage(languageCode);
    if (success) {
      setLocale(languageCode);
    }
    return success;
  }, []);

  return {
    t,
    locale,
    changeLanguage,
    isInitialized,
    languages: LANGUAGES,
    getLevelName,
  };
};

export default useTranslation;
