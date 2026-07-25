import { describe, it, expect } from "vitest";
import { validateConfig } from "../config/validate.js";

describe("validateConfig", () => {
  it("merges with defaults", () => {
    const config = validateConfig({ countryCode: "vn" });
    expect(config.countryCode).toBe("vn");
    expect(config.languages).toEqual(["en"]);
    expect(config.defaultLanguage).toBe("en");
    expect(config.title).toBe("Knowledge Graph");
  });

  it("throws for non-object", () => {
    expect(() => validateConfig(null)).toThrow();
    expect(() => validateConfig("foo")).toThrow();
  });

  it("fixes defaultLanguage if not in languages", () => {
    const config = validateConfig({
      languages: ["vi"],
      defaultLanguage: "en",
    });
    expect(config.defaultLanguage).toBe("vi");
  });

  it("creates empty translations for each language", () => {
    const config = validateConfig({ languages: ["fr", "de"] });
    expect(config.translations.fr).toEqual({});
    expect(config.translations.de).toEqual({});
  });
});
