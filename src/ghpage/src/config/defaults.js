/**
 * Sensible fallback defaults when a config field is not provided.
 */
export const DEFAULTS = {
  countryCode: "xx",
  countryName: "Unknown",
  countryEmoji: "\u{1F30D}", // 🌍

  languages: ["en"],
  defaultLanguage: "en",

  title: "Knowledge Graph",
  subtitle: "Exploring {n} WikiData entities",

  splashTitle: "MiniDi",
  splashMessage: "Loading knowledge graph...",

  slides: [],

  mapCenter: [20, 0],
  mapZoom: 2,

  eras: [],
  eraRanges: {},

  githubRepo: "",
  dataSource: "WikiData",

  dataPath: "_data/index.json",

  chatCountry: "",
  chatGreeting: "Ask me about the knowledge graph.",
};
