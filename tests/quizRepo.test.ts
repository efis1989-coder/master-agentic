import { beforeEach, describe, expect, it } from "vitest";
import { db } from "../src/db/db";
import {
  addMistake,
  deleteMistake,
  getMistakes,
  getMistakesForChapter,
  setMistakeResolved,
} from "../src/db/mistakeRepo";
import { getAllQuizAttempts, getAttemptsForChapter, recordQuizAttempt } from "../src/db/quizRepo";

// fake-indexeddb (tests/setup.ts) backs Dexie; wipe every table between cases.
beforeEach(async () => {
  await Promise.all(db.tables.map((t) => t.clear()));
});

describe("quizRepo", () => {
  it("records an attempt keyed by claim id and reads it back", async () => {
    await recordQuizAttempt({
      itemId: "ch-0-1/selftest/1",
      chapterId: "ch-0-1",
      chosen: true,
      correct: true,
      sure: true,
    });
    const rows = await getAttemptsForChapter("ch-0-1");
    expect(rows).toHaveLength(1);
    expect(rows[0].correct).toBe(true);
    expect(rows[0].sure).toBe(true);
  });

  it("overwrites the prior verdict on a retake of the same claim", async () => {
    await recordQuizAttempt({
      itemId: "ch-0-1/selftest/1",
      chapterId: "ch-0-1",
      chosen: true,
      correct: true,
      sure: false,
    });
    await recordQuizAttempt({
      itemId: "ch-0-1/selftest/1",
      chapterId: "ch-0-1",
      chosen: false,
      correct: false,
      sure: true,
    });
    const rows = await getAttemptsForChapter("ch-0-1");
    // One current attempt per claim — the retake replaces, not appends.
    expect(rows).toHaveLength(1);
    expect(rows[0].correct).toBe(false);
    expect(rows[0].chosen).toBe(false);
    expect(rows[0].sure).toBe(true);
  });

  it("scopes attempts to a chapter by item-id prefix", async () => {
    await recordQuizAttempt({
      itemId: "ch-0-1/selftest/1",
      chapterId: "ch-0-1",
      chosen: true,
      correct: true,
      sure: false,
    });
    await recordQuizAttempt({
      itemId: "ch-0-2/selftest/1",
      chapterId: "ch-0-2",
      chosen: true,
      correct: true,
      sure: false,
    });
    expect(await getAttemptsForChapter("ch-0-1")).toHaveLength(1);
    // A prefix search must not bleed ch-0-1 into a ch-0 lookalike.
    expect(await getAllQuizAttempts()).toHaveLength(2);
  });
});

describe("mistakeRepo (E3)", () => {
  it("logs a mistake unresolved and lists it newest-first", async () => {
    await addMistake({ sourceId: "ch-0-1/selftest/2", kind: "selftest", whyMissed: "misread" });
    await addMistake({ sourceId: "ch-0-2/selftest/3", kind: "selftest", whyMissed: "guessed" });
    const rows = await getMistakes();
    expect(rows).toHaveLength(2);
    expect(rows.every((r) => r.resolved === false)).toBe(true);
    // orderBy at + reverse → most recent addMistake first.
    expect(rows[0].sourceId).toBe("ch-0-2/selftest/3");
  });

  it("re-logging the same item updates the open note in place", async () => {
    await addMistake({ sourceId: "ch-0-1/selftest/2", kind: "selftest", whyMissed: "first" });
    await addMistake({ sourceId: "ch-0-1/selftest/2", kind: "selftest", whyMissed: "second" });
    const rows = await getMistakes();
    expect(rows).toHaveLength(1);
    expect(rows[0].whyMissed).toBe("second");
    expect(rows[0].resolved).toBe(false);
  });

  it("toggles resolved and deletes", async () => {
    await addMistake({ sourceId: "ch-0-1/selftest/2", kind: "selftest", whyMissed: "misread" });
    await setMistakeResolved("ch-0-1/selftest/2", true);
    expect((await getMistakes())[0].resolved).toBe(true);
    await deleteMistake("ch-0-1/selftest/2");
    expect(await getMistakes()).toHaveLength(0);
  });

  it("scopes mistakes to a chapter by source-id prefix", async () => {
    await addMistake({ sourceId: "ch-0-1/selftest/1", kind: "selftest", whyMissed: "a" });
    await addMistake({ sourceId: "ch-0-2/selftest/1", kind: "selftest", whyMissed: "b" });
    const scoped = await getMistakesForChapter("ch-0-1");
    expect(scoped).toHaveLength(1);
    expect(scoped[0].sourceId).toBe("ch-0-1/selftest/1");
  });
});
