import i18n from "i18next";
import { initReactI18next } from "react-i18next";

const resources = {
  en: {
    translation: {
      "Search System": "Search System",
      "Enter name...": "Enter name...",
      "Search": "Search",
      "Canonical Name": "Canonical Name",
      "Variations": "Variations",
      "Category": "Category",
      "Switch Language": "Switch Language",
    },
  },
  he: {
    translation: {
      "Search System": "מערכת חיפוש",
      "Enter name...": "הזן שם...",
      "Search": "חיפוש",
      "Canonical Name": "שם קנוני",
      "Variations": "וריאציות",
      "Category": "קטגוריה",
      "Switch Language": "החלף שפה",
    },
  },
};

i18n.use(initReactI18next).init({ resources, lng: "en", fallbackLng: "en", interpolation: { escapeValue: false } });

export default i18n;
