import { describe, expect, it } from "vitest";
import { INITIAL_EASE, MIN_EASE, initialState, reschedule } from "../src/srs/sm2";

describe("sm2 lite scheduler", () => {
  it("starts a card due now with full ease and no history", () => {
    expect(initialState()).toEqual({ ease: INITIAL_EASE, intervalDays: 0, reps: 0, lapses: 0 });
  });

  it("schedules the first success at 1 day (4 for easy) and counts the rep", () => {
    const good = reschedule(initialState(), "good");
    expect(good).toEqual({ ease: 2.5, intervalDays: 1, reps: 1, lapses: 0 });

    const easy = reschedule(initialState(), "easy");
    expect(easy.intervalDays).toBe(4);
    expect(easy.reps).toBe(1);
    expect(easy.ease).toBeCloseTo(2.65);
  });

  it("grows later intervals by the ease (good) and ease×1.3 (easy)", () => {
    const afterFirst = { ease: 2.5, intervalDays: 1, reps: 1, lapses: 0 };
    // good: round(1 * 2.5) = 3 (ease unchanged)
    expect(reschedule(afterFirst, "good")).toEqual({
      ease: 2.5,
      intervalDays: 3,
      reps: 2,
      lapses: 0,
    });
    // easy: ease→2.65, round(1 * 2.65 * 1.3) = round(3.445) = 3
    const easy = reschedule(afterFirst, "easy");
    expect(easy.ease).toBeCloseTo(2.65);
    expect(easy.intervalDays).toBe(3);
  });

  it("uses a gentle 1.2× step and lowers ease on hard", () => {
    const prev = { ease: 2.5, intervalDays: 10, reps: 2, lapses: 0 };
    const hard = reschedule(prev, "hard");
    expect(hard.intervalDays).toBe(12); // round(10 * 1.2)
    expect(hard.ease).toBeCloseTo(2.35); // 2.5 - 0.15
    expect(hard.reps).toBe(3);
  });

  it("lapses on again: due now, reps reset, lapse counted, ease dropped", () => {
    const prev = { ease: 2.5, intervalDays: 10, reps: 3, lapses: 0 };
    const again = reschedule(prev, "again");
    expect(again).toEqual({ ease: 2.3, intervalDays: 0, reps: 0, lapses: 1 });
  });

  it("never lets ease fall below the floor", () => {
    let s = { ease: MIN_EASE, intervalDays: 5, reps: 2, lapses: 0 };
    s = reschedule(s, "hard");
    expect(s.ease).toBe(MIN_EASE);
    s = reschedule(s, "again");
    expect(s.ease).toBe(MIN_EASE);
  });
});
