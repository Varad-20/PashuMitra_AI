import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Import modular namespace dictionaries for English, Hindi, and Marathi
import enCommon from './locales/en/common.json';
import enDashboard from './locales/en/dashboard.json';
import enAnimals from './locales/en/animals.json';
import enHealth from './locales/en/health.json';
import enAlerts from './locales/en/alerts.json';
import enVaccinations from './locales/en/vaccinations.json';
import enAssistant from './locales/en/assistant.json';
import enVeterinary from './locales/en/veterinary.json';
import enReports from './locales/en/reports.json';
import enMilk from './locales/en/milkProduction.json';
import enDigitalTwin from './locales/en/digitalTwin.json';
import enSettings from './locales/en/settings.json';

import hiCommon from './locales/hi/common.json';
import hiDashboard from './locales/hi/dashboard.json';
import hiAnimals from './locales/hi/animals.json';
import hiHealth from './locales/hi/health.json';
import hiAlerts from './locales/hi/alerts.json';
import hiVaccinations from './locales/hi/vaccinations.json';
import hiAssistant from './locales/hi/assistant.json';
import hiVeterinary from './locales/hi/veterinary.json';
import hiReports from './locales/hi/reports.json';
import hiMilk from './locales/hi/milkProduction.json';
import hiDigitalTwin from './locales/hi/digitalTwin.json';
import hiSettings from './locales/hi/settings.json';

import mrCommon from './locales/mr/common.json';
import mrDashboard from './locales/mr/dashboard.json';
import mrAnimals from './locales/mr/animals.json';
import mrHealth from './locales/mr/health.json';
import mrAlerts from './locales/mr/alerts.json';
import mrVaccinations from './locales/mr/vaccinations.json';
import mrAssistant from './locales/mr/assistant.json';
import mrVeterinary from './locales/mr/veterinary.json';
import mrReports from './locales/mr/reports.json';
import mrMilk from './locales/mr/milkProduction.json';
import mrDigitalTwin from './locales/mr/digitalTwin.json';
import mrSettings from './locales/mr/settings.json';

function assembleTranslation(c, dashboard, animals, health, earlyWarning, vaccinations, assistant, vetHelp, reports, milk, digitalTwin, settings) {
  return {
    ...c,
    dashboard,
    animals,
    health,
    earlyWarning,
    alerts: earlyWarning,
    vaccinations,
    ai: assistant.ai,
    voiceChat: assistant.voiceChat,
    assistant: assistant.ai,
    vetHelp,
    veterinary: vetHelp,
    reports,
    milk,
    milkProduction: milk,
    digitalTwin,
    settings,
  };
}

const STORAGE_KEY = 'pashumitra_lang';

const getSavedLanguage = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && ['en', 'hi', 'mr'].includes(saved)) return saved;
  } catch { /* ignore */ }
  return 'en';
};

i18n.use(initReactI18next).init({
  resources: {
    en: {
      translation: assembleTranslation(
        enCommon, enDashboard, enAnimals, enHealth, enAlerts, enVaccinations,
        enAssistant, enVeterinary, enReports, enMilk, enDigitalTwin, enSettings
      ),
    },
    hi: {
      translation: assembleTranslation(
        hiCommon, hiDashboard, hiAnimals, hiHealth, hiAlerts, hiVaccinations,
        hiAssistant, hiVeterinary, hiReports, hiMilk, hiDigitalTwin, hiSettings
      ),
    },
    mr: {
      translation: assembleTranslation(
        mrCommon, mrDashboard, mrAnimals, mrHealth, mrAlerts, mrVaccinations,
        mrAssistant, mrVeterinary, mrReports, mrMilk, mrDigitalTwin, mrSettings
      ),
    },
  },
  lng: getSavedLanguage(),
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

export function changeAppLanguage(lng) {
  if (!['en', 'hi', 'mr'].includes(lng)) return;
  i18n.changeLanguage(lng);
  try {
    localStorage.setItem(STORAGE_KEY, lng);
    document.documentElement.lang = lng;
  } catch { /* ignore */ }
}

export default i18n;
