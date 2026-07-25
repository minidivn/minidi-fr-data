/**
 * @minidi/minidi-data-ghpage
 *
 * Generic MiniDi knowledge graph frontend library.
 * Drop it into any MiniDi-compatible data repo with a config object.
 *
 * Usage:
 *
 *   import { createMiniDiApp } from "@minidi/minidi-data-ghpage";
 *   import config from "./config.js";
 *   createMiniDiApp(config);
 */

import { setConfig } from "./config/store.js";
import { validateConfig } from "./config/validate.js";
import { initI18n } from "./utils/i18n.js";
import { initPrefs, loadPrefs, applyTheme } from "./utils/preferences.js";
import { setLang } from "./utils/i18n.js";

// NOTE: app-shell.js is NOT imported statically here.
// It is loaded dynamically inside createMiniDiApp() after config is set.
// This avoids a race where component constructors call getConfig() before
// createMiniDiApp() has stored the config.

export * from "./utils/i18n.js";
export * from "./utils/data-loader.js";
export * from "./utils/bm25.js";
export * from "./utils/preferences.js";
export * from "./utils/theme-colors.js";
export * from "./utils/gallery-utils.js";
export * from "./utils/wikidata-fetcher.js";

/**
 * Bootstrap a MiniDi ghpage application.
 *
 * @param {object} config - Country/repo configuration object
 */
export async function createMiniDiApp(config) {
  const validated = validateConfig(config);

  // 1. Store config globally so all components can read it
  setConfig(validated);

  // 2. Init i18n with country translations
  initI18n(validated.translations, validated.defaultLanguage);

  // 3. Init preferences with country default language
  initPrefs(validated.defaultLanguage);

  // 4. Apply persisted preferences (language + theme)
  const prefs = loadPrefs();
  setLang(prefs.lang);
  applyTheme(prefs.theme);

  // 5. Load app shell (and all components) AFTER config is ready.
  //    This ensures component constructors can safely call getConfig().
  await import("./app-shell.js");
}
