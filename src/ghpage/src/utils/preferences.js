/**
 * User preferences — persisted to localStorage.
 * Default language read from config.
 */

const STORAGE_KEY = "minidi-prefs";

let _defaultLang = "en";

export function initPrefs(defaultLang) {
  _defaultLang = defaultLang || "en";
}

function _defaults() {
  return {
    lang: _defaultLang,
    theme: "dark",
    aiModel: "mini",
  };
}

export function loadPrefs() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? { ..._defaults(), ...JSON.parse(stored) } : { ..._defaults() };
  } catch {
    return { ..._defaults() };
  }
}

export function savePrefs(prefs) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    /* ignore */
  }
}

export function applyTheme(theme) {
  const root = document.documentElement;
  const body = document.body;
  const setVar = (name, val) => root.style.setProperty(name, val);

  if (theme === "light") {
    setVar("--bg", "#f8fafc");
    setVar("--bg2", "#ffffff");
    setVar("--bg3", "#e2e8f0");
    setVar("--text", "#0f172a");
    setVar("--text2", "#475569");
    setVar("--text3", "#94a3b8");
    setVar("--a1", "#6366f1");
    setVar("--a2", "#0891b2");
    setVar("--a3", "#7c3aed");
    setVar("--ok", "#16a34a");
    setVar("--warn", "#ca8a04");
    setVar("--border-color", "rgba(0,0,0,0.1)");
    if (body) {
      body.style.background = "#f8fafc";
      body.style.color = "#0f172a";
    }
  } else {
    setVar("--bg", "#070b17");
    setVar("--bg2", "#0f172a");
    setVar("--bg3", "#1e293b");
    setVar("--text", "#f1f5f9");
    setVar("--text2", "#94a3b8");
    setVar("--text3", "#64748b");
    setVar("--a1", "#6366f1");
    setVar("--a2", "#06b6d4");
    setVar("--a3", "#a78bfa");
    setVar("--ok", "#22c55e");
    setVar("--warn", "#eab308");
    setVar("--border-color", "rgba(255,255,255,0.07)");
    if (body) {
      body.style.background = "#070b17";
      body.style.color = "#f1f5f9";
    }
  }
}
