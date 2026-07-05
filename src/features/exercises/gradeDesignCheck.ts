import type { DesignCheck, DesignCheckItem } from "../../content/types";

/** A graded §6 dropdown item: the learner's chosen option vs. the key. */
export interface GradedDesignItem {
  item: DesignCheckItem;
  chosen: string | null; // null when the item was left unanswered
  correct: boolean;
}

export interface GradedDesignCheck {
  results: GradedDesignItem[];
  score: number; // count correct
  total: number; // count items
}

/**
 * Pure grading of a §6 deterministic dropdown check. `selections` is keyed by
 * item id → chosen option. An unanswered item scores as incorrect (the caller
 * enforces "all answered" before submit, but grading stays total-safe). Option
 * equality is exact, so authored answers and dropdown options must match the
 * shared `check.options` list — a guarantee `buildDesignCheck` already enforces.
 */
export function gradeDesignCheck(
  check: DesignCheck,
  selections: Map<string, string>,
): GradedDesignCheck {
  const results: GradedDesignItem[] = check.items.map((item) => {
    const chosen = selections.get(item.id) ?? null;
    return { item, chosen, correct: chosen === item.correct };
  });
  const score = results.filter((r) => r.correct).length;
  return { results, score, total: results.length };
}
