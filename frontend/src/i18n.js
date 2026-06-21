import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Translations
const resources = {
  en: {
    translation: {
      "Welcome to SCC&DP": "Welcome to SCC&DP",
      "Submit Complaint": "Submit Complaint",
      "Risk Dashboard": "Risk Dashboard"
    }
  },
  hi: {
    translation: {
      "Welcome to SCC&DP": "SCC&DP में आपका स्वागत है",
      "Submit Complaint": "शिकायत दर्ज करें",
      "Risk Dashboard": "जोखिम डैशबोर्ड"
    }
  },
  ta: {
    translation: {
      "Welcome to SCC&DP": "SCC&DP க்கு வரவேற்கிறோம்",
      "Submit Complaint": "புகார் சமர்ப்பிக்கவும்",
      "Risk Dashboard": "ஆபத்து டாஷ்போர்டு"
    }
  }
};

i18n
  .use(initReactI18next) // passes i18n down to react-i18next
  .init({
    resources,
    lng: "en", // language to use, more will be detected from browser language in production
    fallbackLng: "en",

    interpolation: {
      escapeValue: false // react already safes from xss
    }
  });

export default i18n;
