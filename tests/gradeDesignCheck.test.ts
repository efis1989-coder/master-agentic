import { describe, expect, it } from "vitest";
import type { DesignCheck } from "../src/content/types";
import { gradeDesignCheck } from "../src/features/exercises/gradeDesignCheck";

const check: DesignCheck = {
  kind: "select",
  options: ["Pipeline", "Workflow", "Agent"],
  items: [
    { id: "c/1", index: 1, label: "Invoicing", correct: "Pipeline", rationale: "Enumerable." },
    { id: "c/2", index: 2, label: "Triage", correct: "Workflow", rationale: null },
    { id: "c/3", index: 3, label: "Redlining", correct: "Agent", rationale: "Non-enumerable." },
  ],
};

describe("gradeDesignCheck", () => {
  it("scores a fully-correct submission", () => {
    const graded = gradeDesignCheck(
      check,
      new Map([
        ["c/1", "Pipeline"],
        ["c/2", "Workflow"],
        ["c/3", "Agent"],
      ]),
    );
    expect(graded.score).toBe(3);
    expect(graded.total).toBe(3);
    expect(graded.results.every((r) => r.correct)).toBe(true);
  });

  it("scores a partially-correct submission and reports each choice", () => {
    const graded = gradeDesignCheck(
      check,
      new Map([
        ["c/1", "Pipeline"],
        ["c/2", "Agent"],
        ["c/3", "Agent"],
      ]),
    );
    expect(graded.score).toBe(2);
    const triage = graded.results.find((r) => r.item.id === "c/2");
    expect(triage?.correct).toBe(false);
    expect(triage?.chosen).toBe("Agent");
  });

  it("scores an all-wrong submission at zero", () => {
    const graded = gradeDesignCheck(
      check,
      new Map([
        ["c/1", "Agent"],
        ["c/2", "Pipeline"],
        ["c/3", "Workflow"],
      ]),
    );
    expect(graded.score).toBe(0);
    expect(graded.results.every((r) => !r.correct)).toBe(true);
  });

  it("treats an unanswered item as incorrect with a null choice", () => {
    const graded = gradeDesignCheck(check, new Map([["c/1", "Pipeline"]]));
    expect(graded.score).toBe(1);
    const unanswered = graded.results.find((r) => r.item.id === "c/2");
    expect(unanswered?.chosen).toBeNull();
    expect(unanswered?.correct).toBe(false);
  });
});
