import { describe, expect, it } from "vitest";
import type { Chapter, SelfTestClaim } from "../src/content/types";
import type { ProgressRow, QuizAttempt } from "../src/db/types";
import { chapterMastery } from "../src/features/conceptmap/mastery";

function claim(id: string, gradable = true): SelfTestClaim {
  return { id, index: 1, claim: "claim", correct: true, answerText: "because", gradable };
}

function makeChapter(selfTest: SelfTestClaim[]): Chapter {
  return {
    kind: "chapter",
    id: "ch-0-1",
    slug: "chapter-0-1",
    part: 0,
    partName: "Orientation",
    chapterIndex: 1,
    number: "0.1",
    title: "Test chapter",
    domain: "D1",
    readingTimeMin: 10,
    prerequisites: [],
    themes: [],
    sections: [],
    bodyMarkdown: "",
    incident: null,
    doctrine: null,
    doctrineCheck: null,
    selfTest,
    srsCards: [],
    exercise: null,
  };
}

function progress(status: "reading" | "read"): ProgressRow {
  return { id: "ch-0-1", status, scrollPct: status === "read" ? 1 : 0.3, updatedAt: 1 };
}

function attempt(itemId: string, correct: boolean): QuizAttempt {
  return { id: itemId, itemId, chapterId: "ch-0-1", chosen: correct, correct, sure: true, at: 1 };
}

describe("chapterMastery", () => {
  const chapter = makeChapter([claim("ch-0-1/selftest/1"), claim("ch-0-1/selftest/2")]);

  it("is unread with no progress row", () => {
    expect(chapterMastery(chapter, undefined, [])).toBe("unread");
  });

  it("is reading while opened but unfinished", () => {
    expect(chapterMastery(chapter, progress("reading"), [])).toBe("reading");
  });

  it("is read when finished with no self-test attempts", () => {
    expect(chapterMastery(chapter, progress("read"), [])).toBe("read");
  });

  it("is quizzed when attempted but not all claims are correct", () => {
    const attempts = [attempt("ch-0-1/selftest/1", true), attempt("ch-0-1/selftest/2", false)];
    expect(chapterMastery(chapter, progress("read"), attempts)).toBe("quizzed");
  });

  it("is quizzed when only some claims have been answered", () => {
    const attempts = [attempt("ch-0-1/selftest/1", true)];
    expect(chapterMastery(chapter, progress("read"), attempts)).toBe("quizzed");
  });

  it("is mastered when every gradable claim is correct", () => {
    const attempts = [attempt("ch-0-1/selftest/1", true), attempt("ch-0-1/selftest/2", true)];
    expect(chapterMastery(chapter, progress("read"), attempts)).toBe("mastered");
  });

  it("tops out at quizzed when no claim is gradable", () => {
    const ungradable = makeChapter([claim("ch-0-1/selftest/1", false)]);
    const attempts = [attempt("ch-0-1/selftest/1", true)];
    expect(chapterMastery(ungradable, progress("read"), attempts)).toBe("quizzed");
  });
});
