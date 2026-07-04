import { beforeEach, describe, expect, it } from "vitest";
import { db } from "../src/db/db";
import { getExamSession, listExamSessions, saveExamSession } from "../src/db/examRepo";
import type { ExamSessionRow } from "../src/db/types";

// fake-indexeddb (tests/setup.ts) backs the examSessions store; wipe between cases.
beforeEach(async () => {
  await Promise.all(db.tables.map((t) => t.clear()));
});

function session(id: string, startedAt: number, passed: boolean): ExamSessionRow {
  return {
    id,
    startedAt,
    finishedAt: startedAt + 1000,
    answers: { "exam/q1": "A" },
    correctCount: passed ? 60 : 10,
    total: 60,
    scoreByDomain: [{ domain: "D1", correct: 10, count: 10, floor: 7, passed }],
    passedOverall: passed,
    passedFloors: passed,
    passed,
  };
}

describe("examRepo", () => {
  it("saves and reads back a session by id", async () => {
    await saveExamSession(session("s1", 100, true));
    const got = await getExamSession("s1");
    expect(got?.correctCount).toBe(60);
    expect(got?.passed).toBe(true);
  });

  it("lists attempts newest-first", async () => {
    await saveExamSession(session("older", 100, false));
    await saveExamSession(session("newer", 200, true));
    const all = await listExamSessions();
    expect(all.map((s) => s.id)).toEqual(["newer", "older"]);
  });

  it("returns undefined for an unknown id", async () => {
    expect(await getExamSession("missing")).toBeUndefined();
  });
});
