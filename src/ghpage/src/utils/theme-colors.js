/**
 * Read current value of a CSS variable from the document.
 * Falls back to a dark-theme default.
 */
export function cssVar(name, fallback) {
  if (typeof document === "undefined") return fallback;
  try {
    const val = getComputedStyle(document.documentElement)
      .getPropertyValue(name)
      .trim();
    return val || fallback;
  } catch {
    return fallback;
  }
}

/**
 * Read CSS variable from a specific element (for shadow DOM access).
 */
export function cssVarFrom(el, name, fallback) {
  if (!el || typeof document === "undefined") return fallback;
  try {
    const val = getComputedStyle(el)
      .getPropertyValue(name)
      .trim();
    return val || fallback;
  } catch {
    return fallback;
  }
}

/**
 * Theme-aware color map: reads --a1, --a2, --a3, --ok, --warn, --text etc.
 */
export function themeColors(el) {
  const get = (n, f) => cssVarFrom(el, n, f);
  return {
    person: get("--a1", "#6366f1"),
    place: get("--ok", "#22c55e"),
    event: get("--warn", "#eab308"),
    other: get("--text3", "#64748b"),
    edge: get("--border-color", "rgba(255,255,255,0.07)"),
    text: get("--text", "#f1f5f9"),
    bg: get("--bg", "#070b17"),
    bg2: get("--bg2", "#0f172a"),
    bg3: get("--bg3", "#1e293b"),
  };
}
