import type { SelfTestClaim } from "../../content/types";

/** The learner's raw input for one claim before it is graded. */
export interface ClaimAnswer {
  chosen: boolean; // True/False verdict
  sure: boolean; // E4 confidence tap
}

/** A graded claim: the learner's input plus whether it matched the key. */
export interface GradedClaim {
  claim: SelfTestClaim;
  chosen: boolean;
  sure: boolean;
  correct: boolean;
}

export interface GradedQuiz {
  results: GradedClaim[];
  score: number; // count correct
  total: number; // count graded
}

/**
 * Pure grading of a chapter's §7 self-test. `answers` is keyed by claim id; a
 * claim with no answer is skipped (the caller enforces "all answered" before
 * submit). Ungradable claims (whose verdict could not be mapped to True/False)
 * are counted toward the total but always scored as correct, since the argued
 * answer is revealed for reflection rather than binary judgement.
 */
export function gradeSelfTest(
  claims: SelfTestClaim[],
  answers: Map<string, ClaimAnswer>,
): GradedQuiz {
  const results: GradedClaim[] = [];
  for (const claim of claims) {
    const answer = answers.get(claim.id);
    if (!answer) continue;
    const correct = claim.gradable ? answer.chosen === claim.correct : true;
    results.push({ claim, chosen: answer.chosen, sure: answer.sure, correct });
  }
  const score = results.filter((r) => r.correct).length;
  return { results, score, total: results.length };
}
