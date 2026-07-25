import { describe, it, expect } from "vitest";
import { getStats } from "../utils/data-loader.js";

describe("getStats", () => {
  const nodes = [
    { id: "Q1", t: "person" },
    { id: "Q2", t: "place" },
    { id: "Q3", t: "event" },
    { id: "Q4", t: "event" },
    { id: "Q5", t: "person" },
    { id: "Q6" },
  ];

  it("counts by type", () => {
    const stats = getStats(nodes);
    expect(stats.person).toBe(2);
    expect(stats.event).toBe(2);
    expect(stats.place).toBe(1);
  });

  it("handles missing type as 'other'", () => {
    const stats = getStats([{ id: "Q1" }]);
    expect(stats.other).toBe(1);
  });

  it("handles empty array", () => {
    const stats = getStats([]);
    expect(Object.keys(stats).length).toBe(0);
  });
});
