import { describe, expect, it } from "vitest";
import {
  parseAnswerBlock,
  parseChapter,
  parseSelfTest,
  verdictToBoolean,
} from "../src/content/chapterParser";
import { course, loadFile } from "./fixtures";

describe("course assembly", () => {
  it("parses exactly 30 chapters grouped into 6 parts (0–5)", () => {
    expect(course.chapters).toHaveLength(30);
    expect(course.parts.map((p) => p.part)).toEqual([0, 1, 2, 3, 4, 5]);
  });

  it("indexes every chapter by its stable id", () => {
    for (const ch of course.chapters) {
      expect(course.byId.get(ch.id)).toBe(ch);
    }
    expect(course.byId.get("ch-0-1")?.number).toBe("0.1");
  });

  it("orders chapters by part then chapter index", () => {
    const ordered = [...course.chapters].sort(
      (a, b) => a.part - b.part || a.chapterIndex - b.chapterIndex,
    );
    expect(course.chapters).toEqual(ordered);
  });
});

describe("chapter skeleton (every chapter)", () => {
  it("exposes exactly 5 gradable self-test claims", () => {
    for (const ch of course.chapters) {
      expect(ch.selfTest, `${ch.id} self-test count`).toHaveLength(5);
      for (const claim of ch.selfTest) {
        expect(claim.gradable, `${claim.id} gradable`).toBe(true);
        expect(typeof claim.correct).toBe("boolean");
        expect(claim.claim.length).toBeGreaterThan(0);
        expect(claim.answerText.length).toBeGreaterThan(0);
      }
    }
  });

  it("has at least one §8 spaced-review card", () => {
    for (const ch of course.chapters) {
      expect(ch.srsCards.length, `${ch.id} srs cards`).toBeGreaterThanOrEqual(1);
    }
  });

  it("has a §6 design exercise with a prompt", () => {
    for (const ch of course.chapters) {
      expect(ch.exercise, `${ch.id} exercise`).not.toBeNull();
      expect(ch.exercise?.prompt.length).toBeGreaterThan(0);
    }
  });

  it("has a Doctrine-check blockquote (E9 anchor)", () => {
    for (const ch of course.chapters) {
      expect(ch.doctrineCheck, `${ch.id} doctrine check`).toBeTruthy();
    }
  });

  it("has an incident cold open (E1) in §1", () => {
    for (const ch of course.chapters) {
      expect(ch.incident, `${ch.id} incident`).not.toBeNull();
      expect(ch.incident?.markdown.length).toBeGreaterThan(0);
    }
  });

  it("derives header metadata (domain + reading time)", () => {
    for (const ch of course.chapters) {
      expect(ch.domain).toMatch(/^D[1-6]$/);
      expect(ch.readingTimeMin).toBeGreaterThan(0);
    }
  });
});

describe("self-test grading nuance", () => {
  it("preserves the full argued answer even when the key is binary", () => {
    const ch01 = course.byId.get("ch-0-1");
    expect(ch01).toBeDefined();
    for (const claim of ch01?.selfTest ?? []) {
      // answerText is the argued reveal, never merely a T/F token.
      expect(claim.answerText.length).toBeGreaterThan(5);
    }
  });

  it("marks ch-2-1 claim 3 (true-in-spirit-but-stated-as-false) as False + gradable", () => {
    const ch = course.byId.get("ch-2-1");
    const claim = ch?.selfTest.find((c) => c.index === 3);
    expect(claim?.gradable).toBe(true);
    expect(claim?.correct).toBe(false);
  });

  it("re-parses a chapter's §7 idempotently", () => {
    const ch = course.byId.get("ch-0-1");
    const s7 = ch?.sections.find((s) => s.n === 7);
    expect(s7).toBeDefined();
    const a = parseSelfTest(s7?.markdown ?? "", "ch-0-1");
    const b = parseSelfTest(s7?.markdown ?? "", "ch-0-1");
    expect(a).toEqual(b);
    expect(a).toHaveLength(5);
  });
});

describe("verdictToBoolean", () => {
  it("maps affirmative verdicts to true", () => {
    for (const v of ["True", "correct", "yes", "accurate as stated"]) {
      expect(verdictToBoolean(v)).toEqual({ correct: true, gradable: true });
    }
  });

  it("maps any 'false' mention to false (incl. compounds)", () => {
    for (const v of ["false", "false as stated", "true-in-spirit-but-stated-as-false"]) {
      expect(verdictToBoolean(v)).toEqual({ correct: false, gradable: true });
    }
  });

  it("maps the false-family lead words to false", () => {
    for (const v of ["Incomplete", "Dangerous as stated", "Too narrow", "Incorrect"]) {
      expect(verdictToBoolean(v)).toEqual({ correct: false, gradable: true });
    }
  });

  it("reports ungradable for an unmappable token", () => {
    expect(verdictToBoolean("¯\\_(ツ)_/¯")).toEqual({ correct: false, gradable: false });
  });
});

describe("parseAnswerBlock", () => {
  it("splits a compound answer line into per-index argued answers", () => {
    const line = "*(Answers: 1-false — a reason; 2-true — another; 3-false — third)*";
    const map = parseAnswerBlock(line);
    expect(map.get(1)).toContain("false");
    expect(map.get(2)).toContain("true");
    expect(map.get(3)).toContain("third");
  });
});

describe("parseChapter (direct)", () => {
  it("builds stable ids from the filename", () => {
    const raw = loadFile("chapter-0-1-agentic-spectrum.md");
    const ch = parseChapter(raw, "content/chapter-0-1-agentic-spectrum.md");
    expect(ch.id).toBe("ch-0-1");
    expect(ch.slug).toBe("chapter-0-1-agentic-spectrum");
    expect(ch.selfTest[0]?.id).toBe("ch-0-1/selftest/1");
    expect(ch.exercise?.id).toBe("ch-0-1/exercise");
  });
});
