/**
 * Dynamic i18n — translations loaded from config at runtime.
 */

let _translations = {};
let currentLang = "en";

/**
 * Feed translations from the validated config.
 * Called once during createMiniDiApp().
 */
export function initI18n(translations, defaultLang) {
  _translations = translations || {};
  currentLang = defaultLang || "en";
}

export function setLang(lang) {
  currentLang = lang;
}

export function getLang() {
  return currentLang;
}

export function t(key, params) {
  const dict = _translations[currentLang] || {};
  let text = dict[key];
  // Fallback: try first language's dictionary, then raw key
  if (text === undefined) {
    const firstLang = Object.keys(_translations)[0];
    text = firstLang ? _translations[firstLang][key] : undefined;
  }
  if (text === undefined) text = key;
  if (params) {
    for (const k in params) {
      text = text.replace("{" + k + "}", params[k]);
    }
  }
  return text;
}

/** Alias kept for backward compat with older component code */
export function translate(key, params) {
  return t(key, params);
}
