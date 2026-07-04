import { db } from "./db";
import type { ExerciseKind, ExerciseRow } from "./types";

/**
 * The exercise checklist store (§6 design exercises, capstone deliverables, and
 * mock-exam design prompts). Each item is one row keyed by its source id, so
 * ticking it done or pasting an answer upserts idempotently. The exercises
 * themselves are done "aside" — this only tracks completion and keeps the note.
 * The `exercises` table has no typed accessor on the Dexie subclass, so it is
 * reached generically here.
 */
const exercises = () => db.table<ExerciseRow, string>("exercises");

async function upsert(
  sourceId: string,
  kind: ExerciseKind,
  patch: Partial<Pick<ExerciseRow, "done" | "answer">>,
): Promise<void> {
  const existing = await exercises().get(sourceId);
  const row: ExerciseRow = {
    id: sourceId,
    sourceId,
    kind,
    done: existing?.done ?? false,
    answer: existing?.answer ?? "",
    ...patch,
    at: Date.now(),
  };
  await exercises().put(row);
}

export function getExercise(sourceId: string): Promise<ExerciseRow | undefined> {
  return exercises().get(sourceId);
}

export function getAllExercises(): Promise<ExerciseRow[]> {
  return exercises().toArray();
}

export function setExerciseDone(input: {
  sourceId: string;
  kind: ExerciseKind;
  done: boolean;
}): Promise<void> {
  return upsert(input.sourceId, input.kind, { done: input.done });
}

export function setExerciseAnswer(input: {
  sourceId: string;
  kind: ExerciseKind;
  answer: string;
}): Promise<void> {
  return upsert(input.sourceId, input.kind, { answer: input.answer });
}
