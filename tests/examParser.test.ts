import { describe, expect, it } from "vitest";
import { parseExam } from "../src/content/examParser";
import { course, loadFile } from "./fixtures";

const exam = course.exam;

describe("exam parsing", () => {
  it("parses 60 questions, each with exactly 4 lettered options", () => {
    expect(exam.questions).toHaveLength(60);
    for (const q of exam.questions) {
      expect(q.options.map((o) => o.letter)).toEqual(["A", "B", "C", "D"]);
      expect(q.stem.length).toBeGreaterThan(0);
    }
  });

  it("keys every question to a valid answer letter", () => {
    for (const q of exam.questions) {
      expect(q.correct).toMatch(/^[A-D]$/);
    }
  });

  it("numbers questions 1..60 without gaps", () => {
    expect(exam.questions.map((q) => q.n)).toEqual(Array.from({ length: 60 }, (_, i) => i + 1));
  });

  it("assigns each question to a domain within its blueprint range", () => {
    for (const q of exam.questions) {
      expect(q.domain).toMatch(/^D[1-6]$/);
    }
    // Domain question counts sum to the full exam.
    const total = exam.domainFloors.reduce((sum, f) => sum + f.count, 0);
    expect(total).toBe(60);
  });

  it("computes per-domain pass floors at 70% (rounded up)", () => {
    for (const f of exam.domainFloors) {
      expect(f.floor).toBe(Math.ceil(f.count * 0.7));
    }
    expect(exam.passOverall).toBe(51);
    expect(exam.totalQuestions).toBe(60);
  });

  it("parses 3 design prompts with rubrics", () => {
    expect(exam.designPrompts).toHaveLength(3);
    for (const p of exam.designPrompts) {
      expect(p.title.length).toBeGreaterThan(0);
      expect(p.prompt.length).toBeGreaterThan(0);
      expect(p.rubric.length).toBeGreaterThan(0);
    }
  });
});

describe("parseExam (direct, idempotent)", () => {
  it("produces the same result on repeat parses", () => {
    const raw = loadFile("certification-exam-blueprint.md");
    expect(parseExam(raw)).toEqual(parseExam(raw));
  });
});
