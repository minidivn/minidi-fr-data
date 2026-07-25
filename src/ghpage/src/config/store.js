/**
 * Runtime config store.
 * Set once by createMiniDiApp() before components are registered.
 */
let _config = null;

export function setConfig(config) {
  _config = { ...config };
}

export function getConfig() {
  if (!_config) {
    throw new Error(
      "[@minidi/minidi-data-ghpage] Config not set. Call createMiniDiApp(config) first.",
    );
  }
  return _config;
}
