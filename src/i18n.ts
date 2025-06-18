import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import jaTranslation from './locales/ja/translation.json';

i18n
  .use(LanguageDetector) // ユーザーのブラウザ言語を検出
  .use(initReactI18next) // react-i18nextを初期化
  .init({
    resources: {
      ja: {
        translation: jaTranslation
      }
    },
    fallbackLng: 'ja', // デフォルト言語を日本語に
    interpolation: {
      escapeValue: false // ReactはXSS対策済みなのでfalse
    }
  });

export default i18n;