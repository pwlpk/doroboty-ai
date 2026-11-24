import { describe, expect, it } from "vitest";
import raw from "./scenario.json" with { type: "json" };
import { ownWords, parseVariant, scenario, scenarioSchema, scoreSelection } from "./scenario";

describe("scope review scenario", () => {
  it("has six applications for one job with two historical continuations", () => {
    expect(scenario.applications).toHaveLength(6);
    expect(scenario.applications.filter((a) => a.outcome.decision === "continue")).toHaveLength(2);
  });
  it("keeps every summary quote verbatim in the candidate's own text", () => {
    const broken = structuredClone(raw);
    broken.applications[0].summary.own[0].quote = "Zdanie, którego kandydat nie napisał.";
    expect(scenarioSchema.safeParse(broken).success).toBe(false);
  });
  it("preserves the scope sentence in the I2 answer and drops it from the assistant answer", () => {
    for (const a of scenario.applications) {
      const scope = a.summary.own[0].quote!;
      expect(a.answerWithScope).toContain(scope);
      expect(a.assistantAnswer).not.toContain(scope);
    }
  });
  it("exposes the preserved scope sentences as the candidate's verbatim words", () => {
    for (const a of scenario.applications) {
      const own = ownWords(a);
      expect(own.length).toBeGreaterThan(0);
      expect(a.originalAnswer).toContain(own);
      expect(own).toContain(a.summary.own[0].quote!);
    }
  });
  it("rejects preserved sentences the candidate did not write", () => {
    const broken = structuredClone(raw);
    broken.applications[0].answerWithScope += " Samodzielnie wdrożyłem cały system.";
    expect(scenarioSchema.safeParse(broken).success).toBe(false);
  });
  it("has prepared follow-up questions for every candidate", () => {
    for (const a of scenario.applications) expect(a.followUps.length).toBeGreaterThan(0);
  });
  it("defaults to the combined variant and scores selections", () => {
    expect(parseVariant(null)).toBe("i2-i5");
    expect(parseVariant("obecna")).toBe("obecna");
    expect(parseVariant("x")).toBe("i2-i5");
    expect(scoreSelection(["scope-a", "scope-d"])).toEqual({ hits: 1, total: 2 });
  });
});
