import { describe, expect, it } from "vitest";
import type { DomainFloor, ExamOption, ExamQuestion, OptionLetter } from "../src/content/types";
import { scoreExam } from "../src/features/exam/score";

const OPTS: ExamOption[] = [
  { letter: "A", text: "a" },
  { letter: "B", text: "b" },
  { letter: "C", text: "c" },
  { letter: "D", text: "d" },
];

function q(n: number, domain: ExamQuestion["domain"], correct: OptionLetter): ExamQuestion {
  return { id: `exam/q${n}`, n, domain, stem: `Q${n}`, options: OPTS, correct, rationale: "r" };
}

// Two domains, two questions each; floor = ceil(2 * 0.7) = 2 (both required).
const questions: ExamQuestion[] = [
  q(1, "D1", "A"),
  q(2, "D1", "B"),
  q(3, "D2", "C"),
  q(4, "D2", "D"),
];
const floors: DomainFloor[] = [
  { domain: "D1", count: 2, floor: 2 },
  { domain: "D2", count: 2, floor: 2 },
];

describe("scoreExam", () => {
  it("tallies correct answers overall and per domain", () => {
    const answers = new Map<string, OptionLetter>([
      ["exam/q1", "A"],
      ["exam/q2", "B"],
      ["exam/q3", "C"],
      ["exam/q4", "D"],
    ]);
    const r = scoreExam(questions, answers, floors, 3);
    expect(r.correctCount).toBe(4);
    expect(r.total).toBe(4);
    expect(r.passedOverall).toBe(true);
    expect(r.passedFloors).toBe(true);
    expect(r.passed).toBe(true);
    expect(r.scoreByDomain).toEqual([
      { domain: "D1", correct: 2, count: 2, floor: 2, passed: true },
      { domain: "D2", correct: 2, count: 2, floor: 2, passed: true },
    ]);
  });

  it("counts an unanswered or wrong question as incorrect", () => {
    const answers = new Map<string, OptionLetter>([
      ["exam/q1", "A"],
      ["exam/q2", "C"], // wrong
      // q3 unanswered
      ["exam/q4", "D"],
    ]);
    const r = scoreExam(questions, answers, floors, 3);
    expect(r.correctCount).toBe(2);
    expect(r.scoreByDomain[0]).toMatchObject({ correct: 1, passed: false });
    expect(r.scoreByDomain[1]).toMatchObject({ correct: 1, passed: false });
  });

  it("fails when a domain is below floor even if overall clears", () => {
    // 3/4 overall clears passOverall=3, but D2 has only 1/2 (below floor 2).
    const answers = new Map<string, OptionLetter>([
      ["exam/q1", "A"],
      ["exam/q2", "B"],
      ["exam/q3", "C"],
      ["exam/q4", "A"], // wrong
    ]);
    const r = scoreExam(questions, answers, floors, 3);
    expect(r.correctCount).toBe(3);
    expect(r.passedOverall).toBe(true);
    expect(r.passedFloors).toBe(false);
    expect(r.passed).toBe(false);
  });

  it("fails when overall is below the bar even if all floors are met", () => {
    const answers = new Map<string, OptionLetter>([
      ["exam/q1", "A"],
      ["exam/q2", "B"],
      ["exam/q3", "C"],
      ["exam/q4", "D"],
    ]);
    const r = scoreExam(questions, answers, floors, 5); // impossibly high bar
    expect(r.passedFloors).toBe(true);
    expect(r.passedOverall).toBe(false);
    expect(r.passed).toBe(false);
  });

  it("reports a domain with no answered questions as zero against its floor", () => {
    const r = scoreExam(questions, new Map(), floors, 3);
    expect(r.correctCount).toBe(0);
    expect(r.scoreByDomain).toEqual([
      { domain: "D1", correct: 0, count: 2, floor: 2, passed: false },
      { domain: "D2", correct: 0, count: 2, floor: 2, passed: false },
    ]);
  });
});
