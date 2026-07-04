import { beforeEach, describe, expect, it } from "vitest";
import { db } from "../src/db/db";
import {
  getAllExercises,
  getExercise,
  setExerciseAnswer,
  setExerciseDone,
} from "../src/db/exerciseRepo";

// fake-indexeddb (tests/setup.ts) backs the exercises store; wipe between cases.
beforeEach(async () => {
  await Promise.all(db.tables.map((t) => t.clear()));
});

describe("exerciseRepo (checklist)", () => {
  it("creates a row on first tick and reads it back", async () => {
    await setExerciseDone({ sourceId: "ch-0-1/exercise", kind: "design", done: true });
    const row = await getExercise("ch-0-1/exercise");
    expect(row?.done).toBe(true);
    expect(row?.kind).toBe("design");
    expect(row?.answer).toBe("");
  });

  it("preserves a pasted answer when toggling done, and done when saving an answer", async () => {
    await setExerciseAnswer({
      sourceId: "capstone-a/deliverable/1",
      kind: "capstone",
      answer: "my write-up",
    });
    await setExerciseDone({ sourceId: "capstone-a/deliverable/1", kind: "capstone", done: true });
    const row = await getExercise("capstone-a/deliverable/1");
    expect(row?.done).toBe(true);
    expect(row?.answer).toBe("my write-up");
  });

  it("upserts idempotently — one row per source id", async () => {
    await setExerciseDone({ sourceId: "exam/design/1", kind: "examPrompt", done: true });
    await setExerciseDone({ sourceId: "exam/design/1", kind: "examPrompt", done: false });
    const all = await getAllExercises();
    expect(all).toHaveLength(1);
    expect(all[0].done).toBe(false);
  });
});
