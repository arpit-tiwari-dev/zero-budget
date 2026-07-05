import i18n from 'i18next';
import {initReactI18next} from 'react-i18next';
import {getDeviceLocaleInfo} from '../utils/locale';
import en from './locales/en.json';

const resources = {
  en: {translation: en},
} as const;

i18n.use(initReactI18next).init({
  resources,
  lng: getDeviceLocaleInfo().languageCode,
  fallbackLng: 'en',
  interpolation: {escapeValue: false},
  react: {useSuspense: false},
});

export default i18n;
