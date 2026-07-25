import { DEFAULTS } from "./defaults.js";

/**
 * Validate and normalise a user-provided config object.
 * Merges with defaults, warns about missing required fields.
 */
export function validateConfig(config) {
  if (!config || typeof config !== "object") {
    throw new Error(
      "[@minidi/minidi-data-ghpage] Config must be a plain object.",
    );
  }

  const merged = { ...DEFAULTS, ...config };

  // Languages must be a non-empty array
  if (!Array.isArray(merged.languages) || merged.languages.length === 0) {
    merged.languages = DEFAULTS.languages;
    merged.defaultLanguage = DEFAULTS.defaultLanguage;
  }

  // defaultLanguage must be in languages
  if (!merged.languages.includes(merged.defaultLanguage)) {
    merged.defaultLanguage = merged.languages[0];
  }

  // Translations must exist for each language
  if (!merged.translations || typeof merged.translations !== "object") {
    merged.translations = {};
  }
  for (const lang of merged.languages) {
    if (!merged.translations[lang]) {
      merged.translations[lang] = {};
    }
  }

  return merged;
}
