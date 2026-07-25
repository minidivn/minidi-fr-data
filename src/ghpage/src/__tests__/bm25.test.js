import { describe, it, expect } from "vitest";
import { buildBM25 } from "../utils/bm25.js";

const mockNodes = [
  { id: "Q1", l: "Hanoi", d: "Capital of Vietnam" },
  { id: "Q2", l: "Saigon", d: "Largest city in Vietnam" },
  { id: "Q3", l: "Huong River", d: "River in Hue, Vietnam" },
  { id: "Q4", l: "Bach Dang Battle", d: "Historic battle in 938 CE" },
  { id: "Q5", l: "Nguyen Hue", d: "Emperor Quang Trung" },
];

describe("buildBM25", () => {
  const score = buildBM25(mockNodes);

  it("returns results sorted by relevance", () => {
    const results = score("hanoi");
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].index).toBe(0);
  });

  it("returns empty for no match", () => {
    const results = score("xyznonexistent");
    expect(results.length).toBe(0);
  });

  it("ranks label match higher than description match", () => {
    const results = score("battle");
    expect(results.length).toBeGreaterThan(0);
    expect(mockNodes[results[0].index].id).toBe("Q4");
  });

  it("handles Vietnamese characters", () => {
    const results = score("saigon");
    expect(results.length).toBeGreaterThan(0);
    expect(mockNodes[results[0].index].id).toBe("Q2");
  });

  it("handles empty node list", () => {
    const fn = buildBM25([]);
    const results = fn("test");
    expect(results.length).toBe(0);
  });
});
