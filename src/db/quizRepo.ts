import { db } from "./db";
import type { QuizAttempt } from "./types";

/**
 * §7 self-test attempts. Keyed by the claim's item id, so re-taking a chapter's
 * self-test overwrites the prior verdict for each claim (one current attempt per
 * claim). The `quizAttempts` table is declared in the schema but has no typed
 * accessor on the Dexie subclass, so it is reached generically here.
 */
const attempts = () => db.table<QuizAttempt, string>("quizAttempts");

export function recordQuizAttempt(input: {
  itemId: string;
  chapterId: string;
  chosen: boolean;
  correct: boolean;
  sure: boolean;
}): Promise<string> {
  const row: QuizAttempt = { id: input.itemId, at: Date.now(), ...input };
  return attempts().put(row);
}

export function getAttemptsForChapter(chapterId: string): Promise<QuizAttempt[]> {
  return attempts().where("itemId").startsWith(`${chapterId}/`).toArray();
}

export function getAllQuizAttempts(): Promise<QuizAttempt[]> {
  return attempts().toArray();
}
