import { describe, it, expect } from "vitest";
import { initI18n, t, getLang, setLang } from "../utils/i18n.js";

const TEST_TRANSLATIONS = {
  en: { entities: "Entities", search: "Search...", results: "{n} results", page: "Page {p} of {t}" },
  vi: { entities: "Thực thể", search: "Tìm kiếm...", results: "{n} kết quả", page: "Trang {p} / {t}" },
};

describe("i18n", () => {
  it("returns English by default after init", () => {
    initI18n(TEST_TRANSLATIONS, "en");
    expect(getLang()).toBe("en");
    expect(t("entities")).toBe("Entities");
    expect(t("search")).toBe("Search...");
  });

  it("switches to Vietnamese", () => {
    setLang("vi");
    expect(getLang()).toBe("vi");
    expect(t("entities")).toBe("Thực thể");
    expect(t("search")).toBe("Tìm kiếm...");
    setLang("en");
  });

  it("handles unknown key", () => {
    expect(t("nonexistent_key")).toBe("nonexistent_key");
  });

  it("interpolates params", () => {
    expect(t("results", { n: 42 })).toBe("42 results");
    expect(t("page", { p: 1, t: 5 })).toBe("Page 1 of 5");
  });
});
