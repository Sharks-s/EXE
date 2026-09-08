import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import viValidation from "./locales/vi/validationErrors.json";
import enValidation from "./locales/en/validationErrors.json";
import viBusiness from "./locales/vi/businessErrors.json";
import enBusiness from "./locales/en/businessErrors.json";
import viCommon from "./locales/vi/common.json";
import enCommon from "./locales/en/common.json";

const STORAGE_KEY = "focusbuddy_language";
const savedLanguage = localStorage.getItem(STORAGE_KEY) ?? "vi";

i18n.use(initReactI18next).init({
  lng: savedLanguage,
  fallbackLng: "en",

  resources: {
    vi: {
      validationErrors: viValidation,
      businessErrors: viBusiness,
      common: viCommon,
    },
    en: {
      validationErrors: enValidation,
      businessErrors: enBusiness,
      common: enCommon,
    },
  },

  interpolation: {
    escapeValue: false,
  },

  missingKeyHandler: false,
});

i18n.on("languageChanged", (lng) => {
  localStorage.setItem(STORAGE_KEY, lng);
});

export default i18n;