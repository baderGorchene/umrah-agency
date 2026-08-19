import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import fr from './fr.json';
import ar from './ar.json';

const resources = {
  fr: { translation: fr },
  ar: { translation: ar },
};

const getInitialLanguage = (): string => {
  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem('umrah_app_language');
      if (saved === 'FR') return 'fr';
      if (saved === 'AR') return 'ar';
    } catch {
      // ignore
    }
  }
  return 'ar';
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: getInitialLanguage(),
    fallbackLng: 'ar',
    interpolation: {
      escapeValue: false, // react already safes from xss
    },
    react: {
      useSuspense: false,
    },
  });

export default i18n;
