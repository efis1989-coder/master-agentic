// SM-2 lite: a pure, time-independent spaced-repetition scheduler. The repo layer
// turns an interval (in days) into a concrete due date; this module only computes
// the next {ease, intervalDays, reps, lapses} from a self-graded review, so the
// scheduling math is trivially unit-testable without clocks or storage.

export type SrsGrade = "again" | "hard" | "good" | "easy";

export interface SrsState {
  /** Difficulty multiplier; larger = intervals grow faster. */
  ease: number;
  /** Days until the card is next due (0 = due immediately, e.g. after "again"). */
  intervalDays: number;
  /** Successful reviews in a row (reset to 0 on a lapse). */
  reps: number;
  /** Total times the card was forgotten ("again"). */
  lapses: number;
}

export const INITIAL_EASE = 2.5;
export const MIN_EASE = 1.3;

/** Per-grade adjustment to ease; "good" holds ease steady. */
const EASE_DELTA: Record<SrsGrade, number> = {
  again: -0.2,
  hard: -0.15,
  good: 0,
  easy: 0.15,
};

/** A freshly enqueued card: full ease, due now (interval 0), no history. */
export function initialState(): SrsState {
  return { ease: INITIAL_EASE, intervalDays: 0, reps: 0, lapses: 0 };
}

/**
 * Next state after self-grading a review. "again" lapses the card (interval 0 →
 * due now again, reps reset); the graded successes grow the interval — the first
 * success is a fixed 1 day (4 for "easy"), and later successes multiply the prior
 * interval by 1.2 (hard), the ease (good), or ease×1.3 (easy). Ease is clamped at
 * MIN_EASE so a repeatedly-hard card never collapses to sub-day churn.
 */
export function reschedule(prev: SrsState, grade: SrsGrade): SrsState {
  const ease = Math.max(MIN_EASE, Number((prev.ease + EASE_DELTA[grade]).toFixed(2)));

  if (grade === "again") {
    return { ease, intervalDays: 0, reps: 0, lapses: prev.lapses + 1 };
  }

  const reps = prev.reps + 1;
  let intervalDays: number;
  if (prev.reps === 0) {
    intervalDays = grade === "easy" ? 4 : 1;
  } else {
    const factor = grade === "hard" ? 1.2 : grade === "easy" ? ease * 1.3 : ease;
    intervalDays = Math.max(1, Math.round(prev.intervalDays * factor));
  }
  return { ease, intervalDays, reps, lapses: prev.lapses };
}
