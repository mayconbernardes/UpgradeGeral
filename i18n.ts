import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from './i18n/en.json';
import fr from './i18n/fr.json';
import it from './i18n/it.json';
import pt from './i18n/pt.json';

const resources = {
  en: {
    translation: en,
  },
  fr: {
    translation: fr,
  },
  it: {
    translation: it,
  },
  pt: {
    translation: pt,
  },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
