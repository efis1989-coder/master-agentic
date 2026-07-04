import type { Chapter } from "../../content/types";
import type { ProgressRow, QuizAttempt } from "../../db/types";

/**
 * How far a learner has taken a single chapter, weakest → strongest. This is a
 * derived view over reading progress and §7 self-test attempts — the raw stores
 * never persist it, so it always reflects the latest state:
 *
 * - `unread`   — never opened (no progress row).
 * - `reading`  — opened but not scrolled to the end.
 * - `read`     — finished, but the self-test has not been attempted.
 * - `quizzed`  — self-test attempted, but not every gradable claim is correct.
 * - `mastered` — finished AND every gradable §7 claim answered correctly.
 */
export type MasteryLevel = "unread" | "reading" | "read" | "quizzed" | "mastered";

export interface MasteryMeta {
  level: MasteryLevel;
  label: string;
  description: string;
}

/** Ordered weakest → strongest; drives the legend and node tinting on the map. */
export const MASTERY_LEVELS: MasteryMeta[] = [
  { level: "unread", label: "Unread", description: "Not opened yet" },
  { level: "reading", label: "Reading", description: "Opened, not finished" },
  { level: "read", label: "Read", description: "Finished, self-test not taken" },
  { level: "quizzed", label: "Quizzed", description: "Self-test attempted" },
  { level: "mastered", label: "Mastered", description: "Every self-test claim correct" },
];

/**
 * Classify one chapter's mastery from its reading progress and the self-test
 * attempts recorded for it. `attempts` should already be scoped to this chapter;
 * an absent progress row means the chapter was never opened. "Mastered" requires
 * at least one gradable claim (a chapter with no gradable claims tops out at
 * "quizzed" once its self-test has been attempted).
 */
export function chapterMastery(
  chapter: Chapter,
  progress: ProgressRow | undefined,
  attempts: QuizAttempt[],
): MasteryLevel {
  if (!progress) return "unread";
  if (progress.status === "reading") return "reading";
  if (attempts.length === 0) return "read";

  const attemptById = new Map(attempts.map((a) => [a.itemId, a]));
  const gradable = chapter.selfTest.filter((c) => c.gradable);
  const allCorrect =
    gradable.length > 0 && gradable.every((c) => attemptById.get(c.id)?.correct === true);

  return allCorrect ? "mastered" : "quizzed";
}
